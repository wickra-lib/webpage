<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface BenchEntry {
  name: string
  value: number | null
}

interface BenchRow {
  label: string
  wickra: number
  /** Every competitor in the row; each renders its own bar. */
  peers: BenchEntry[]
  unit?: string
}

const props = defineProps<{
  rows: BenchRow[]
  title?: string
  /** Lower-is-better (default): the shortest bar is the fastest. */
  lowerIsBetter?: boolean
  /** Fixed decimals; omit for magnitude-adaptive formatting. */
  decimals?: number
}>()

const animated = ref(false)

onMounted(() => {
  // Defer one frame so the width transition fires from 0.
  requestAnimationFrame(() => {
    animated.value = true
  })
})

const lowerBetter = computed(() => props.lowerIsBetter ?? true)

// Wickra plus its peers, sorted fastest-first so each row reads as a ranking.
function entries(row: BenchRow): (BenchEntry & { self: boolean })[] {
  const all = [
    { name: 'Wickra', value: row.wickra, self: true },
    ...row.peers.map((p) => ({ ...p, self: false })),
  ]
  return all.sort((a, b) => {
    if (a.value == null) return 1
    if (b.value == null) return -1
    return lowerBetter.value ? a.value - b.value : b.value - a.value
  })
}

function rowMax(row: BenchRow): number {
  return Math.max(row.wickra, ...row.peers.map((p) => p.value ?? 0))
}

function widthFor(value: number | null, row: BenchRow): string {
  if (!animated.value || value == null) return '0%'
  const ref = rowMax(row)
  if (ref === 0) return '0%'
  const pct = (value / ref) * 100
  return `${Math.max(2, Math.min(100, pct))}%`
}

// Speedup of the slowest-vs-Wickra, shown once per row as a headline.
function rowSpeedup(row: BenchRow): string {
  const peerVals = row.peers.map((p) => p.value).filter((v): v is number => v != null)
  if (!peerVals.length || row.wickra === 0) return ''
  const slowest = Math.max(...peerVals)
  const ratio = lowerBetter.value ? slowest / row.wickra : row.wickra / slowest
  if (!isFinite(ratio) || ratio <= 1.01) return ''
  return ratio >= 100 ? `up to ${Math.round(ratio)}×` : `up to ${ratio.toFixed(1)}×`
}

function fmt(value: number | null): string {
  if (value == null) return '—'
  if (props.decimals != null) return value.toFixed(props.decimals)
  const mag = Math.abs(value)
  if (mag >= 100) return value.toFixed(0)
  if (mag >= 1) return value.toFixed(2)
  return value.toFixed(3)
}
</script>

<template>
  <div class="wk-bench">
    <h3 v-if="title">{{ title }}</h3>
    <div v-for="row in rows" :key="row.label" class="wk-bench-group">
      <div class="wk-bench-grouphead">
        <span class="wk-bench-grouplabel">{{ row.label }}</span>
        <span class="wk-bench-speedup" v-if="rowSpeedup(row)">{{ rowSpeedup(row) }} faster</span>
      </div>
      <div
        v-for="e in entries(row)"
        :key="e.name"
        class="wk-bench-bar"
        :class="{ 'is-self': e.self }"
      >
        <div class="wk-bench-name">
          <span v-if="e.self" class="wk-bench-star">★</span>{{ e.name }}
        </div>
        <div class="wk-bench-track">
          <div
            class="wk-bench-fill"
            :class="e.self ? 'winner' : 'peer'"
            :style="{ width: widthFor(e.value, row) }"
          />
        </div>
        <div class="wk-bench-num" :class="{ 'is-best': e.self }">
          {{ fmt(e.value) }}<small> {{ row.unit ?? 'µs' }}</small>
        </div>
      </div>
    </div>
  </div>
</template>
