# Public Search And Taxonomy Density Slice

Status: Completed
Spec sources:

- `docs/superpowers/specs/2026-07-09-search-relevance-alias-contract-design.md`
- `docs/superpowers/specs/2026-07-09-archive-taxonomy-density-filtering-design.md`
- `docs/superpowers/specs/2026-07-09-design-system-component-contract-design.md`

## Goal

Improve Wave 1 public discovery readability by reducing the zero-result search vertical gap and preventing taxonomy side tags from pushing article rows too far down on mobile.

## Scope

In:

- Compress Search page hierarchy when a query is active.
- Keep search result and recovery information readable without clipping key guidance.
- Limit taxonomy sibling tags to a compact set with an overflow count.
- Capture before/after screenshots for search zero-state and taxonomy.

Out:

- No API, route, DB, SEO, or Agent behavior changes.
- No broad visual system rewrite.
- No dependency addition.
- No deploy or push.

## Tasks

- [x] Add query-active Search classes and responsive CSS.
- [x] Add compact sibling-tag rendering on taxonomy pages.
- [x] Run focused Search/Taxonomy tests.
- [x] Capture after screenshots.
- [x] Run `corepack pnpm audit:ui`.
- [x] Run `corepack pnpm audit:css`.
- [x] Run `corepack pnpm audit:performance`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write slice report.
- [x] Commit with `feat: improve public discovery density`.

## Verification Commands

```bash
corepack pnpm test -- client/src/pages/Search.test.tsx client/src/pages/TaxonomyPage.test.ts
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/public-search-taxonomy-density-slice-2026-07-09/ui-layout-checks.json
corepack pnpm audit:css
corepack pnpm audit:performance
corepack pnpm check
corepack pnpm build
git diff --check
```
