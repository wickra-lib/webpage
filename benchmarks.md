---
title: Benchmarks
description: Wickra vs. the Python TA ecosystem (finta, talipp) and the other Rust TA crates (kand, ta-rs, yata) across batch and streaming workloads — reproducible on your own hardware via the bench scripts.
---

<script setup>
// Full Python batch field, measured in one Python 3.12 run alongside Wickra.
const batch = [
  { label: 'SMA(20)',           wickra: 22.2,  peers: [{ name: 'TA-Lib', value: 15.6 }, { name: 'tulipy', value: 15.9 }, { name: 'pandas-ta', value: 32.7 },  { name: 'finta', value: 290.1 }]  },
  { label: 'EMA(20)',           wickra: 30.5,  peers: [{ name: 'TA-Lib', value: 30.4 }, { name: 'tulipy', value: 30.9 }, { name: 'pandas-ta', value: 46.7 },  { name: 'finta', value: 198.5 }]  },
  { label: 'RSI(14)',           wickra: 52.3,  peers: [{ name: 'TA-Lib', value: 72.0 }, { name: 'tulipy', value: 34.2 }, { name: 'pandas-ta', value: 88.8 },  { name: 'finta', value: 812.3 }]  },
  { label: 'MACD(12,26,9)',     wickra: 129.8, peers: [{ name: 'TA-Lib', value: 111.1 }, { name: 'tulipy', value: 38.4 }, { name: 'pandas-ta', value: 286.8 }, { name: 'finta', value: 716.7 }]  },
  { label: 'Bollinger(20,2.0)', wickra: 87.2,  peers: [{ name: 'TA-Lib', value: 74.6 }, { name: 'tulipy', value: 37.9 }, { name: 'pandas-ta', value: 474.3 }, { name: 'finta', value: 1255.5 }] },
  { label: 'ATR(14)',           wickra: 74.7,  peers: [{ name: 'TA-Lib', value: 87.3 }, { name: 'tulipy', value: 35.5 }, { name: 'pandas-ta', value: null },  { name: 'finta', value: 3496.4 }] },
]

// Python streaming: Wickra vs talipp, the only other incremental peer. The
// recompute-on-every-tick libraries (TA-Lib/tulipy/pandas-ta/finta) are
// 2 800–19 000× slower here — too far off-scale for a bar, covered in prose.
const streaming = [
  { label: 'SMA(20)',           wickra: 0.089, unit: 'µs / tick', peers: [{ name: 'talipp', value: 0.959 }] },
  { label: 'EMA(20)',           wickra: 0.111, unit: 'µs / tick', peers: [{ name: 'talipp', value: 1.187 }] },
  { label: 'RSI(14)',           wickra: 0.061, unit: 'µs / tick', peers: [{ name: 'talipp', value: 0.949 }] },
  { label: 'MACD(12,26,9)',     wickra: 0.079, unit: 'µs / tick', peers: [{ name: 'talipp', value: 3.298 }] },
  { label: 'Bollinger(20,2.0)', wickra: 0.089, unit: 'µs / tick', peers: [{ name: 'talipp', value: 4.967 }] },
]

