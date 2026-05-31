<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface BenchRow {
  label: string
  wickra: number
  peer?: number | null
  peerName?: string
  unit?: string
}

const props = defineProps<{
  rows: BenchRow[]
  title?: string
  /** Lower-is-better (default) inverts the bar so the winner is shortest. */
  lowerIsBetter?: boolean
}>()

const animated = ref(false)

onMounted(() => {
  // Defer one frame so the transition fires.
  requestAnimationFrame(() => {
    animated.value = true
  })
})

const lowerBetter = computed(() => props.lowerIsBetter ?? true)

// Normalise bar widths against the slowest value in the row so the winner
// is always visually shortest (or longest, depending on direction).
function widthFor(value: number, row: BenchRow): string {
  if (!animated.value) return '0%'
  const ref = Math.max(row.wickra, row.peer ?? 0)
  if (ref === 0) return '0%'
  const pct = (value / ref) * 100
  return `${Math.max(2, Math.min(100, pct))}%`
}

function speedupLabel(row: BenchRow): string {
  if (row.peer == null || row.peer === 0) return ''
  const ratio = lowerBetter.value ? row.peer / row.wickra : row.wickra / row.peer
  if (!isFinite(ratio) || ratio <= 1.01) return ''
  return `${ratio.toFixed(1)}× faster`
}
</script>

<template>
  <div class="wk-bench">
    <h3 v-if="title">{{ title }}</h3>
    <div v-for="row in rows" :key="row.label" class="wk-bench-row">
      <div class="wk-bench-label">{{ row.label }}</div>
      <div>
        <div class="wk-bench-track" style="margin-bottom: 4px;">
          <div
            class="wk-bench-fill winner"
            :style="{ width: widthFor(row.wickra, row) }"
          />
        </div>
        <div class="wk-bench-track" v-if="row.peer != null">
          <div
            class="wk-bench-fill peer"
            :style="{ width: widthFor(row.peer, row) }"
          />
        </div>
      </div>
      <div class="wk-bench-value">
        <div>
          <strong>{{ row.wickra.toFixed(1) }}</strong>
          <small style="color:var(--vp-c-text-2);"> {{ row.unit ?? 'µs' }}</small>
        </div>
        <div v-if="row.peer != null" style="color:var(--vp-c-text-2);">
          {{ row.peer.toFixed(1) }} <small>{{ row.unit ?? 'µs' }}</small>
        </div>
        <span class="speedup" v-if="speedupLabel(row)">{{ speedupLabel(row) }}</span>
      </div>
    </div>
  </div>
</template>
