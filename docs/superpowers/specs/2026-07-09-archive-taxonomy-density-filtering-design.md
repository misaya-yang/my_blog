# Archive And Taxonomy Density Filtering Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

Archive, tag, and category pages are not secondary decoration. They are retrieval surfaces for a technical research archive. They need enough density for scanning, enough filters to reduce clutter, and enough explanation for empty or long states.

This spec defines archive and taxonomy behavior without introducing a new search backend.

## Goals

- Make archive/taxonomy pages useful for scanning the corpus.
- Keep filters represented in URL when implemented.
- Avoid mobile crowding and badge overflow.
- Provide clear empty states and next routes.
- Preserve public-only boundaries.

## Non-Goals

- No external search engine.
- No infinite-scroll requirement.
- No public hidden/draft/admin filters.
- No visual redesign detached from existing research archive style.

## Current Files

- `client/src/pages/Archive.tsx`
- `client/src/pages/TaxonomyPage.tsx`
- `client/src/components/ArticleCard.tsx`
- `server/discovery.ts`
- `server/db.ts`
- `server/routers.ts`
- `client/src/i18n/common.ts`

## Archive Contract

Archive should support one of two explicit models:

1. Simple ledger:
   - Month/year grouping.
   - Track/category/tag labels.
   - Compact article summaries.
   - Search and track links as escape routes.

2. Filtered archive:
   - Year/month filter.
   - Track filter.
   - Optional tag/category filter.
   - URL query params for filter state.

Do not implement a half-filtered archive where controls appear but are not reflected in data or URL.

## Taxonomy Contract

Tag and category pages should:

- Show taxonomy identity.
- Show count and scope.
- Use pagination or a documented limit.
- Provide next route when empty.
- Keep article cards compact.

Long taxonomies should not load arbitrary large result sets without a limit.

## Density Rules

- Prefer rows or compact cards for archive lists.
- Archive defaults to ledger rows unless a future design intentionally chooses filtered cards.
- Search results default to result rows with excerpt, matched track/tag context, and recovery actions.
- Taxonomy pages use compact cards or rows when density is high; full `ArticleCard` treatment is reserved for small curated sets.
- Limit visible tag chips per article or provide a controlled wrap.
- Tag chips visible per item should have a cap, with `+N` or equivalent overflow behavior when needed.
- Titles and excerpts should use intentional clamp rules, not accidental clipping.
- Mobile targets must remain at least comfortably tappable for article links and filter controls.
- Avoid nested cards.
- Dates and series labels must remain readable on mobile.
- No horizontal page scroll from long titles or tags.

## Public Boundary

Archive and taxonomy APIs must return only public published content for unauthenticated users.

Owner-only filters may exist later, but they belong under owner routes, not public archive/taxonomy routes.

## Implementation Slices

1. Decide ledger or filtered archive for the next implementation pass.
2. Add URL-state helpers if filters are implemented.
3. Add pagination/limit copy for taxonomy pages.
4. Add density and overflow browser checks.
5. Add public-only tests for taxonomy and archive endpoints.

## Tests

Focused:

```bash
corepack pnpm test -- client/src/pages/Archive.test.ts client/src/pages/Track.test.ts server/discovery.router.test.ts server/discovery.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

## Acceptance Checklist

- Archive behavior is explicitly ledger or filtered.
- Filter state, if present, is represented in URL.
- Taxonomy long states have a limit or pagination.
- Empty states route readers to search, archive, or tracks.
- Public pages do not expose hidden/draft/admin content.
