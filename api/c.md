---
title: C API
description: Wickra in C / C++ — link the generated wickra.h, the five-function opaque-handle shape, batch + streaming, and the wickra.hpp RAII wrapper.
---

# C / C++

The C ABI is the hub every other C-capable language links against. It ships as a
pre-built shared/static library plus a generated header, `wickra.h`.

```bash
# Build from source...
cargo build -p wickra-c --release
# ...or grab the prebuilt header + library for your platform from the releases.
```

- **Distribution:** `wickra.h` + `wickra.hpp` + the library ship with every
  [GitHub release](https://github.com/wickra-lib/wickra/releases).
- **Links against:** C, C++, and any C-capable language (C#, Go, Java, R).
- **Memory model:** opaque handles, NULL-safe, no panic across the boundary.

```bash
# Linux / macOS
cc app.c -I include -L lib -lwickra -lm -o app

# Windows (MinGW gcc, linking the DLL directly)
gcc app.c -I include wickra.dll -lm -o app.exe
```

## The handle shape

Every indicator is an opaque handle with `new` / `update` / `batch` /
`warmup_period` / `is_ready` / `reset` / `free`. There is no RAII in C, so each
`new` needs exactly one `free`.

```c
#include "wickra.h"

struct Sma *sma = wickra_sma_new(14);      /* NULL on invalid params */
size_t w = wickra_sma_warmup_period(sma);  /* updates until ready: 14 */
double v = wickra_sma_update(sma, 42.0);   /* NaN while warming up    */
bool ready = wickra_sma_is_ready(sma);     /* false until warmed up   */
wickra_sma_reset(sma);
wickra_sma_free(sma);                      /* exactly once per _new   */
```

The alt-chart bar builders (`renko_bars`, `kagi_bars`, …) omit
`warmup_period` / `is_ready` — a candle can complete 0..n bars, so they have no
warmup.

## Streaming

```c
struct Rsi *rsi = wickra_rsi_new(14);
for (size_t i = 0; i < n; ++i) {
    double v = wickra_rsi_update(rsi, prices[i]);
    if (v == v && v > 70.0)               /* v == v is the NaN check */
        printf("overbought %.2f\n", v);
}
wickra_rsi_free(rsi);
```

## Batch (writes into a caller-owned buffer)

```c
struct Ema *ema = wickra_ema_new(20);
double out[5];
wickra_ema_batch(ema, prices, out, 5);    /* NaN during warmup */
wickra_ema_free(ema);
```

## Multi-output indicators

Indicators with several outputs take a pointer to a `#[repr(C)]` struct and
return a `bool` that is `true` once a value is ready:

```c
struct MacdIndicator *macd = wickra_macd_indicator_new(12, 26, 9);
WickraMacdOutput m;
if (wickra_macd_indicator_update(macd, price, &m))
    printf("macd=%.4f signal=%.4f hist=%.4f\n", m.macd, m.signal, m.histogram);
wickra_macd_indicator_free(macd);
```

## C++ — RAII over the same library

The optional `wickra.hpp` wraps any handle in a move-only `wickra::Handle` that
frees it automatically:

```cpp
#include "wickra.hpp"

wickra::Handle<Sma, wickra_sma_free> sma{wickra_sma_new(14)};
double v = wickra_sma_update(sma.get(), 42.0);
// freed when `sma` goes out of scope
```

## More

- [Quickstart: C (docs)](https://docs.wickra.org/Quickstart-C)
- [Examples](https://github.com/wickra-lib/wickra/tree/main/examples/c)
- [Benchmarks](/benchmarks)
