# Wickra — marketing site

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

## Deploy

Static build via Cloudflare Pages:

- **Build command:** `npm run build`
- **Output directory:** `.vitepress/dist`
- **Node version:** 20

Custom domain `wickra.org` is configured in the Cloudflare Pages dashboard.

## License

Dual-licensed under [MIT](https://github.com/wickra-lib/wickra/blob/main/LICENSE-MIT) or [Apache-2.0](https://github.com/wickra-lib/wickra/blob/main/LICENSE-APACHE), at your option.
