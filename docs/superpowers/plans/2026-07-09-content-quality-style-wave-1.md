# Content Quality Style Wave 1 Plan

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`

## Scope

Implement the first article-quality slice: make the existing content audit distinguish release blockers from writing suggestions and surface concrete style findings.

## Goals

- Add `suggestion` severity while preserving existing `issues` output for compatibility.
- Add category and rewrite-intent fields to findings.
- Detect AI-ish filler, over-subjective framing, unsupported certainty, and vague technical claims as non-blocking suggestions.
- Keep structural and metadata failures as release blockers.
- Add optional JSON report output for durable review evidence.

## Non-Goals

- No automatic rewrite of article text.
- No LLM dependency.
- No database migration or owner cockpit UI in this slice.
- No change to published article content.

## Intended Files

- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- `docs/product_optimization/reports/content-quality-style-wave-1-2026-07-09/summary.md`
- `docs/product_optimization/reports/content-quality-style-wave-1-2026-07-09/content-quality-report.json`

## Implementation Steps

1. [x] Extend audit types with `suggestion`, `category`, `suggestion`, and compatible `findings`.
2. [x] Convert template-like article phrasing from warning to suggestion.
3. [x] Add deterministic regex rules for subjective framing, unsupported certainty, and vague technical claims.
4. [x] Add optional `--output=<path>` report writing.
5. [x] Update tests for severity counts, compatibility, and style findings.
6. [x] Run the audit against the current project and save a report.

## Verification Commands

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm content:audit
corepack pnpm check
corepack pnpm build
```

## Risks

- Regex findings can be noisy. Keep them suggestions and include rewrite intent instead of failing builds.
- Existing consumers may read `issues`. Keep `issues` unchanged and add `findings` as an alias.
- Current articles may produce suggestions. That is expected and should not block release.

## Result

- Shipped in commits `e9e670c`, `fc8af32`, and `29f48ea`.
- Evidence report: `docs/product_optimization/reports/content-quality-style-wave-1-2026-07-09/summary.md`.
- JSON audit report: `docs/product_optimization/reports/content-quality-style-wave-1-2026-07-09/content-quality-report.json`.

## Verification

- `corepack pnpm test -- scripts/audit/content-quality.test.ts client/src/i18n/copyVoice.test.ts` passed: 44 files, 273 tests.
- `corepack pnpm content:audit -- --output=docs/product_optimization/reports/content-quality-style-wave-1-2026-07-09/content-quality-report.json` passed: 1 suggestion, 0 warnings, 0 failures.
