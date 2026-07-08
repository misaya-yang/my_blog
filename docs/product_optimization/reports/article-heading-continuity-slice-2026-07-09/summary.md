# Article Heading Continuity Slice

Date: 2026-07-09
Branch: dev
Spec source: `docs/superpowers/specs/2026-07-09-reading-continuity-route-state-design.md`

## Summary

Improved article heading navigation without changing routes or visual styling. Article hash links now scroll only when the target heading exists, malformed hashes no-op instead of throwing, and custom heading jumps respect `prefers-reduced-motion`.

## Changed Files

- `client/src/pages/PostDetail.tsx`
- `client/src/pages/PostDetail.test.ts`
- `docs/superpowers/plans/2026-07-09-article-heading-continuity-slice.md`
- `docs/product_optimization/reports/article-heading-continuity-slice-2026-07-09/*`

## User-Visible Behavior

- `/post/:slug#heading-id` still lands on the target heading when the anchor exists.
- Unknown or malformed hashes do not trigger a failed scroll path.
- TOC and hash-driven heading jumps use instant scrolling for readers who prefer reduced motion.

## Validation

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx
corepack pnpm check
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-heading-continuity-slice-2026-07-09/ui-layout-checks.json
git diff --check
```

Result: passed.

Note: the focused Vitest command currently runs the repo Vitest suite under this configuration; 73 files and 424 tests passed.

## Evidence

- `docs/product_optimization/reports/article-heading-continuity-slice-2026-07-09/ui-layout-checks.json`

The UI audit passed with 13 route/viewport checks.

## Risk Notes

- This slice does not implement cross-page scroll restoration; it only hardens article heading navigation.
- No CSS, API, DB, auth, Agent, search, or content changes were made.
