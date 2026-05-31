---
title: Live demo
description: Run any Wickra indicator over a generated price series — straight in your browser, powered by the wickra-wasm bundle from npm.
---

# Live demo

Every line below is computed by **`wickra-wasm`** running inside your
browser via WebAssembly — no server, no API call, no install. The same
Rust kernel that powers `pip install wickra` and `cargo add wickra` is
producing every indicator value you see.

<WasmDemo />

## What's happening

1. A pseudo-random price walk seeds a synthetic asset (start = 100,
   small drift + per-tick volatility).
2. The wickra-wasm bundle is fetched once (~80 KB gzipped) and the
   indicator class you pick is instantiated.
3. Every tick is fed into the indicator's `update(price)` method — a
   single O(1) state-machine step. Output is plotted live.
4. Hitting **▶ Stream** advances the walk in real time at ~12 fps so
   you can watch the indicator settle in.

## Try this

- Drop the period to **5** and switch to **RSI** — watch the
  oscillator pin against the 0 / 100 rails on a sharp move.
- Set period to **80** on **HMA** vs **EMA** — the Hull moving average
  hugs the price noticeably tighter.
- Bump **Historical ticks** to 5 000 — the initial pass throughput
  number jumps because the JS-to-WASM boundary is amortised across
  more updates.

## Wiring this into your own project

The chart on this page is ~250 lines of Vue + lightweight-charts; the
indicator math is one constructor call and `update()` per tick.

```javascript
import init, { RSI } from 'wickra-wasm'

await init()                    // fetches the .wasm bundle
const rsi = new RSI(14)

for (const price of liveFeed) {
  const v = rsi.update(price)   // O(1) — returns null during warmup
  if (v !== null && v > 70) console.log('overbought', v)
}
```

The same shape works in Node and Python — see the
[API pages](/api/wasm) for each binding's idiomatic snippet.
