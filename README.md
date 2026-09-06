# DevKit

Live: [tools.fategenie.com](https://tools.fategenie.com)

14 free developer tools in English and Simplified Chinese, with browser-local input processing, independent static pages and no advertising or analytics scripts.

## Local development

Node.js 22 or later.

```sh
npm ci
npm test
npm run dev
```

Open http://127.0.0.1:8766. The development server serves only `dist`, including genuine 404 responses. The default build is a **noindex preview**.

```sh
SITE_URL=https://tools.fategenie.com npm run build
npm run preview
```

The domain above is the active production address and matches the Cloudflare custom domain. An unset `SITE_URL` produces a noindex build and an empty sitemap; invalid origins fail the build. Only deploy `dist` through `wrangler.jsonc`.

## Source layout

- `index.html`: source tool UI and application logic; not the deployment directory.
- `assets/regex-worker.js`: bounded regex matching in a Web Worker.
- `content/tools.json`: English per-tool instructions, examples and limitations.
- `content/zh-CN/`: Chinese metadata, UI strings, HTTP descriptions and tool guides.
- `assets/i18n.js`: translates explicit display strings without rewriting user data.
- `assets/language.js`: homepage language selection and remembered manual preference.
- `scripts/build.cjs`: generates shared hashed assets, 34 English/Chinese pages, a bilingual 404, robots and sitemap.
- `tests/`: Node regression tests for transformations and static output.
- `docs/PROGRESS.md`: resumable project checkpoint.

The build deliberately excludes documentation, tests, backups and Git data. Generated navigation, titles, descriptions, examples and canonical URLs do not depend on client-side routing. Inputs reset when navigating to another page.

## Cloudflare deployment

Connect this GitHub repository to Cloudflare Workers Builds. Set the Worker name to `devkit-tools`, the build command to `npm test && npm run build`, and the deploy command to `npx wrangler deploy`. Set build variable `SITE_URL` to the final HTTPS origin. The repository includes a locked Wrangler dependency.

Before launch, bind the chosen custom domain, check real 404 responses and inspect canonical URLs and the sitemap on the live site. See [部署与 Google 收录步骤](docs/DEPLOY.zh-CN.md).

## Scope

Five-field Cron uses the browser timezone and an eight-year search window. curl conversion handles supported literal arguments, not arbitrary shell scripts, and has not been executed on native Windows. JWT decoding does not verify signatures. Base64 is text-only. Each page states its supported behavior.

## Languages

English URLs remain `/json`, `/cron`, etc. Chinese equivalents live under `/zh`. Each version has its own canonical and reciprocal hreflang links. Only the root homepage automatically chooses a language from a saved preference or the primary browser language; shared tool URLs never redirect. Manual selection stores only `en` or `zh` under `devkit-language`. When storage is blocked, English remains reachable through `/?lang=en`.
