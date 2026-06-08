import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

import Layout from './Layout.vue'
import WasmDemo from '../components/WasmDemo.vue'
import BenchmarkBar from '../components/BenchmarkBar.vue'
import InstallTabs from '../components/InstallTabs.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('WasmDemo', WasmDemo)
    app.component('BenchmarkBar', BenchmarkBar)
    app.component('InstallTabs', InstallTabs)
  },
} satisfies Theme
