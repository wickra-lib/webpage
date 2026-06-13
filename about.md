---
title: About
description: What Wickra is, the design choices behind it, and why it exists — a streaming-first technical-analysis library with a Rust core and Python, Node.js, and WASM bindings.
---

# About Wickra

Wickra is a multi-language technical-analysis library with a Rust core and
first-class bindings for **Python, Node.js, and WASM**. Every indicator
is a state machine that updates in **O(1) per new data point**, so live trading
bots and historical backtests share the exact same implementation — no separate
"streaming" and "batch" code paths to drift apart.

## What makes it different

Plenty of TA libraries are fast. Wickra's edge is **breadth with reach**: 514
indicators that all update in O(1) per tick and ship natively to four language
targets from a single engine. See the
[indicators overview](https://docs.wickra.org/Indicators-Overview) for the full
catalogue.

- **Streaming-first.** Each `update` advances internal state in constant time —
  no recomputation over history, the same call whether you feed a 50,000-bar
  backtest or one live tick.
- **One engine, four languages.** The Rust core compiles to Python wheels, a
  Node native addon, a WASM bundle, and a crate. Identical numbers
  everywhere.
- **Install-free.** `pip install wickra`, `npm install wickra`,
  `cargo add wickra` — no system dependencies, no C toolchain, no build step.
- **Safe by construction.** Every `update` validates its input, runs a real
  warmup before it emits a value, and returns an `Option`/`None`/`NaN` during
  warmup so a single bad tick can't silently poison the state.

## On speed — and the deliberate trade-off

Wickra is not the fastest TA crate, and that is a choice rather than a ceiling.
The leaner Rust crates win several micro-benchmarks, and those losses are
[shown rather than hidden](/benchmarks). The gap exists because Wickra keeps its
guarantees — input validation, a real warmup contract, NaN-safety — instead of
handing back a bare `f64` from the first tick. What no other library matches is
the *combination*: catalogue size, native O(1) streaming, NaN-safety, and four
first-class language targets at once.

## Why it exists

Wickra started as a personal itch. The existing TA libraries never quite fit the
projects being built on them, so the decision was to build one from the ground
up — partly to learn, partly for the genuine enjoyment of taking something that
already exists and trying to do it differently, and ideally better. It is open
source because the useful version of that itch is the one other people can build
on too.

## Open source

Wickra is dual-licensed under **MIT OR Apache-2.0** — use it, fork it, modify
it, redistribute it, commercially or not. Issues and pull requests are welcome.

- **Source:** [github.com/wickra-lib/wickra](https://github.com/wickra-lib/wickra)
- **Documentation:** [docs.wickra.org](https://docs.wickra.org)
- **Packages:** [crates.io](https://crates.io/crates/wickra) ·
  [PyPI](https://pypi.org/project/wickra/) ·
  [npm](https://www.npmjs.com/package/wickra)

## Disclaimer

Wickra is an indicator toolkit, **not a trading system**. The values it computes
are deterministic transforms of the input data — they are not financial advice
and they do not predict the market. Any use of this library in a production
trading context is at your own risk. The library is provided **as is**, without
warranty of any kind; see the [license](https://github.com/wickra-lib/wickra#license)
for the full terms.
