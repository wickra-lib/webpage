---
title: Benchmarks
description: Wickra vs. the Python TA ecosystem (TA-Lib, tulipy, pandas-ta, finta, talipp), the other Rust TA crates (kand, ta-rs, yata) and QuanTAlib in .NET across batch and streaming workloads — reproducible on your own hardware via the bench scripts.
---

<script setup>
// Full Python batch field, measured in one Python 3.12 run alongside Wickra's
// exact batch and its opt-in batch_fast.
const batch = [
  { label: 'SMA(20)',           wickra: 20.5, wickraFast: 9.0,  peers: [{ name: 'TA-Lib', value: 15.5 },  { name: 'tulipy', value: 16.1 }, { name: 'pandas-ta', value: 32.7 },  { name: 'finta', value: 286.5 }]  },
  { label: 'EMA(20)',           wickra: 32.0, wickraFast: 9.7,  peers: [{ name: 'TA-Lib', value: 30.3 },  { name: 'tulipy', value: 31.4 }, { name: 'pandas-ta', value: 50.5 },  { name: 'finta', value: 224.7 }]  },
  { label: 'RSI(14)',           wickra: 38.3, wickraFast: 22.9, peers: [{ name: 'TA-Lib', value: 74.7 },  { name: 'tulipy', value: 34.8 }, { name: 'pandas-ta', value: 106.9 }, { name: 'finta', value: 962.9 }]  },
  { label: 'MACD(12,26,9)',     wickra: 40.1, wickraFast: 27.9, peers: [{ name: 'TA-Lib', value: 102.1 }, { name: 'tulipy', value: 33.4 }, { name: 'pandas-ta', value: 234.4 }, { name: 'finta', value: 574.4 }]  },
  { label: 'Bollinger(20,2.0)', wickra: 75.0, wickraFast: 33.1, peers: [{ name: 'TA-Lib', value: 71.5 },  { name: 'tulipy', value: 34.2 }, { name: 'pandas-ta', value: 351.1 }, { name: 'finta', value: 871.1 }]  },
  { label: 'ATR(14)',           wickra: 41.1, wickraFast: 28.1, peers: [{ name: 'TA-Lib', value: 84.4 },  { name: 'tulipy', value: 34.4 }, { name: 'pandas-ta', value: null },  { name: 'finta', value: 3182.6 }] },
]

// Python streaming: Wickra vs talipp, the only other incremental peer. The
// recompute-on-every-tick libraries (TA-Lib/tulipy/pandas-ta/finta) are
// 1 800–15 400× slower here — too far off-scale for a bar, covered in prose.
const streaming = [
  { label: 'SMA(20)',           wickra: 0.061, unit: 'µs / tick', peers: [{ name: 'talipp', value: 0.537 }] },
  { label: 'EMA(20)',           wickra: 0.064, unit: 'µs / tick', peers: [{ name: 'talipp', value: 0.727 }] },
  { label: 'RSI(14)',           wickra: 0.068, unit: 'µs / tick', peers: [{ name: 'talipp', value: 1.111 }] },
  { label: 'MACD(12,26,9)',     wickra: 0.084, unit: 'µs / tick', peers: [{ name: 'talipp', value: 4.298 }] },
  { label: 'Bollinger(20,2.0)', wickra: 0.102, unit: 'µs / tick', peers: [{ name: 'talipp', value: 5.689 }] },
]

// Rust core vs Rust crates, no language-binding overhead: µs for the whole
// 50 000-bar series.
const rustStream = [
  { label: 'SMA(20)',           wickra: 48,  peers: [{ name: 'kand', value: 37 },  { name: 'ta-rs', value: 46 },  { name: 'yata', value: 37 }]   },
  { label: 'EMA(20)',           wickra: 72,  peers: [{ name: 'kand', value: 69 },  { name: 'ta-rs', value: 54 },  { name: 'yata', value: 72 }]   },
  { label: 'RSI(14)',           wickra: 171, peers: [{ name: 'kand', value: 202 }, { name: 'ta-rs', value: 76 },  { name: 'yata', value: null }] },
  { label: 'MACD(12,26,9)',     wickra: 228, peers: [{ name: 'kand', value: 178 }, { name: 'ta-rs', value: 64 },  { name: 'yata', value: null }] },
  { label: 'Bollinger(20,2.0)', wickra: 175, peers: [{ name: 'kand', value: 290 }, { name: 'ta-rs', value: 163 }, { name: 'yata', value: null }] },
  { label: 'ATR(14)',           wickra: 86,  peers: [{ name: 'kand', value: 164 }, { name: 'ta-rs', value: 68 },  { name: 'yata', value: null }] },
]
const rustBatch = [
  { label: 'SMA(20)',           wickra: 48,  wickraFast: 23, peers: [{ name: 'kand', value: 41 }]  },
  { label: 'EMA(20)',           wickra: 82,  wickraFast: 18, peers: [{ name: 'kand', value: 67 }]  },
  { label: 'RSI(14)',           wickra: 85,  wickraFast: 47, peers: [{ name: 'kand', value: 222 }] },
  { label: 'MACD(12,26,9)',     wickra: 83,  wickraFast: 58, peers: [{ name: 'kand', value: 249 }] },
  { label: 'Bollinger(20,2.0)', wickra: 195, wickraFast: 78, peers: [{ name: 'kand', value: 408 }] },
  { label: 'ATR(14)',           wickra: 73,  wickraFast: 42, peers: [{ name: 'kand', value: 165 }] },
]

