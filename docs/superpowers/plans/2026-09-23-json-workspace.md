# JSON workspace plan

User wants maximum useful screen area: single editable text/tree surface, compact actions, collapsed desktop tool rail that expands on hover, accessible mobile navigation. Ordinary implementation/deployment is already authorized.

- [x] Replace two JSON cards with one flex workspace filling the viewport below a compact app header/toolbar. Keep accessible H1 without duplicate visible headings/description. Preserve footer links in a small row. Text view is the actual editor, tree view shows the same current document. No second output pane, tutorial or sample area.
- [x] Update state and regressions: format→tree (root expanded), minify→text, validate current text without changing it, tree/text roundtrip preserves edits and literal data, copy uses current document, clear, one-step undo of format/minify, Ctrl/Cmd+Enter formats. Invalid input remains editable with an error; do not silently discard pasted data.
- [x] Desktop sidebar uses a 56px icon rail and 268px overlay expansion on pointer enter or keyboard focus; collapse on leave/focus exit, support menu toggle/Escape. Mobile remains a button-controlled drawer. Opening navigation never shifts or overwrites editor content.
- [x] English/Chinese labels, responsive toolbar and single internally scrolling work surface; large-tree lazy rendering remains unchanged. Verify wide desktop, laptop, portrait mobile, landscape; meaningful browser screenshots and no horizontal scroll.
- [x] Run unit/build/browser checks, independent review, then publish through existing Git→Cloudflare deployment. Confirm production artifacts and save checkpoint.

Published feature commit: `60bffbe`. Production verification: `docs/json-workspace-live-checks.json` (34 pages, 7 exact assets, sitemap/robots and real 404).
