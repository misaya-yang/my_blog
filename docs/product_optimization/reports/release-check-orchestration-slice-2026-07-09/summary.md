# Release Check Orchestration Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice adds a local release gate command:

```bash
corepack pnpm release:check
```

The command records branch, commit, dirty state, command results, skipped gates, failures, and an optional JSON report path. It is intentionally conservative: dirty worktrees fail by default, blocking failures stop later gates, and skipped gates remain visible in the report.

## Files

- `package.json`
- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/product_optimization/reports/po-08-publish-freshness-latest.json`

## Code Review Notes

- No new dependency was added.
- The script uses `execFile`, not shell interpolation.
- Command output is tailed and redacts common token/connection-string patterns before writing reports.
- The default sequence includes `content:verify` and `audit:ui`.
- `--skip-ui` and `--skip-content-verify` are diagnostic escape hatches, not release waivers.
- `content:verify` currently reports stale Agent knowledge for:
  - `flow-matching-generative-transport`
  - `isohc-fixed-vector-isometric-residual-mixing`

## Verification

```bash
corepack pnpm test -- scripts/release/check.test.ts
```

Passed: 60 test files, 347 tests.

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm content:audit
```

Passed: 9 article files, 0 suggestions, 0 warnings, 0 failures.

```bash
corepack pnpm content:verify
```

Failed as expected for current state: Agent knowledge is stale for two public posts. This failure is recorded in `docs/product_optimization/reports/po-08-publish-freshness-latest.json`.

```bash
corepack pnpm release:check --dry-run --no-output
```

Passed.

```bash
corepack pnpm release:check --allow-dirty --skip-ui --skip-content-verify --output=.cache/release-check-diagnostic.json
```

Passed as a diagnostic run. It executed `git status`, `git diff --check`, `corepack pnpm check`, `corepack pnpm test`, `corepack pnpm content:audit`, and `corepack pnpm build`; it explicitly skipped `content:verify` and `audit:ui`.

## Remaining Risk

The project is not release-ready until Agent knowledge freshness is resolved and a full `release:check` run completes without skips against a running local production server.
