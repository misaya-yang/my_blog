# CSS Ownership Budget Baseline Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-css-ownership-style-debt-budget-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Add a dependency-free CSS ownership audit that records current style debt for the active CSS layers and joins the local release gate. This creates a measurable baseline before the next UI implementation passes.

## Scope

In:

- Add `scripts/audit/css-ownership.ts`.
- Add focused tests for parsing, metric extraction, missing files, and threshold failure.
- Add `corepack pnpm audit:css`.
- Add CSS ownership to `release:check`.
- Generate the current baseline report and slice summary.

Out:

- No visual CSS rewrites in this slice.
- No dependency addition.
- No screenshot evidence, because runtime UI is unchanged.
- No deploy or push.

## Tasks

- [x] Implement CSS ownership audit.
- [x] Add unit tests.
- [x] Add package script and release gate step.
- [x] Generate baseline report.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write slice report.
- [x] Commit with `feat: add css ownership audit`.

## Verification Commands

```bash
corepack pnpm test -- scripts/audit/css-ownership.test.ts scripts/release/check.test.ts
corepack pnpm audit:css
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- The first baseline intentionally reports existing debt without blocking on it. Future UI slices can compare against this report and use explicit thresholds.
- Selector parsing is deliberately conservative and line-oriented enough for ownership metrics, not a full CSS parser.
