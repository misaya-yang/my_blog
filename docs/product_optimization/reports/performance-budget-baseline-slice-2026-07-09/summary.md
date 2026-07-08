# Performance Budget Baseline Slice Report

Date: 2026-07-09
Branch: `dev`
Commit target: `feat: add performance budget audit`

## Outcome

- Added `pnpm audit:performance`.
- Added a performance budget JSON report at `docs/product_optimization/reports/performance-budget-latest.json`.
- Integrated the performance audit into `release:check` after `build` and before `audit:ui`.
- Added blocking checks for build output presence and route lazy-loading boundaries.
- Added non-blocking baseline checks for largest JS gzip and total CSS gzip.

## Changed Files

- `package.json`
- `scripts/audit/performance-budget.ts`
- `scripts/audit/performance-budget.test.ts`
- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `docs/superpowers/plans/2026-07-09-performance-budget-baseline-slice.md`
- `docs/product_optimization/reports/performance-budget-latest.json`

## Current Baseline

- JavaScript assets: 42 files, 456.0 kB gzip total.
- CSS assets: 3 files, 82.5 kB gzip total.
- Largest JS asset: `assets/index-B-2DH7Xv.js`, 127.1 kB gzip.
- Largest CSS asset: `assets/index-DvhKXFs2.css`, 74.0 kB gzip.
- Performance checks: 6 passed, 0 warnings, 0 failures.

## Blocking Checks

- Build output includes JS and CSS assets.
- Route pages remain behind `React.lazy`.
- Markdown heavy dependencies stay out of `PostDetail` and `Editor` page entry modules.
- `@tiptap/*` editor dependencies remain assigned to the editor chunk.

## Code Quality Notes

- The audit reuses `collectDistAssetSizes` from `scripts/audit/baseline.ts` instead of duplicating gzip/asset traversal logic.
- First-pass bundle thresholds are warnings, not release blockers, matching the spec's baseline-first requirement.
- No new dependency, route change, schema change, or deploy.

## Verification

- `corepack pnpm test -- scripts/audit/performance-budget.test.ts scripts/release/check.test.ts scripts/audit/phase05-performance-boundaries.test.ts`
  - Passed. Vitest executed the full suite: 72 files, 417 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- `corepack pnpm audit:performance`
  - Passed. Generated `docs/product_optimization/reports/performance-budget-latest.json`.
- `git diff --check`
  - Passed.

## Known Risks

- This slice records bundle baseline and lazy boundary evidence; it does not yet compare against a committed previous baseline.
- Future strict enforcement should compare this report to an approved baseline and require an explicit waiver for meaningful growth.
