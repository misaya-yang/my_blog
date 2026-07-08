# Public Search And Taxonomy Density Slice

Date: 2026-07-09
Branch: dev
Specs:

- `docs/superpowers/specs/2026-07-09-search-relevance-alias-contract-design.md`
- `docs/superpowers/specs/2026-07-09-archive-taxonomy-density-filtering-design.md`
- `docs/superpowers/specs/2026-07-09-design-system-component-contract-design.md`
- `docs/superpowers/specs/2026-07-09-css-ownership-style-debt-budget-design.md`

## Summary

Improved public discovery density without changing APIs or data contracts. Search now uses a compact query-active hierarchy on desktop and keeps mobile recovery guidance readable. Taxonomy pages cap related tags to a concise set and show a remaining-count chip so article rows appear sooner on mobile.

## Changed Files

- `client/src/pages/Search.tsx`
- `client/src/pages/TaxonomyPage.tsx`
- `client/src/styles/visual-refresh.css`
- `docs/superpowers/plans/2026-07-09-public-search-taxonomy-density-slice.md`
- `docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/*`
- `docs/product_optimization/reports/css-ownership-latest.json`
- `docs/product_optimization/reports/performance-budget-latest.json`

## User-Visible Behavior

- `/search?q=...` desktop now collapses the title and supporting copy into a compact row, bringing the result count and no-match recovery higher in the viewport.
- `/search?q=...` mobile keeps the recovery explanation complete instead of clipping the sentence too early.
- `/tags/:slug` and `/categories/:slug` related tags show the first 10 tags plus `+N`, reducing visual crowding and improving first-screen access to article rows.

## Evidence

Screenshots:

Before:

- `docs/product_optimization/reports/wave1-public-ui-density-precheck-2026-07-09/search-zero-desktop.png`
- `docs/product_optimization/reports/wave1-public-ui-density-precheck-2026-07-09/search-zero-mobile.png`
- `docs/product_optimization/reports/wave1-public-ui-density-precheck-2026-07-09/taxonomy-desktop.png`
- `docs/product_optimization/reports/wave1-public-ui-density-precheck-2026-07-09/taxonomy-mobile.png`

After:

- `docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/search-zero-desktop-after.png`
- `docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/search-zero-mobile-after.png`
- `docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/taxonomy-desktop-after.png`
- `docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/taxonomy-mobile-after.png`

Audit:

- `docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/ui-layout-checks.json`

## Code Quality Notes

- No new dependency.
- No new `!important`.
- No viewport font-size increase; `audit:css` stayed at 70 viewport font-size rules.
- No route, tRPC, DB schema, SEO, auth, or Agent contract change.
- Related tag limiting reuses existing taxonomy helper functions and existing `discovery.moreTags` copy.

## Validation

```bash
corepack pnpm test -- client/src/pages/Search.test.tsx client/src/pages/TaxonomyPage.test.ts
corepack pnpm audit:css -- --no-output
corepack pnpm audit:css
corepack pnpm check
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/ui-layout-checks.json
corepack pnpm audit:performance
git diff --check
```

Result: passed.

Note: the focused Vitest command currently runs the repo Vitest suite under this configuration; 73 files and 421 tests passed.

## Known Risks

- This is a focused discovery-density pass, not the full public visual redesign.
- The taxonomy side panel still remains visible on mobile; it is now shorter, but a future slice may move it below articles or make it collapsible if review prefers article-first ordering.
