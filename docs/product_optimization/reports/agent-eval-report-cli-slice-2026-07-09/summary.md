# Agent Eval Report CLI Slice Report

Date: 2026-07-09
Branch: `dev`
Commit target: `feat: add agent eval report cli`

## Outcome

- Added `pnpm ai:eval`.
- Default Agent eval output path is `docs/product_optimization/reports/agent-eval-latest.json`.
- Extracted shared deterministic Agent eval logic into `server/ai/evals.ts`.
- Refactored `/manage/agent` eval execution to use the shared helper.
- Added release-facing report status: `passed`, `failed`, or `manual_review_required`.
- `pnpm ai:eval` exits non-zero for failed or manual-review reports.
- `release:check --agent-eval-report=<path>` now validates report JSON status and rejects invalid or non-passing reports.

## Changed Files

- `package.json`
- `server/ai/evals.ts`
- `server/ai/harness.ts`
- `scripts/ai/agent-eval-report.ts`
- `scripts/ai/agent-eval-report.test.ts`
- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/superpowers/plans/2026-07-09-agent-eval-report-cli-slice.md`

## Verification

- `corepack pnpm test -- scripts/ai/agent-eval-report.test.ts scripts/release/check.test.ts server/ai/harness.test.ts`
  - Passed. The command executed the repository Vitest suite: 70 files, 409 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- `git diff --check`
  - Passed.
- `corepack pnpm ai:eval --no-output --question="What problem does IsoHC solve?"`
  - Passed. Output: `Agent eval status: passed`.
- `corepack pnpm ai:eval --output=.cache/agent-eval-smoke.json --question="What problem does IsoHC solve?" && corepack pnpm release:check --dry-run --allow-dirty --agent-eval-report=.cache/agent-eval-smoke.json --no-output`
  - Passed. This verifies the report-generation and release-check evidence path together.

## Evidence Contract

The generated report includes:

```json
{
  "generatedAt": "ISO timestamp",
  "status": "passed | failed | manual_review_required",
  "summary": {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "manualReview": 0
  },
  "failures": [],
  "manualReviewRequired": [],
  "items": []
}
```

## Code Quality Notes

- The eval decision logic now has one owner: `evaluateAgentGoldenQuestions`.
- `/manage/agent` and `pnpm ai:eval` share the same deterministic source/refusal/manual-review behavior.
- The CLI does not call the model provider and does not require an admin session.
- No schema migration, deployment, or new dependency.

## Known Risks

- `pnpm ai:eval` depends on the local DB and current public knowledge index.
- Manual-review reports are intentionally not passing release evidence. Use a narrower deterministic expected-source eval or an explicit waiver when human review is the release decision.