// Rust core vs Rust crates, no language-binding overhead. Per-tick in ns.
const rustStream = [
  { label: 'SMA(20)',           wickra: 50,  unit: 'ns', peers: [{ name: 'kand', value: 38 },  { name: 'ta-rs', value: 47 },  { name: 'yata', value: 38 }]   },
  { label: 'EMA(20)',           wickra: 154, unit: 'ns', peers: [{ name: 'kand', value: 69 },  { name: 'ta-rs', value: 56 },  { name: 'yata', value: 69 }]   },
  { label: 'RSI(14)',           wickra: 164, unit: 'ns', peers: [{ name: 'kand', value: 216 }, { name: 'ta-rs', value: 74 },  { name: 'yata', value: null }] },
  { label: 'MACD(12,26,9)',     wickra: 275, unit: 'ns', peers: [{ name: 'kand', value: 143 }, { name: 'ta-rs', value: 66 },  { name: 'yata', value: null }] },
  { label: 'Bollinger(20,2.0)', wickra: 128, unit: 'ns', peers: [{ name: 'kand', value: 248 }, { name: 'ta-rs', value: 168 }, { name: 'yata', value: null }] },
  { label: 'ATR(14)',           wickra: 152, unit: 'ns', peers: [{ name: 'kand', value: 166 }, { name: 'ta-rs', value: 61 },  { name: 'yata', value: null }] },
]
const rustBatch = [
  { label: 'SMA(20)',           wickra: 53,  peers: [{ name: 'kand', value: 41 }]  },
  { label: 'EMA(20)',           wickra: 111, peers: [{ name: 'kand', value: 71 }]  },
  { label: 'RSI(14)',           wickra: 221, peers: [{ name: 'kand', value: 259 }] },
  { label: 'MACD(12,26,9)',     wickra: 533, peers: [{ name: 'kand', value: 327 }] },
  { label: 'Bollinger(20,2.0)', wickra: 404, peers: [{ name: 'kand', value: 460 }] },
  { label: 'ATR(14)',           wickra: 122, peers: [{ name: 'kand', value: 169 }] },
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

**Python — per-tick latency** (seed 5 000 bars, then feed ticks one at a time):

<BenchmarkBar :rows="streaming" />

Against the only other incremental Python peer Wickra is **11–56× faster**;
against the recompute-on-every-tick libraries it is **2 800–19 000× faster**
(`finta` RSI hits 19 000×). tulipy / pandas-ta land in the same recompute band
as TA-Lib — too far off-scale to chart next to a sub-microsecond bar.

**Rust — per-tick latency** (whole 50 000-bar series, lower = faster):

<BenchmarkBar :rows="rustStream" :decimals="0" />

`ta-rs` hands back a bare `f64` from the first tick with no warmup and no
validation; it leads several rows by giving those guarantees up. Against `kand`,
Wickra wins streaming **RSI, Bollinger and ATR**. `yata` exposes only SMA/EMA as
raw-value methods, so its other rows are omitted rather than faked.

## 2. Batch — competitive, not the headline

Whole series in one call. This is **not** the headline: hand-tuned C (`tulipy`,
TA-Lib) and the leanest crate (`kand`) win the simple recurrences, and we show
the full field rather than cherry-pick. Wickra trades a few µs per pass for the
`None`-warmup, NaN-safety and bit-exact `batch == streaming` guarantees none of
them keep — yet it still beats `pandas-ta` and `finta` on every row, and TA-Lib
on RSI and ATR.

**Python** (20 000-bar pass, µs/op, lower = faster):

<BenchmarkBar :rows="batch" :decimals="1" />

> All five libraries are measured in the **same Python 3.12 run** as Wickra (no
> CI-vs-desktop mix). tulipy's SIMD C and TA-Lib lead the simple recurrences;
> `pandas-ta` and `finta` trail across the board. talipp is excluded from the
> batch chart on purpose — it is streaming-first, so re-instantiating it for a
> full batch pass is not a like-for-like comparison.

**Rust** (50 000-bar pass, µs, lower = faster). Only Wickra and `kand` expose a
batch API; `ta-rs` and `yata` are streaming-only:

<BenchmarkBar :rows="rustBatch" :decimals="0" />

Wickra wins **RSI, Bollinger and ATR** outright and trades a few µs on the simple
recurrences for the warmup/NaN guarantees. Its real edge is breadth (474
indicators) and native O(1) streaming across four languages, not winning every
micro-benchmark — the
[project README](https://github.com/wickra-lib/wickra#benchmarks) carries the
same tables.

## 3 — Per-binding throughput

The sections above compare Wickra against other libraries — which only exist for
Python and Rust. Every binding calls the **same** Rust core, so this last table
is **not** a speed claim: it measures the raw cost of crossing each language's
FFI boundary, in million updates per second (Mupd/s), for `SMA(20)` over 200 000
bars (median of 3, same machine as above).

| Target               | streaming (Mupd/s) | batch (Mupd/s) |
|----------------------|-------------------:|---------------:|
| Rust core (no FFI)   |                391 |            500 |
| C                    |                383 |            330 |
| C# / .NET            |                337 |            244 |
| Python               |                 33 |            488 |
| Java                 |                 28 |            175 |
| Go                   |                 24 |            400 |
| WebAssembly          |                 19 |            167 |
| Node.js              |                 17 |             10 |
| R                    |                0.1 |            193 |

Streaming spans three orders of magnitude — the raw C ABI (383) nearly matches
the FFI-free Rust ceiling (391), while R's per-call interpreter overhead makes
streaming ~2000× slower than its own batch. The single `batch` crossing
converges near the core speed for the zero-copy bindings; Node is the outlier
because its napi `batch` boxes every element into a JS `Array`. Reproduce with
the per-binding `throughput` scripts — see
[BENCHMARKS.md §3](https://github.com/wickra-lib/wickra/blob/main/BENCHMARKS.md).

## What the numbers do **not** say

- Absolute µs values depend on CPU, memory clock, OS scheduler, and the
  Python / Node / Rust versions — read them as **relative speedups** between
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
  (C, C#, Go, Java, Python, R, WASM, plus the Rust core baseline). These measure
  each binding's FFI overhead, not the cross-library comparison shown above.
- [Streaming-vs-Batch (docs)](https://docs.wickra.org/Streaming-vs-Batch)
  — what the equivalence guarantee actually means.
