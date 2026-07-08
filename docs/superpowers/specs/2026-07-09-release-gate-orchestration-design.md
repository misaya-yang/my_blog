# Release Gate Orchestration Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The repo has many useful checks, but they are not yet one release contract. A release should not depend on memory of which commands to run. This spec defines the release gate orchestration, evidence report shape, waiver policy, and dirty-worktree rules.

## Goals

- Define one authoritative release check sequence.
- Make failures blocking and warnings explicitly waived.
- Record commit, branch, dirty status, commands, and result.
- Keep deploy separate from release verification unless explicitly approved.
- Prevent "looks fine" releases without evidence.

## Non-Goals

- No CI provider migration.
- No automatic production deploy.
- No force push or history rewrite.
- No new dependency for orchestration unless justified.

## Current Files

- `package.json`
- `scripts/audit/baseline.ts`
- `scripts/audit/ui-layout.ts`
- `scripts/audit/content-quality.ts`
- `scripts/audit/publish-freshness.ts`
- `docs/product_optimization/reports/*`
- `agent.md`

## Release Command Contract

Full local release verification:

```bash
git status --short --branch
git diff --check
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
corepack pnpm content:verify
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui
```

Notes:

- `audit:ui` requires a running local server.
- Agent answer-quality eval evidence is required before claiming final release readiness. If it is not automated in `release:check` yet, the release report must include an explicit waiver and the focused Agent eval command/result.
- `content:publish` is not part of routine verification because it mutates DB/knowledge index state.
- Deploy requires explicit approval.

## Failure And Waiver Policy

Blocking:

- Typecheck failure.
- Test failure.
- Build failure.
- Content audit failure.
- UI audit failure.
- Release-blocking publish freshness failure.
- Release-blocking Agent quality failure, including hidden/draft source returned, expected source missing for a golden question, repeated zero-source in-scope answer, or unusable citations.
- Dirty worktree not explained in report.
- Secret exposure risk.

Warning:

- Known content style suggestion.
- Existing non-blocking baseline warning.
- Large bundle warning within accepted budget.

Warnings must be listed in the release report with owner-facing impact and decision: accepted, deferred, or fixed.

## Evidence Report Shape

Each release report should include:

- Branch.
- Commit SHA.
- Dirty status.
- Commands run.
- Pass/fail result.
- Browser/server URL used.
- Screenshots or audit output paths.
- Known warnings and waivers.
- Deploy status: not requested, requested, skipped, or completed.
- Agent eval report path, or explicit waiver with reason and owner impact.

## Implementation Slices

1. Add a release report template.
2. Optionally add `release:check` script that wraps non-destructive checks.
3. Teach baseline audit to distinguish blocking failures from warnings if precise.
4. Update reports to use consistent command/result language.
5. Run full gates before merge to `main`.

## Acceptance Checklist

- A future agent can run release verification from one spec.
- Blocking vs warning states are explicit.
- Deployment remains separately approved.
- Release evidence includes branch, commit, dirty status, commands, and outputs.
