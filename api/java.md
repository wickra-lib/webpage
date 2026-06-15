---
title: Java API
description: Wickra in Java — org.wickra:wickra on Maven Central, idiomatic AutoCloseable indicator classes over the Java FFM API (Panama), batch + streaming, and record multi-output over the C ABI.
---

# Java

> **Verified against the Rust reference.** Every one of Wickra's 514 indicators is replayed through all 10 languages and checked bit-for-bit against the Rust core's golden fixtures in CI — the math here is provably identical to every other binding ([how](https://docs.wickra.org/FAQ#do-all-the-language-bindings-compute-the-same-values)).

The Java binding is a language shim on the C ABI hub built on the Java
Foreign Function & Memory API (Panama). It ships on Maven Central as
`org.wickra:wickra` with the native library prebuilt for every supported
platform; there is nothing to compile.

```xml
<dependency>
  <groupId>org.wickra</groupId>
  <artifactId>wickra</artifactId>
  <version>0.9.2</version>
</dependency>
```

- **Distribution:** Maven Central (`org.wickra:wickra`), native libraries bundled
  per platform (win/linux/osx × x64/arm64).
- **Requirements:** Java 22+ (the FFM API is final since Java 22). Run with
  `--enable-native-access=ALL-UNNAMED`.
- **Built on:** the [C ABI hub](/api/c) via the Java FFM API (`java.lang.foreign`),
  generated from `wickra.h` — not JNI, not jextract.
- **Memory model:** opaque handles are `MemorySegment`s freed by a
  `java.lang.ref.Cleaner`; try-with-resources for deterministic cleanup.

## The class shape

Every indicator is an `AutoCloseable` class with `update` / `batch` /
`warmupPeriod` / `isReady` / `reset`. Prefer try-with-resources so the native
handle is freed deterministically.

```java
import org.wickra.Sma;

try (Sma sma = new Sma(14)) {      // throws IllegalArgumentException on invalid params
    int w = sma.warmupPeriod();    // updates until ready: 14
    double v = sma.update(42.0);   // NaN while warming up
    boolean ready = sma.isReady(); // false until warmed up
    sma.reset();
} // freed at the end of the try-with-resources scope
```

The alt-chart bar builders (`RenkoBars`, `KagiBars`, …) have no
`warmupPeriod` / `isReady` — a candle can complete 0..n bars, so they have no
warmup.

## Streaming

```java
try (Rsi rsi = new Rsi(14)) {
    for (double price : feed) {
        double v = rsi.update(price);
        if (Double.isFinite(v) && v > 70.0) {
            System.out.printf("overbought %.2f%n", v);
        }
    }
}
```

## Batch (one call over a whole series)

```java
try (Ema ema = new Ema(20)) {
    double[] values = ema.batch(prices); // NaN at warmup positions
}
```

## Multi-output indicators

Indicators with several outputs return a `record` — `null` while warming up:

```java
try (MacdIndicator macd = new MacdIndicator(12, 26, 9)) {
    for (double price : feed) {
        MacdOutput m = macd.update(price);
        if (m != null) {
            System.out.printf("macd=%.4f signal=%.4f hist=%.4f%n",
                m.macd(), m.signal(), m.histogram());
        }
    }
}
```

Candle-input indicators take OHLCV plus a timestamp, e.g.
`atr.update(open, high, low, close, volume, timestamp)`.

## More

- [Quickstart: Java (docs)](https://docs.wickra.org/Quickstart-Java)
- [Examples](https://github.com/wickra-lib/wickra/tree/main/examples/java)
- [Benchmarks](/benchmarks)
