# AI Reindex Dry Run Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary specs:

- `docs/superpowers/specs/2026-07-09-agent-quality-operations-design.md`
- `docs/superpowers/specs/2026-07-09-publish-freshness-signal-bridge-design.md`
- `docs/superpowers/specs/2026-07-09-release-gate-orchestration-design.md`

Status: Passed

## Goal

Add a safe preview mode for `pnpm ai:reindex` so the owner can inspect Agent knowledge freshness without deleting and rebuilding the knowledge index.

## Scope

In:

- Add `--dry-run` to `scripts/ai/reindex-knowledge.ts`.
- Keep normal `pnpm ai:reindex` behavior unchanged.
- Extract CLI argument parsing and status formatting into tested pure helpers.
- Run the dry-run command against the current database to confirm it performs no writes and reports the known stale slugs.
- Write a slice evidence report.

Out:

- No actual reindex.
- No `content:publish`.
- No schema, API, route, UI, retrieval, model, auth, or deployment behavior changes.

## Expected Files

- `scripts/ai/reindex-knowledge.ts`
- `scripts/ai/reindex-knowledge.test.ts`
- `docs/product_optimization/reports/ai-reindex-dry-run-slice-2026-07-09/summary.md`

## Validation

```bash
corepack pnpm test -- scripts/ai/reindex-knowledge.test.ts
corepack pnpm check
corepack pnpm ai:reindex --dry-run
corepack pnpm build
git diff --check
```

## Acceptance

- `pnpm ai:reindex --dry-run` reads current status and exits without calling `reindexPublicKnowledgeChunks`.
- Unknown args fail fast.
- Dry-run output includes stale and extra indexed slugs when present.
- Current stale slugs remain visible:
  - `flow-matching-generative-transport`
  - `isohc-fixed-vector-isometric-residual-mixing`
