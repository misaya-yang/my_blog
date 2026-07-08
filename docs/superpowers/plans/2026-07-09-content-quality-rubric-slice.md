# Content Quality Rubric Slice Implementation Plan

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
Primary area: `SPEC-CONTENT`

## Goal

Extend the deterministic content audit so every seeded article gets a machine-readable Problem, Mechanism, Evidence, Limitation, and Implication rubric summary, while adding low-noise style suggestions for awkward expression and translationese.

## Scope

In:

- Add optional finding metadata fields for `reason`, `confidence`, and source text span when available.
- Add `rubrics` to `ContentQualityReport`.
- Add rubric counts to the report summary without changing release-blocking semantics.
- Add deterministic non-blocking suggestions for `content.awkward_expression` and `content.translationese`.
- Add tests and a saved current-project JSON report.

Out:

- No article rewrites.
- No UI integration.
- No database, route, auth, Agent, publish, or release script contract changes.
- No LLM dependency.

## Expected Files

- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- `docs/product_optimization/reports/content-quality-rubric-slice-2026-07-09/summary.md`
- `docs/product_optimization/reports/content-quality-rubric-slice-2026-07-09/content-quality-report.json`

## Tasks

- [x] Add report types for article rubric dimensions and optional finding metadata.
- [x] Build rubric summaries from seeded article Markdown using conservative heading/keyword heuristics.
- [x] Keep rubric weak/missing states non-blocking and separate from `issues`.
- [x] Add awkward expression and translationese suggestion patterns with focused tests.
- [x] Add tests for rubric present/weak/missing states and new finding metadata.
- [x] Run focused tests.
- [x] Run current content audit with `--output` into the report folder.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check` and a secret/contact scan over touched files.
- [x] Write the evidence report.
- [x] Commit with `feat: add content quality rubric`.

## Verification Commands

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm content:audit -- --output=docs/product_optimization/reports/content-quality-rubric-slice-2026-07-09/content-quality-report.json
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- Rubric heuristics can be imperfect. Keep them as review signals, not blockers.
- Avoid broad wording patterns that flood the current corpus with low-value suggestions.
- Preserve `issues` and `findings` compatibility for existing consumers.

## Result

- Added `rubrics` to `ContentQualityReport` with Problem, Mechanism, Evidence, Limitation, and Implication dimensions.
- Added summary counts for rubric articles, weak dimensions, and missing dimensions.
- Added optional `reason`, `confidence`, and `span` metadata to content findings.
- Added non-blocking `content.awkward_expression` and `content.translationese` suggestions.
- Current corpus report: `docs/product_optimization/reports/content-quality-rubric-slice-2026-07-09/content-quality-report.json`.
