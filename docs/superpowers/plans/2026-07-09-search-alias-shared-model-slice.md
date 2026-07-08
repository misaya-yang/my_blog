# Search Alias Shared Model Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-search-relevance-alias-contract-design.md`
Status: Passed

## Goal

Implement the first approved Wave 1 code slice by making search concept aliases a shared model used by both server discovery search and client search recovery.

## Scope

In:

- Add a shared alias/recovery topic module.
- Replace server-local discovery alias map with shared helpers.
- Replace client-local recovery topic aliases with shared topic config.
- Improve search highlight helpers so alias matches in excerpts can be highlighted.
- Add focused tests for shared aliases, server discovery, client recovery, and highlight behavior.
- Write a slice evidence report.

Out:

- No database change.
- No external search service.
- No vector search.
- No route redesign.
- No visual CSS pass except what tests require.
- No deploy.

## Expected Files

- `shared/search-aliases.ts`
- `shared/search-aliases.test.ts`
- `server/discovery.ts`
- `server/discovery.test.ts`
- `client/src/pages/searchRecovery.ts`
- `client/src/pages/searchRecovery.test.ts`
- `client/src/pages/Search.tsx`
- `client/src/pages/Search.test.tsx`
- `docs/product_optimization/reports/search-alias-shared-model-slice-2026-07-09/summary.md`

## Implementation Steps

1. Create the shared alias model with normalized aliases, expansion helpers, recovery topics, and highlight needles.
2. Update `server/discovery.ts` to build `SearchPlan` from the shared helpers while preserving public-only filtering.
3. Update `client/src/pages/searchRecovery.ts` to derive topics from the shared recovery config.
4. Update `Search.tsx` highlight helpers to support multiple alias needles without overlapping marks.
5. Add tests for Chinese/English alias parity, alias recovery ordering, and highlight alias behavior.
6. Run focused tests and static gates.
7. Write the evidence report and commit the slice.

## Validation

Focused:

```bash
corepack pnpm test -- shared/search-aliases.test.ts server/discovery.test.ts client/src/pages/searchRecovery.test.ts client/src/pages/Search.test.tsx
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- Server search and client recovery import alias data from `shared/search-aliases.ts`.
- Search aliases support mixed Chinese/English technical queries.
- Search highlights can mark alias-expanded excerpt matches.
- Hidden/draft/admin content remains excluded by existing discovery filtering.
- No new dependency is introduced.
