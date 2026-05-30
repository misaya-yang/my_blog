# Phase 07 Content Ops and Release Report

Date: 2026-05-30

## Scope Shipped

- Implemented owner-only tag update with slug collision checks.
- Blocked category and tag deletion while posts still reference them.
- Added post curation metadata: `seriesSlug`, `seriesTitle`, `seriesOrder`, `featuredRank`, and `pinnedTrack`.
- Added version restore mutation that can save current content before restoring an older version.
- Added content health summary helpers and `/manage` health tiles for status, visibility, taxonomy, SEO gaps, and recency.
- Added `/manage` taxonomy operations for category/tag create, edit, and guarded delete.
- Added editor settings for series, featured rank, pinned track, and version restore.
- Added environment-gated analytics helpers for SPA pageviews, zero-result searches, feedback submissions, Core Web Vitals, and client errors.
- Hardened ErrorBoundary so production stack traces stay hidden and client errors are reportable.
- Added GitHub Actions release gates for install, typecheck, tests, build, and Phase 00 audit smoke.
- Updated README, deployment guide, and Harness Engine roadmap.

## Migrations

- `drizzle/0003_motionless_lila_cheney.sql`: subscribers and private post feedback.
- `drizzle/0004_wonderful_wildside.sql`: series, featured, and pinned post metadata.

## Verification

- TDD red state observed for missing tag update, delete guards, restoreVersion, content ops helpers, and ErrorBoundary helpers.
- `pnpm check` passed.
- `pnpm test` passed with escalation for local listen permissions: 15 files, 70 tests.
- `pnpm build` passed. Existing lazy Markdown/app-vendor chunk warning remains.
- `pnpm audit:baseline:quick` passed with escalation for local `tsx` IPC permissions.
- Browser QA covered:
  - `/manage` renders content health tiles.
  - `/manage` renders category and tag management sections.
  - `/manage` keeps feedback/subscriber sections visible.
  - `/write` settings drawer renders curation controls.
  - `/write` hides version restore for a new unsaved post.

## Local Coverage Boundary

The local dev server has no `DATABASE_URL`, so populated taxonomy mutation success, version restore success, article route feedback success, and real content health counts are covered by router/unit tests rather than Browser against seeded data.

## Remaining Risk

- Analytics delivery depends on the selected provider endpoint shape; helpers are safe when unconfigured.
- CI includes deterministic build/test/audit gates but not a full browser accessibility job yet.
- Pinned track metadata is editable and stored; richer public pinned-track presentation can be expanded later without schema churn.
