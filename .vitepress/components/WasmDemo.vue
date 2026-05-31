<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, shallowRef } from 'vue'
import { useData } from 'vitepress'

// Indicator catalogue exposed to the picker. Names map onto the wickra-wasm
// exports — only single-output scalar indicators here so the overlay logic
// stays simple.
const INDICATORS = [
  { id: 'EMA', label: 'EMA — Exponential MA' },
  { id: 'SMA', label: 'SMA — Simple MA' },
  { id: 'WMA', label: 'WMA — Weighted MA' },
  { id: 'HMA', label: 'HMA — Hull MA' },
  { id: 'DEMA', label: 'DEMA — Double EMA' },
  { id: 'TEMA', label: 'TEMA — Triple EMA' },
  { id: 'RSI', label: 'RSI — Relative Strength' },
  { id: 'MOM', label: 'MOM — Momentum' },
  { id: 'CMO', label: 'CMO — Chande Momentum' },
  { id: 'ROC', label: 'ROC — Rate of Change' },
] as const

type IndicatorId = (typeof INDICATORS)[number]['id']

const { isDark } = useData()

const indicator = ref<IndicatorId>('EMA')
const period = ref(20)
const ticks = ref(500)

const status = ref<string>('Loading WASM module…')
const error = ref<string | null>(null)
const updatesPerSecond = ref(0)
const wasmVersion = ref<string>('')
const lastPrice = ref<number | null>(null)
const lastIndicatorValue = ref<number | null>(null)
const isOscillator = computed(() =>
  ['RSI', 'MOM', 'CMO', 'ROC'].includes(indicator.value),
)

const chartContainer = ref<HTMLDivElement | null>(null)
const chartRef = shallowRef<any>(null)
const priceSeriesRef = shallowRef<any>(null)
const indicatorSeriesRef = shallowRef<any>(null)
const oscillatorSeriesRef = shallowRef<any>(null)

// Hold the wasm namespace once initialised so re-rendering on parameter
// changes doesn't re-fetch the binary.
const wasm = shallowRef<any>(null)

// Animation handle so we can cancel on unmount or re-render.
let rafId: number | null = null
let lastFrameTs = 0
let counter = 0

/** Random-walk price generator seeded for visual interest. */
function* priceWalk(start: number, drift = 0.0001, vol = 0.6): Generator<number> {
  let p = start
  while (true) {
    const shock = (Math.random() - 0.5) * vol * 2 + drift * p
    p = Math.max(1, p + shock)
    yield p
  }
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
    rightPriceScale: {
      borderColor: dark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.1)',
    },
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
  const { createChart, LineStyle } = await import('lightweight-charts')

  // Destroy any prior chart instance (e.g. when re-mounting after HMR).
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

  const priceSeries = chart.addLineSeries({
    color: '#94a3b8',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true,
    title: 'Price',
  })
  priceSeriesRef.value = priceSeries

  // Two pre-allocated overlays: one rides the price scale for MAs, one lives
  // on a dedicated pane for oscillators (RSI / MOM / CMO / ROC).
  const indicatorSeries = chart.addLineSeries({
    color: '#0ea5e9',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true,
    title: indicator.value,
  })
  indicatorSeriesRef.value = indicatorSeries

  const oscillatorSeries = chart.addLineSeries({
    color: '#f97316',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true,
    title: indicator.value,
    priceScaleId: 'osc',
  })
  oscillatorSeriesRef.value = oscillatorSeries

  chart.priceScale('osc').applyOptions({
    scaleMargins: { top: 0.78, bottom: 0 },
    borderVisible: false,
  })
  void LineStyle

  // Handle responsive resize.
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

async function ensureWasm() {
  if (wasm.value) return wasm.value
  status.value = 'Loading WASM module…'
  try {
    const mod = await import('wickra-wasm')
    if (typeof mod.default === 'function') {
      await mod.default()
    }
    wasm.value = mod
    wasmVersion.value =
      typeof (mod as any).version === 'function' ? (mod as any).version() : ''
    status.value = ''
    return mod
  } catch (e: any) {
    error.value = `Could not load wickra-wasm: ${e?.message ?? e}`
    status.value = ''
    throw e
  }
}

function makeIndicator(id: IndicatorId, p: number) {
  const m = wasm.value
  if (!m) throw new Error('wasm not initialised')
  switch (id) {
    case 'SMA': return new m.SMA(p)
    case 'EMA': return new m.EMA(p)
    case 'WMA': return new m.WMA(p)
    case 'HMA': return new m.HMA(p)
    case 'DEMA': return new m.DEMA(p)
    case 'TEMA': return new m.TEMA(p)
    case 'RSI': return new m.RSI(p)
    case 'MOM': return new m.MOM(p)
    case 'CMO': return new m.CMO(p)
    case 'ROC': return new m.ROC(p)
  }
}

