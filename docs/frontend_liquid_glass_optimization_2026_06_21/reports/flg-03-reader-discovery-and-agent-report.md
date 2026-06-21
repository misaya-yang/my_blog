# FLG-03 Reader Discovery And Agent Report

**Date:** 2026-06-21

**Feature:** FLG-F004

**Status:** Passing

## Summary

FLG-03 applied the Liquid Glass material language to the article reader and Agent companion while keeping dense reading content opaque. The reader now has material semantics for mobile TOC, TOC rail, reading guide, Agent prompts, share actions, and related navigation. The Agent launcher/panel/source-card styles were refined in `agent-surfaces.css` without changing the agent API or server behavior.

Important correction during QA: a wide-screen attempt to restore the hidden left reader-map rail compressed the article column to 208px at 1728px. That was rejected and reverted. The final design keeps the main article column at 832px with a 208px TOC rail at 1728px, preserving readability.

## Files Changed

- `client/src/pages/PostDetail.tsx`: added material classes to mobile TOC, reading surface, entry layer, Agent prompts, share actions, related/previous/next cards, and TOC surface. Existing heading-anchor and table-label work in this file was preserved.
- `client/src/styles/visual-refresh.css`: added the final FLG-03 reader adoption layer at the end of the cascade, including high-contrast code/table rules, reader action panels, prompt visibility fixes, and reduced-transparency fallbacks.
- `client/src/styles/agent-surfaces.css`: refined Agent launcher, panel, trust boundary, message bubbles, and source-card styling with a more layered graphite/aqua material treatment.
- `docs/frontend_liquid_glass_optimization_2026_06_21/*`: updated FLG-03 evidence, oracle, progress, ledger, source packet, and handoff.

## Reader Notes

- `paper-reader-main` remains near-opaque; prose uses no backdrop blur.
- Code blocks and table wrappers keep `backdrop-filter: none`.
- Mobile TOC is visible and materialized.
- Article Agent prompts now show both prompt buttons on mobile instead of hiding the second prompt through older compact rules.
- Share actions and related navigation cards use `liquid-surface` but remain readable.

## Agent Notes

- Launcher remains a compact pill/orb depending on route-level constraints.
- Agent panel gets layered highlight/shadow treatment while preserving solid message and source-card interiors.
- Source cards use `backdrop-filter: none` and a high-contrast solid background.
- No prompt was sent to the backend during visual QA; source-card styling was verified with a browser-injected CSS fixture.

## Command Evidence

```bash
python3 /Users/yang/.codex/skills/prd-phase-harness/scripts/validate_harness_prd.py docs/frontend_liquid_glass_optimization_2026_06_21 --strict --quality-score
```

Result: passed. Quality score: 100 (excellent).

```bash
pnpm check
```

Result: passed.

```bash
pnpm test
```

Result: passed. Vitest reported 40 passed test files and 254 passed tests.

```bash
pnpm build
```

Result: passed. Vite and server bundle completed.

```bash
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui
```

Result: passed. Report path: `docs/product_optimization/reports/ui-layout-checks-latest.json`.

```bash
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick
```

Result: passed. Output reported 14 route checks, 0 skipped routes, 0 known gaps, and 0 command failures.

## Browser Evidence

Screenshots and metrics captured under `.cache/flg-03-qa/`.

Coverage:

- Article route: `/post/goal-harness-agent-phase-protocol`.
- Viewports: 390x844, 768x1024, 1440x1000, 1728x1117.
- States: article full page, code viewport, table viewport, Agent closed/open on `/`, Agent closed/open on the article route, and source-card fixture on the article route.
- Total captured states: 32.
- Automated failures: 0.

Measured checks:

- Maximum header height: 72px.
- Maximum horizontal overflow delta: 0px.
- Minimum article reading surface width: 358px.
- Code block backdrop values: `none`.
- Table wrapper backdrop values: `none`.
- Agent open states captured: 8.
- Source-card fixture states captured: 4.
- Reduced transparency removed reader and Agent panel blur.
- Reduced motion reduced sampled material transitions to `1e-05s`.

Detail screenshots:

- `.cache/flg-03-qa-preview/detail/mobile-top.png`
- `.cache/flg-03-qa-preview/detail/mobile-code.png`
- `.cache/flg-03-qa-preview/detail/mobile-table.png`
- `.cache/flg-03-qa-preview/detail/desktop-top.png`
- `.cache/flg-03-qa-preview/detail/desktop-agent-open.png`

## Acceptance Gates

- Reader rails and action surfaces use the material system: passed.
- Prose, code, formulas, tables, and source cards remain high contrast: passed.
- Agent launcher and panel feel layered while messages/source cards stay readable: passed.
- Reader and Agent screenshots exist: passed.
- Feature oracle FLG-F004 updated: passed.

## Handoff

FLG-04 can now focus on owner tools and editor density. Preserve the reader decision from this phase: do not restore the left reader-map rail unless a future layout gives the main article column at least 42rem.
