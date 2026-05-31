import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Wickra',
  description:
    'Streaming-first technical indicators. Rust core with Python, Node, and WASM bindings. 214 indicators, install-free.',
  lang: 'en-US',
  cleanUrls: true,

  // Served at the domain root (wickra.org via Cloudflare Pages), so the base is
  // '/'. Do NOT reintroduce a '/<repo>/' sub-path — that was only needed for the
  // old GitHub Pages preview.
  base: '/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0ea5e9' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Wickra — streaming-first technical indicators' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          '214 indicators with a Rust core and Python / Node / WASM bindings. Same code for backtest and live tick. Install-free.',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    siteTitle: 'Wickra',
    logo: { src: '/logo.svg', alt: 'Wickra' },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Demo', link: '/demo' },
      { text: 'Benchmarks', link: '/benchmarks' },
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
        text: 'v0.3.1',
        items: [
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

    footer: {
      message:
        'Released under the PolyForm Noncommercial License 1.0.0. Wickra is an indicator toolkit, not a trading system — production use is at your own risk.',
      copyright: 'Copyright © 2026 kingchenc',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },

    editLink: {
      pattern: 'https://github.com/wickra-lib/webpage/edit/main/:path',
      text: 'Edit this page on GitHub',
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
    // wickra-wasm ships a .wasm next to its JS loader — Vite needs to know
    // not to try to parse it as JS.
    assetsInclude: ['**/*.wasm'],
    optimizeDeps: {
      // Pre-bundle these so dev-server boots fast and the WASM loader runs
      // through the same import path as the build.
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
