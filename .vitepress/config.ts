import { defineConfig } from 'vitepress'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// JSON-LD structured data (Organization + SoftwareApplication) so search
// engines and LLM crawlers can resolve the project's entity, ownership, and
// where it is published. Emitted once in the document <head> below.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://wickra.org/#organization',
      name: 'Wickra',
      url: 'https://wickra.org/',
      logo: 'https://wickra.org/wickra-mark.svg',
      sameAs: [
        'https://github.com/wickra-lib/wickra',
        'https://crates.io/crates/wickra',
        'https://pypi.org/project/wickra/',
        'https://www.npmjs.com/package/wickra',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://wickra.org/#software',
      name: 'Wickra',
      url: 'https://wickra.org/',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Windows, macOS, Linux, WebAssembly',
      programmingLanguage: ['Rust', 'Python', 'JavaScript', 'WebAssembly', 'C'],
      description:
        'Streaming-first technical indicators with a Rust core and Python, Node, WASM, and C ABI bindings. Same code for backtesting and live ticks.',
      license: 'https://polyformproject.org/licenses/noncommercial/1.0.0/',
      publisher: { '@id': 'https://wickra.org/#organization' },
    },
  ],
}

export default defineConfig({
  title: 'Wickra',
  description:
    'Streaming-first technical indicators with a Rust core and Python, Node, WASM, and C ABI bindings — 514 indicators, install-free. Same code for backtest and live tick.',
  lang: 'en-US',
  cleanUrls: true,

  // Served at the domain root (wickra.org via Cloudflare Pages), so the base is
  // '/'. Do NOT reintroduce a '/<repo>/' sub-path — that was only needed for the
  // old GitHub Pages preview.
  base: '/',

  // Sitemap is emitted into the build output by VitePress' built-in generator
  // (no extra dependency); CF Pages serves dist/sitemap.xml at the domain root.
  // robots.txt points discovery here.
  sitemap: { hostname: 'https://wickra.org' },

  // README.md is repo documentation, not a site page — keep it out of the build
  // so it never becomes a /README route or a stray sitemap entry.
  srcExclude: ['README.md'],

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#0ea5e9' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Wickra — streaming-first technical indicators' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          '514 indicators with a Rust core and Python / Node / WASM / C bindings. Same code for backtest and live tick. Install-free.',
      },
    ],
    ['meta', { property: 'og:image', content: 'https://wickra.org/og-banner.webp' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://wickra.org/og-banner.webp' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify(structuredData)],
  ],

  // VitePress emits neither a canonical link nor a per-page og:url on its own;
  // derive both from each page's path so every URL self-references its clean,
  // apex-domain canonical (consistent with `cleanUrls: true`).
  transformPageData(pageData) {
    const path = pageData.relativePath.replace(/(?:index)?\.md$/, '')
    const canonical = `https://wickra.org/${path}`
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: canonical }],
      ['meta', { property: 'og:url', content: canonical }],
    )
  },

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
          { text: 'C', link: 'https://docs.wickra.org/Quickstart-C' },
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
          { text: 'C', link: '/api/c' },
        ],
      },
      {
        text: 'Links',
        items: [
          { text: 'crates.io', link: 'https://crates.io/crates/wickra' },
          { text: 'PyPI', link: 'https://pypi.org/project/wickra/' },
          { text: 'npm', link: 'https://www.npmjs.com/package/wickra' },
        ],
      },
      {
        text: 'v0.7.3',
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
            { text: 'C', link: '/api/c' },
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
