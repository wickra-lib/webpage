---
title: Rust API
description: Wickra in Rust — cargo add wickra, the Indicator trait, batch + streaming, and the optional live Binance feed.
---

# Rust

```bash
cargo add wickra
# optional: live Binance WebSocket feed
cargo add wickra-data --features live-binance
```

The `wickra` crate is a façade that re-exports `wickra-core`. For lean
builds you can depend on `wickra-core` directly and pick features with
`--no-default-features`.

- **Latest:** [`wickra 0.8.7`](https://crates.io/crates/wickra)
- **API reference:** <https://docs.rs/wickra>
- **MSRV:** Rust 1.86 (workspace), 1.88 (Node binding crate)

## The `Indicator` trait

Every indicator implements `Indicator<Input = f64, Output = …>` (or
`Candle` input for OHLCV-aware ones). One trait, four methods:
`update`, `reset`, `is_ready`, `warmup_period`. Batch is the same trait
with a default `batch` provided by `BatchExt`.

```rust
use wickra::{Indicator, BatchExt, Ema, Rsi};

// Streaming — one tick at a time.
let mut rsi = Rsi::new(14)?;
for price in live_feed {
    if let Some(v) = rsi.update(price) {
        if v > 70.0 {
            println!("RSI overbought: {v:.2}");
        }
    }
}

// Batch — identical output, single call.
let mut ema = Ema::new(20)?;
let out: Vec<Option<f64>> = ema.batch(&[1.0, 2.0, 3.0, 4.0, 5.0]);
```

The `batch == streaming` invariant is a property test in `wickra-core`:
feeding any sequence one tick at a time produces the same `Vec` as one
`batch` call.

## Composing indicators

`Chain` feeds one indicator's output into the next, only emitting when
the second one is ready.

```rust
use wickra::{Chain, Ema, Rsi};

// RSI(7) on top of EMA(14).
let mut chain = Chain::new(Ema::new(14)?, Rsi::new(7)?);
if let Some(v) = chain.update(price) {
    println!("smoothed RSI: {v:.2}");
}
```

## Live Binance feed

```rust
use wickra::{Indicator, Rsi};
use wickra_data::live::binance::{BinanceKlineStream, Interval};

let mut stream =
    BinanceKlineStream::connect(&["BTCUSDT".into()], Interval::OneMinute).await?;
let mut rsi = Rsi::new(14)?;

while let Some(event) = stream.next_event().await? {
    if event.is_closed {
        if let Some(v) = rsi.update(event.candle.close) {
            println!("RSI = {v:.2}");
        }
    }
}
```

The connector reconnects on dropped sockets, applies a read timeout
and frame-size caps, and tracks a closed flag so a deliberately closed
stream is not reused. Since `0.2.5`, `BinanceConfig` lets you point at
Binance Testnet (`wss://testnet.binance.vision`) or tune the timing:

```rust
use std::time::Duration;
use wickra_data::live::binance::{BinanceConfig, BinanceKlineStream, Interval};

let cfg = BinanceConfig {
    base_url: "wss://testnet.binance.vision".into(),
    read_timeout: Duration::from_secs(60),
    ..BinanceConfig::default()
};
let stream = BinanceKlineStream::connect_with_config(
    &["BTCUSDT".into()],
    Interval::OneMinute,
    cfg,
).await?;
```

## More

- [Quickstart-Rust (docs)](https://docs.wickra.org/Quickstart-Rust)
- [Data-Layer (docs)](https://docs.wickra.org/Data-Layer)
- [Benchmarks](/benchmarks)
