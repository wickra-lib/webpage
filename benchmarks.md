---
title: Benchmarks
description: Wickra vs. the Python TA ecosystem (finta, talipp) and the other Rust TA crates (kand, ta-rs, yata) across batch and streaming workloads — reproducible on your own hardware via the bench scripts.
---

<script setup>
// Full Python batch field, measured in one Python 3.12 run alongside Wickra's
// exact batch and its opt-in batch_fast.
const batch = [
  { label: 'SMA(20)',           wickra: 21.7, wickraFast: 10.4, peers: [{ name: 'TA-Lib', value: 15.2 }, { name: 'tulipy', value: 15.8 }, { name: 'pandas-ta', value: 32.6 },  { name: 'finta', value: 269.8 }]  },
  { label: 'EMA(20)',           wickra: 33.9, wickraFast: 10.6, peers: [{ name: 'TA-Lib', value: 29.2 }, { name: 'tulipy', value: 29.6 }, { name: 'pandas-ta', value: 51.2 },  { name: 'finta', value: 195.4 }]  },
  { label: 'RSI(14)',           wickra: 36.4, wickraFast: 21.3, peers: [{ name: 'TA-Lib', value: 69.8 }, { name: 'tulipy', value: 35.3 }, { name: 'pandas-ta', value: 107.6 }, { name: 'finta', value: 792.0 }]  },
  { label: 'MACD(12,26,9)',     wickra: 36.0, wickraFast: 26.1, peers: [{ name: 'TA-Lib', value: 96.1 }, { name: 'tulipy', value: 32.5 }, { name: 'pandas-ta', value: 203.4 }, { name: 'finta', value: 503.1 }]  },
  { label: 'Bollinger(20,2.0)', wickra: 71.6, wickraFast: 36.4, peers: [{ name: 'TA-Lib', value: 68.4 }, { name: 'tulipy', value: 35.9 }, { name: 'pandas-ta', value: 397.0 }, { name: 'finta', value: 753.5 }]  },
  { label: 'ATR(14)',           wickra: 49.3, wickraFast: 34.0, peers: [{ name: 'TA-Lib', value: 76.8 }, { name: 'tulipy', value: 30.8 }, { name: 'pandas-ta', value: null },  { name: 'finta', value: 2094.3 }] },
]

// Python streaming: Wickra vs talipp, the only other incremental peer. The
// recompute-on-every-tick libraries (TA-Lib/tulipy/pandas-ta/finta) are
// 1 600–10 500× slower here — too far off-scale for a bar, covered in prose.
const streaming = [
  { label: 'SMA(20)',           wickra: 0.070, unit: 'µs / tick', peers: [{ name: 'talipp', value: 0.537 }] },
  { label: 'EMA(20)',           wickra: 0.074, unit: 'µs / tick', peers: [{ name: 'talipp', value: 0.849 }] },
  { label: 'RSI(14)',           wickra: 0.113, unit: 'µs / tick', peers: [{ name: 'talipp', value: 1.327 }] },
  { label: 'MACD(12,26,9)',     wickra: 0.121, unit: 'µs / tick', peers: [{ name: 'talipp', value: 4.373 }] },
  { label: 'Bollinger(20,2.0)', wickra: 0.102, unit: 'µs / tick', peers: [{ name: 'talipp', value: 6.746 }] },
]