async function render() {
  if (!chartRef.value) await bootChart()
  await ensureWasm()
  if (error.value) return

  const priceSeries = priceSeriesRef.value
  const indicatorSeries = indicatorSeriesRef.value
  const oscillatorSeries = oscillatorSeriesRef.value
  if (!priceSeries || !indicatorSeries || !oscillatorSeries) return

  // Wipe series before re-rendering with new params.
  priceSeries.setData([])
  indicatorSeries.setData([])
  oscillatorSeries.setData([])
  indicatorSeries.applyOptions({ title: isOscillator.value ? '' : indicator.value, visible: !isOscillator.value })
  oscillatorSeries.applyOptions({ title: isOscillator.value ? indicator.value : '', visible: isOscillator.value })

  const n = Math.max(50, Math.min(5000, ticks.value | 0))
  const ind: any = makeIndicator(indicator.value, period.value)

  const prices: { time: number; value: number }[] = []
  const indicatorPts: { time: number; value: number }[] = []

  const walk = priceWalk(100)
  const t0 = performance.now()
  for (let i = 0; i < n; i++) {
    const p = walk.next().value as number
    prices.push({ time: i, value: p })
    const v = ind.update(p)
    if (typeof v === 'number' && !Number.isNaN(v)) {
      indicatorPts.push({ time: i, value: v })
    }
  }
  const elapsed = performance.now() - t0

  priceSeries.setData(prices)
  ;(isOscillator.value ? oscillatorSeries : indicatorSeries).setData(indicatorPts)
  chartRef.value.timeScale().fitContent()

  updatesPerSecond.value = Math.round((n / Math.max(elapsed, 0.001)) * 1000)
  lastPrice.value = prices[prices.length - 1]?.value ?? null
  lastIndicatorValue.value = indicatorPts[indicatorPts.length - 1]?.value ?? null

  ind.reset?.()
}

function startStream() {
  if (rafId !== null) return
  if (!wasm.value) return
  const live: any = makeIndicator(indicator.value, period.value)
  // Re-feed last 200 points so the indicator is warm when streaming begins.
  const walk = priceWalk(lastPrice.value ?? 100)
  let baseTime = (priceSeriesRef.value?.dataByIndex?.(Infinity)?.time as number) ?? ticks.value

  const stepOnce = (ts: number) => {
    if (!chartRef.value) return
    // Throttle to ~12 fps so the chart movement reads naturally and the
    // WASM update path is still doing real work each frame.
    if (ts - lastFrameTs < 80) {
      rafId = requestAnimationFrame(stepOnce)
      return
    }
    lastFrameTs = ts
    const p = walk.next().value as number
    baseTime += 1
    counter += 1
    priceSeriesRef.value.update({ time: baseTime, value: p })
    const v = live.update(p)
    if (typeof v === 'number' && !Number.isNaN(v)) {
      ;(isOscillator.value ? oscillatorSeriesRef.value : indicatorSeriesRef.value).update({
        time: baseTime,
        value: v,
      })
      lastIndicatorValue.value = v
    }
    lastPrice.value = p
    rafId = requestAnimationFrame(stepOnce)
  }
  rafId = requestAnimationFrame(stepOnce)
  status.value = 'Streaming…'
}

function stopStream() {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  status.value = ''
}

watch([indicator, period, ticks], async () => {
  stopStream()
  await render()
})

watch(isDark, () => {
  if (chartRef.value) chartRef.value.applyOptions(chartOptions(isDark.value))
})

onMounted(async () => {
  await bootChart()
  await render()
})

onBeforeUnmount(() => {
  stopStream()
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
</script>

<template>
  <ClientOnly>
    <div class="wk-demo">
      <div class="wk-demo-controls">
        <div class="wk-demo-control">
          <label for="wk-ind">Indicator</label>
          <select id="wk-ind" v-model="indicator">
            <option v-for="i in INDICATORS" :key="i.id" :value="i.id">{{ i.label }}</option>
          </select>
        </div>

        <div class="wk-demo-control">
          <label for="wk-period">Period: <strong>{{ period }}</strong></label>
          <input
            id="wk-period"
            type="range"
            min="2"
            max="120"
            v-model.number="period"
          />
        </div>

        <div class="wk-demo-control">
          <label for="wk-ticks">Historical ticks</label>
          <input
            id="wk-ticks"
            type="number"
            min="50"
            max="5000"
            step="50"
            v-model.number="ticks"
          />
        </div>

        <div class="wk-demo-control" style="margin-left: auto;">
          <label>&nbsp;</label>
          <div style="display: flex; gap: 8px;">
            <button
              v-if="rafId === null"
              class="wk-demo-button"
              @click="startStream"
            >▶ Stream</button>
            <button
              v-else
              class="wk-demo-button secondary"
              @click="stopStream"
            >■ Stop</button>
            <button class="wk-demo-button secondary" @click="render">↻ Reseed</button>
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
          <span class="label">{{ indicator }}({{ period }})</span>
          <span class="value">{{ lastIndicatorValue !== null ? lastIndicatorValue.toFixed(2) : '—' }}</span>
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
