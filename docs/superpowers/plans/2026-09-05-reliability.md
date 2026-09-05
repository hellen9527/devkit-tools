# DevKit Reliability Implementation Plan

> Execute inline in the current task, using test-driven development and verification checkpoints. User has approved the assessment direction and requested resumable progress.

**Goal:** Correct the audited tool failures and make every existing page usable on mobile.
**Architecture:** Preserve the current frontend while establishing behavior tests; extract pure logic only where necessary. Follow with static page generation in a separate phase.
**Tech Stack:** HTML/CSS/JavaScript, Node built-in test runner, browser Web Workers.

## Task 1: Safety and regression baseline

- [ ] Initialize local Git baseline on devkit/reliability; no remote required yet.
- [ ] Add tests/load-app.cjs based on audit VM adapter. Record element event listeners so UI handlers can be invoked. Run real application code, not copied algorithms.
- [ ] Add tests/reliability.test.cjs and run `node --test tests/*.test.cjs`, confirming expected failures: exact JSON integer lexeme; HTML Unicode roundtrip; iat/nbf labels; Cron future time and OR date matching; curl empty argument; IPv4/prefix strictness; alpha preservation; timestamp Now with milliseconds.

## Task 2: Correct transformations

- [ ] JSON: retain original numeric tokens and strings; native parser only validates syntax; whitespace formatting operates over lexer tokens. Test nested objects/arrays, escape sequences, duplicate keys and 64-bit integers.
- [ ] HTML: correct hex prefix and Unicode iteration; decoding uses complete HTML entities through browser inert text parsing, with pure numeric helper coverage.
- [ ] Base64: reject invalid UTF-8 in text mode; clarify text-only scope. Hash: include empty input digests. UUID: fail clearly when secure randomness unavailable.
- [ ] JWT: exp only means expiry, nbf is activation, iat is issuance; invalid numeric claims fail cleanly and old results clear.
- [ ] Date/Cron/CIDR/Color: fix audited cases, invalid inputs and stale results. Preserve Cron wildcard provenance for OR semantics; bound search by days and use UTC option in later enhancement.
- [ ] curl: preserve empty args and quotes; distinguish interactive cmd from batch, reject unsupported shell interpolation/operators instead of pretending conversion is exact.
- [ ] Regex: pure bounded result matching in worker; reject invalid flags; Unicode empty match advances by code point; cancel/timeout old worker, no main-thread matching fallback.
- [ ] Run the full regression suite. Commit with updated progress and any remaining limitations.

## Task 3: Mobile and interaction

- [ ] Increase input sizes and contrast; allow grid children to shrink; mobile status/claim/CIDR layouts stack.
- [ ] Add accessible labels and navigation state/focus handling; clear stale output on invalid input.
- [ ] Browser checks at 390px and desktop: Regex, JSON, HTML, JWT, Cron, CIDR, Color, navigation and remaining tool overflow.
- [ ] Re-run relevant tests, update docs/PROGRESS.md, commit checkpoint.

## Next phase

Generate independent static HTML per tool with visible navigation and unique head metadata; build-only dist assets; preview noindex until real SITE_URL exists. Need a separate test-backed build task after phase 1 is stable.
