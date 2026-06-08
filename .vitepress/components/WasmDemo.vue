<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, shallowRef } from 'vue'
import { useData } from 'vitepress'

// The best-known indicators per drivable family, exercised against the
// wickra-wasm bundle. The picker is grouped by family. Each entry declares its
// constructor parameters (`params` — name + default, all exposed as live
// sliders), how it is fed (`sig`), which pane it draws on (`pane`), and how its
// output is rendered (`render`). The driver below is fully generic over these.
//
// Three families are intentionally absent — Microstructure, Derivatives and
// Market Breadth need a live order-book / funding / breadth feed that a single
// synthetic price series cannot stand in for. Alt-Chart Bars (Renko/Kagi/P&F)
// emit a variable number of bars per tick and get a dedicated renderer later.
type Sig = 'scalar' | 'ohlc' | 'hlc' | 'hl' | 'cv' | 'hlcv' | 'hlv' | 'ohlcv_ts'
type Pane = 'price' | 'sub'
type Render = 'line' | 'multi' | 'markers'
type Param = [string, number] // [constructor arg name, default value]

interface Pick {
  fam: string
  cls: string
  label: string
  params: Param[]
  sig: Sig
  pane: Pane
  render: Render
  fields?: string[] // for multi-output: only plot these object keys (else all)
}