// Rust core vs Rust crates, no language-binding overhead: µs for the whole
// 50 000-bar series.
const rustStream = [
  { label: 'SMA(20)',           wickra: 51,  peers: [{ name: 'kand', value: 37 },  { name: 'ta-rs', value: 45 },  { name: 'yata', value: 30 }]   },
  { label: 'EMA(20)',           wickra: 70,  peers: [{ name: 'kand', value: 68 },  { name: 'ta-rs', value: 54 },  { name: 'yata', value: 70 }]   },
  { label: 'RSI(14)',           wickra: 170, peers: [{ name: 'kand', value: 211 }, { name: 'ta-rs', value: 73 },  { name: 'yata', value: null }] },
  { label: 'MACD(12,26,9)',     wickra: 226, peers: [{ name: 'kand', value: 165 }, { name: 'ta-rs', value: 62 },  { name: 'yata', value: null }] },
  { label: 'Bollinger(20,2.0)', wickra: 175, peers: [{ name: 'kand', value: 275 }, { name: 'ta-rs', value: 154 }, { name: 'yata', value: null }] },
  { label: 'ATR(14)',           wickra: 84,  peers: [{ name: 'kand', value: 156 }, { name: 'ta-rs', value: 62 },  { name: 'yata', value: null }] },
]
const rustBatch = [
  { label: 'SMA(20)',           wickra: 47,  wickraFast: 21, peers: [{ name: 'kand', value: 39 }]  },
  { label: 'EMA(20)',           wickra: 75,  wickraFast: 16, peers: [{ name: 'kand', value: 67 }]  },
  { label: 'RSI(14)',           wickra: 90,  wickraFast: 46, peers: [{ name: 'kand', value: 221 }] },
  { label: 'MACD(12,26,9)',     wickra: 82,  wickraFast: 58, peers: [{ name: 'kand', value: 228 }] },
  { label: 'Bollinger(20,2.0)', wickra: 194, wickraFast: 93, peers: [{ name: 'kand', value: 346 }] },
  { label: 'ATR(14)',           wickra: 71,  wickraFast: 38, peers: [{ name: 'kand', value: 157 }] },
]
</script>

# Benchmarks

