# Release Agent Eval Evidence Gate Slice Implementation Plan

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
Primary area: `SPEC-GATES`

## Goal

Make `release:check` enforce the spec requirement that final release readiness includes Agent answer-quality eval evidence or an explicit waiver.

## Scope

In:

- Add `--agent-eval-report=<path>` option.
- Add `--agent-eval-waiver=<reason>` option.
- Add report-level `agentEvalEvidence`.
- Fail non-dry-run release checks when no Agent eval report or waiver is provided.
- Check that a provided report path exists.
- Keep the normal command sequence unchanged.
- Add focused tests and a slice report.

Out:

- No automated DB-backed Agent eval runner.
- No deploy.
- No new dependency.
- No model/provider call.

## Expected Files

- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/product_optimization/reports/release-agent-eval-evidence-gate-slice-2026-07-09/summary.md`

## Tasks

- [x] Add release check options for Agent eval report and waiver.
- [x] Add report evidence shape and non-dry-run failure collection.
- [x] Add tests for missing evidence, existing report, waiver, and missing report path.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check` and secret/contact scan.
- [x] Write the evidence report.
- [x] Commit with `feat: require agent eval release evidence`.

## Verification Commands

```bash
corepack pnpm test -- scripts/release/check.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- This makes default `pnpm release:check` stricter. For diagnostic local checks, use `--agent-eval-waiver=<reason>` or `--dry-run`.
- The slice records evidence but does not automate DB-backed eval execution.
