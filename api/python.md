---
title: Python API
description: Wickra in Python — pip install wickra (zero C deps), NumPy-friendly batch, streaming, and live feeds via the websockets package.
---

# Python

```bash
pip install wickra
```

No system dependencies. No C toolchain. The Rust core ships as a
pre-built wheel for every Python 3.9–3.13 on Linux, macOS, and Windows
(x86_64 and aarch64 where the registry has the platform).

- **Latest:** [`wickra 0.8.3`](https://pypi.org/project/wickra/)
- **Supported Python:** 3.9 / 3.11 / 3.12 / 3.13 (3.10 omitted upstream)

## Batch — TA-Lib-style on a NumPy array

```python
import numpy as np
import wickra as ta

prices = np.linspace(100, 200, 1000)
rsi = ta.RSI(14)
values = rsi.batch(prices)              # numpy array, NaN during warmup
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
[`examples/python/live_trading.py`](https://github.com/wickra-lib/wickra/blob/main/examples/python/live_trading.py)
that pairs `wickra` with the standard `websockets` library to stream a
Binance Spot kline feed.

## More

- [Quickstart-Python (docs)](https://docs.wickra.org/Quickstart-Python)
- [Warmup-Periods](https://docs.wickra.org/Warmup-Periods) —
  how many bars before each indicator emits a non-None value
- [Benchmarks](/benchmarks)
