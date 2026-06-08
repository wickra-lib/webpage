<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, shallowRef } from 'vue'
import { useData } from 'vitepress'

// One well-known indicator per drivable family, exercised against the
// wickra-wasm bundle. The picker is grouped by family. Each entry declares how
// the indicator is constructed (`ctor`), how it is fed (`sig` — the update
// signature), which pane it draws on (`pane`), and how its output is rendered
// (`render`). The driver below is fully generic over these, so growing each
// family from one to five later is a data-only change.
//
// Three families are intentionally absent — Microstructure, Derivatives and
// Market Breadth need a live order-book / funding / breadth feed that a single
// synthetic price series cannot stand in for. Alt-Chart Bars (Renko/Kagi/P&F)
// emit a variable number of bars per tick and get a dedicated renderer later.
type Sig = 'scalar' | 'ohlc' | 'hlc' | 'hl' | 'cv' | 'hlcv' | 'hlv' | 'ohlcv_ts'
type Pane = 'price' | 'sub'
type Render = 'line' | 'multi' | 'markers'

interface Pick {
  fam: string
  cls: string
  label: string
  ctor: number[]
  sig: Sig
  pane: Pane
  render: Render
  len?: boolean // length slider drives ctor[0]
  fields?: string[] // for multi-output: only plot these object keys (else all)
}

