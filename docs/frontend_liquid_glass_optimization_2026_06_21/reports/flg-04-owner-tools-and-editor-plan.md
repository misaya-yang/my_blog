# FLG-04 Owner Tools And Editor Plan

**Date:** 2026-06-21

**Feature:** FLG-F005

## Scope

Optimize `/manage`, `/manage/agent`, and `/write` only. Preserve routes, auth, API, schema, analytics, SEO, content, and editor data contracts.

## Inspected Facts

- `client/src/main.tsx` imports `owner-tools.css` before `liquid-materials.css`, so owner rules need explicit owner-scoped selectors when they must beat generic material utilities.
- `/manage` uses `owner-dark-scope`, `owner-ops-page`, `owner-command-strip`, `owner-dashboard-kpis`, `owner-ops-ledger`, `owner-table-wrap`, `owner-panel`, taxonomy panels, backlog, radar, feedback, and subscribers sections.
- `/manage/agent` uses `owner-dark-scope`, `agent-console-tabs`, `research-surface`, dense tab content, metric tiles, diagnostic panels, source cards, traces, and idea status controls.
- `/write` uses `owner-editor-shell`, two `owner-toolbar` rows, a snippet rail, source textarea, preview pane, settings sheet, and dialogs.
- Current browser session is not admin-authenticated. Playwright visual QA will use a local, read-only tRPC fixture to enter owner UI states; this does not read secrets or mutate backend data.
- `owner-tools.css` already contains historical public-page selectors. FLG-04 will not broaden those selectors; new rules are scoped to `.owner-dark-scope`, `.owner-ops-page`, `.agent-console-tabs`, and `.owner-editor-shell`.

## Implementation Plan

1. Add minimal semantic class adoption in owner TSX where useful:
   - Promote owner command/tables/panels to dense material surfaces without changing component props.
   - Mark editor source/preview regions as high-contrast writing surfaces.
   - Keep owner auth/loading states under the existing `owner-dark-scope`.
2. Append one compact FLG-04 layer to `owner-tools.css`:
   - Define owner-only material tokens for graphite, frost, aqua, and mint.
   - Style dense panels, KPI tiles, forms, tables, tab lists, trace/source cards, taxonomy chips, and buttons.
   - Keep textarea, tables, code snippets, and editor preview mostly opaque.
   - Add reduced-transparency and reduced-motion fallbacks.
   - Keep all selectors owner-scoped.
3. Run browser QA:
   - Capture `/manage`, `/manage/agent`, `/write`, and public `/` at 390x844, 768x1024, 1440x1000, 1728x1117.
   - Use fixture data for owner routes and no fixture for public `/`.
   - Check overflow, header height, owner surface counts, editor toolbar/canvas focus, reduced transparency, and public bleed.
4. Run validation:
   - `pnpm check`
   - `pnpm test`
   - `pnpm build`
   - Harness strict validator

## Acceptance Notes

- Owner pages should feel operational, not decorative: compact rows, clear tables, stable controls, readable empty/error states.
- Editor glass is limited to shell/toolbars; writing and preview surfaces remain solid enough for long sessions.
- Any auth limitation in local screenshots is documented; fixture screenshots are labeled as visual fixtures.
