# Publish Freshness Reader Signal Bridge Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-publish-freshness-signal-bridge-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Convert the latest publish freshness report into owner-only `publish_freshness` reader signals so `/manage` can show release-readiness problems alongside feedback and search-miss work.

## Scope

In:

- Add a dependency-free server adapter for `docs/product_optimization/reports/po-08-publish-freshness-latest.json`.
- Map report blockers, missing sitemap/RSS/archive slugs, hidden/draft leaks, track coverage gaps, and Agent knowledge index gaps into `publish_freshness` signals.
- Add a medium `report_unavailable` signal when the latest report cannot be read.
- Merge publish freshness signals into `engagement.contentRadar.summary().readerSignals`.
- Add focused tests and an evidence report.

Out:

- No DB schema changes.
- No browser-side script execution.
- No automatic `db:seed`, `ai:reindex`, `content:publish`, deploy, or destructive command.
- No public route exposure of report contents.
- No redesign of `/manage` layout in this slice.

## Tasks

- [x] Add `server/publishFreshnessSignals.ts`.
- [x] Add `server/publishFreshnessSignals.test.ts`.
- [x] Wire publish freshness signals into `server/engagement.router.ts`.
- [x] Extend `server/engagement.router.test.ts`.
- [x] Run focused tests.
- [x] Run `corepack pnpm content:verify`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: bridge publish freshness signals`.

## Risk Notes

- Latest report timestamps and git metadata can be stale; signals should include the report path/source reference rather than pretending to be live checks.
- This slice intentionally keeps stale or missing freshness report visibility owner-only.
