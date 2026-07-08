# Agent Eval Manual Review Status Slice Implementation Plan

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
Primary area: `SPEC-OPS`

## Goal

Make retrieval-only Agent evals honest about cases that cannot be deterministically judged. Custom source-backed evals with no expected source slug should return `manual_review_required` when retrieval finds public sources, and those items must not count as passed.

## Scope

In:

- Add an additive eval item `status` value: `passed`, `failed`, or `manual_review_required`.
- Add summary `manualReview` count.
- Keep legacy `passed: boolean` so existing callers remain compatible.
- Mark custom source-backed evals with no expected source slug as manual review when sources are found.
- Surface manual-review status in `/manage/agent`.
- Add focused tests and a report.

Out:

- No model-based judge.
- No schema migration.
- No new dependency.
- No release gate behavior change.

## Expected Files

- `server/ai/types.ts`
- `server/ai/harness.ts`
- `server/ai/harness.test.ts`
- `server/agent.router.test.ts`
- `client/src/pages/ManageAgent.tsx`
- `client/src/i18n/agentOps.ts`
- `docs/product_optimization/reports/agent-eval-manual-review-status-slice-2026-07-09/summary.md`

## Tasks

- [x] Extend Agent eval output types with status and manual-review count.
- [x] Update `adminRunEvals` status calculation.
- [x] Update owner UI labels and badges.
- [x] Add server tests proving manual-review items do not count as pass.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check` and secret/contact scan.
- [x] Write the evidence report.
- [x] Commit with `feat: flag manual review agent evals`.

## Verification Commands

```bash
corepack pnpm test -- server/ai/harness.test.ts server/agent.router.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- Existing clients can keep using `passed`; new clients should prefer `status`.
- Manual review is intentionally narrow in this slice to avoid downgrading deterministic source recall checks.
