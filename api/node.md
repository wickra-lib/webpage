---
title: Node API
description: Wickra in Node — npm install wickra, ESM imports, batch + streaming, live Binance feed via the trading example.
---

# Node

```bash
npm install wickra
```

The package ships native bindings (built with napi-rs) and pulls in
the right platform subpackage automatically — no `node-gyp`, no
post-install build step.

- **Latest:** [`wickra 0.5.1`](https://www.npmjs.com/package/wickra)
- **Supported Node:** 18 LTS and 20 LTS, on Linux x64 / arm64,
  macOS x64 / arm64, Windows x64.
  *(Windows ARM64 is tracked but blocked on an npm name-publishing
  filter — see the release notes for status.)*

## Streaming

```javascript
import { RSI } from 'wickra'

const rsi = new RSI(14)
for (const price of liveFeed) {
  const v = rsi.update(price)
  if (v != null && v > 70) console.log('overbought', v)
}
```

## Batch (returns a `Float64Array`)

```javascript
import { EMA } from 'wickra'

const ema = new EMA(20)
const out = ema.batch(prices)        // Float64Array, NaN during warmup
```

## Multi-output indicators

```javascript
import { MACD, BollingerBands } from 'wickra'

const macd = new MACD(12, 26, 9)
const out = macd.update(price)
// → { macd, signal, histogram } or null

const bb = new BollingerBands(20, 2.0)
const band = bb.update(price)
// → { upper, middle, lower, stddev } or null
```

## Live Binance example

`examples/node/live_trading.js` pairs `wickra` with the `ws` package
for a live Binance Spot kline feed:

```bash
cd examples/node
npm install
node live_trading.js BTCUSDT 1m
```

## More

- [Quickstart-Node (docs)](https://docs.wickra.org/Quickstart-Node)
- [Cookbook](https://docs.wickra.org/Cookbook)
- [Benchmarks](/benchmarks)
