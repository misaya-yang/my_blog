# WPU-05 Release And Evaluation Gates Plan

**Date:** 2026-06-16

## Objective

Produce a release evidence packet for WebDeb after WPU-01 through WPU-04, without deploying or mutating production systems.

## Scope

- Confirm prior phase reports and oracle states.
- Run the release validation suite in the required order.
- Execute `pnpm content:publish` as a local release gate: snapshot, seed, reindex, freshness compare.
- Capture local browser evidence for reader, article, archive/search, RSS, sitemap, robots, Agent, and owner AgentOps fallback.
- Record Agent trust, content/SEO/feed, privacy, rollback, and deployment approval status.

## Validation Steps

1. `pnpm check`
2. `pnpm test`
3. `pnpm content:audit`
4. `pnpm content:publish`
5. `pnpm build`
6. `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick`
7. `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:ui`
8. Browser route and Agent smoke checks against `http://localhost:3000`
9. Harness strict validation

## Acceptance Criteria

- WPU-F006 is passing only if all required gates pass or any blocker is named.
- Browser/route evidence exists for release-critical surfaces.
- Hidden/draft content and raw Agent reasoning remain excluded.
- Deployment status is explicit: not deployed, approval required.
- Rollback notes identify phase-scoped changes and generated evidence files.