Wickra is a **streaming-first** library: the state machine inside every
indicator takes a single new tick and returns its updated output in constant
time. The charts below show what that costs against the full Python TA ecosystem
and the other Rust crates — wins **and** losses, the same figures the
[project README](https://github.com/wickra-lib/wickra#benchmarks) carries.
Each bar is normalised to the slowest in its group, so the shortest bar is the
fastest library; the value to the right is the measured number.

::: tip Choosing a language? Jump to per-binding throughput
All 10 bindings call the same verified Rust core, but the cost of crossing each
language's FFI boundary differs by orders of magnitude on streaming workloads.
See [**Per-binding throughput**](#_3-—-per-binding-throughput) to pick the binding
that keeps up with your hot loop (Rust / C / C++ stream near the core; C#, Go and
Java batch at the core's rate into a reused buffer; R is the streaming outlier).
:::

::: tip Reproduce these on your own hardware
```bash
# Python — vs talipp / TA-Lib / tulipy / pandas-ta / finta
pip install -e bindings/python[bench]
python -m benchmarks.compare_libraries

# Rust core — vs kand / ta-rs / yata
cargo bench -p wickra-bench
```

The Python script auto-detects every peer library installed in your venv. The
nightly `cross-library-bench` workflow runs both suites on a Linux runner and
uploads the raw reports as artefacts.
:::

## 1. Streaming — the structural win

Live trading feeds one tick at a time. Wickra updates every indicator in
**O(1)**; batch-only libraries (TA-Lib, tulipy, finta, pandas-ta) have no
incremental API and must recompute the whole history on every tick. Only
`talipp` (Python) and `ta-rs` / `yata` (Rust) carry real per-tick state. This is
the gap the library was built to expose.

**Python — per-tick latency** (seed 5 000 bars, then feed 10 000 ticks one at a time):

<BenchmarkBar :rows="streaming" />

Against the only other incremental Python peer Wickra is **8–66× faster**;
against the recompute-on-every-tick libraries it is **1 600–10 500× faster**
(`finta` Bollinger hits 10 500×). tulipy / pandas-ta land in the same recompute
band as TA-Lib — too far off-scale to chart next to a sub-microsecond bar.

**Rust — per-tick latency** (whole 50 000-bar series, µs, lower = faster):

<BenchmarkBar :rows="rustStream" :decimals="0" />

`ta-rs` hands back a bare `f64` from the first tick with no warmup and no
validation; it leads the table by giving those guarantees up. Against `kand`,
Wickra wins streaming **RSI, Bollinger and ATR** and ties EMA. `yata` exposes
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
> CI-vs-desktop mix). The fast batch leads TA-Lib and tulipy on SMA, EMA, RSI and
> MACD; tulipy's SIMD C edges it on Bollinger and ATR; the exact batch beats
> TA-Lib on RSI, MACD and ATR, and `pandas-ta` and `finta` trail across the board. talipp is excluded from the
> batch chart on purpose — it is streaming-first, so re-instantiating it for a
> full batch pass is not a like-for-like comparison.

**Rust** (50 000-bar pass, µs, lower = faster, into a caller buffer on both
sides). Only Wickra and `kand` expose a batch API; `ta-rs` and `yata` are
streaming-only:

<BenchmarkBar :rows="rustBatch" :decimals="0" />

The fast batch wins **every row**; the exact batch wins **RSI, MACD, Bollinger
and ATR** and trails `kand` by a few µs on SMA and EMA, where keeping
streaming's bits fixes the order of the additions. Beyond the numbers, the edge
is breadth (514 indicators) and O(1) streaming across ten languages — the
[project README](https://github.com/wickra-lib/wickra#benchmarks) carries the
same tables.

## 3 — Per-binding throughput

The sections above compare Wickra against other libraries — which only exist for
Python and Rust. Every binding calls the **same** Rust core, so this last table
is **not** a speed claim: it measures the raw cost of crossing each language's
FFI boundary, in million updates per second (Mupd/s), for `SMA(20)` over 200 000
bars (the better of two runs, each the median of 3, same machine and session).

| Target               | streaming | batch | fast batch | fast into a reused buffer |
|----------------------|----------:|------:|-----------:|--------------------------:|
| Rust core (no FFI)   |     1 374 | 1 151 |      3 115 |                     3 115 |
| C / C++              |       399 | 1 126 |      3 160 |                     3 160 |
| C#                   |        63 |   744 |      1 409 |                     3 145 |
| Go                   |        24 | 1 046 |      2 435 |                     3 005 |
| Java                 |        64 |   314 |        367 |                     2 744 |
| R                    |       0.1 |   601 |      1 021 |                         — |
| WASM                 |        34 |   424 |        406 |                         — |
| Python               |        29 |   248 |        314 |                         — |
| Node.js              |       5.4 |    11 |      1 255 |                         — |

Streaming spans four orders of magnitude — the raw C ABI is nearly free, while
R's per-call interpreter overhead makes streaming thousands of times slower than
its own batch. The single `batch` crossing stays high for the bindings that
return a contiguous buffer; Node's `batch` still boxes every element into a JS
`Array`, while its `batchFast` returns a `Float64Array`. Writing into a buffer the
caller reuses — C#'s `Span`, Go's `BatchFastInto`, Java's native `MemorySegment`,
the C ABI itself — reaches the Rust ceiling. Reproduce with the per-binding
`throughput` scripts — see
[BENCHMARKS.md §3](https://github.com/wickra-lib/wickra/blob/main/BENCHMARKS.md).

## What the numbers do **not** say

- Absolute µs values depend on CPU, memory clock, OS scheduler, and the
  Python / Node.js / Rust versions — read them as **relative speedups** between
  libraries on identical input, not as a universal performance contract.
- Reproduced on: Windows 11 Pro 26200, AMD Ryzen 9 9950X, 64 GB DDR5,
  Rust 1.92 (release profile, `lto = "fat"`, `codegen-units = 1`), Python 3.12.
- The Python Wickra figures are the **Python binding** runtime, not the bare
  Rust kernel — a small PyO3 boundary cost is included on each measurement.

## See also

- [`benchmarks/compare_libraries.py`](https://github.com/wickra-lib/wickra/blob/main/bindings/python/benchmarks/compare_libraries.py)
  — the canonical Python script.
- [`crates/wickra-bench`](https://github.com/wickra-lib/wickra/tree/main/crates/wickra-bench)
  — the Rust cross-library benchmark harness.
- [Bench workflow](https://github.com/wickra-lib/wickra/actions/workflows/bench.yml)
  — nightly run on the GitHub-hosted Linux runner, archived as build artefacts.
- [BENCHMARKS.md §3](https://github.com/wickra-lib/wickra/blob/main/BENCHMARKS.md)
  — per-binding throughput benchmarks: raw updates/sec for each language binding
  (C, C++, C#, Go, Java, Python, R, WASM, plus the Rust core baseline). These measure
  each binding's FFI overhead, not the cross-library comparison shown above.
- [Streaming-vs-Batch (docs)](https://docs.wickra.org/Streaming-vs-Batch)
  — what the equivalence guarantee actually means.
