# MNP-05 Code Simplification And CSS Architecture Phase Report

**Phase:** MNP-05 Code Simplification And CSS Architecture

**Status:** passed

**Date:** 2026-06-20

---

## Summary

Completed a scoped simplification slice across the Agent source-card path and public CSS architecture. The change extracts source-card anchor/excerpt helpers from the large Agent component, shares semantic source-card anchor generation between client and server, consolidates the final public light/dark theme token source, and removes a duplicate global reduced-motion override.

## Plan Followed

Plan: `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-05-code-simplification-and-css-architecture-plan.md`

The implementation stayed inside the planned low-risk slice: Agent pure helper extraction plus CSS token/reduced-motion consolidation. Post detail and deeper CSS `!important` cleanup were left for a later slice because they would widen the blast radius.

## Files Changed

- `client/src/components/agent/sourceCardLinks.ts`: new pure helper module for source-card hrefs, semantic anchors, legacy fallback anchors, and compact excerpts.
- `client/src/components/agent/BlogAgentRoot.tsx`: imports the helper module and preserves existing named exports for compatibility.
- `shared/heading-anchors.ts`: adds `createSourceCardSemanticAnchorId` so client and server share semantic source-card anchor generation.
- `server/ai/model.ts`: uses the shared semantic anchor helper without persisting legacy `heading-N` fallbacks.
- `client/src/styles/owner-tools.css`: makes final public theme tokens land on `:root, .space-page` and `.dark, .dark .space-page` to override earlier legacy layers without duplicating whole blocks.
- `client/src/styles/visual-refresh.css`: removes duplicate global reduced-motion rules already owned by `client/src/index.css`.
- Tests updated in `client/src/components/agent/sourceCards.test.ts`, `server/ai/model.test.ts`, and `shared/heading-anchors.test.ts`.

## Validation Evidence

| Gate | Command or Check | Result | Notes |
| --- | --- | --- | --- |
| Focused Agent/anchor regression | `pnpm exec vitest run client/src/components/agent/sourceCards.test.ts client/src/components/agent/BlogAgentRoot.test.ts shared/heading-anchors.test.ts server/ai/model.test.ts` | passed | 4 files, 42 tests. Covers explicit `anchorId`, `sectionTitle` priority, blank anchor fallback, client legacy `heading-N`, server semantic-only anchors, and Agent route behavior. |
| Required validation | `pnpm check && pnpm test && pnpm build` | passed | 39 test files and 243 tests passed; production build completed. |
| UI layout regression | `pnpm audit:ui` after starting `PORT=3000 pnpm start` | passed | Report written to `docs/product_optimization/reports/ui-layout-checks-latest.json`. First attempt failed only because no local server was running. |
| Runtime theme-token smoke | Playwright against `http://localhost:3000/` | passed | Evidence saved at `reports/mnp-05-runtime/theme-token-smoke.json`; mobile light/dark tokens match canonical values and no horizontal overflow was observed. |
| Compliance | Secrets/data mutation check | passed | No secrets were read or printed; no production data mutation or schema change was performed. |
| Acceptance | Harness writeback | passed | Feature oracle, source packet, continuity ledger, progress log, loop state, and handoff were updated for MNP-05. |

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNP-F006 | failing | passing | This report, `reports/mnp-05-runtime/theme-token-smoke.json`, `docs/product_optimization/reports/ui-layout-checks-latest.json`, focused Vitest, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit:ui`. |

## Progress Log Update

Appended a 2026-06-20 MNP-05 entry recording the Agent helper extraction, shared source-card semantic anchor helper, CSS token consolidation, reduced-motion cleanup, full validation, UI audit, and runtime token smoke. The next step is MNP-06 commit, push, deploy, and production smoke.

## Screenshots, Logs, or Eval Tables

- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-05-runtime/theme-token-smoke.json`
- `docs/product_optimization/reports/ui-layout-checks-latest.json`

## Blockers and Deviations

- `pnpm audit:ui` initially failed with `ERR_CONNECTION_REFUSED` because the expected local server was not running; after starting the production build on port 3000, the audit passed.
- Deeper `PostDetail.tsx` helper extraction and launcher `!important` cleanup were intentionally deferred because they are separate risk slices.

## Handoff Notes

MNP-05 is complete for this scoped simplification slice and unlocks MNP-06 release. Preserve these boundaries in later work:

- Client source cards may keep legacy `heading-N` fallback for old/no-heading cards.
- Server source cards should only persist semantic anchors from section or heading text.
- `owner-tools.css` remains the final public theme-token authority because it imports after `visual-refresh.css`.
