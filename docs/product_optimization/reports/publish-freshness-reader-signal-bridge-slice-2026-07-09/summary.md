# Publish Freshness Reader Signal Bridge Slice

Date: 2026-07-09
Status: Passed
Branch: dev

## Summary

Added an owner-only bridge from the latest publish freshness report to normalized `publish_freshness` reader signals. `/manage` can now include freshness blockers, route/report failures, missing public asset coverage, hidden-content exposure, and stale Agent knowledge index findings in the same reader signal ledger as feedback and search misses.

## Changed Files

- `server/publishFreshnessSignals.ts`
- `server/publishFreshnessSignals.test.ts`
- `server/readerSignals.ts`
- `server/engagement.router.ts`
- `server/engagement.router.test.ts`
- `docs/superpowers/plans/2026-07-09-publish-freshness-reader-signal-bridge-slice.md`
- `docs/product_optimization/reports/po-08-publish-freshness-latest.json`

## Behavior

- Healthy publish freshness reports produce no extra signals.
- Missing report produces a medium `publish_freshness:report_unavailable:global` signal.
- Missing sitemap/RSS/archive/track coverage, route failures, release blockers, hidden-content exposure, and stale public Agent index findings become owner-only signals.
- The owner summary reads the latest report only; it does not run `db:seed`, `ai:reindex`, `content:publish`, deploy, or destructive operations.

## Verification

```bash
corepack pnpm test -- server/publishFreshnessSignals.test.ts server/readerSignals.test.ts server/engagement.router.test.ts
corepack pnpm content:verify
corepack pnpm check
corepack pnpm build
git diff --check
```

Results:

- Focused Vitest command ran 77 files / 441 tests: passed.
- `content:verify`: passed, 8 public posts, 136 chunks, 0 blockers.
- `check`: passed.
- `build`: passed.
- `git diff --check`: passed.

## Current Freshness Report Note

`docs/product_optimization/reports/po-08-publish-freshness-latest.json` was refreshed during this uncommitted slice, so its `git.dirty` field is `true`. The freshness status itself is pass with no blockers.

## Risk Notes

- The bridge reflects the latest report file; it is not a live database verification.
- If the report is stale, the signal evidence should be treated as report-derived.
- Public routes do not expose report details.
