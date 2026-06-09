---
title: C# API
description: Wickra in C# / .NET — dotnet add package Wickra, idiomatic IDisposable indicator classes, batch + streaming, and nullable record-struct multi-output over the C ABI.
---

# C# / .NET

The .NET binding is the first language stecker on the C ABI hub. It ships on
NuGet as `Wickra` with the native library prebuilt for every supported platform;
there is nothing to compile.

```bash
dotnet add package Wickra
```

- **Distribution:** NuGet (`Wickra`), native libraries bundled per RID
  (win/linux/osx × x64/arm64).
- **Built on:** the [C ABI hub](/api/c) via `[LibraryImport]` source-generated
  P/Invoke, generated from `wickra.h`.
- **Memory model:** opaque handles wrapped in a `SafeHandle`; `using` for
  deterministic cleanup, with a finalizer as the safety net.

## The class shape

Every indicator is an `IDisposable` class with `Update` / `Batch` / `Reset`.
Prefer `using` so the native handle is freed deterministically.

```csharp
using Wickra;

using var sma = new Sma(14);     // throws ArgumentException on invalid params
double v = sma.Update(42.0);     // NaN while warming up
sma.Reset();
// freed at the end of the using scope
```

## Streaming

```csharp
using var rsi = new Rsi(14);
foreach (var price in feed)
{
    var v = rsi.Update(price);
    if (double.IsFinite(v) && v > 70.0)
    {
        Console.WriteLine($"overbought {v:F2}");
    }
}
```

## Batch (one call over a whole series)

```csharp
using var ema = new Ema(20);
double[] values = ema.Batch(prices); // NaN at warmup positions
```

## Multi-output indicators

Indicators with several outputs return a nullable `record struct` — `null` while
warming up:

```csharp
using var macd = new MacdIndicator(12, 26, 9);
foreach (var price in feed)
{
    if (macd.Update(price) is { } m)
    {
        Console.WriteLine($"macd={m.Macd:F4} signal={m.Signal:F4} hist={m.Histogram:F4}");
    }
}
```

Candle-input indicators take OHLCV plus a timestamp, e.g.
`atr.Update(open, high, low, close, volume, timestamp)`.

## More

- [Quickstart: C# (docs)](https://docs.wickra.org/Quickstart-CSharp)
- [Examples](https://github.com/wickra-lib/wickra/tree/main/examples/csharp)
- [Benchmarks](/benchmarks)
