# Content Quality Style Wave 1 Report

Date: 2026-07-09
Branch: `dev`
Plan: `docs/superpowers/plans/2026-07-09-content-quality-style-wave-1.md`

## Shipped

- Added `suggestion` severity to the content audit while keeping `issues` compatible for existing consumers.
- Added `category` and `suggestion` fields so findings can feed future owner-cockpit queues.
- Added deterministic checks for AI-ish filler, over-subjective framing, unsupported certainty, and vague technical claims.
- Kept style findings non-blocking: only `failure` still exits non-zero.
- Added `findings` as a compatibility-forward alias of `issues`.
- Added `--output=<path>` support for durable JSON audit reports.
- Reduced false positives for scoped caveats and content-boundary invariants such as hidden/admin/draft data never entering public sources.

## Current Project Audit

Report: `docs/product_optimization/reports/content-quality-style-wave-1-2026-07-09/content-quality-report.json`

Summary:

- Article files: `9`
- Skipped non-article Markdown files: `6`
- Seed posts: `9`
- Suggestions: `1`
- Warnings: `0`
- Failures: `0`

Remaining suggestion:

- `gated_ffn_blog.md:353` uses the absolute claim `训练永远更稳定。`; the audit recommends adding scope, evidence, or a caveat.

## Verification

- `corepack pnpm test -- scripts/audit/content-quality.test.ts client/src/i18n/copyVoice.test.ts`
  - Passed: 44 files, 273 tests.
- `corepack pnpm content:audit -- --output=docs/product_optimization/reports/content-quality-style-wave-1-2026-07-09/content-quality-report.json`
  - Passed: 1 suggestion, 0 warnings, 0 failures.

## Deferred

- No article rewrite was made in this slice.
- No database-backed owner cockpit integration was added.
- Repeated style suggestions can later be normalized into `ReaderSignal` content audit tasks.