// .NET on QuanTAlib's own setup (500 000 bars, period 220), BenchmarkDotNet
// mean in µs, every library writing into a buffer the caller keeps.
const dotnetBatch = [
  { label: 'SMA',         wickra: 512,  wickraFast: 197,  peers: [{ name: 'QuanTAlib', value: 298 },  { name: 'TA-Lib', value: 361 }]  },
  { label: 'EMA',         wickra: 763,  wickraFast: 186,  peers: [{ name: 'QuanTAlib', value: 430 },  { name: 'TA-Lib', value: 730 }]  },
  { label: 'WMA',         wickra: 653,  wickraFast: 358,  peers: [{ name: 'QuanTAlib', value: 312 },  { name: 'TA-Lib', value: 384 }]  },
  { label: 'HMA',         wickra: 1472, wickraFast: 1079, peers: [{ name: 'QuanTAlib', value: 1021 }, { name: 'TA-Lib', value: null }] },
  { label: 'ADOSC',       wickra: 1048, wickraFast: 687,  peers: [{ name: 'QuanTAlib', value: 650 },  { name: 'TA-Lib', value: 745 }]  },
  { label: 'Correlation', wickra: 3464, wickraFast: 1322, peers: [{ name: 'QuanTAlib', value: null }, { name: 'TA-Lib', value: 2154 }] },
  { label: 'Skewness',    wickra: 3600, wickraFast: 603,  peers: [{ name: 'QuanTAlib', value: 584 },  { name: 'TA-Lib', value: null }] },
]
const dotnetStream = [
  { label: 'SMA',         wickra: 1801, peers: [{ name: 'QuanTAlib', value: 1904 }]  },
  { label: 'EMA',         wickra: 1654, peers: [{ name: 'QuanTAlib', value: 1581 }]  },
  { label: 'WMA',         wickra: 2020, peers: [{ name: 'QuanTAlib', value: 2962 }]  },
  { label: 'HMA',         wickra: 5565, peers: [{ name: 'QuanTAlib', value: 20436 }] },
  { label: 'ADOSC',       wickra: 3501, peers: [{ name: 'QuanTAlib', value: 14122 }] },
  { label: 'Correlation', wickra: 4323, peers: [{ name: 'QuanTAlib', value: 18328 }] },
  { label: 'Skewness',    wickra: 4282, peers: [{ name: 'QuanTAlib', value: 5523 }]  },
]
</script>

# Benchmarks

