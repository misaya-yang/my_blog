# Search Archive Retrieval Wave 1 Report

Date: 2026-07-09
Branch: `dev`
Plan: `docs/superpowers/plans/2026-07-09-search-archive-retrieval-wave-1.md`

## Shipped

- Search highlights now use `getHighlightedTextParts()` plus `.search-highlight`, so light/dark mode no longer depends on dark-only Tailwind colors.
- Empty `/search` now shows a compact start panel with nearby topics and reading paths while still listing latest public notes.
- Search result rows now use semantic classes for title, excerpt, metadata, and overflow-safe text wrapping.
- Zero-result recovery now keeps the explanation before actions on mobile and uses consistent "Reading paths" wording.
- Archive now has a summary strip for public note count, month span, search, and reading paths before the timeline.
- Archive summary and update-date logic are covered by pure helper tests.

## Files Changed

- `client/src/pages/Search.tsx`
- `client/src/pages/Search.test.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/pages/Archive.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/product_optimization/reports/ui-layout-checks-latest.json`

## Screenshot Evidence

- `docs/product_optimization/reports/search-archive-retrieval-wave-1-2026-07-09/search-start-desktop-light.png`
- `docs/product_optimization/reports/search-archive-retrieval-wave-1-2026-07-09/search-results-desktop-light.png`
- `docs/product_optimization/reports/search-archive-retrieval-wave-1-2026-07-09/search-zero-mobile-dark.png`
- `docs/product_optimization/reports/search-archive-retrieval-wave-1-2026-07-09/archive-desktop-light.png`
- `docs/product_optimization/reports/search-archive-retrieval-wave-1-2026-07-09/archive-mobile-dark.png`

## Browser Probe

- `/search`, 1440x900 light: start panels `1`, latest rows `8`, horizontal overflow `false`.
- `/search?q=Agent`, 1440x900 light: result rows `5`, highlights `5`, horizontal overflow `false`.
- `/search?q=zzzz-no-hit-ui-audit`, 390x844 dark: recovery label `Reading paths`, horizontal overflow `false`.
- `/archive`, 1440x900 light: summary strips `1`, archive rows `8`, horizontal overflow `false`.
- `/archive`, 390x844 dark: summary strips `1`, archive rows `8`, horizontal overflow `false`.

## Verification

- `corepack pnpm test -- client/src/pages/Search.test.tsx client/src/pages/Archive.test.ts client/src/pages/searchRecovery.test.ts server/discovery.router.test.ts client/src/i18n/copyVoice.test.ts`
  - Passed: 44 files, 272 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm content:audit`
  - Passed: 0 warnings, 0 failures.
- `corepack pnpm build`
  - Passed.
- `corepack pnpm audit:ui`
  - Passed. Latest report: `docs/product_optimization/reports/ui-layout-checks-latest.json`.
- `git diff --check`
  - Passed.

## Deferred

- Search ranking and tokenization remain server-owned and unchanged.
- No Agent retrieval or source-card behavior changed in this slice.
- Archive filtering by track/tag is still a future discovery slice, not part of this implementation.
