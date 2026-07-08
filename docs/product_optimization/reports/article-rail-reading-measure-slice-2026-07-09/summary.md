# Article Rail Reading Measure Slice

Date: 2026-07-09
Branch: dev

## Scope

- Added `client/src/lib/articleLayout.ts` to encode the article reading contract: 66-78ch healthy measure, 74ch target prose, and `1360px` minimum viewport before the desktop TOC rail appears.
- Updated `client/src/pages/PostDetail.tsx` so the article cockpit exposes CSS custom properties and data attributes from the contract.
- Removed conflicting Tailwind breakpoint utilities from the inline TOC and right TOC rail, so `visual-refresh.css` owns the article rail behavior.
- Updated `client/src/styles/visual-refresh.css` so:
  - Below `1360px`, the right TOC rail is hidden and the inline collapsed TOC remains reachable.
  - At `1360px+`, the right TOC rail appears and the inline TOC is hidden.
  - Header, cover, handoff, share controls, and prose align to the article measure instead of stretching across the full shell.

## Evidence

- Browser probe JSON: `docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/article-layout-probes.json`
- UI audit JSON: `docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/ui-layout-checks.json`
- Viewport screenshots:
  - `tablet-light-1024.png`
  - `tablet-dark-1024.png`
  - `rail-light-1360.png`
  - `rail-dark-1360.png`
  - `desktop-light-1440.png`
  - `desktop-dark-1440.png`
  - `mobile-light-390.png`
  - `mobile-dark-390.png`

Probe results for `/post/goal-harness-agent-phase-protocol`:

| Case | Rail | Inline TOC | Overflow | Prose width |
| --- | --- | --- | --- | --- |
| 1024 light | none | block | false | 641px |
| 1024 dark | none | block | false | 641px |
| 1360 light | block | none | false | 663px |
| 1360 dark | block | none | false | 663px |
| 1440 light | block | none | false | 668px |
| 1440 dark | block | none | false | 668px |
| 390 light | none | block | false | 326px |
| 390 dark | none | block | false | 326px |

## CSS Debt

- `!important` count in `client/src/styles/visual-refresh.css`: 199 -> 199.
- New dependencies: none.
- New broad selectors: none outside `.paper-reader-*` article scope.
- Viewport font sizing: no new readable-text viewport font sizing.
- Hard-coded color debt: unchanged.

## Verification

- `corepack pnpm test -- client/src/pages/PostDetail.test.ts` passed after implementation. Vitest executed the current full suite: 63 files, 358 tests.
- `corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx client/src/components/SeriesProgress.test.tsx client/src/components/ArticleFeedback.test.tsx` passed. Vitest executed the current full suite: 63 files, 358 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/ui-layout-checks.json` passed.
- `git diff --check` passed.

## Residual Risk

- This slice does not solve all article-page density issues. The author footer and related/feedback/subscription area still have older glass/control styling and should be handled in a separate continuation slice.
- The CSS file still has high legacy `!important` debt; this slice kept the count flat instead of attempting a broad cleanup.
