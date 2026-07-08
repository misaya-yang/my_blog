# Release Agent Eval Evidence Gate Slice Report

Date: 2026-07-09
Branch: `dev`
Commit target: `feat: require agent eval release evidence`

## Outcome

- Added `--agent-eval-report=<path>` to `release:check`.
- Added `--agent-eval-waiver=<reason>` to `release:check`.
- Added `agentEvalEvidence` to release check reports.
- Non-dry-run release checks now fail when neither Agent eval evidence nor an explicit waiver is provided.
- Provided Agent eval report paths are checked for existence before the report can pass.
- Existing release command sequence remains unchanged.

## Changed Files

- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/superpowers/plans/2026-07-09-release-agent-eval-evidence-gate-slice.md`

## Verification

- `corepack pnpm test -- scripts/release/check.test.ts`
  - Passed. The command executed the repository Vitest suite: 69 files, 404 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- `git diff --check`
  - Passed.
- `corepack pnpm release:check --dry-run --allow-dirty --agent-eval-waiver=local-diagnostic --no-output`
  - Passed. CLI accepted the new Agent eval waiver option and generated a dry-run report.

## Evidence Contract

Release report field:

```json
"agentEvalEvidence": {
  "status": "provided | waived | missing | missing_report",
  "reportPath": "path-or-null",
  "waiver": "reason-or-null",
  "reason": "failure-reason-or-null",
  "ownerImpact": "reader-facing explanation"
}
```

## Code Quality Notes

- This is additive to report shape and options, with no new dependency.
- The gate is evidence-oriented: it records an existing eval report or an explicit waiver, rather than calling DB-backed evals from release orchestration.
- Existing command runner, command order, and step result shape remain unchanged.

## Known Risks

- Default `pnpm release:check` is now stricter. Diagnostic runs should pass `--agent-eval-waiver=<reason>` when Agent eval evidence is intentionally unavailable.
- This slice does not automate Agent eval execution; it prevents final release readiness from being claimed without evidence or waiver.
