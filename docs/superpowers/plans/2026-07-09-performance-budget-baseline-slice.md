# Performance Budget Baseline Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-performance-budget-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Add a first-pass performance budget audit that records current build output and protects route lazy-loading boundaries without turning current bundle-size warnings into hard release blockers yet.

## Scope

In:

- Add `pnpm audit:performance`.
- Record dist JS/CSS raw and gzip totals plus largest assets.
- Check source-level lazy-loading boundaries for route pages, Markdown heavy dependencies, and editor chunking.
- Integrate the audit into `release:check` after `build`.
- Add focused tests and a report.

Out:

- No new dependency or bundle analyzer.
- No route/page refactor.
- No strict numeric bundle blocker in this first baseline slice.
- No deploy.

## Tasks

- [x] Add `scripts/audit/performance-budget.ts`.
- [x] Add `scripts/audit/performance-budget.test.ts`.
- [x] Add `audit:performance` package script.
- [x] Run the performance audit after build in `release:check`.
- [x] Update release orchestration tests.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `corepack pnpm audit:performance`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: add performance budget audit`.

## Verification Commands

```bash
corepack pnpm test -- scripts/audit/performance-budget.test.ts scripts/release/check.test.ts scripts/audit/phase05-performance-boundaries.test.ts
corepack pnpm check
corepack pnpm build
corepack pnpm audit:performance
git diff --check
```

## Risk Notes

- Current bundle sizes may produce warnings. This slice records them rather than failing release readiness on historical baseline.
- The audit assumes `dist/public` exists, so `release:check` must run it after `build`.
