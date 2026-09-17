<p align="center">
  <a href="https://wickra.org"><img src="https://raw.githubusercontent.com/wickra-lib/.github/main/profile/wickra-banner.webp?v=514-7" alt="Wickra — streaming-first technical indicators" width="100%"></a>
</p>

[![Indicators](https://img.shields.io/badge/indicators-514-3b82f6)](https://github.com/wickra-lib/wickra)
[![Live demo](https://img.shields.io/badge/live%20demo-live.wickra.org-3b82f6)](https://live.wickra.org)
[![Docs](https://raw.githubusercontent.com/wickra-lib/.github/main/profile/badges/wickra/docs.svg)](https://docs.wickra.org)
[![Verified across 10 languages](https://raw.githubusercontent.com/wickra-lib/.github/main/profile/badges/wickra/verified.svg)](https://docs.wickra.org/FAQ#do-all-the-language-bindings-compute-the-same-values)
[![License: MIT OR Apache-2.0](https://raw.githubusercontent.com/wickra-lib/.github/main/profile/badges/wickra/license.svg)](https://github.com/wickra-lib/wickra#license)
[![Built with VitePress](https://img.shields.io/badge/built%20with-VitePress-5c73e7?logo=vite&logoColor=white)](https://vitepress.dev)

---

Source for the Wickra landing site (**[wickra.org](https://wickra.org)**): hero,
live in-browser WASM indicator demo, benchmarks, and per-language API overviews.
Built with [VitePress](https://vitepress.dev).

The per-indicator reference documentation lives separately at
**[docs.wickra.org](https://docs.wickra.org)** (repo
[`wickra-lib/wickra-docs`](https://github.com/wickra-lib/wickra-docs)); the
library itself is [`wickra-lib/wickra`](https://github.com/wickra-lib/wickra).

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build (also fails on dead internal links)
npm run preview  # preview the production build
```

The live demo loads the published [`wickra-wasm`](https://www.npmjs.com/package/wickra-wasm)
bundle from npm, so it runs the real indicators in the browser.

## What is kept current by workflow

- **The indicator count and the released version** — the headline count, the
  version menu in the nav, the `Latest:` lines and Maven snippets on the API
  pages, and the demo's `wickra-wasm` bundle (package.json and the lockfile
  together) — are pulled hourly from [wickra](https://github.com/wickra-lib/wickra)
  by `sync-from-wickra.yml`: the count from the core's re-export block, the
  version from its latest release.
- **The status badges** in the footer are snapshots refreshed hourly by
  `refresh-badges.yml`; the SVGs in `public/badges/` are generated, not edited.

Everything else — the copy, the API pages, the benchmark figures (from the
core's `BENCHMARKS.md`), the ecosystem section — is edited here by hand.

## Deploy

Static build via Cloudflare Pages (Git integration, no deploy secret):

- **Build command:** `npm run build`
- **Output directory:** `.vitepress/dist`
- **Node version:** 22 (`.nvmrc`)

Custom domain `wickra.org` is configured in the Cloudflare Pages dashboard.

## License

Dual-licensed under [MIT](https://github.com/wickra-lib/wickra/blob/main/LICENSE-MIT) or [Apache-2.0](https://github.com/wickra-lib/wickra/blob/main/LICENSE-APACHE), at your option.
