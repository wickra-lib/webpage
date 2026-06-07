<script setup lang="ts">
import { computed } from 'vue'

interface BenchRow {
  label: string
  /** One value per column, aligned with `columns`. `null` means "not measured". */
  cells: (number | null)[]
}

const props = defineProps<{
  /** Column headers; the first column is the reference (Wickra) and is starred. */
  columns: string[]
  rows: BenchRow[]
  unit?: string
  decimals?: number
  /** Lower-is-better (default) bolds the smallest value in each row. */
  lowerIsBetter?: boolean
}>()

const lowerBetter = computed(() => props.lowerIsBetter ?? true)

function fmt(value: number | null): string {
  if (value == null) return '—'
  // Fixed precision when the caller asks for it (keeps a column visually
  // uniform, e.g. batch µs at 1 decimal); otherwise adapt to magnitude so a
  // table mixing 0.061 and 422 stays readable on both ends.
  if (props.decimals != null) return value.toFixed(props.decimals)
  const mag = Math.abs(value)
  if (mag >= 100) return value.toFixed(0)
  if (mag >= 1) return value.toFixed(2)
  return value.toFixed(3)
}

// Index of the winning (fastest) cell in a row, ignoring nulls.
function winnerIndex(row: BenchRow): number {
  let best = -1
  let bestVal = lowerBetter.value ? Infinity : -Infinity
  row.cells.forEach((cell, i) => {
    if (cell == null) return
    if (lowerBetter.value ? cell < bestVal : cell > bestVal) {
      bestVal = cell
      best = i
    }
  })
  return best
}
</script>

<template>
  <div class="wk-bench-table">
    <table>
      <thead>
        <tr>
          <th>Indicator</th>
          <th v-for="(col, i) in columns" :key="col" :class="{ 'wk-ref': i === 0 }">
            <span v-if="i === 0">★&nbsp;</span>{{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <td class="wk-indicator">{{ row.label }}</td>
          <td
            v-for="(cell, i) in row.cells"
            :key="i"
            class="wk-num"
            :class="{ 'wk-win': i === winnerIndex(row), 'wk-ref': i === 0 }"
          >
            {{ fmt(cell) }}
          </td>
        </tr>
      </tbody>
    </table>
    <p class="wk-unit" v-if="unit">All values in {{ unit }} — lower is faster; <strong>bold</strong> is the fastest in the row.</p>
  </div>
</template>

<style scoped>
.wk-bench-table {
  margin: 16px 0;
  overflow-x: auto;
}
.wk-bench-table table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.wk-bench-table th,
.wk-bench-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  text-align: right;
  white-space: nowrap;
}
.wk-bench-table th:first-child,
.wk-bench-table td.wk-indicator {
  text-align: left;
  font-weight: 600;
}
.wk-bench-table thead th {
  border-bottom: 2px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-weight: 600;
}
.wk-bench-table th.wk-ref {
  color: var(--vp-c-brand-1);
}
.wk-bench-table td.wk-ref {
  color: var(--vp-c-text-1);
}
.wk-bench-table td.wk-win {
  font-weight: 700;
  color: var(--vp-c-brand-1);
}
.wk-unit {
  margin-top: 8px;
  font-size: 0.85em;
  color: var(--vp-c-text-2);
}
</style>
