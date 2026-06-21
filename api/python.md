---
title: Python API
description: Wickra in Python — pip install wickra with zero third-party deps (not even NumPy), array.array batch, streaming, and a native Binance live feed.
---

# Python

> **Verified against the Rust reference.** Every one of Wickra's 514 indicators is replayed through all 10 languages and checked bit-for-bit against the Rust core's golden fixtures in CI — the math here is provably identical to every other binding ([how](https://docs.wickra.org/FAQ#do-all-the-language-bindings-compute-the-same-values)).

```bash
pip install wickra
```

**Zero third-party dependencies** — `pip install wickra` pulls nothing else,
not even NumPy. No system dependencies, no C toolchain. The Rust core ships as a
pre-built wheel for every Python 3.9–3.13 on Linux, macOS, and Windows
(x86_64 and aarch64 where the registry has the platform). NumPy is an optional
extra (`pip install wickra[numpy]`) for zero-copy interop.

- **Latest:** [`wickra 0.9.7`](https://pypi.org/project/wickra/)
- **Supported Python:** 3.9 / 3.11 / 3.12 / 3.13 (3.10 omitted upstream)

## Batch — TA-Lib-style over a series

```python
import wickra as ta                     # zero third-party deps — not even NumPy

prices = [100.0 + i * 0.1 for i in range(1000)]   # a list, array.array or NumPy all work
rsi = ta.RSI(14)
values = rsi.batch(prices)              # array.array('d'), NaN during warmup
                                        # np.asarray(values) wraps it zero-copy if you use NumPy
```

## Streaming — tick-by-tick

```python
import wickra as ta

rsi = ta.RSI(14)
for price in live_feed:
    v = rsi.update(price)               # O(1)
    if v is not None and v > 70:
        print("overbought", v)
```

## Multi-output indicators (MACD, Bollinger …)

```python
import wickra as ta

macd = ta.MACD(12, 26, 9)
for price in live_feed:
    out = macd.update(price)            # dict or None
    if out is not None:
        print(out["macd"], out["signal"], out["histogram"])

bb = ta.BollingerBands(20, 2.0)
out = bb.update(price)                  # {"upper", "middle", "lower", "stddev"}
```

## Candle-input indicators

`ATR`, `Stochastic`, and the volume-aware family take a `Candle`-shaped
dict or tuple:

```python
import wickra as ta

atr = ta.ATR(14)
for c in candles:
    v = atr.update({"high": c.h, "low": c.l, "close": c.c})
    if v is not None:
        ...
```

The dict form is the explicit one; tuples (`(o, h, l, c, v, t)`) work
too and are documented per indicator on the
[Indicator pages (docs)](https://docs.wickra.org/Indicators-Overview).

## Live trading example

The repo ships a runnable example at
[`examples/python/live_binance.py`](https://github.com/wickra-lib/wickra/blob/main/examples/python/live_binance.py)
that streams a Binance Spot kline feed through the **native** `wickra.BinanceFeed`
— no third-party WebSocket client. A `wickra.fetch_binance_klines` example pulls
historical candles over the native REST fetcher the same way.

## More

- [Quickstart-Python (docs)](https://docs.wickra.org/Quickstart-Python)
- [Warmup-Periods](https://docs.wickra.org/Warmup-Periods) —
  how many bars before each indicator emits a non-None value
- [Benchmarks](/benchmarks)
