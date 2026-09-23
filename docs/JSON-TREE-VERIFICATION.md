# JSON tree inspection — 2026-09-23

## Change

Format now opens a root-level tree. Nested objects/arrays remain collapsed and render only when expanded; closing a branch releases its descendants. Each branch shows up to 100 children per batch. Long scalar values have an expandable preview. Input and output have viewport-bounded scroll areas; full Text view and First level only controls are available in English and Chinese.

Copy full JSON uses the complete formatted/minified string, independent of visible tree nodes. Original numeric tokens, duplicate keys, property order and string escapes remain intact. Literal repeated spaces also remain visually intact. Editing input or submitting invalid input clears obsolete results and disables copying.

## Verification

- `npm test`: 53 passing tests, including parser/rendering, exact-copy integration and static bilingual builds.
- `SITE_URL=https://tools.fategenie.com npm run build`: 34 pages, JSON module loaded before app on JSON pages only.
- `tests/json-browser.cjs`: isolated Chromium; every website request intercepted to serve local build artifacts, no external requests. Desktop English 1280×900 and Chinese mobile viewport 390×844 tested with 20,000 objects (1,737,874 UTF-8 bytes). This is viewport emulation on desktop hardware, not a physical-phone performance claim.
- Browser checks: root-only initial expansion, lazy children, next-100 loading, reset, complete clipboard contents including huge integers/duplicates, text switching, input edits/invalid syntax, keyboard expansion, hostile HTML strings, long values, minify and significant spaces. No JavaScript errors or horizontal page overflow.
- Results: `json-tree-browser-checks.json`; screenshots: `json-tree-en.png` and `json-tree-zh.png`.
- Independent code review found a visual whitespace-collapse issue; reproduced via browser text-width measurement, fixed with pre-wrap on literal spans, and regression passed. No remaining review findings.

To repeat the optional browser check: install/provide Playwright, build the site, run `node tests/json-browser.cjs`. If Playwright is outside local node_modules, set PLAYWRIGHT_MODULE to its module path; optionally set CHROME_EXECUTABLE to the browser binary. The regular npm test suite does not require a browser dependency.

## Scope

Based on production commit 72cc1d8. Pending analytics work remains on devkit/analytics; it is not included in this release. A successful build or push alone is not live evidence; the production comparison will be recorded separately after deployment.
