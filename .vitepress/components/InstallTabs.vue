<script setup lang="ts">
import { ref } from 'vue'

interface Tab {
  label: string
  lang: string
  code: string
}

const props = defineProps<{
  tabs: Tab[]
}>()

const active = ref(0)
const copied = ref(false)

async function copy() {
  const code = props.tabs[active.value]?.code ?? ''
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* clipboard denied — silently ignore */
  }
}
</script>

<template>
  <div class="wk-tabs">
    <div class="wk-tabs-header" role="tablist">
      <button
        v-for="(tab, i) in tabs"
        :key="tab.label"
        class="wk-tabs-tab"
        :class="{ active: active === i }"
        :aria-selected="active === i"
        role="tab"
        @click="active = i"
      >{{ tab.label }}</button>
    </div>
    <div class="wk-tabs-panel">
      <button class="wk-tabs-copy" @click="copy">
        {{ copied ? '✓ Copied' : 'Copy' }}
      </button>
      <pre :class="`language-${tabs[active]?.lang ?? 'bash'}`"><code>{{ tabs[active]?.code ?? '' }}</code></pre>
    </div>
  </div>
</template>
