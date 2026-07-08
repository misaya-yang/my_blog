# Publish Freshness Signal Bridge Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The repository already has strong publish freshness tooling through `content:verify`, `content:publish`, `publish-freshness.ts`, sitemap/RSS/Agent index checks, and knowledge reindex commands. The gap is product visibility: owner screens should understand freshness as release readiness and reader-signal input without running destructive commands from the UI.

## Goals

- Convert publish freshness report findings into owner-readable `publish_freshness` signals.
- Show release readiness without hiding CLI evidence.
- Link stale knowledge index state to `/manage/agent`.
- Keep DB seed/reindex execution explicit in command-line workflows.
- Avoid public exposure of internal release state.

## Non-Goals

- No UI button that silently runs `db:seed` or `ai:reindex`.
- No production deploy trigger.
- No schema migration in first pass.
- No replacing CLI reports with dashboard-only state.

## Current Files

- `scripts/audit/publish-freshness.ts`
- `scripts/audit/publish-freshness.test.ts`
- `scripts/ai/reindex-knowledge.ts`
- `server/ai/knowledgeDb.ts`
- `server/readerSignals.ts`
- `server/engagement.router.ts`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `package.json`

## Freshness Inputs

Potential checks:

- Public article exists in DB/seed.
- Published article is present in sitemap and RSS when eligible.
- Archive and discovery include public articles.
- Agent knowledge chunks include current public article content.
- Hidden/draft/admin content is absent from public discovery and Agent sources.
- Last reindex did not fail.

## Signal Mapping

Map freshness results to `publish_freshness`:

- Stale public Agent index: high.
- Public article missing from RSS/sitemap/archive: high.
- Hidden/draft content exposed publicly: high and release-blocking.
- Missing optional freshness timestamp: medium.
- Report generation unavailable: medium until verified.

Signal fields:

- `sourceRef`: report path or check code.
- `articleSlug`: when article-specific.
- `excerpt`: concise safe message.
- `firstSeenAt` and `lastSeenAt`: report generation timestamp when available.

## Owner UI Contract

`/manage` should show:

- Release readiness summary.
- Last content verify status if available.
- Freshness blockers and warnings.
- Link to generated report.
- Suggested command for manual verification.

`/manage/agent` should show:

- Agent knowledge freshness.
- Last reindex status.
- Stale index warnings.

Do not show internal commands on public routes.

## Command Contract

Existing scripts remain authoritative:

```bash
corepack pnpm content:verify
corepack pnpm content:publish
corepack pnpm ai:reindex
```

UI can display commands for owner guidance, but implementation must not execute them from the browser.

## Implementation Slices

1. Add publish freshness signal builder.
2. Add parser/adapter for latest freshness report if needed.
3. Surface summary in owner cockpit.
4. Add tests for stale public index and hidden-content exposure mapping.
5. Add release report evidence.

## Tests

Focused:

```bash
corepack pnpm test -- scripts/audit/publish-freshness.test.ts server/readerSignals.test.ts server/engagement.router.test.ts
```

General:

```bash
corepack pnpm content:verify
corepack pnpm check
corepack pnpm build
```

## Acceptance Checklist

- Freshness findings can become `publish_freshness` signals.
- Owner can see release-blocking freshness problems.
- UI does not run DB seed, reindex, publish, deploy, or destructive operations.
- Public pages never expose internal freshness reports.
- Stale Agent index state links to the Agent operations surface.