const PICKS: Pick[] = [
  { fam: 'Moving Averages', cls: 'EMA', label: 'EMA — Exponential MA', params: [['period', 20]], sig: 'scalar', pane: 'price', render: 'line' },
  { fam: 'Moving Averages', cls: 'SMA', label: 'SMA — Simple MA', params: [['period', 20]], sig: 'scalar', pane: 'price', render: 'line' },
  { fam: 'Moving Averages', cls: 'WMA', label: 'WMA — Weighted MA', params: [['period', 20]], sig: 'scalar', pane: 'price', render: 'line' },
  { fam: 'Moving Averages', cls: 'HMA', label: 'HMA — Hull MA', params: [['period', 20]], sig: 'scalar', pane: 'price', render: 'line' },

  { fam: 'Momentum Oscillators', cls: 'RSI', label: 'RSI — Relative Strength', params: [['period', 14]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Momentum Oscillators', cls: 'Stochastic', label: 'Stochastic', params: [['k_period', 14], ['d_period', 3]], sig: 'hlc', pane: 'sub', render: 'multi' },
  { fam: 'Momentum Oscillators', cls: 'CCI', label: 'CCI — Commodity Channel', params: [['period', 20]], sig: 'hlc', pane: 'sub', render: 'line' },
  { fam: 'Momentum Oscillators', cls: 'WilliamsR', label: 'Williams %R', params: [['period', 14]], sig: 'hlc', pane: 'sub', render: 'line' },

  { fam: 'Trend & Directional', cls: 'MACD', label: 'MACD', params: [['fast', 12], ['slow', 26], ['signal', 9]], sig: 'scalar', pane: 'sub', render: 'multi' },
  { fam: 'Trend & Directional', cls: 'ADX', label: 'ADX / DMI', params: [['period', 14]], sig: 'hlc', pane: 'sub', render: 'multi' },
  { fam: 'Trend & Directional', cls: 'Aroon', label: 'Aroon', params: [['period', 14]], sig: 'hl', pane: 'sub', render: 'multi' },
  { fam: 'Trend & Directional', cls: 'TRIX', label: 'TRIX', params: [['period', 15]], sig: 'scalar', pane: 'sub', render: 'line' },

  { fam: 'Price Oscillators', cls: 'PPO', label: 'PPO — Percentage Price Osc', params: [['fast', 12], ['slow', 26]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Price Oscillators', cls: 'APO', label: 'APO — Absolute Price Osc', params: [['fast', 12], ['slow', 26]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Price Oscillators', cls: 'Coppock', label: 'Coppock Curve', params: [['roc_long', 14], ['roc_short', 11], ['wma_period', 10]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Price Oscillators', cls: 'BalanceOfPower', label: 'Balance of Power', params: [], sig: 'ohlc', pane: 'sub', render: 'line' },

  { fam: 'Volatility & Bands', cls: 'BollingerBands', label: 'Bollinger Bands', params: [['period', 20], ['multiplier', 2]], sig: 'scalar', pane: 'price', render: 'multi', fields: ['upper', 'middle', 'lower'] },
  { fam: 'Volatility & Bands', cls: 'ATR', label: 'ATR — Average True Range', params: [['period', 14]], sig: 'hlc', pane: 'sub', render: 'line' },
  { fam: 'Volatility & Bands', cls: 'Keltner', label: 'Keltner Channel', params: [['ema_period', 20], ['atr_period', 10], ['multiplier', 2]], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Volatility & Bands', cls: 'Donchian', label: 'Donchian Channel', params: [['period', 20]], sig: 'hl', pane: 'price', render: 'multi' },

  { fam: 'Bands & Channels', cls: 'MaEnvelope', label: 'MA Envelope', params: [['period', 20], ['percent', 2.5]], sig: 'scalar', pane: 'price', render: 'multi' },
  { fam: 'Bands & Channels', cls: 'StarcBands', label: 'STARC Bands', params: [['sma_period', 20], ['atr_period', 10], ['multiplier', 2]], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Bands & Channels', cls: 'AtrBands', label: 'ATR Bands', params: [['period', 20], ['multiplier', 2]], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Bands & Channels', cls: 'LinRegChannel', label: 'Linear Regression Channel', params: [['period', 20], ['multiplier', 2]], sig: 'scalar', pane: 'price', render: 'multi' },

  { fam: 'Trailing Stops', cls: 'SuperTrend', label: 'SuperTrend', params: [['atr_period', 10], ['multiplier', 3]], sig: 'hlc', pane: 'price', render: 'multi', fields: ['value'] },
  { fam: 'Trailing Stops', cls: 'PSAR', label: 'Parabolic SAR', params: [['af_start', 0.02], ['af_step', 0.02], ['af_max', 0.2]], sig: 'hlc', pane: 'price', render: 'line' },
  { fam: 'Trailing Stops', cls: 'ChandelierExit', label: 'Chandelier Exit', params: [['period', 22], ['multiplier', 3]], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Trailing Stops', cls: 'AtrTrailingStop', label: 'ATR Trailing Stop', params: [['atr_period', 14], ['multiplier', 3]], sig: 'hlc', pane: 'price', render: 'line' },

  { fam: 'Volume', cls: 'OBV', label: 'OBV — On-Balance Volume', params: [], sig: 'cv', pane: 'sub', render: 'line' },
  { fam: 'Volume', cls: 'VWAP', label: 'VWAP', params: [], sig: 'hlcv', pane: 'price', render: 'line' },
  { fam: 'Volume', cls: 'ChaikinMoneyFlow', label: 'Chaikin Money Flow', params: [['period', 20]], sig: 'hlcv', pane: 'sub', render: 'line' },
  { fam: 'Volume', cls: 'ADL', label: 'Accumulation / Distribution', params: [], sig: 'hlcv', pane: 'sub', render: 'line' },

  { fam: 'Price Statistics', cls: 'ZScore', label: 'Z-Score', params: [['period', 20]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Price Statistics', cls: 'LinearRegression', label: 'Linear Regression', params: [['period', 20]], sig: 'scalar', pane: 'price', render: 'line' },
  { fam: 'Price Statistics', cls: 'LinRegSlope', label: 'Lin-Reg Slope', params: [['period', 20]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Price Statistics', cls: 'Variance', label: 'Variance', params: [['period', 20]], sig: 'scalar', pane: 'sub', render: 'line' },

  { fam: 'Ehlers / Cycle (DSP)', cls: 'FisherTransform', label: 'Fisher Transform', params: [['period', 10]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Ehlers / Cycle (DSP)', cls: 'MAMA', label: 'MAMA — MESA Adaptive MA', params: [['fast_limit', 0.5], ['slow_limit', 0.05]], sig: 'scalar', pane: 'price', render: 'multi' },
  { fam: 'Ehlers / Cycle (DSP)', cls: 'SuperSmoother', label: 'Super Smoother', params: [['period', 10]], sig: 'scalar', pane: 'price', render: 'line' },
  { fam: 'Ehlers / Cycle (DSP)', cls: 'InverseFisherTransform', label: 'Inverse Fisher Transform', params: [['scale', 1]], sig: 'scalar', pane: 'sub', render: 'line' },

  { fam: 'Pivots & S/R', cls: 'ClassicPivots', label: 'Classic Pivots', params: [], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Pivots & S/R', cls: 'FibonacciPivots', label: 'Fibonacci Pivots', params: [], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Pivots & S/R', cls: 'Camarilla', label: 'Camarilla Pivots', params: [], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Pivots & S/R', cls: 'ZigZag', label: 'ZigZag', params: [['threshold', 0.05]], sig: 'hl', pane: 'price', render: 'multi', fields: ['swing'] },

  { fam: 'DeMark', cls: 'TDDeMarker', label: 'TD DeMarker', params: [['period', 13]], sig: 'hl', pane: 'sub', render: 'line' },
  { fam: 'DeMark', cls: 'TDSetup', label: 'TD Setup', params: [['lookback', 4], ['target', 9]], sig: 'hlc', pane: 'sub', render: 'line' },
  { fam: 'DeMark', cls: 'TDREI', label: 'TD Range Expansion Index', params: [['period', 5]], sig: 'hl', pane: 'sub', render: 'line' },

  { fam: 'Ichimoku & Charts', cls: 'Ichimoku', label: 'Ichimoku Cloud', params: [['tenkan_period', 9], ['kijun_period', 26], ['senkou_b_period', 52], ['displacement', 26]], sig: 'hlc', pane: 'price', render: 'multi' },
  { fam: 'Ichimoku & Charts', cls: 'HeikinAshi', label: 'Heikin-Ashi (close)', params: [], sig: 'ohlc', pane: 'price', render: 'multi', fields: ['close'] },

  { fam: 'Candlestick Patterns', cls: 'Engulfing', label: 'Engulfing', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Candlestick Patterns', cls: 'Doji', label: 'Doji', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Candlestick Patterns', cls: 'Hammer', label: 'Hammer', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Candlestick Patterns', cls: 'MorningEveningStar', label: 'Morning / Evening Star', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },

  { fam: 'Market Profile', cls: 'ValueArea', label: 'Value Area', params: [['period', 20], ['bin_count', 24], ['value_area_pct', 0.7]], sig: 'hlv', pane: 'price', render: 'multi' },
  { fam: 'Market Profile', cls: 'InitialBalance', label: 'Initial Balance', params: [['period', 20]], sig: 'hl', pane: 'price', render: 'multi' },
  { fam: 'Market Profile', cls: 'OpeningRange', label: 'Opening Range', params: [['period', 20]], sig: 'hlc', pane: 'price', render: 'multi', fields: ['high', 'low'] },

  { fam: 'Risk / Performance', cls: 'SharpeRatio', label: 'Sharpe Ratio', params: [['period', 20], ['risk_free', 0]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Risk / Performance', cls: 'SortinoRatio', label: 'Sortino Ratio', params: [['period', 20], ['mar', 0]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Risk / Performance', cls: 'MaxDrawdown', label: 'Max Drawdown', params: [['period', 20]], sig: 'scalar', pane: 'sub', render: 'line' },
  { fam: 'Risk / Performance', cls: 'CalmarRatio', label: 'Calmar Ratio', params: [['period', 20]], sig: 'scalar', pane: 'sub', render: 'line' },

  { fam: 'Seasonality & Session', cls: 'SessionVwap', label: 'Session VWAP', params: [['utc_offset_minutes', 0]], sig: 'ohlcv_ts', pane: 'price', render: 'line' },
  { fam: 'Seasonality & Session', cls: 'SessionHighLow', label: 'Session High / Low', params: [['utc_offset_minutes', 0]], sig: 'ohlcv_ts', pane: 'price', render: 'multi' },
  { fam: 'Seasonality & Session', cls: 'SessionRange', label: 'Session Range', params: [['utc_offset_minutes', 0]], sig: 'ohlcv_ts', pane: 'sub', render: 'multi' },

  { fam: 'Chart Patterns', cls: 'HeadAndShoulders', label: 'Head & Shoulders', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Chart Patterns', cls: 'DoubleTopBottom', label: 'Double Top / Bottom', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Chart Patterns', cls: 'Triangle', label: 'Triangle', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },

  { fam: 'Harmonic Patterns', cls: 'Gartley', label: 'Gartley', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Harmonic Patterns', cls: 'Butterfly', label: 'Butterfly', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },
  { fam: 'Harmonic Patterns', cls: 'Bat', label: 'Bat', params: [], sig: 'ohlc', pane: 'price', render: 'markers' },

  { fam: 'Fibonacci', cls: 'FibRetracement', label: 'Fibonacci Retracement', params: [], sig: 'hl', pane: 'price', render: 'multi' },
  { fam: 'Fibonacci', cls: 'FibExtension', label: 'Fibonacci Extension', params: [], sig: 'hl', pane: 'price', render: 'multi' },
  { fam: 'Fibonacci', cls: 'GoldenPocket', label: 'Golden Pocket', params: [], sig: 'hl', pane: 'price', render: 'multi' },
]

// Group picks by family for the <optgroup> selector.
const GROUPS = PICKS.reduce<Record<string, Pick[]>>((acc, p) => {
  ;(acc[p.fam] ??= []).push(p)
  return acc
}, {})

const PALETTE = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#eab308', '#ef4444', '#14b8a6']
const PRICE_COLOR = '#94a3b8'

// Slider bounds derived from the constructor argument name, so every parameter
// of every indicator gets a sensible live control without per-indicator config.
function paramSpec(name: string) {
  const n = name.toLowerCase()
  const F = (min: number, max: number, step: number) => ({ min, max, step })
  if (n.includes('value_area_pct')) return F(0.5, 0.95, 0.05)
  if (n.includes('fast_limit')) return F(0.1, 1, 0.05)
  if (n.includes('slow_limit')) return F(0.01, 0.6, 0.01)
  if (n.includes('threshold')) return F(0.01, 0.3, 0.01)
  if (n.includes('af_max')) return F(0.1, 0.5, 0.05)
  if (n.startsWith('af_')) return F(0.01, 0.2, 0.01)
  if (n.includes('multiplier') || n.includes('factor') || n === 'k' || n.includes('k_inner') || n.includes('k_outer')) return F(0.5, 5, 0.1)
  if (n.includes('percent')) return F(0.5, 10, 0.1)
  if (n.includes('scale')) return F(0.5, 5, 0.5)
  if (n === 'mar' || n.includes('risk_free')) return F(0, 1, 0.05)
  if (n.includes('utc_offset')) return F(-720, 720, 60)
  return F(2, 200, 1) // period-like default (integer)
}
function paramLabel(name: string) {
  return name
    .replace(/_/g, ' ')
    .replace(/\bpct\b/, '%')
    .replace(/^\w/, (c) => c.toUpperCase())
}

const { isDark } = useData()

const selected = ref<string>('EMA')
const pvals = ref<number[]>(PICKS[0].params.map((p) => p[1]))
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
const paused = ref(false)
const legend = ref<{ label: string; color: string; value: string }[]>([])

const chartContainer = ref<HTMLDivElement | null>(null)
const chartRef = shallowRef<any>(null)
const priceSeriesRef = shallowRef<any>(null)
const indSeries = new Map<string, any>() // output field -> line series
const fieldColors = new Map<string, string>() // output field -> colour
const fieldLast = new Map<string, number>() // output field -> latest value
const wasm = shallowRef<any>(null)

// Persistent stream state so Pause/Resume continues without resetting.
let rafId: number | null = null
let lastFrameTs = 0
let acc = 0 // fractional candles accumulated between frames
let liveInd: any = null
let baseTime = 0
let markers: any[] = []
let signalCount = 0
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

function makeIndicator(p: Pick): any {
  return new wasm.value[p.cls](...pvals.value)
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

/** (Re)create the price series as either a line (close) or candlesticks. The
 *  on-chart value tag is disabled here and on every indicator series — the
 *  custom legend below carries the live numbers, so the price axis stays clean
 *  no matter how many bands/pivots an indicator emits. */
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
        lastValueVisible: false,
      })
    : chart.addLineSeries({
        color: PRICE_COLOR,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      })
}

function clearIndicatorSeries() {
  const chart = chartRef.value
  if (chart) for (const s of indSeries.values()) chart.removeSeries(s)
  indSeries.clear()
  fieldColors.clear()
  fieldLast.clear()
  markers = []
  signalCount = 0
  if (priceSeriesRef.value) priceSeriesRef.value.setMarkers([])
}

function seriesFor(field: string, pane: Pane): any {
  let s = indSeries.get(field)
  if (s) return s
  const color = PALETTE[indSeries.size % PALETTE.length]
  fieldColors.set(field, color)
  s = chartRef.value.addLineSeries({
    color,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
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
  signalCount += 1
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

function fieldLabel(field: string, p: Pick) {
  return field === 'value' ? p.cls : field
}

/** Rebuild the HTML legend from the current series + latest values. */
function refreshLegend() {
  const p = pick.value
  const out = [{ label: 'Price', color: PRICE_COLOR, value: lastPrice.value != null ? lastPrice.value.toFixed(2) : '—' }]
  if (p.render === 'markers') {
    out.push({ label: `${p.cls} signals`, color: '#22c55e', value: String(signalCount) })
  } else {
    for (const field of indSeries.keys()) {
      const v = fieldLast.get(field)
      out.push({
        label: fieldLabel(field, p),
        color: fieldColors.get(field) ?? PALETTE[0],
        value: v != null ? v.toFixed(2) : '—',
      })
    }
  }
  legend.value = out
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
      fieldLast.set('value', res)
    }
  } else if (res && typeof res === 'object') {
    for (const key of objFields(res, p)) {
      const v = (res as any)[key]
      if (typeof v === 'number' && Number.isFinite(v)) {
        seriesFor(key, p.pane).update({ time, value: v })
        fieldLast.set(key, v)
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

  // A bad live parameter combination (e.g. fast_limit < slow_limit) makes the
  // Rust constructor throw — surface it instead of leaving a blank chart.
  try {
    liveInd = makeIndicator(p)
  } catch (e: any) {
    liveInd = null
    legend.value = []
    status.value = `Invalid parameters: ${e?.message ?? e}`
    return
  }

  const priceBuf: any[] = []
  const fieldBuf = new Map<string, any[]>()
  const markerBuf: any[] = []

  const t0 = performance.now()
  for (let i = 0; i < n; i++) {
    const k = nextCandle()
    priceBuf.push(priceData(k, i))
    const res = feed(liveInd, p.sig, k, gen.clock)
    if (p.render === 'markers') {
      if (typeof res === 'number' && res !== 0 && !Number.isNaN(res)) {
        signalCount += 1
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
        fieldLast.set('value', res)
      }
    } else if (res && typeof res === 'object') {
      for (const key of objFields(res, p)) {
        const v = (res as any)[key]
        if (typeof v === 'number' && Number.isFinite(v)) {
          ;(fieldBuf.get(key) ?? fieldBuf.set(key, []).get(key))!.push({ time: i, value: v })
          fieldLast.set(key, v)
        }
      }
    }
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
  status.value = ''
  refreshLegend()
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
    refreshLegend()
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

// Selecting a new indicator resets its parameters to their defaults; that
// pvals change drives the rebuild below.
watch(selected, () => {
  pvals.value = pick.value.params.map((p) => p[1])
})

// Parameters or history changed → rebuild from scratch.
watch([pvals, history], async () => {
  await rebuild()
}, { deep: true })

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

        <div class="wk-demo-control" v-for="(pp, i) in pick.params" :key="pick.cls + pp[0]">
          <label :for="'wk-p' + i">{{ paramLabel(pp[0]) }}: <strong>{{ pvals[i] }}</strong></label>
          <input
            :id="'wk-p' + i"
            type="range"
            :min="paramSpec(pp[0]).min"
            :max="paramSpec(pp[0]).max"
            :step="paramSpec(pp[0]).step"
            v-model.number="pvals[i]"
          />
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

      <div class="wk-demo-legend" v-if="legend.length">
        <span v-for="e in legend" :key="e.label" class="wk-legend-chip">
          <span class="wk-legend-dot" :style="{ background: e.color }" />{{ e.label }}
          <strong>{{ e.value }}</strong>
        </span>
      </div>

      <div class="wk-demo-stats">
        <div class="wk-demo-stat">
          <span class="label">Throughput (initial pass)</span>
          <span class="value">{{ speedLabel }} <small style="font-weight:500;color:var(--vp-c-text-2);">updates/s</small></span>
        </div>
        <div class="wk-demo-stat">
          <span class="label">Indicator</span>
          <span class="value" style="font-size:15px;">{{ pick.cls }}</span>
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
