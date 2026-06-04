---
title: WASM API
description: Wickra in the browser — wickra-wasm runs the same Rust kernel everywhere, no server roundtrip.
---

# WASM (browser, bundler, Node)

```bash
npm install wickra-wasm
```

The `wickra-wasm` bundle is the same Rust kernel compiled to
WebAssembly via `wasm-bindgen`. It runs in the browser (any modern
one), in bundlers (Vite / webpack / esbuild), and in Node 18+.

- **Latest:** [`wickra-wasm 0.5.5`](https://www.npmjs.com/package/wickra-wasm)
- **Bundle size:** ~80 KB gzipped (JS loader + `.wasm`)
- **Try it live:** [Demo page](/demo)

## Initialise the module once

```javascript
import init, { RSI, EMA, MACD, BollingerBands, version } from 'wickra-wasm'

await init()                          // fetches the .wasm binary
console.log('wickra-wasm v' + version())
```

The default export is an async `init()` function. In Vite and other
modern bundlers it resolves the WASM URL for you; in a plain
`<script type="module">` setup you can pass an explicit URL to
`init(url)`.

## Streaming RSI in the browser

```javascript
const rsi = new RSI(14)
for (const price of liveFeed) {
  const v = rsi.update(price)         // null during warmup
  if (v != null && v > 70) console.log('overbought', v)
}
```

## Multi-output indicators

```javascript
const macd = new MACD(12, 26, 9)
const out = macd.update(price)
// → { macd, signal, histogram } or null

const bb = new BollingerBands(20, 2.0)
const band = bb.update(price)
// → { upper, middle, lower, stddev } or null
```

## Batch (`Float64Array`)

Every indicator class exposes `batch(prices)` returning a typed array.
For multi-output indicators it is a flat array — e.g. MACD returns
`[macd0, sig0, hist0, macd1, sig1, hist1, ...]` of length `3 * n`.

```javascript
const macd = new MACD(12, 26, 9)
const flat = macd.batch(prices)
// access column i with flat[3 * tick + i]
```

## Building from source

If you want to ship a custom build (e.g. with `--features panic-hook`
enabled, or scoped to fewer indicators):

```bash
wasm-pack build bindings/wasm --target web --release --features panic-hook
```

The resulting `pkg/` directory is publishable to npm or vendored
into your app directly.

## More

- [Quickstart-WASM (docs)](https://docs.wickra.org/Quickstart-WASM)
- [Live demo source](https://github.com/wickra-lib/webpage/blob/main/.vitepress/components/WasmDemo.vue)
- [Bundle structure](https://www.npmjs.com/package/wickra-wasm)