Wickra is a **streaming-first** library: the state machine inside every
indicator takes a single new tick and returns its updated output in constant
time. The charts below show what that costs against the full Python TA ecosystem,
the other Rust crates and QuanTAlib in .NET — wins **and** losses, the same
figures as the project's
[BENCHMARKS.md](https://github.com/wickra-lib/wickra/blob/main/BENCHMARKS.md).
Each bar is normalised to the slowest in its group, so the shortest bar is the
fastest library; the value to the right is the measured number.

::: tip Choosing a language? Jump to per-binding throughput
All 10 bindings call the same verified Rust core, but the cost of crossing each
language's FFI boundary differs by orders of magnitude on streaming workloads.
See [**Per-binding throughput**](#_3-—-per-binding-throughput) to pick the binding
that keeps up with your hot loop (C, C++, C# and Java stream at hundreds of millions
of updates a second; C, C#, Go, Java and Node batch at the core's rate into a
reused buffer; R is the streaming outlier).
:::

::: tip Reproduce these on your own hardware
```bash
# Python — vs talipp / TA-Lib / tulipy / pandas-ta / finta
pip install -e bindings/python[bench]
python -m benchmarks.compare_libraries

# Rust core — vs kand / ta-rs / yata
cargo bench -p wickra-bench

# .NET — vs QuanTAlib / TA-Lib / Skender (build the C ABI first)
cargo build -p wickra-c --release
dotnet run -c Release --project bindings/csharp/cross-library
```

The Python script auto-detects every peer library installed in your venv. The
nightly `cross-library-bench` workflow runs the Python and Rust suites on a Linux
runner and uploads the raw reports as artefacts; CI runs the .NET harness's
`verify` mode, which checks the libraries agree before their times are compared.
:::

## 1. Streaming — the structural win

Live trading feeds one tick at a time. Wickra updates every indicator
incrementally, with no pass over the history behind the tick; batch-only
libraries (TA-Lib, tulipy, finta, pandas-ta) have no incremental API and must
recompute the whole history on every tick. Only `talipp` (Python), `ta-rs` /
`yata` (Rust) and QuanTAlib (.NET, section 2) carry real per-tick state. This is
the gap the library was built to expose.

**Python — per-tick latency** (seed 5 000 bars, then feed 10 000 ticks one at a time):

<BenchmarkBar :rows="streaming" />

Against the only other incremental Python peer Wickra is **9–56× faster**;
against the recompute-on-every-tick libraries it is **1 800–15 400× faster**
(`finta` RSI hits 15 400×). tulipy / pandas-ta land in the same recompute
band as TA-Lib — too far off-scale to chart next to a sub-microsecond bar.

**Rust — per-tick latency** (whole 50 000-bar series, µs, lower = faster):

<BenchmarkBar :rows="rustStream" :decimals="0" />

`ta-rs` hands back a bare `f64` from the first tick with no warmup and no
validation; it leads the table by giving those guarantees up. Against `kand`,
Wickra wins streaming **RSI, Bollinger and ATR** and is within 5 % on EMA. `yata` exposes
only SMA/EMA as raw-value methods, so its other rows are omitted rather than
faked.

## 2. Batch — the exact batch, and the opt-in fast one

Whole series in one call, in two forms. **Wickra**'s `batch` is bit for bit what
streaming gives — a guarantee none of the other libraries keep. **Wickra fast**
is the opt-in `batch_fast`: SIMD kernels that reorder the arithmetic and agree
with `batch` to within a few units in the last place, with the same `NaN`
placement and the same result on every platform. We show the full field rather
than cherry-pick.

**Python** (20 000-bar pass, µs/op, lower = faster):

<BenchmarkBar :rows="batch" :decimals="1" />

> All five libraries are measured in the **same Python 3.12 run** as Wickra (no
> CI-vs-desktop mix). The fast batch leads every row, tulipy's SIMD C included;
> the exact batch beats TA-Lib on RSI, MACD and ATR, and `pandas-ta` and `finta`
> trail across the board. A contiguous `float64` NumPy array or `array.array('d')`
> of 8 192 values or more is read in place, without a copy. talipp is excluded
> from the batch chart on purpose — it is streaming-first, so re-instantiating it for a
> full batch pass is not a like-for-like comparison.

**Rust** (50 000-bar pass, µs, lower = faster, into a caller buffer on both
sides). Only Wickra and `kand` expose a batch API; `ta-rs` and `yata` are
streaming-only:

<BenchmarkBar :rows="rustBatch" :decimals="0" />

The fast batch wins **every row**; the exact batch wins **RSI, MACD, Bollinger
and ATR** by 2.1–3.0× and trails `kand` by a few µs on SMA and EMA, where keeping
streaming's bits fixes the order of the additions.

**.NET** (500 000 bars, period 220, QuanTAlib's own setup: its
geometric-Brownian-motion feed, seed 42, BenchmarkDotNet `ShortRun` on .NET 10,
mean µs, lower = faster). Every library writes into a buffer the caller keeps:
Wickra's `Batch` and `BatchFast` into a `Span`, QuanTAlib's span `Batch`,
TA-Lib's output array:

<BenchmarkBar :rows="dotnetBatch" :decimals="0" />

The fast batch leads SMA, EMA and correlation; QuanTAlib's span batch leads WMA,
HMA, ADOSC and skewness by 3–15 % (WMA's gap reaches 20 % in other runs), and
TA-Lib trails both on ADOSC. The two HMAs are different series: Wickra rounds
√220 to 15, QuanTAlib — like TradingView and pandas-ta — truncates it to 14.
QuanTAlib's span correlation is left out: it returns `NaN` for most bars of this
series (its streaming one is correct), so its 1 464 µs is not a comparable
result. Wickra's skewness is the population skewness; QuanTAlib's default is the
sample skewness (its population form, 600 µs).

Streaming in .NET — one call per value from C# into the native core — is level
with QuanTAlib on SMA and EMA and 1.3–4.2× faster on the other five:

<BenchmarkBar :rows="dotnetStream" :decimals="0" />

Beyond the numbers, the edge is breadth (514 indicators) and incremental
streaming across ten languages — the project's
[BENCHMARKS.md](https://github.com/wickra-lib/wickra/blob/main/BENCHMARKS.md)
carries the same tables.

## 3 — Per-binding throughput

The sections above compare Wickra against other libraries — which exist for
Python, Rust and .NET. Every binding calls the **same** Rust core, so this last
table is **not** a speed claim: it measures the raw cost of crossing each
language's FFI boundary, in million updates per second (Mupd/s), for `SMA(20)`
over 200 000 bars (the better of two runs, each the median of 3, same machine,
all targets in one session).

| Target               | streaming | batch  | fast batch | fast into a reused buffer |
|----------------------|----------:|-------:|-----------:|--------------------------:|
| Rust core (no FFI)   |     1 362 | 1 144¹ |    3 068¹  |                     3 068 |
| C / C++              |       397 | 1 131¹ |    3 140¹  |                     3 140 |
| C#                   |       345 |    739 |      1 263 |       3 072 (`Span<double>`) |
| Go                   |      24.5 |    998 |      2 290 |          2 960 (`BatchFastInto`) |
| Java                 |       255 |    950 |      1 120 |     2 778 (`MemorySegment`) |
| R                    |       0.4 |    623 |      1 031 |                         — |
| WASM                 |      34.8 |    380 |        402 |                         — |
| Python               |      27.5 |    530 |        752 |                         — |
| Node.js              |       5.4 |  11 ²  |      1 256 |     3 160 (`batchFastInto`) |

¹ Into a reused buffer — the Rust benchmark and the C ABI have no allocating form.
² A plain JS `Array` in and out; from a `Float64Array` read in place, 19.

Streaming spans more than three orders of magnitude — the raw C ABI costs a few
nanoseconds a call, while R's per-call interpreter overhead makes streaming
thousands of times slower than its own batch. The single `batch` crossing stays
high for every binding that returns a contiguous buffer; Node's `batch` still
boxes every element into a JS `Array`, while its `batchFast` returns a
`Float64Array`. Writing into a buffer the caller reuses — C#'s `Span`, Go's
`BatchFastInto`, Java's native `MemorySegment`, Node's `batchFastInto`, the C ABI
itself — takes the page faults of a fresh result out of the loop and reaches the
Rust ceiling. Reproduce with the per-binding `throughput` scripts — see
[BENCHMARKS.md §3](https://github.com/wickra-lib/wickra/blob/main/BENCHMARKS.md).

## What the numbers do **not** say

- Absolute µs values depend on CPU, memory clock, OS scheduler, and the
  Python / Node.js / Rust / .NET versions — read them as **relative speedups** between
  libraries on identical input, not as a universal performance contract.
- Reproduced on: Windows 11 Pro 26200, AMD Ryzen 9 9950X, 64 GB DDR5,
  Rust 1.92 (release profile, `lto = "fat"`, `codegen-units = 1`), Python 3.12,
  .NET 10.
- The Python Wickra figures are the **Python binding** runtime, not the bare
  Rust kernel — a small PyO3 boundary cost is included on each measurement.

## See also

- [`benchmarks/compare_libraries.py`](https://github.com/wickra-lib/wickra/blob/main/bindings/python/benchmarks/compare_libraries.py)
  — the canonical Python script.
- [`crates/wickra-bench`](https://github.com/wickra-lib/wickra/tree/main/crates/wickra-bench)
  — the Rust cross-library benchmark harness.
- [`bindings/csharp/cross-library`](https://github.com/wickra-lib/wickra/tree/main/bindings/csharp/cross-library)
  — the .NET cross-library harness on QuanTAlib's setup, with its `verify` mode.
- [Bench workflow](https://github.com/wickra-lib/wickra/actions/workflows/bench.yml)
  — nightly run on the GitHub-hosted Linux runner, archived as build artefacts.
- [BENCHMARKS.md §3](https://github.com/wickra-lib/wickra/blob/main/BENCHMARKS.md)
  — per-binding throughput benchmarks: raw updates/sec for each language binding
  (C, C++, C#, Go, Java, Python, R, WASM, Node.js, plus the Rust core baseline). These measure
  each binding's FFI overhead, not the cross-library comparison shown above.
- [Streaming-vs-Batch (docs)](https://docs.wickra.org/Streaming-vs-Batch)
  — what the equivalence guarantee actually means.
