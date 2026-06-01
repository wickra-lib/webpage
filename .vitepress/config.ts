import { defineConfig } from 'vitepress'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  title: 'Wickra',
  description:
    'Streaming-first technical indicators. Rust core with Python, Node, and WASM bindings. 227 indicators, install-free.',
  lang: 'en-US',
  cleanUrls: true,

  // Served at the domain root (wickra.org via Cloudflare Pages), so the base is
  // '/'. Do NOT reintroduce a '/<repo>/' sub-path — that was only needed for the
  // old GitHub Pages preview.
  base: '/',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    // Warm the TLS connections to the external badge hosts used in the footer
    // badge row so the status badges paint with the page instead of popping in.
    ['link', { rel: 'preconnect', href: 'https://img.shields.io' }],
    ['link', { rel: 'preconnect', href: 'https://github.com' }],
    ['link', { rel: 'preconnect', href: 'https://codecov.io' }],
    ['link', { rel: 'preconnect', href: 'https://api.securityscorecards.dev' }],
    ['meta', { name: 'theme-color', content: '#0ea5e9' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Wickra — streaming-first technical indicators' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          '227 indicators with a Rust core and Python / Node / WASM bindings. Same code for backtest and live tick. Install-free.',
      },
    ],
    ['meta', { property: 'og:image', content: 'https://wickra.org/og-banner.webp' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://wickra.org/og-banner.webp' }],
  ],

  themeConfig: {
    siteTitle: 'Wickra',
    logo: { src: '/wickra-mark.svg', alt: 'Wickra' },

    // Shared top-level nav, kept 1:1 with the docs site (docs.wickra.org).
    // On-site targets are relative (SPA navigation); targets that live on the
    // docs site are absolute. The docs site mirrors this list with the
    // resolution flipped.
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Demo', link: '/demo' },
      { text: 'Benchmarks', link: '/benchmarks' },
      { text: 'Overview', link: 'https://docs.wickra.org/overview' },
      {
        text: 'Quickstart',
        items: [
          { text: 'Rust', link: 'https://docs.wickra.org/Quickstart-Rust' },
          { text: 'Python', link: 'https://docs.wickra.org/Quickstart-Python' },
          { text: 'Node', link: 'https://docs.wickra.org/Quickstart-Node' },
          { text: 'WASM', link: 'https://docs.wickra.org/Quickstart-WASM' },
        ],
      },
      { text: 'Indicators', link: 'https://docs.wickra.org/Indicators-Overview' },
      {
        text: 'API',
        items: [
          { text: 'Rust', link: '/api/rust' },
          { text: 'Python', link: '/api/python' },
          { text: 'Node', link: '/api/node' },
          { text: 'WASM', link: '/api/wasm' },
        ],
      },
      {
        text: 'Links',
        items: [
          { text: 'Changelog', link: 'https://github.com/wickra-lib/wickra/blob/main/CHANGELOG.md' },
          { text: 'crates.io', link: 'https://crates.io/crates/wickra' },
          { text: 'PyPI', link: 'https://pypi.org/project/wickra/' },
          { text: 'npm', link: 'https://www.npmjs.com/package/wickra' },
        ],
      },
      {
        text: 'v0.4.2',
        items: [
          { text: 'Release notes', link: 'https://github.com/wickra-lib/wickra/releases' },
          { text: 'Changelog', link: 'https://github.com/wickra-lib/wickra/blob/main/CHANGELOG.md' },
          { text: 'Docs', link: 'https://docs.wickra.org/' },
          { text: 'docs.rs', link: 'https://docs.rs/wickra' },
        ],
      },
    ],

    sidebar: {
      '/api/': [
        {
          text: 'Bindings',
          items: [
            { text: 'Rust', link: '/api/rust' },
            { text: 'Python', link: '/api/python' },
            { text: 'Node', link: '/api/node' },
            { text: 'WASM', link: '/api/wasm' },
          ],
        },
        {
          text: 'More',
          items: [
            { text: 'Live demo', link: '/demo' },
            { text: 'Benchmarks', link: '/benchmarks' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wickra-lib/wickra' },
    ],

    // The footer is rendered by a custom component (theme/SiteFooter.vue via
    // the layout-bottom slot) so it can carry the badge row + the per-page
    // "Updated" date, which a static themeConfig.footer string cannot.

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },

    lastUpdated: {
      text: 'Updated',
      formatOptions: { dateStyle: 'medium' },
    },
  },

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: false,
  },

  vite: {
    // wickra-wasm is a wasm-pack `--target bundler` build: its JS glue does
    // `import * as wasm from './wickra_wasm_bg.wasm'` and expects the bundler
    // to instantiate the module and expose its exports. vite-plugin-wasm does
    // exactly that (the previous `assetsInclude: ['**/*.wasm']` made Vite hand
    // back the asset URL instead, so `wasm.__wbindgen_*` was undefined and the
    // demo failed with "__wbindgen_add_to_stack_pointer is not a function").
    // vite-plugin-top-level-await is required because the wasm init the plugin
    // emits uses top-level await.
    plugins: [wasm(), topLevelAwait()],
    optimizeDeps: {
      // esbuild's dep pre-bundling can't follow the .wasm ESM import, so keep
      // wickra-wasm out of it and let vite-plugin-wasm handle it on demand.
      exclude: ['wickra-wasm'],
    },
    server: {
      fs: {
        // Allow VitePress to serve files from the workspace root if needed.
        allow: ['..'],
      },
    },
  },
})
