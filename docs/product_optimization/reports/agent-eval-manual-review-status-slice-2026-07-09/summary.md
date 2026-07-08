# Agent Eval Manual Review Status Slice Report

Date: 2026-07-09
Branch: `dev`
Commit target: `feat: flag manual review agent evals`

## Outcome

- Added additive Agent eval item `status`: `passed`, `failed`, or `manual_review_required`.
- Added summary `manualReview` count while keeping legacy `passed: boolean` for compatibility.
- Marked custom source-backed evals with no expected source slug as `manual_review_required` when retrieval finds public sources.
- Kept such manual-review items out of the passed count.
- Updated `/manage/agent` eval summary and badges to show manual review distinctly from failed retrieval/source checks.

## Changed Files

- `server/ai/types.ts`
- `server/ai/harness.ts`
- `server/ai/harness.test.ts`
- `server/agent.router.test.ts`
- `client/src/pages/ManageAgent.tsx`
- `client/src/i18n/agentOps.ts`
- `docs/superpowers/plans/2026-07-09-agent-eval-manual-review-status-slice.md`

## Verification

- `corepack pnpm test -- server/ai/harness.test.ts server/agent.router.test.ts client/src/pages/ManageAgent.test.tsx`
  - Passed. The command executed the repository Vitest suite: 69 files, 399 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- `git diff --check`
  - Passed.
- Browser check with mocked tRPC data at `http://localhost:4180/manage/agent`
  - Desktop 1440x900: manual-review summary visible, manual-review note visible, passed shows `0/1`, horizontal overflow 0, no console errors.
  - Mobile 390x844: manual-review summary visible, manual-review note visible, passed shows `0/1`, horizontal overflow 0, no console errors.

## Evidence

- Desktop screenshot: `docs/product_optimization/reports/agent-eval-manual-review-status-slice-2026-07-09/manage-agent-manual-review-desktop.png`
- Mobile screenshot: `docs/product_optimization/reports/agent-eval-manual-review-status-slice-2026-07-09/manage-agent-manual-review-mobile.png`
- Browser assertion JSON: `docs/product_optimization/reports/agent-eval-manual-review-status-slice-2026-07-09/browser-checks.json`

## Code Quality Notes

- The change is additive and keeps existing `passed` consumers working.
- Manual review is intentionally narrow: deterministic golden source/refusal evals keep their current pass/fail behavior.
- No new dependency, schema change, route change, or model-provider change.

## Known Risks

- The eval runner is still retrieval-only. This slice prevents false confidence for custom questions but does not add semantic answer judging.
- A future model/judge eval can expand `manual_review_required` to citation usability, grounded answer quality, and scope discipline.
