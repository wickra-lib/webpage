---
title: Benchmarks
description: Wickra vs. the Python TA ecosystem (finta, talipp) and the other Rust TA crates (kand, ta-rs, yata) across batch and streaming workloads — reproducible on your own hardware via the bench scripts.
---

<script setup>
// Full Python batch field, measured in one Python 3.12 run alongside Wickra.
const batchCols = ['Wickra', 'TA-Lib', 'tulipy', 'pandas-ta', 'finta']
const batch = [
  { label: 'SMA(20)',           cells: [22.2,  15.6,  15.9, 32.7,  290.1]  },
  { label: 'EMA(20)',           cells: [30.5,  30.4,  30.9, 46.7,  198.5]  },
  { label: 'RSI(14)',           cells: [52.3,  72.0,  34.2, 88.8,  812.3]  },
  { label: 'MACD(12,26,9)',     cells: [129.8, 111.1, 38.4, 286.8, 716.7]  },
  { label: 'Bollinger(20,2.0)', cells: [87.2,  74.6,  37.9, 474.3, 1255.5] },
  { label: 'ATR(14)',           cells: [74.7,  87.3,  35.5, null,  3496.4] },
]

const streaming = [
  { label: 'SMA(20)',           wickra: 0.089, peer: 0.959, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'EMA(20)',           wickra: 0.111, peer: 1.187, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'RSI(14)',           wickra: 0.061, peer: 0.949, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'MACD(12,26,9)',     wickra: 0.079, peer: 3.298, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'Bollinger(20,2.0)', wickra: 0.089, peer: 4.967, peerName: 'talipp', unit: 'µs / tick' },
]

// Full Python streaming field: the only incremental peer (talipp) plus the
// recompute-on-every-tick band (TA-Lib stands in for tulipy / pandas-ta, which
// land in the same band). µs per tick after a 5 000-bar warmup.
const streamCols = ['Wickra', 'talipp', 'TA-Lib (recompute)']
const streamFull = [
  { label: 'SMA(20)',           cells: [0.089, 0.96, 422] },
  { label: 'EMA(20)',           cells: [0.111, 1.19, 430] },
  { label: 'RSI(14)',           cells: [0.061, 0.95, 298] },
  { label: 'MACD(12,26,9)',     cells: [0.079, 3.30, 327] },
  { label: 'Bollinger(20,2.0)', cells: [0.089, 4.97, 296] },
]

// Rust core vs Rust crates, no language-binding overhead.
const rustStreamCols = ['Wickra', 'kand', 'ta-rs', 'yata']
const rustStream = [
  { label: 'SMA(20)',           cells: [50,  38,  47,  38]   },
  { label: 'EMA(20)',           cells: [154, 69,  56,  69]   },
  { label: 'RSI(14)',           cells: [164, 216, 74,  null] },
  { label: 'MACD(12,26,9)',     cells: [275, 143, 66,  null] },
  { label: 'Bollinger(20,2.0)', cells: [128, 248, 168, null] },
  { label: 'ATR(14)',           cells: [152, 166, 61,  null] },
]
const rustBatchCols = ['Wickra', 'kand']
const rustBatch = [
  { label: 'SMA(20)',           cells: [53,  41]  },
  { label: 'EMA(20)',           cells: [111, 71]  },
  { label: 'RSI(14)',           cells: [221, 259] },
  { label: 'MACD(12,26,9)',     cells: [533, 327] },
  { label: 'Bollinger(20,2.0)', cells: [404, 460] },
  { label: 'ATR(14)',           cells: [122, 169] },
]
</script>

# Benchmarks

Wickra is a **streaming-first** library: the state machine inside every
indicator takes a single new tick and returns its updated output in constant
time. The tables below show what that costs against the full Python TA ecosystem
and the other Rust crates — wins **and** losses, the same figures the
[project README](https://github.com/wickra-lib/wickra#benchmarks) carries.

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

<BenchmarkBar :rows="streaming" lower-is-better />

**Python — per-tick latency** (seed 5 000 bars, then feed ticks one at a time):

<BenchmarkTable :columns="streamCols" :rows="streamFull" unit="µs / tick" />

Against the only other incremental Python peer Wickra is **11–56× faster**;
against the recompute-on-every-tick libraries it is **2 800–19 000× faster**
(`finta` RSI hits 19 000×). tulipy / pandas-ta land in the same recompute band
as TA-Lib.

**Rust — per-tick latency** (whole 50 000-bar series, lower = faster):

<BenchmarkTable :columns="rustStreamCols" :rows="rustStream" :decimals="0" />

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

<BenchmarkTable :columns="batchCols" :rows="batch" :decimals="1" unit="µs/op" />

> All five libraries are measured in the **same Python 3.12 run** as Wickra (no
> CI-vs-desktop mix). tulipy's SIMD C and TA-Lib lead the simple recurrences;
> `pandas-ta` and `finta` trail across the board. talipp is excluded from the
> batch table on purpose — it is streaming-first, so re-instantiating it for a
> full batch pass is not a like-for-like comparison.

**Rust** (50 000-bar pass, µs, lower = faster). Only Wickra and `kand` expose a
batch API; `ta-rs` and `yata` are streaming-only:

<BenchmarkTable :columns="rustBatchCols" :rows="rustBatch" :decimals="0" unit="µs" />

Wickra wins **RSI, Bollinger and ATR** outright and trades a few µs on the simple
recurrences for the warmup/NaN guarantees. Its real edge is breadth (474
indicators) and native O(1) streaming across four languages, not winning every
micro-benchmark — the
[project README](https://github.com/wickra-lib/wickra#benchmarks) carries the
same tables.

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
- [Streaming-vs-Batch (docs)](https://docs.wickra.org/Streaming-vs-Batch)
  — what the equivalence guarantee actually means.
