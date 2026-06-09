---
title: R API
description: Wickra in R — install the .Call binding, indicator constructors with update/batch/reset, batch + streaming, and named-vector multi-output over the C ABI.
---

# R

The R binding is a `.Call` stecker on the C ABI hub (not extendr). It compiles a
thin C glue layer against the prebuilt Wickra C ABI library and exposes all 514
indicators as constructors.

```bash
cargo build -p wickra-c --release
WICKRA_INCLUDE_DIR="$PWD/bindings/c/include" WICKRA_LIB_DIR="$PWD/target/release" \
  R CMD INSTALL bindings/r
```

- **Distribution:** R package (r-universe / source install); the native library
  is bundled per platform.
- **Built on:** the [C ABI hub](/api/c) through R's native `.Call` interface, with
  C glue + R wrappers generated from `wickra.h`.
- **Memory model:** the handle is an R external pointer freed by a registered
  finalizer, so it is released automatically on garbage collection.

## The object shape

Every indicator is a constructor returning a `wickra_indicator` object with
generic `update` / `batch` / `reset` methods.

```r
library(wickra)

sma <- Sma(14)        # errors on invalid params
v <- update(sma, 42)  # NA while warming up
reset(sma)
```

## Streaming

```r
rsi <- Rsi(14)
for (price in feed) {
  v <- update(rsi, price)
  if (!is.na(v) && v > 70) message(sprintf("overbought %.2f", v))
}
```

## Batch (one call over a whole series)

```r
ema <- Ema(20)
values <- batch(ema, prices) # NA at warmup positions
```

## Multi-output indicators

Indicators with several outputs return a named numeric vector — `NA` while
warming up:

```r
macd <- MacdIndicator(12, 26, 9)
for (price in feed) {
  m <- update(macd, price)
  if (!is.na(m[["macd"]])) {
    cat(sprintf("macd=%.4f signal=%.4f hist=%.4f\n",
                m[["macd"]], m[["signal"]], m[["histogram"]]))
  }
}
```

Candle-input indicators take OHLCV plus a timestamp, e.g.
`update(atr, open, high, low, close, volume, timestamp)`.

## More

- [Quickstart: R (docs)](https://docs.wickra.org/Quickstart-R)
- [Examples](https://github.com/wickra-lib/wickra/tree/main/examples/r)
- [Benchmarks](/benchmarks)
