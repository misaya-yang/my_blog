# Agent Knowledge Reindex Refresh Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary specs:

- `docs/superpowers/specs/2026-07-09-agent-quality-operations-design.md`
- `docs/superpowers/specs/2026-07-09-publish-freshness-signal-bridge-design.md`
- `docs/superpowers/specs/2026-07-09-release-gate-orchestration-design.md`

Status: Passed

## Goal

Resolve the current Agent knowledge freshness release blocker by rebuilding the derived public knowledge index and verifying publish freshness.

## Scope

In:

- Run `corepack pnpm ai:reindex`.
- Run `corepack pnpm content:verify`.
- Update `docs/product_optimization/reports/po-08-publish-freshness-latest.json`.
- Write a slice evidence report.

Out:

- No article publish.
- No deploy.
- No schema migration.
- No API, UI, model, retrieval contract, or auth behavior changes.

## Result

- Reindex created 136 chunks, deleted 142 old chunks, skipped 0.
- `content:verify` passed with 8 public posts, 136 chunks, and 0 blockers.
- Stale public post slugs are now empty.

## Verification

```bash
corepack pnpm ai:reindex
corepack pnpm content:verify
```

## Acceptance

- `agentKnowledge.ok` is true in `po-08-publish-freshness-latest.json`.
- `agentKnowledge.stalePublicPostSlugs` is empty.
- `agentKnowledge.extraIndexedPostSlugs` is empty.
- `blockers` is empty.
