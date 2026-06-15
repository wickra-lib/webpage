---
title: Go API
description: Wickra in Go — go get the cgo binding, idiomatic indicator types with New/Update/Batch/Reset/Close, batch + streaming, and (value, ok) multi-output over the C ABI.
---

# Go

> **Verified against the Rust reference.** Every one of Wickra's 514 indicators is replayed through all 10 languages and checked bit-for-bit against the Rust core's golden fixtures in CI — the math here is provably identical to every other binding ([how](https://docs.wickra.org/FAQ#do-all-the-language-bindings-compute-the-same-values)).

The Go binding is a cgo shim on the C ABI hub. It links the prebuilt Wickra
C ABI library and exposes all 514 indicators as idiomatic Go types.

```bash
go get github.com/wickra-lib/wickra-go
```

- **Distribution:** standalone Go module (`github.com/wickra-lib/wickra-go`) with
  the prebuilt native libraries committed per platform, so `go get` builds with
  no extra steps.
- **Built on:** the [C ABI hub](/api/c) via cgo, with wrappers generated from
  `wickra.h`.
- **Memory model:** opaque handles freed by `Close()`, with a
  `runtime.SetFinalizer` backstop; `defer x.Close()` for prompt cleanup.

## The type shape

Every indicator is a type with `Update` / `Batch` / `WarmupPeriod` / `IsReady` /
`Reset` / `Close`. Use `defer x.Close()` so the native handle is freed promptly.

```go
import wickra "github.com/wickra-lib/wickra-go"

sma, err := wickra.NewSma(14) // ErrInvalidParams on invalid params
if err != nil {
	panic(err)
}
defer sma.Close()

w := sma.WarmupPeriod() // updates until ready: 14
v := sma.Update(42.0)   // NaN while warming up
ready := sma.IsReady()  // false until warmed up
sma.Reset()
```

The alt-chart bar builders (`RenkoBars`, `KagiBars`, …) have no
`WarmupPeriod` / `IsReady` — a candle can complete 0..n bars, so they have no
warmup.

## Streaming

```go
rsi, _ := wickra.NewRsi(14)
defer rsi.Close()
for _, price := range feed {
	v := rsi.Update(price)
	if !math.IsNaN(v) && v > 70.0 {
		fmt.Printf("overbought %.2f\n", v)
	}
}
```

## Batch (one call over a whole series)

```go
ema, _ := wickra.NewEma(20)
defer ema.Close()
values := ema.Batch(prices) // NaN at warmup positions
```

## Multi-output indicators

Indicators with several outputs return a value plus a `bool` — `false` while
warming up:

```go
macd, _ := wickra.NewMacdIndicator(12, 26, 9)
defer macd.Close()
for _, price := range feed {
	if m, ok := macd.Update(price); ok {
		fmt.Printf("macd=%.4f signal=%.4f hist=%.4f\n", m.Macd, m.Signal, m.Histogram)
	}
}
```

Candle-input indicators take OHLCV plus a timestamp, e.g.
`atr.Update(open, high, low, close, volume, timestamp)`.

## More

- [Quickstart: Go (docs)](https://docs.wickra.org/Quickstart-Go)
- [Examples](https://github.com/wickra-lib/wickra/tree/main/examples/go)
- [Benchmarks](/benchmarks)
