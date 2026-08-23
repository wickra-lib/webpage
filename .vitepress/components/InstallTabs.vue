<script setup lang="ts">
import { computed, ref, useId } from 'vue'

interface Tab {
  label: string
  lang: string
  code: string
}

const props = defineProps<{
  tabs: Tab[]
}>()

// Two of these render on the landing page, so the ids that wire the tabs to
// their panel have to be unique per instance.
const uid = useId()
const tabId = (i: number) => `${uid}-tab-${i}`
const panelId = `${uid}-panel`

const active = ref(0)
const tabEls = ref<HTMLButtonElement[]>([])
const current = computed(() => props.tabs[active.value])

function registerTab(el: Element | null, i: number) {
  if (el instanceof HTMLButtonElement) {
    tabEls.value[i] = el
  }
}

function select(i: number) {
  active.value = i
  tabEls.value[i]?.focus()
}

// In the ARIA tabs pattern the arrow keys move between tabs and only the
// selected tab is in the page's tab sequence, so Tab steps over the group to the
// panel rather than through every language.
function onKeydown(event: KeyboardEvent) {
  const last = props.tabs.length - 1
  let next: number
  switch (event.key) {
    case 'ArrowRight':
      next = active.value === last ? 0 : active.value + 1
      break
    case 'ArrowLeft':
      next = active.value === 0 ? last : active.value - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    default:
      return
  }
  event.preventDefault()
  select(next)
}

type CopyState = 'idle' | 'copied' | 'failed'
const copyState = ref<CopyState>('idle')
const copyLabel = computed(() =>
  copyState.value === 'copied' ? '✓ Copied' : copyState.value === 'failed' ? 'Copy failed' : 'Copy',
)

async function copy() {
  try {
    await navigator.clipboard.writeText(current.value?.code ?? '')
    copyState.value = 'copied'
  } catch {
    // Denied permission, or a page served over plain http. Saying so beats a
    // button that looks like it worked and did nothing.
    copyState.value = 'failed'
  }
  setTimeout(() => (copyState.value = 'idle'), 2000)
}
</script>

<template>
  <div class="wk-tabs">
    <div class="wk-tabs-header" role="tablist" aria-label="Install command language" @keydown="onKeydown">
      <button
        v-for="(tab, i) in tabs"
        :key="tab.label"
        :ref="(el) => registerTab(el as Element | null, i)"
        class="wk-tabs-tab"
        :class="{ active: active === i }"
        role="tab"
        :id="tabId(i)"
        :aria-controls="panelId"
        :aria-selected="active === i"
        :tabindex="active === i ? 0 : -1"
        type="button"
        @click="select(i)"
      >{{ tab.label }}</button>
    </div>
    <div
      class="wk-tabs-panel"
      role="tabpanel"
      :id="panelId"
      :aria-labelledby="tabId(active)"
      tabindex="0"
    >
      <button class="wk-tabs-copy" type="button" @click="copy">{{ copyLabel }}</button>
      <!-- The button's own label changes, but a screen reader only announces it
           if the change is in a live region. -->
      <span class="wk-visually-hidden" role="status" aria-live="polite">
        {{ copyState === 'idle' ? '' : copyLabel }}
      </span>
      <pre :class="`language-${current?.lang ?? 'bash'}`"><code>{{ current?.code ?? '' }}</code></pre>
    </div>
  </div>
</template>
