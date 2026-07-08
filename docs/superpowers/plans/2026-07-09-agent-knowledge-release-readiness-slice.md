# Agent Knowledge Release Readiness Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary specs:

- `docs/superpowers/specs/2026-07-09-agent-quality-operations-design.md`
- `docs/superpowers/specs/2026-07-09-publish-freshness-signal-bridge-design.md`
- `docs/superpowers/specs/2026-07-09-release-gate-orchestration-design.md`

Status: Passed

## Goal

Make stale Agent knowledge visible as an owner-facing release blocker in `/manage/agent`, with the correct local remediation sequence, without running reindex or mutating production state.

## Scope

In:

- Add a release readiness callout to the Agent index status panel.
- Treat stale public post slugs, extra indexed posts, or latest reindex error as release blockers.
- Show the sequence `pnpm ai:reindex` then `pnpm content:verify` when blocked.
- Add bilingual copy.
- Add static render tests for stale and fresh states.
- Write a slice evidence report.

Out:

- No `pnpm ai:reindex`.
- No `pnpm content:publish`.
- No server API, DB, retrieval, model, auth, or deployment behavior changes.

## Expected Files

- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/ManageAgent.test.tsx`
- `client/src/i18n/agentOps.ts`
- `docs/product_optimization/reports/agent-knowledge-release-readiness-slice-2026-07-09/summary.md`

## Validation

```bash
corepack pnpm test -- client/src/pages/ManageAgent.test.tsx
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- Stale Agent knowledge renders explicit release blocker language.
- The blocked state shows `pnpm ai:reindex` followed by `pnpm content:verify`.
- Fresh Agent knowledge renders release-ready language and does not show blocker copy.
- Chinese and English copy are both present in `agentOps`.
