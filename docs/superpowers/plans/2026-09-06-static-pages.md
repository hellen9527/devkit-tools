# Static tool pages implementation plan

> Execute inline in the current task under the user's existing approval, with test and Git checkpoints. Follow executing-plans and verification-before-completion.

**Goal:** Ship a small, crawlable static site for all 14 tools, preserving tested local processing.
**Architecture:** Keep index.html as the tool markup/logic source for now. A Node build extracts shared assets and emits only the selected tool per HTML page. Build metadata, navigation and explanatory content are present before JavaScript runs. Deployment includes dist only.
**Tech Stack:** Node built-ins, HTML/CSS/JavaScript, Cloudflare Workers Static Assets.

## 1. Build contract

- [x] Create tests/build.test.cjs: temporary output via buildSite({outDir,siteUrl}); assert 14 tool pages, single matching view and h1, unique absolute canonical/title/description, examples, static nav, no docs/tests/backup, sitemap entries, real 404 artifact, preview noindex. Reject non-HTTPS or non-origin SITE_URL.
- [x] Run node --test tests/build.test.cjs; verify missing builder failure.
- [x] Add scripts/build.cjs exporting buildSite and CLI using SITE_URL. Extract CSS/JS and metadata from trusted local source, write hashed shared assets, output /tool/index.html and 404.html, robots and sitemap. Remove old runtime head metadata from generated pages, include static JSON-LD and noscript notice.
- [x] Add content/tools.json with unique steps/examples/limitations for every tool. Examples use harmless sample text only.
- [x] Make index.html event registration tolerate omitted tools. Generated static mode must leave navigation links and metadata alone; initialize only present tools. Preserve source-mode regression tests.
- [x] Run node --test tests/*.test.cjs and build preview/production outputs; inspect representative HTML.

## 2. Local serving and deploy configuration

- [x] Add scripts/serve.cjs: only serve dist; resolve /tool and /tool/ to generated pages with canonical redirect, unknown paths return status404 and 404.html. Do not expose filesystem traversal or repository files.
- [x] Add package.json scripts test/build/dev, wrangler.jsonc assets.directory dist, html_handling drop-trailing-slash, not_found_handling404-page. No binding to a domain before user target is settled.
- [x] README explains build, supported tool scope, Cloudflare Git connection and SITE_URL; docs/DEPLOY.zh-CN.md records exact dashboard settings and Search Console steps with primary documentation links. Remove obsolete catchall/placeholder root deployment files.

## 3. Verify and checkpoint

- [x] Browser visit generated direct URLs, use actual input for all14 tools, verify workers and error clearing. Recheck narrow viewport and navigation. Read-only DOM verifies unique head metadata and no console errors.
- [x] Verify HTTP responses for /json, /json/, missing route and source files; inspect dist file list and sitemap. Run tests and git diff --check.
- [x] Update docs/PROGRESS.md with evidence, unresolved domain/account actions, and commit. Continue Cloudflare setup within existing authorization; stop only at required account actions or low quota.
