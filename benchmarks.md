---
title: Benchmarks
description: Wickra vs. the Python TA ecosystem (finta, talipp) and the other Rust TA crates (kand, ta-rs, yata) across batch and streaming workloads — reproducible on your own hardware via the bench scripts.
---

<script setup>
const batch = [
  { label: 'SMA(20)',           wickra: 59.6,  peer: 354.2,  peerName: 'finta' },
  { label: 'EMA(20)',           wickra: 88.4,  peer: 309.3,  peerName: 'finta' },
  { label: 'RSI(14)',           wickra: 77.3,  peer: 1283.0, peerName: 'finta' },
  { label: 'MACD(12,26,9)',     wickra: 116.4, peer: 529.5,  peerName: 'finta' },
  { label: 'Bollinger(20,2.0)', wickra: 146.0, peer: 1246.4, peerName: 'finta' },
  { label: 'ATR(14)',           wickra: 135.8, peer: 3811.8, peerName: 'finta' },
]

const streaming = [
  { label: 'SMA(20)',           wickra: 0.067, peer: 0.633, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'EMA(20)',           wickra: 0.051, peer: 0.628, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'RSI(14)',           wickra: 0.053, peer: 1.004, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'MACD(12,26,9)',     wickra: 0.071, peer: 3.641, peerName: 'talipp', unit: 'µs / tick' },
  { label: 'Bollinger(20,2.0)', wickra: 0.085, peer: 4.866, peerName: 'talipp', unit: 'µs / tick' },
]
</script>

# Benchmarks

Wickra is a **streaming-first** library: the state machine inside every
indicator takes a single new tick and returns its updated output in constant
time. The charts below show what that costs against the Python TA ecosystem —
and, in prose, the honest picture against the other Rust crates.

::: tip Reproduce these on your own hardware
```bash
# Python — vs finta / talipp / TA-Lib / tulipy
pip install -e bindings/python[bench]
python -m benchmarks.compare_libraries

# Rust core — vs kand / ta-rs / yata
cargo bench -p wickra-bench
```

The Python script auto-detects every peer library installed in your venv. The
nightly `cross-library-bench` workflow runs both suites on a Linux runner and
uploads the raw reports as artefacts.
:::

## Python batch — single full pass over 20 000 bars

Lower bar = faster. The orange bar is **Wickra**, the grey bar is `finta`, the
fastest pure-Python peer that installs without C build tooling.

<BenchmarkBar :rows="batch" lower-is-better />

> TA-Lib and tulipy ship C extensions that don't build cleanly on every desktop,
> so their numbers come from the Linux CI job rather than this chart. pandas-ta
> needs Python ≥ 3.12 and isn't in the 3.11 bench matrix. talipp is left out of
> the batch chart on purpose — it is streaming-first, and re-instantiating it for
> a full batch pass is not a like-for-like comparison; it appears in the
> streaming chart below, where it belongs.

## Python streaming — per-tick latency after 5 000 historical bars

This is where streaming-first really shows. A batch-only library re-runs its
full indicator over the entire history on every new tick; Wickra advances its
internal state by one step. talipp is the only Python peer with a true
incremental API.

<BenchmarkBar :rows="streaming" lower-is-better />

## Against the other Rust crates — the honest picture

The fairest comparison is Rust core vs Rust core, with no language-binding
overhead. Here Wickra is **not** the outright fastest, and we don't pretend
otherwise:

- **ta-rs** is the per-indicator speed champion on almost every row — it returns
  a bare `f64` with no input validation and no warmup state, trading away the
  NaN-safety and `None`-warmup semantics Wickra keeps.
- Against **kand**, Wickra wins streaming **RSI, Bollinger and ATR**, and trails
  on the pure recurrences (**EMA, MACD**) and **SMA**.
- **yata** exposes only SMA/EMA as raw-value methods.

The full per-indicator Rust-vs-Rust table — wins *and* losses — is in the
[project README](https://github.com/wickra-lib/wickra#benchmarks). Wickra's edge
is breadth (467 indicators) and native O(1) streaming across four languages, not
winning every micro-benchmark.

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
