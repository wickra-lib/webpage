---
layout: home
title: Wickra — streaming-first technical indicators in Rust
titleTemplate: false

hero:
  name: "Wickra"
  text: "Streaming-first technical indicators."
  tagline: "479 indicators with a Rust core and Python, Node, and WASM bindings. Same code for backtest and live tick. Install-free."
  image:
    src: /wickra-mark.svg
    alt: Wickra
  actions:
    - theme: brand
      text: Live demo
      link: /demo
    - theme: alt
      text: View on GitHub
      link: https://github.com/wickra-lib/wickra
    - theme: alt
      text: Benchmarks
      link: /benchmarks

features:
  - icon: ⚡
    title: O(1) per tick
    details: Every indicator is a state machine. Streaming updates are constant-time — no recomputing over history on every new bar.
  - icon: 🦀
    title: Rust core, four bindings
    details: One implementation in Rust. Python (PyO3), Node (napi-rs), browsers (wasm-bindgen), and Rust itself all share it.
  - icon: 📦
    title: Install-free
    details: "pip install wickra works on Windows without a C toolchain. So does npm install wickra. And cargo add wickra. Zero system deps."
  - icon: 🧪
    title: 100 % covered
    details: Reference-value tests for every indicator, plus property tests for the streaming invariants. CI runs 28 checks across three OSes.
  - icon: 🔄
    title: batch == streaming
    details: Feed prices one by one or hand the whole vector at once — same numeric output, same warmup, same NaN profile. Pinned by tests.
  - icon: 📈
    title: Live exchange feed
    details: Optional Binance Spot WebSocket adapter ships with the data crate. Auto-reconnects, applies size limits, and now talks to Testnet via BinanceConfig.
---

<script setup>
const installTabs = [
  { label: 'Python', lang: 'bash', code: 'pip install wickra' },
  { label: 'Node',   lang: 'bash', code: 'npm install wickra' },
  { label: 'Rust',   lang: 'bash', code: 'cargo add wickra' },
  { label: 'WASM',   lang: 'bash', code: 'npm install wickra-wasm' },
]

const pyCode = `import wickra as ta

rsi = ta.RSI(14)
for price in live_feed:
    v = rsi.update(price)
    if v is not None and v > 70:
        print('overbought', v)`

const nodeCode = `import { RSI } from 'wickra'

const rsi = new RSI(14)
for (const price of liveFeed) {
  const v = rsi.update(price)
  if (v != null && v > 70) console.log('overbought', v)
}`

const rustCode = `use wickra::{Indicator, Rsi};

let mut rsi = Rsi::new(14)?;
for price in live_feed {
    if let Some(v) = rsi.update(price) {
        if v > 70.0 { println!("overbought {v}"); }
    }
}`

const wasmCode = `import init, { RSI } from 'wickra-wasm'

await init()
const rsi = new RSI(14)
for (const price of liveFeed) {
  const v = rsi.update(price)
  if (v != null && v > 70) console.log('overbought', v)
}`

const snippetTabs = [
  { label: 'Python', lang: 'python',     code: pyCode },
  { label: 'Node',   lang: 'javascript', code: nodeCode },
  { label: 'Rust',   lang: 'rust',       code: rustCode },
  { label: 'WASM',   lang: 'javascript', code: wasmCode },
]
</script>

<div style="max-width: 1140px; margin: 64px auto 0; padding: 0 24px;">

## Install in 30 seconds {#install}

<InstallTabs :tabs="installTabs" />

## A streaming RSI in every language {#snippets}

<InstallTabs :tabs="snippetTabs" />

## Why streaming-first matters {#why}

A batch-only library recomputes its full indicator over every historical bar
each time a new tick arrives. With a 5 000-bar history that's 5 001 work
instead of 1. Wickra holds the indicator state in a struct and advances it
by one update per tick — the cost stays flat as your history grows.

| Library scenario | Cost per tick (5 000-bar history) |
|---|---|
| Wickra (streaming RSI(14))     | **0.119 µs** ⚡ |
| talipp     (streaming RSI(14)) | 1.644 µs (13.8× slower) |
| pandas-ta  (re-batch RSI(14))  | ~5 ms (≈ 42 000× slower at this size) |

The streaming gap widens linearly with history length — see the
[benchmark page](/benchmarks) for the full table.

### How the benchmark is measured {#methodology}

The per-tick numbers come from the same `compare_libraries` script the
[benchmark page](/benchmarks) runs: each library is handed an identical
generated price series, warmed up over 5 000 bars, and then timed advancing one
tick at a time. The Wickra figure is measured through the **Python binding**, so
the small PyO3 boundary cost is already included rather than hidden in the bare
Rust kernel. Reproduced on a Windows 11 / AMD Ryzen 9 9950X machine with Rust
1.92 in release profile — read the values as **relative speedups on identical
input**, not as an absolute performance contract, since CPU, memory clock, and
runtime versions all move the absolutes.

### Who streaming-first is for {#use-cases}

The same indicator object serves three workflows without a code change. For
**live trading**, the optional Binance Spot WebSocket adapter pushes ticks
straight into an indicator that updates in constant time, so per-tick latency
stays flat even after a session has run for hours. For **backtesting**, you can
replay a full history through that very same struct and trust that batch and
streaming produce identical output — the equivalence is pinned by
reference-value tests. For **research**, the Rust core and the Python, Node, and
WASM bindings all share one implementation, so a notebook prototype and a
production service compute the exact same numbers.

## The full indicator catalogue {#catalogue}

479 indicators across twenty-four families. Every one is implemented once in Rust,
re-exported by every binding, and pinned by reference-value tests.

| Family | Examples |
|---|---|
| Moving Averages | SMA, EMA, WMA, DEMA, TEMA, HMA, KAMA, SMMA, TRIMA, ZLEMA, T3, VWMA |
| Momentum Oscillators | RSI (Wilder), Stochastic, CCI, ROC, Williams %R, MFI, AO, MOM, CMO, TSI, PMO, StochRSI, Ultimate Oscillator |
| Trend & Directional | MACD, ADX (+DI/-DI), Aroon, TRIX, Aroon Osc, Vortex, Mass Index, Choppiness Index, Vertical Horizontal Filter |
| Price Oscillators | PPO, DPO, Coppock, Accelerator, Balance of Power |
| Volatility & Bands | ATR, Bollinger Bands, Keltner, Donchian, NATR, StdDev, Ulcer Index, Historical Volatility, BB Width, %B, True Range, Chaikin Volatility |
| Trailing Stops | Parabolic SAR, SuperTrend, Chandelier Exit, Chande Kroll Stop, ATR Trailing Stop |
| Volume | OBV, VWAP (cumulative + rolling), ADL, VPT, CMF, Chaikin Osc, Force Index, Ease of Movement |
| Price Statistics | Typical Price, Median Price, Weighted Close, Linear Regression, LR Slope, Z-Score, LR Angle |

[See the full per-indicator deep-dives in the docs →](https://docs.wickra.org/Indicators-Overview)

</div>
