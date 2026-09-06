# Bilingual implementation plan

User selected browser language, manual override and stable tool URLs. Execute in devkit/bilingual; do not publish a partial translation.

Checkpoint 2026-09-06: steps1–6 complete, 38 tests pass. Step7 deployment complete: f427059 merged to main, public34-page and6-asset verification passed. Remaining search-platform actions require user unlock/login: Google latest processing status not reread; Baidu not logged in/verified/submitted. See docs/PROGRESS.md; do not restart implementation.

1. Add tests/language.test.cjs for preferredLanguage({saved,languages}) and equivalentPath(path,language), then assets/language.js as a pure reusable module. Explicit saved en/zh wins; otherwise first nonempty browser language selects zh only for zh or zh-*; English fallback. Preserve the corresponding tool path and canonical slash policy.
2. Add content/zh-CN tool names, descriptions, instructions, examples, limitations and UI strings. Extract English dynamic labels/errors into shared translation keys rather than replacing user output. Keep actual data (JSON tokens, codes, identifiers) unchanged.
3. Extend tests/build.test.cjs before scripts/build.cjs: 34 public pages, zh-Hans lang and unique Chinese metadata, reciprocal en/zh-Hans/x-default hreflang, self canonical, same-tool language links, Chinese internal navigation. Preview remains noindex and unknown routes404.
4. Generate both language trees with shared tool logic and locale dictionaries. Add a small language preference controller: manual links remain valid without JS; storage errors tolerated; explicit user language wins; automatic browser selection only on initial root homepage. Preserve direct tool URLs. Validate English choice remains reachable even when storage is blocked (explicit validated lang query override on homepage link).
5. Update both privacy pages to state that language preference is stored, while tool inputs remain unstored. Update sitemap to34 entries.
6. Run all existing transformation tests plus locale/build tests. Browser test both languages, storage failure, switching on a tool and narrow viewport. Verify all dynamic errors and labels; inspect input/output for accidental translation.
7. Merge only after the full bilingual build is usable, push, verify Cloudflare deployment and34-page sitemap. Recheck Google discovery; inspect Baidu resource platform login and eligible submission methods. External promotion drafts require explicit posting instruction before publication.
