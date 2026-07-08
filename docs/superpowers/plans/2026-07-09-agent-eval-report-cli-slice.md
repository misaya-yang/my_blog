# Agent Eval Report CLI Slice Implementation Plan

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
Primary areas: `SPEC-OPS`, `SPEC-GATES`

## Goal

Provide a non-UI command that generates the Agent eval report expected by `release:check`, so final release readiness can attach evidence instead of relying on waivers.

## Scope

In:

- Add `pnpm ai:eval`.
- Generate `docs/product_optimization/reports/agent-eval-latest.json` by default.
- Reuse the same deterministic golden-eval logic used by `/manage/agent`.
- Add report status: `passed`, `failed`, or `manual_review_required`.
- Return non-zero for failed or manual-review reports.
- Teach `release:check --agent-eval-report` to reject non-passing or invalid reports.
- Add focused tests and a report.

Out:

- No model-judge eval.
- No provider call.
- No schema migration.
- No deploy.

## Expected Files

- `package.json`
- `server/ai/evals.ts`
- `server/ai/harness.ts`
- `scripts/ai/agent-eval-report.ts`
- `scripts/ai/agent-eval-report.test.ts`
- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/product_optimization/reports/agent-eval-report-cli-slice-2026-07-09/summary.md`

## Tasks

- [x] Extract shared deterministic Agent eval helper.
- [x] Refactor `/manage/agent` eval service to use the helper.
- [x] Add `ai:eval` CLI and package script.
- [x] Make release check validate Agent eval report status.
- [x] Add focused tests for CLI helpers, shared eval behavior, and release report validation.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check` and secret/contact scan.
- [x] Write the evidence report.
- [x] Commit with `feat: add agent eval report cli`.

## Verification Commands

```bash
corepack pnpm test -- scripts/ai/agent-eval-report.test.ts scripts/release/check.test.ts server/ai/harness.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- `pnpm ai:eval` depends on the local database-backed knowledge index. If the DB is unavailable or stale, the report should fail rather than silently claiming readiness.
- Manual-review evals intentionally do not pass release readiness without owner review or a waiver.
