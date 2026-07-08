# Taxonomy Density Compact List Slice

Date: 2026-07-09
Status: Passed

## Summary

Replaced taxonomy full article cards with compact scan-friendly rows. The change makes tag/category pages closer to the archive ledger density while preserving article links, category links, tag links, pagination, and public-only data flow.

## Changed Files

- `client/src/pages/TaxonomyPage.tsx`
- `client/src/pages/TaxonomyPage.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/superpowers/plans/2026-07-09-taxonomy-density-compact-list-slice.md`

## User-Visible Behavior

- Taxonomy pages show compact article rows instead of full visual cards.
- Visible tags are capped at three and overflow appears as `+N`.
- Titles and excerpts clamp intentionally and wrap safely.
- Row action remains a clear article link.

## Code Quality Notes

- `ArticleCard` remains unchanged for home and track surfaces.
- Pure helpers cover tag capping and excerpt fallback.
- No new dependency, route, API, or DB contract change.
- No new `!important` or viewport-unit font sizing was added.

## Browser Evidence

- `tag-agent-systems-desktop-light.png`
- `category-applications-mobile-dark.png`
- `taxonomy-browser-probes.json`
- `ui-layout-checks.json`

Probe results:

- `/tags/agent-systems`, 1440x900 light: `rowCount=4`, `articleCardCount=0`, `noHorizontalOverflow=true`.
- `/categories/ai-applications`, 390x844 dark: `rowCount=4`, `articleCardCount=0`, `noHorizontalOverflow=true`.

## Verification

```bash
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts client/src/pages/Archive.test.ts client/src/pages/Search.test.tsx
corepack pnpm check
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/taxonomy-density-compact-list-slice-2026-07-09/ui-layout-checks.json
git diff --check
```

All passed.

## Known Risk

The route-level visual improvement is limited to taxonomy result lists. The related-tags rail and mobile taxonomy header density remain candidates for a separate public shell density slice.