const PICKS: Pick[] = [
  { fam: 'Moving Averages', cls: 'EMA', label: 'EMA — Exponential MA', ctor: [20], sig: 'scalar', pane: 'price', render: 'line', len: true },
  { fam: 'Moving Averages', cls: 'SMA', label: 'SMA — Simple MA', ctor: [20], sig: 'scalar', pane: 'price', render: 'line', len: true },
  { fam: 'Moving Averages', cls: 'WMA', label: 'WMA — Weighted MA', ctor: [20], sig: 'scalar', pane: 'price', render: 'line', len: true },
  { fam: 'Moving Averages', cls: 'HMA', label: 'HMA — Hull MA', ctor: [20], sig: 'scalar', pane: 'price', render: 'line', len: true },

  { fam: 'Momentum Oscillators', cls: 'RSI', label: 'RSI — Relative Strength', ctor: [14], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Momentum Oscillators', cls: 'Stochastic', label: 'Stochastic', ctor: [14, 3], sig: 'hlc', pane: 'sub', render: 'multi', len: true },
  { fam: 'Momentum Oscillators', cls: 'CCI', label: 'CCI — Commodity Channel', ctor: [20], sig: 'hlc', pane: 'sub', render: 'line', len: true },
  { fam: 'Momentum Oscillators', cls: 'WilliamsR', label: 'Williams %R', ctor: [14], sig: 'hlc', pane: 'sub', render: 'line', len: true },

  { fam: 'Trend & Directional', cls: 'MACD', label: 'MACD', ctor: [12, 26, 9], sig: 'scalar', pane: 'sub', render: 'multi', len: true },
  { fam: 'Trend & Directional', cls: 'ADX', label: 'ADX / DMI', ctor: [14], sig: 'hlc', pane: 'sub', render: 'multi', len: true },
  { fam: 'Trend & Directional', cls: 'Aroon', label: 'Aroon', ctor: [14], sig: 'hl', pane: 'sub', render: 'multi', len: true },
  { fam: 'Trend & Directional', cls: 'TRIX', label: 'TRIX', ctor: [15], sig: 'scalar', pane: 'sub', render: 'line', len: true },

  { fam: 'Price Oscillators', cls: 'PPO', label: 'PPO — Percentage Price Osc', ctor: [12, 26], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Price Oscillators', cls: 'APO', label: 'APO — Absolute Price Osc', ctor: [12, 26], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Price Oscillators', cls: 'Coppock', label: 'Coppock Curve', ctor: [14, 11, 10], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Price Oscillators', cls: 'BalanceOfPower', label: 'Balance of Power', ctor: [], sig: 'ohlc', pane: 'sub', render: 'line' },

  { fam: 'Volatility & Bands', cls: 'BollingerBands', label: 'Bollinger Bands', ctor: [20, 2], sig: 'scalar', pane: 'price', render: 'multi', len: true, fields: ['upper', 'middle', 'lower'] },
  { fam: 'Volatility & Bands', cls: 'ATR', label: 'ATR — Average True Range', ctor: [14], sig: 'hlc', pane: 'sub', render: 'line', len: true },
  { fam: 'Volatility & Bands', cls: 'Keltner', label: 'Keltner Channel', ctor: [20, 10, 2], sig: 'hlc', pane: 'price', render: 'multi', len: true },
  { fam: 'Volatility & Bands', cls: 'Donchian', label: 'Donchian Channel', ctor: [20], sig: 'hl', pane: 'price', render: 'multi', len: true },

  { fam: 'Bands & Channels', cls: 'MaEnvelope', label: 'MA Envelope', ctor: [20, 2.5], sig: 'scalar', pane: 'price', render: 'multi', len: true },
  { fam: 'Bands & Channels', cls: 'StarcBands', label: 'STARC Bands', ctor: [20, 10, 2], sig: 'hlc', pane: 'price', render: 'multi', len: true },
  { fam: 'Bands & Channels', cls: 'AtrBands', label: 'ATR Bands', ctor: [20, 2], sig: 'hlc', pane: 'price', render: 'multi', len: true },
  { fam: 'Bands & Channels', cls: 'LinRegChannel', label: 'Linear Regression Channel', ctor: [20, 2], sig: 'scalar', pane: 'price', render: 'multi', len: true },

  { fam: 'Trailing Stops', cls: 'SuperTrend', label: 'SuperTrend', ctor: [10, 3], sig: 'hlc', pane: 'price', render: 'multi', len: true, fields: ['value'] },
  { fam: 'Trailing Stops', cls: 'PSAR', label: 'Parabolic SAR', ctor: [0.02, 0.02, 0.2], sig: 'hlc', pane: 'price', render: 'line' },
  { fam: 'Trailing Stops', cls: 'ChandelierExit', label: 'Chandelier Exit', ctor: [22, 3], sig: 'hlc', pane: 'price', render: 'multi', len: true },
  { fam: 'Trailing Stops', cls: 'AtrTrailingStop', label: 'ATR Trailing Stop', ctor: [14, 3], sig: 'hlc', pane: 'price', render: 'line', len: true },

  { fam: 'Volume', cls: 'OBV', label: 'OBV — On-Balance Volume', ctor: [], sig: 'cv', pane: 'sub', render: 'line' },
  { fam: 'Volume', cls: 'VWAP', label: 'VWAP', ctor: [], sig: 'hlcv', pane: 'price', render: 'line' },
  { fam: 'Volume', cls: 'ChaikinMoneyFlow', label: 'Chaikin Money Flow', ctor: [20], sig: 'hlcv', pane: 'sub', render: 'line', len: true },
  { fam: 'Volume', cls: 'ADL', label: 'Accumulation / Distribution', ctor: [], sig: 'hlcv', pane: 'sub', render: 'line' },

  { fam: 'Price Statistics', cls: 'ZScore', label: 'Z-Score', ctor: [20], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Price Statistics', cls: 'LinearRegression', label: 'Linear Regression', ctor: [20], sig: 'scalar', pane: 'price', render: 'line', len: true },
  { fam: 'Price Statistics', cls: 'LinRegSlope', label: 'Lin-Reg Slope', ctor: [20], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Price Statistics', cls: 'Variance', label: 'Variance', ctor: [20], sig: 'scalar', pane: 'sub', render: 'line', len: true },

  { fam: 'Ehlers / Cycle (DSP)', cls: 'FisherTransform', label: 'Fisher Transform', ctor: [10], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Ehlers / Cycle (DSP)', cls: 'MAMA', label: 'MAMA — MESA Adaptive MA', ctor: [0.5, 0.05], sig: 'scalar', pane: 'price', render: 'multi' },
  { fam: 'Ehlers / Cycle (DSP)', cls: 'SuperSmoother', label: 'Super Smoother', ctor: [10], sig: 'scalar', pane: 'price', render: 'line', len: true },
  { fam: 'Ehlers / Cycle (DSP)', cls: 'InverseFisherTransform', label: 'Inverse Fisher Transform', ctor: [1], sig: 'scalar', pane: 'sub', render: 'line' },

  { fam: 'Pivots & S/R', cls: 'ClassicPivots', label: 'Classic Pivots', ctor: [], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Pivots & S/R', cls: 'FibonacciPivots', label: 'Fibonacci Pivots', ctor: [], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Pivots & S/R', cls: 'Camarilla', label: 'Camarilla Pivots', ctor: [], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Pivots & S/R', cls: 'ZigZag', label: 'ZigZag', ctor: [0.05], sig: 'hl', pane: 'price', render: 'multi', fields: ['swing'] },

  { fam: 'DeMark', cls: 'TDDeMarker', label: 'TD DeMarker', ctor: [13], sig: 'hl', pane: 'sub', render: 'line', len: true },
  { fam: 'DeMark', cls: 'TDSetup', label: 'TD Setup', ctor: [4, 9], sig: 'hlc', pane: 'sub', render: 'line', len: true },
  { fam: 'DeMark', cls: 'TDREI', label: 'TD Range Expansion Index', ctor: [5], sig: 'hl', pane: 'sub', render: 'line', len: true },

  { fam: 'Ichimoku & Charts', cls: 'Ichimoku', label: 'Ichimoku Cloud', ctor: [9, 26, 52, 26], sig: 'hlc', pane: 'price', render: 'multi', len: true },
  { fam: 'Ichimoku & Charts', cls: 'HeikinAshi', label: 'Heikin-Ashi (close)', ctor: [], sig: 'ohlc', pane: 'price', render: 'multi', fields: ['close'] },

  { fam: 'Candlestick Patterns', cls: 'Engulfing', label: 'Engulfing', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Candlestick Patterns', cls: 'Doji', label: 'Doji', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Candlestick Patterns', cls: 'Hammer', label: 'Hammer', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Candlestick Patterns', cls: 'MorningEveningStar', label: 'Morning / Evening Star', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },

  { fam: 'Market Profile', cls: 'ValueArea', label: 'Value Area', ctor: [20, 24, 0.7], sig: 'hlv', pane: 'price', render: 'multi', len: true },
  { fam: 'Market Profile', cls: 'InitialBalance', label: 'Initial Balance', ctor: [20], sig: 'hl', pane: 'price', render: 'multi', len: true },
  { fam: 'Market Profile', cls: 'OpeningRange', label: 'Opening Range', ctor: [20], sig: 'hlc', pane: 'price', render: 'multi', len: true, fields: ['high', 'low'] },

  { fam: 'Risk / Performance', cls: 'SharpeRatio', label: 'Sharpe Ratio', ctor: [20, 0], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Risk / Performance', cls: 'SortinoRatio', label: 'Sortino Ratio', ctor: [20, 0], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Risk / Performance', cls: 'MaxDrawdown', label: 'Max Drawdown', ctor: [20], sig: 'scalar', pane: 'sub', render: 'line', len: true },
  { fam: 'Risk / Performance', cls: 'CalmarRatio', label: 'Calmar Ratio', ctor: [20], sig: 'scalar', pane: 'sub', render: 'line', len: true },

  { fam: 'Seasonality & Session', cls: 'SessionVwap', label: 'Session VWAP', ctor: [0], sig: 'ohlcv_ts', pane: 'price', render: 'line' },
  { fam: 'Seasonality & Session', cls: 'SessionHighLow', label: 'Session High / Low', ctor: [0], sig: 'ohlcv_ts', pane: 'price', render: 'multi' },
  { fam: 'Seasonality & Session', cls: 'SessionRange', label: 'Session Range', ctor: [0], sig: 'ohlcv_ts', pane: 'sub', render: 'multi' },

  { fam: 'Chart Patterns', cls: 'HeadAndShoulders', label: 'Head & Shoulders', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Chart Patterns', cls: 'DoubleTopBottom', label: 'Double Top / Bottom', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Chart Patterns', cls: 'Triangle', label: 'Triangle', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },

  { fam: 'Harmonic Patterns', cls: 'Gartley', label: 'Gartley', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Harmonic Patterns', cls: 'Butterfly', label: 'Butterfly', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Harmonic Patterns', cls: 'Bat', label: 'Bat', ctor: [], sig: 'ohlc', pane: 'price', render: 'markers' },

  { fam: 'Fibonacci', cls: 'FibRetracement', label: 'Fibonacci Retracement', ctor: [], sig: 'hl', pane: 'price', render: 'multi' },
  { fam: 'Fibonacci', cls: 'FibExtension', label: 'Fibonacci Extension', ctor: [], sig: 'hl', pane: 'price', render: 'multi' },
  { fam: 'Fibonacci', cls: 'GoldenPocket', label: 'Golden Pocket', ctor: [], sig: 'hl', pane: 'price', render: 'multi' },
]

// Group picks by family for the <optgroup> selector.
const GROUPS = PICKS.reduce<Record<string, Pick[]>>((acc, p) => {
  ;(acc[p.fam] ??= []).push(p)
  return acc
}, {})

const PALETTE = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#eab308', '#ef4444', '#14b8a6']

const { isDark } = useData()

const selected = ref<string>('EMA')
const length = ref(20)
const history = ref(400)
const speed = ref(1) // 1..10
const volatility = ref(0.6) // 0.1..2.0
const trend = ref(0) // -1..1
const candles = ref(false)

const pick = computed<Pick>(() => PICKS.find((p) => p.cls === selected.value) ?? PICKS[0])

const status = ref<string>('Loading WASM module…')
const error = ref<string | null>(null)
const updatesPerSecond = ref(0)
const wasmVersion = ref<string>('')
const lastPrice = ref<number | null>(null)
const lastValue = ref<number | null>(null)
const paused = ref(false)

const chartContainer = ref<HTMLDivElement | null>(null)
const chartRef = shallowRef<any>(null)
const priceSeriesRef = shallowRef<any>(null)
const indSeries = new Map<string, any>() // output field -> line series
const wasm = shallowRef<any>(null)

// Persistent stream state so Pause/Resume continues without resetting.
let rafId: number | null = null
let lastFrameTs = 0
let acc = 0 // fractional candles accumulated between frames
let liveInd: any = null
let baseTime = 0
let markers: any[] = []
const gen = { price: 100, clock: 0 }

interface Candle {
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** One synthetic OHLCV candle, shaped by the volatility + trend controls. */
function nextCandle(): Candle {
  const vol = volatility.value
  const drift = trend.value * 0.12
  const open = gen.price
  let c = open
  let hi = open
  let lo = open
  for (let i = 0; i < 4; i++) {
    const shock = (Math.random() - 0.5) * vol * 2 + drift
    c = Math.max(1, c + shock)
    if (c > hi) hi = c
    if (c < lo) lo = c
  }
  gen.price = c
  gen.clock += 60_000
  return { open, high: hi, low: lo, close: c, volume: 400 + Math.random() * 1600 }
}

function feed(ind: any, sig: Sig, k: Candle, clock: number): any {
  switch (sig) {
    case 'scalar': return ind.update(k.close)
    case 'ohlc': return ind.update(k.open, k.high, k.low, k.close)
    case 'hlc': return ind.update(k.high, k.low, k.close)
    case 'hl': return ind.update(k.high, k.low)
    case 'cv': return ind.update(k.close, k.volume)
    case 'hlcv': return ind.update(k.high, k.low, k.close, k.volume)
    case 'hlv': return ind.update(k.high, k.low, k.volume)
    case 'ohlcv_ts': return ind.update(k.open, k.high, k.low, k.close, k.volume, BigInt(clock))
  }
}

function makeIndicator(p: Pick, len: number): any {
  const m = wasm.value
  const args = p.ctor.slice()
  if (p.len && args.length) args[0] = len
  return new m[p.cls](...args)
}

function chartOptions(dark: boolean) {
  return {
    layout: {
      background: { color: dark ? '#0b1220' : '#ffffff' },
      textColor: dark ? '#cbd5e1' : '#475569',
      fontFamily: 'var(--vp-font-family-base)',
    },
    grid: {
      vertLines: { color: dark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.05)' },
      horzLines: { color: dark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.05)' },
    },
    rightPriceScale: { borderColor: dark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.1)' },
    timeScale: {
      borderColor: dark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.1)',
      timeVisible: false,
      secondsVisible: false,
    },
    crosshair: { mode: 1 },
  }
}

async function bootChart() {
  if (!chartContainer.value) return
  const { createChart } = await import('lightweight-charts')

  if (chartRef.value) {
    chartRef.value.remove()
    chartRef.value = null
  }

  const chart = createChart(chartContainer.value, {
    ...chartOptions(isDark.value),
    width: chartContainer.value.clientWidth,
    height: chartContainer.value.clientHeight,
  })
  chartRef.value = chart

  buildPriceSeries()

  // Dedicated bottom pane for oscillator-style outputs.
  chart.priceScale('osc').applyOptions({
    scaleMargins: { top: 0.72, bottom: 0 },
    borderVisible: false,
  })

  const ro = new ResizeObserver(() => {
    if (!chartContainer.value || !chartRef.value) return
    chartRef.value.applyOptions({
      width: chartContainer.value.clientWidth,
      height: chartContainer.value.clientHeight,
    })
  })
  ro.observe(chartContainer.value)
  ;(chart as any).__ro = ro
}

/** (Re)create the price series as either a line (close) or candlesticks. */
function buildPriceSeries() {
  const chart = chartRef.value
  if (!chart) return
  if (priceSeriesRef.value) {
    chart.removeSeries(priceSeriesRef.value)
    priceSeriesRef.value = null
  }
  priceSeriesRef.value = candles.value
    ? chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        priceLineVisible: false,
      })
    : chart.addLineSeries({
        color: '#94a3b8',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'Price',
      })
}

function clearIndicatorSeries() {
  const chart = chartRef.value
  if (chart) for (const s of indSeries.values()) chart.removeSeries(s)
  indSeries.clear()
  markers = []
  if (priceSeriesRef.value) priceSeriesRef.value.setMarkers([])
}

function seriesFor(field: string, pane: Pane): any {
  let s = indSeries.get(field)
  if (s) return s
  const color = PALETTE[indSeries.size % PALETTE.length]
  s = chartRef.value.addLineSeries({
    color,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true,
    title: indSeries.size === 0 ? pick.value.cls : field,
    priceScaleId: pane === 'sub' ? 'osc' : 'right',
  })
  indSeries.set(field, s)
  return s
}

function priceData(k: Candle, time: number) {
  return candles.value
    ? { time, open: k.open, high: k.high, low: k.low, close: k.close }
    : { time, value: k.close }
}

function pushMarker(time: number, up: boolean) {
  markers.push({
    time,
    position: up ? 'belowBar' : 'aboveBar',
    color: up ? '#22c55e' : '#ef4444',
    shape: up ? 'arrowUp' : 'arrowDown',
  })
  if (markers.length > 60) markers = markers.slice(-60)
  priceSeriesRef.value?.setMarkers(markers)
}

/** Numeric output fields of an object result, honouring an optional whitelist. */
function objFields(res: any, p: Pick): string[] {
  const keys = Object.keys(res)
  return p.fields ? keys.filter((k) => p.fields!.includes(k)) : keys
}

/** Push an indicator result during streaming (one point per series). */
function applyLive(res: any, time: number, p: Pick) {
  if (p.render === 'markers') {
    if (typeof res === 'number' && res !== 0 && !Number.isNaN(res)) pushMarker(time, res > 0)
    return
  }
  if (typeof res === 'number') {
    if (!Number.isNaN(res)) {
      seriesFor('value', p.pane).update({ time, value: res })
      lastValue.value = res
    }
  } else if (res && typeof res === 'object') {
    for (const key of objFields(res, p)) {
      const v = (res as any)[key]
      if (typeof v === 'number' && Number.isFinite(v)) {
        seriesFor(key, p.pane).update({ time, value: v })
        lastValue.value = v
      }
    }
  }
}

/** Rebuild the chart from a fresh synthetic history and warm the indicator. */
async function rebuild() {
  if (!chartRef.value) await bootChart()
  await ensureWasm()
  if (error.value) return

  stopStream()
  clearIndicatorSeries()
  buildPriceSeries()

  const p = pick.value
  const n = Math.max(50, Math.min(3000, history.value | 0))
  gen.price = 100
  gen.clock = 0
  liveInd?.free?.()
  liveInd = makeIndicator(p, length.value)

  const priceBuf: any[] = []
  const fieldBuf = new Map<string, any[]>()
  const markerBuf: any[] = []
  let last = 0

  const t0 = performance.now()
  for (let i = 0; i < n; i++) {
    const k = nextCandle()
    priceBuf.push(priceData(k, i))
    const res = feed(liveInd, p.sig, k, gen.clock)
    if (p.render === 'markers') {
      if (typeof res === 'number' && res !== 0 && !Number.isNaN(res)) {
        markerBuf.push({
          time: i,
          position: res > 0 ? 'belowBar' : 'aboveBar',
          color: res > 0 ? '#22c55e' : '#ef4444',
          shape: res > 0 ? 'arrowUp' : 'arrowDown',
        })
      }
    } else if (typeof res === 'number') {
      if (!Number.isNaN(res)) {
        ;(fieldBuf.get('value') ?? fieldBuf.set('value', []).get('value'))!.push({ time: i, value: res })
        last = res
      }
    } else if (res && typeof res === 'object') {
      for (const key of objFields(res, p)) {
        const v = (res as any)[key]
        if (typeof v === 'number' && Number.isFinite(v)) {
          ;(fieldBuf.get(key) ?? fieldBuf.set(key, []).get(key))!.push({ time: i, value: v })
          last = v
        }
      }
    }
    last && (lastValue.value = last)
  }
  const elapsed = performance.now() - t0

  priceSeriesRef.value.setData(priceBuf)
  for (const [field, data] of fieldBuf) seriesFor(field, p.pane).setData(data)
  markers = markerBuf.slice(-60)
  if (p.render === 'markers') priceSeriesRef.value.setMarkers(markers)
  chartRef.value.timeScale().fitContent()

  baseTime = n - 1
  updatesPerSecond.value = Math.round((n / Math.max(elapsed, 0.001)) * 1000)
  lastPrice.value = gen.price
  lastValue.value = last || lastValue.value
  status.value = ''
}

async function ensureWasm() {
  if (wasm.value) return wasm.value
  status.value = 'Loading WASM module…'
  try {
    const mod: any = await import('wickra-wasm')
    if (typeof mod.default === 'function') await mod.default()
    wasm.value = mod
    wasmVersion.value = typeof mod.version === 'function' ? mod.version() : ''
    status.value = ''
    return mod
  } catch (e: any) {
    error.value = `Could not load wickra-wasm: ${e?.message ?? e}`
    status.value = ''
    throw e
  }
}

function frame(ts: number) {
  if (!chartRef.value || paused.value) {
    rafId = null
    return
  }
  // candles-per-second scales with the speed slider (speed 1 ≈ calm 3/s).
  const cps = speed.value * 3
  const dt = lastFrameTs ? (ts - lastFrameTs) / 1000 : 0
  lastFrameTs = ts
  acc += dt * cps
  let emit = Math.floor(acc)
  if (emit > 0) {
    acc -= emit
    if (emit > 40) emit = 40 // guard against tab-restore bursts
    const p = pick.value
    while (emit-- > 0) {
      const k = nextCandle()
      baseTime += 1
      priceSeriesRef.value.update(priceData(k, baseTime))
      const res = feed(liveInd, p.sig, k, gen.clock)
      applyLive(res, baseTime, p)
      lastPrice.value = k.close
    }
  }
  rafId = requestAnimationFrame(frame)
}

function startStream() {
  if (rafId !== null || !wasm.value || !liveInd) return
  paused.value = false
  lastFrameTs = 0
  acc = 0
  rafId = requestAnimationFrame(frame)
  status.value = 'Streaming…'
}

function stopStream() {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  if (status.value === 'Streaming…') status.value = ''
}

function togglePause() {
  if (rafId !== null) {
    paused.value = true
    stopStream()
    status.value = 'Paused'
  } else {
    startStream()
  }
}

// Length / indicator / history changes rebuild from scratch.
watch([selected, length, history], async () => {
  await rebuild()
})

// Sync the length slider to the newly selected indicator's default.
watch(selected, () => {
  const p = pick.value
  if (p.len && p.ctor.length) length.value = p.ctor[0]
})

// Candle/line toggle reseeds and re-renders with the new price style.
watch(candles, async () => {
  await rebuild()
})

watch(isDark, () => {
  if (chartRef.value) chartRef.value.applyOptions(chartOptions(isDark.value))
})

onMounted(async () => {
  await bootChart()
  await rebuild()
})

onBeforeUnmount(() => {
  stopStream()
  liveInd?.free?.()
  if (chartRef.value) {
    const ro = (chartRef.value as any).__ro as ResizeObserver | undefined
    ro?.disconnect()
    chartRef.value.remove()
    chartRef.value = null
  }
})

const speedLabel = computed(() => {
  const v = updatesPerSecond.value
  if (!v) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} k`
  return String(v)
})
const trendLabel = computed(() => (trend.value > 0.05 ? 'bull' : trend.value < -0.05 ? 'bear' : 'flat'))
</script>

<template>
  <ClientOnly>
    <div class="wk-demo">
      <div class="wk-demo-controls">
        <div class="wk-demo-control">
          <label for="wk-ind">Indicator</label>
          <select id="wk-ind" v-model="selected">
            <optgroup v-for="(items, fam) in GROUPS" :key="fam" :label="fam">
              <option v-for="p in items" :key="p.cls" :value="p.cls">{{ p.label }}</option>
            </optgroup>
          </select>
        </div>

        <div class="wk-demo-control" v-if="pick.len">
          <label for="wk-len">Length: <strong>{{ length }}</strong></label>
          <input id="wk-len" type="range" min="2" max="120" v-model.number="length" />
        </div>

        <div class="wk-demo-control">
          <label for="wk-speed">Stream speed: <strong>{{ speed }}×</strong></label>
          <input id="wk-speed" type="range" min="1" max="10" step="1" v-model.number="speed" />
        </div>

        <div class="wk-demo-control">
          <label for="wk-vol">Volatility: <strong>{{ volatility.toFixed(1) }}</strong></label>
          <input id="wk-vol" type="range" min="0.1" max="2" step="0.1" v-model.number="volatility" />
        </div>

        <div class="wk-demo-control">
          <label for="wk-trend">Trend: <strong>{{ trendLabel }}</strong></label>
          <input id="wk-trend" type="range" min="-1" max="1" step="0.05" v-model.number="trend" />
        </div>

        <div class="wk-demo-control">
          <label for="wk-candles">Price style</label>
          <button
            id="wk-candles"
            class="wk-demo-button secondary"
            @click="candles = !candles"
          >{{ candles ? '▦ Candles' : '〜 Line' }}</button>
        </div>

        <div class="wk-demo-control" style="margin-left: auto;">
          <label>&nbsp;</label>
          <div style="display: flex; gap: 8px;">
            <button v-if="rafId === null" class="wk-demo-button" @click="startStream">▶ Stream</button>
            <button v-else class="wk-demo-button secondary" @click="togglePause">⏸ Pause</button>
            <button class="wk-demo-button secondary" @click="rebuild">↻ Reseed</button>
          </div>
        </div>
      </div>

      <div ref="chartContainer" class="wk-demo-chart" />

      <div class="wk-demo-stats">
        <div class="wk-demo-stat">
          <span class="label">Throughput (initial pass)</span>
          <span class="value">{{ speedLabel }} <small style="font-weight:500;color:var(--vp-c-text-2);">updates/s</small></span>
        </div>
        <div class="wk-demo-stat">
          <span class="label">Last price</span>
          <span class="value">{{ lastPrice !== null ? lastPrice.toFixed(2) : '—' }}</span>
        </div>
        <div class="wk-demo-stat">
          <span class="label">{{ pick.cls }}</span>
          <span class="value">{{ lastValue !== null ? lastValue.toFixed(2) : '—' }}</span>
        </div>
        <div class="wk-demo-stat" v-if="wasmVersion">
          <span class="label">wickra-wasm</span>
          <span class="value" style="font-size:14px;">v{{ wasmVersion }}</span>
        </div>
      </div>

      <p v-if="status" class="wk-demo-status">{{ status }}</p>
      <p v-if="error" class="wk-demo-status error">{{ error }}</p>
    </div>

    <template #fallback>
      <div class="wk-demo">
        <div class="wk-demo-chart" style="display:flex;align-items:center;justify-content:center;color:var(--vp-c-text-2);">
          Loading interactive chart…
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
