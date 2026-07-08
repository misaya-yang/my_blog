# CSS Ownership Budget Baseline Slice

Date: 2026-07-09
Branch: dev
Spec source: `docs/superpowers/specs/2026-07-09-css-ownership-style-debt-budget-design.md`

## Summary

Added a dependency-free CSS ownership audit and wired it into the release gate. The first baseline records existing CSS debt as warnings, not blocking failures, so future UI slices can compare against a concrete count before changing public, owner, Agent, or legacy material styles.

## Changed Files

- `scripts/audit/css-ownership.ts`
- `scripts/audit/css-ownership.test.ts`
- `package.json`
- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/superpowers/plans/2026-07-09-css-ownership-budget-baseline-slice.md`
- `docs/product_optimization/reports/css-ownership-latest.json`
- `docs/product_optimization/reports/css-ownership-budget-baseline-slice-2026-07-09/css-ownership.json`

## User-Visible Behavior

No runtime UI behavior changed. The change adds a local quality gate:

```bash
corepack pnpm audit:css
```

`release:check` now runs the CSS ownership audit after the performance audit and before the browser UI audit.

## Baseline Result

Current active CSS surface:

- Files scanned: 6
- Lines scanned: 15,952
- `!important`: 1,559
- viewport-unit `font-size`: 70
- hard-coded color literals: 1,175
- broad/global selectors: 106
- Agent runtime selectors outside `agent-surfaces.css`: 44

Report:

- `docs/product_optimization/reports/css-ownership-budget-baseline-slice-2026-07-09/css-ownership.json`
- `docs/product_optimization/reports/css-ownership-latest.json`

## Code Quality Notes

- No new dependency.
- The audit follows the existing CLI pattern used by `performance-budget.ts`: parser, runner, formatter, JSON output, and non-zero exit on blocking failures.
- Default behavior is no-growth ready: existing debt is reported as warnings, while future slices can use explicit thresholds such as `--max-important=...`.
- Selector parsing is intentionally conservative and dependency-free. It is a debt-budget scanner, not a complete CSS parser.

## Validation

```bash
corepack pnpm test -- scripts/audit/css-ownership.test.ts scripts/release/check.test.ts
corepack pnpm audit:css -- --no-output
corepack pnpm audit:css
corepack pnpm audit:css -- --output=docs/product_optimization/reports/css-ownership-budget-baseline-slice-2026-07-09/css-ownership.json
corepack pnpm check
corepack pnpm build
git diff --check
```

Result: passed.

Note: the focused Vitest command currently runs the repo Vitest suite under this configuration; 73 files and 421 tests passed.

## Known Risks

- The baseline shows substantial existing CSS debt. This slice does not reduce it; it makes future increases visible.
- Hard-coded color counting intentionally includes color literals inside token definitions, so the count is a debt trend signal rather than a direct failure condition.
- Browser screenshots were not captured because no runtime UI was changed.
