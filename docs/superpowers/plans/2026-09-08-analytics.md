# Analytics Implementation Plan

> Execute with subagent-driven-development for isolated website implementation while root configures Google/Baidu accounts; review before deployment.

**Goal:** Add consent-gated GA4 analytics with no collection of tool input/output.
**Architecture:** assets/analytics.js owns opt-in loader and predefined interaction events; scripts/build.cjs owns static configuration, bilingual consent UI and privacy wording; config/analytics.json stores public measurement ID. Existing tool logic remains unchanged.
**Tech Stack:** Vanilla JS, Node static builder and node:test, Google tag.

- [x] Inspect Google tag docs and source button/input identifiers. Use fixed event enums, not values/text.
- [x] Add failing tests in tests/analytics.test.cjs for absent/invalid IDs, nonproduction host, unknown/denied/granted choice, safe page_location and referrer, one initial pageview, fixed tool_action parameters, withdrawal and storage errors. Confirm failures before implementation.
- [x] Implement assets/analytics.js UMD runtime with injected test environment. Expose initialize(env,config); absent/invalid config returns without network. Load Google script only on explicit consent; disable sending on withdrawal and clean this property's cookies if possible without touching unrelated cookies. Failure never prevents tool use.
- [x] Add config/analytics.json initially {"measurementId":""}; root fills real ID after account setup. Build validates /^G-[A-Z0-9]+$/ when nonempty and emits only for configured production pages; preview/404 excluded. Add matching build tests first.
- [x] Add static bilingual consent panel and footer preference button with equal allow/reject buttons and mobile/focus accessibility. Do not add another settings page or frameworks. Update both privacy pages accurately based on whether analytics is configured.
- [x] Preserve raw tool outputs. Track only predetermined tool/action names using delegated UI events, no arbitrary labels, URLs or field values. Page URL strips query/hash, referrer origin only. Google account switches remain in the separate pending step below.
- [x] Run npm test, production build, spec review and code quality review; browser consent and mobile checks.
- [ ] Root completes Google account/data stream, fills real ID, validates GA4 Realtime, merges/pushes after all checks, records IDs and settings in docs/PROGRESS.md. Continue Baidu verification and GSC account linkage if available.

- [x] Fix language redirect double-count race; exercise real language and analytics initializers together. Final local tests: 48 passing. Independent review has no remaining high/medium findings.
- [ ] Accept final Google agreements only after the pending explicit country/terms confirmation. Create Web stream; disable enhanced measurement and Signals; confirm actual cookie names and live Realtime.

Checkpoint: code complete, real measurementId empty; no production GA4 collection yet. Saved development branch may be resumed without recreating the implementation.
