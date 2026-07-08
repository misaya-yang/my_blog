# Reading Continuity And Route State Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The reading product spans home, tracks, search, archive, taxonomy pages, article pages, and the Agent. Readers should be able to enter an article from a list, follow a heading link, ask a question, and return without losing their place or context.

This spec defines route-state and reading-continuity behavior. It does not introduce user accounts or cross-device reading sync.

## Goals

- Preserve useful list state when moving from discovery pages to articles and back.
- Keep deep links to article headings stable after lazy rendering.
- Make completion links deterministic and non-repetitive.
- Keep Agent context aligned with the current article or track.
- Avoid scroll jumps that make dense reading frustrating.

## Non-Goals

- No cross-device reading history.
- No authenticated bookmark system.
- No browser extension.
- No analytics-driven personalization.

## Current Files

- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/Search.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/pages/TaxonomyPage.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/components/SeriesProgress.tsx`
- `client/src/components/agent/routeContext.ts`

## Entry And Return Contract

Discovery routes should keep their state in URL or restorable browser state:

- Search query and filters.
- Archive year/month/filter if implemented.
- Taxonomy slug and pagination.
- Track tab or section when implemented.
- Scroll position when browser back is used.

Rules:

- Prefer URL state for user-meaningful filters.
- Use browser history state only for ephemeral scroll restoration.
- Do not store private Agent context in route state.
- Do not add query params that leak private feedback or subscription data.

## Article Deep Link Contract

Heading links should:

- Use stable slugs.
- Work after lazy Markdown render.
- Respect fixed headers and safe scroll margins.
- Preserve hash when language or theme changes.
- Not shift unexpectedly when images/code blocks load.

If a heading is missing, the page should not crash; it can fall back to article top.

## Completion Links

After the article, continuation links should prioritize:

1. Next item in the same series.
2. Current track reading path.
3. Related articles.
4. Search/archive fallback.

Rules:

- Do not duplicate the current article.
- Do not show hidden/draft/admin content.
- Keep labels short.
- Keep mobile layout compact.

## Agent Route Context

Agent route context should follow:

- Article slug on `/post/:slug`.
- Track scope on `/algorithms` or `/applications`.
- Public corpus scope on archive/search/taxonomy.
- Owner/debug scope on `/manage/agent` only when authenticated.

Switching routes should update scope without resetting private session context unexpectedly.

## Implementation Slices

1. Audit route state and scroll restoration behavior.
2. Add tests for heading anchors and completion link ordering.
3. Add list-to-article-to-back browser checks.
4. Add Agent route context tests where route behavior changes.
5. Document any unsupported restoration behavior explicitly.

## Tests

Focused:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/pages/Search.test.tsx client/src/pages/Archive.test.ts client/src/pages/Track.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Browser evidence:

- Search result to article and back.
- Track article to next reading path.
- Article heading deep link.
- Agent open while route changes.

## Acceptance Checklist

- Browser back from an article preserves useful discovery state.
- Article hash links land on the intended heading.
- Completion links are ordered and non-duplicative.
- Agent scope matches the current route.
- No private context leaks into URL state.
