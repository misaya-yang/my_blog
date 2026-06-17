# WPU-04 Content Atlas And Article Quality Plan

**Date:** 2026-06-16

## Objective

Unify public content metadata across seed, fallback, series/track catalog, discovery search, RSS/sitemap, content audit, and Agent freshness checks while preserving hidden/draft/admin boundaries.

## Scope

- Reconcile fallback public posts with the shared series catalog.
- Improve public search beyond exact substring matching through lightweight alias/token matching.
- Add RSS updated-date evidence.
- Clarify content audit title strategy so shell-provided titles are not confused with missing-title defects.
- Keep search miss privacy redaction from WPU-03.
- Avoid database migrations, production mutations, public UI redesign, and Agent prompt changes.

## Execution Steps

1. Inspect seed, fallback, series, discovery, SEO/feed, content audit, freshness, and tests.
2. Add fallback series metadata derived from `shared/content-series.ts`.
3. Improve `searchDiscoveryPosts` with alias-aware matching and match excerpts.
4. Add RSS channel/item updated evidence and tests.
5. Add content-audit title strategy warnings/failures with tests.
6. Run focused content/discovery/SEO/freshness tests.
7. Run `pnpm content:audit`, `pnpm content:verify`, `pnpm check`, and local route checks.
8. Record evidence and WPU-05 handoff in harness files.

## Acceptance Criteria

- Public fallback posts carry primary series slug/title/order.
- Search handles mixed Chinese/English aliases without exposing hidden/draft posts.
- RSS includes updated-date evidence while excluding non-public posts.
- Content audit distinguishes shell-provided titles from true missing-H1 defects.
- README/release workflow already names `content:publish`; no redundant doc rewrite unless a gap appears.
- WPU-F005 passes with test, audit, freshness, and route evidence.
