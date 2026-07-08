# Release Check Orchestration Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-release-gate-orchestration-design.md`
Status: Passed

## Goal

Turn the release gate sequence into a runnable local command that records branch, commit, dirty state, command results, skips, and failures without adding a dependency or hiding known blockers.

## Scope

In:

- Add `corepack pnpm release:check`.
- Add `scripts/release/check.ts` with a deterministic gate plan.
- Add focused tests for argument parsing, gate sequence, skip behavior, failure stop behavior, and dry-run behavior.
- Record the current `content:verify` blocker in the existing publish freshness report.
- Write a slice evidence report.

Out:

- No deploy.
- No `ai:reindex` or `content:publish`.
- No CI provider changes.
- No schema, API, route, UI, Agent, or content behavior changes.

## Gate Sequence

Default sequence:

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

Supported diagnostic options:

- `--dry-run`
- `--allow-dirty`
- `--skip-ui`
- `--skip-content-verify`
- `--output=<path>`
- `--base-url=<url>`
- `--no-output`

## Expected Files

- `package.json`
- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/product_optimization/reports/po-08-publish-freshness-latest.json`
- `docs/product_optimization/reports/release-check-orchestration-slice-2026-07-09/summary.md`

## Validation

```bash
corepack pnpm test -- scripts/release/check.test.ts
corepack pnpm check
corepack pnpm release:check --dry-run --no-output
corepack pnpm release:check --allow-dirty --skip-ui --skip-content-verify --output=.cache/release-check-diagnostic.json
```

## Acceptance

- `release:check` exists in `package.json`.
- The default gate sequence is explicit and includes content freshness and UI audit.
- Dirty worktree is blocking unless `--allow-dirty` is supplied.
- Skipped gates remain visible in the report.
- Blocking failures stop later gates and mark them `not_run`.
- Full release readiness is not claimed while `content:verify` reports stale Agent knowledge.

## Result

- Added `scripts/release/check.ts`.
- Added `scripts/release/check.test.ts`.
- Added `release:check` to `package.json`.
- Updated `po-08-publish-freshness-latest.json` with the current stale Agent knowledge blocker from `content:verify`.
- Evidence report: `docs/product_optimization/reports/release-check-orchestration-slice-2026-07-09/summary.md`.
