---
title: Benchmarks
description: Wickra vs. finta, talipp, and pandas-ta across batch and streaming workloads — numbers reproducible on your own hardware via the bench script.
---

<script setup>
const batch = [
  { label: 'SMA(20)',           wickra: 95.6,  peer: 343.5,   peerName: 'finta' },
  { label: 'EMA(20)',           wickra: 64.6,  peer: 223.1,   peerName: 'finta' },
  { label: 'RSI(14)',           wickra: 126.2, peer: 1107.1,  peerName: 'finta' },
  { label: 'MACD(12,26,9)',     wickra: 119.0, peer: 531.8,   peerName: 'finta' },
  { label: 'Bollinger(20,2.0)', wickra: 105.3, peer: 812.0,   peerName: 'finta' },
  { label: 'ATR(14)',           wickra: 123.5, peer: 5144.8,  peerName: 'finta' },
]

const batchTalipp = [
  { label: 'SMA(20)',           wickra: 95.6,  peer: 7640.6,   peerName: 'talipp' },
  { label: 'EMA(20)',           wickra: 64.6,  peer: 12160.9,  peerName: 'talipp' },
  { label: 'RSI(14)',           wickra: 126.2, peer: 15792.2,  peerName: 'talipp' },
  { label: 'MACD(12,26,9)',     wickra: 119.0, peer: 49788.1,  peerName: 'talipp' },
  { label: 'Bollinger(20,2.0)', wickra: 105.3, peer: 130938.3, peerName: 'talipp' },
  { label: 'ATR(14)',           wickra: 123.5, peer: 28816.0,  peerName: 'talipp' },
]

const streaming = [
  { label: 'RSI(14)', wickra: 0.119, peer: 1.644, peerName: 'talipp', unit: 'µs / tick' },
]
</script>

# Benchmarks

Wickra is a **streaming-first** library: the state machine inside every
indicator can take a single new tick and return its updated output in
constant time. The numbers below show what that costs in wall-clock
time relative to the most-used Python TA libraries.

::: tip Reproduce these on your own hardware
```bash
pip install -e bindings/python[bench]
python -m benchmarks.compare_libraries
```

The script auto-detects every peer library installed in your venv and
runs them against the same generated input as Wickra. The CI job
`cross-library-bench` uploads the raw report as an artefact on every push.
:::

## Batch — single full pass over 20 000 bars

Lower bar = faster. The orange bar is **Wickra**, the grey bar is the peer.

### vs. finta

<BenchmarkBar :rows="batch" lower-is-better />

### vs. talipp

<BenchmarkBar :rows="batchTalipp" lower-is-better />

## Streaming — per-tick latency after 5 000 historical bars

This is where streaming-first really shows. A batch-only library has to
re-run its full indicator over the entire history on every new tick;
Wickra advances its internal state by one step.

<BenchmarkBar :rows="streaming" lower-is-better />

## Why isn't TA-Lib / pandas-ta on these charts?

Both fail to install cleanly on Windows without C build tooling —
which is precisely the install-pain Wickra was built to remove. The
[bench script](https://github.com/wickra-lib/wickra/blob/main/benchmarks/compare_libraries.py)
auto-detects every peer library it can find and runs them on the same
inputs as Wickra; install them in your environment and those rows
will show up too.

## What the numbers do **not** say

- Absolute µs values depend on CPU, memory clock, OS scheduler, and
  the Python / Node / Rust versions — read them as **relative
  speedups** between libraries on identical input, not as a universal
  performance contract.
- Reproduced on: Windows 11 Pro 26200, AMD Ryzen 9 9950X, 64 GB
  DDR5, Rust 1.92 (release profile, `lto = "fat"`,
  `codegen-units = 1`), Python 3.12, Node 20.
- The Wickra figures are the **Python binding** runtime, not the bare
  Rust kernel — there is a small PyO3 boundary cost included on each
  measurement.

## See also

- [`benchmarks/compare_libraries.py`](https://github.com/wickra-lib/wickra/blob/main/benchmarks/compare_libraries.py)
  — the canonical script the table above runs.
- [Bench workflow](https://github.com/wickra-lib/wickra/actions/workflows/bench.yml)
  — nightly run on the GitHub-hosted Linux runner, archived
  as build artefacts.
- [Streaming-vs-Batch (docs)](https://docs.wickra.org/Streaming-vs-Batch)
  — what the equivalence guarantee actually means.
