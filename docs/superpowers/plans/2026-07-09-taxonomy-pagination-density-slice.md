# Taxonomy Pagination Density Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-archive-taxonomy-density-filtering-design.md`
Status: Passed

## Goal

Make public tag and category pages explicitly bounded retrieval surfaces instead of a silent fixed-size list. Long taxonomy pages should expose pagination state in the URL, show the visible result range, and keep compact navigation without changing backend contracts.

## Scope

In:

- Add URL-backed `?page=` handling for tag and category pages.
- Use a fixed public taxonomy page size.
- Show result range, page count, and previous/next controls.
- Add helper tests for page parsing, href generation, and range calculation.
- Write a slice evidence report.

Out:

- No new backend route or DB query shape.
- No infinite scroll.
- No owner-only public filters.
- No article card redesign.
- No deploy.

## Expected Files

- `client/src/pages/TaxonomyPage.tsx`
- `client/src/pages/TaxonomyPage.test.ts`
- `client/src/i18n/home.ts`
- `docs/product_optimization/reports/taxonomy-pagination-density-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts client/src/pages/Archive.test.ts server/discovery.router.test.ts server/discovery.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- Taxonomy result pages use `?page=` for reader-meaningful pagination state.
- First page keeps the clean canonical URL without `?page=1`.
- Visible range text handles empty, partial, and full pages.
- Previous/next controls are disabled at boundaries.
- Query limit and offset are derived from the same helper-tested page model.
