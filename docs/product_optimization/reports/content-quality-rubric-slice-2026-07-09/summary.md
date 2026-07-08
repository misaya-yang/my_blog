# Content Quality Rubric Slice

Date: 2026-07-09
Branch: `dev`
Spec: `SPEC-CONTENT` in `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Summary

This slice extends the deterministic content audit from issue detection into article-structure review. Each seeded article now receives a machine-readable rubric for Problem, Mechanism, Evidence, Limitation, and Implication.

The rubric is intentionally non-blocking. It identifies weak or missing dimensions for owner review without converting them into release failures.

## Changed Files

- `scripts/audit/content-quality.ts`
  - Adds optional finding metadata: `reason`, `confidence`, and source `span`.
  - Adds `ArticleQualityRubric` and `rubrics` to the audit report.
  - Adds summary counts for weak and missing rubric dimensions.
  - Adds non-blocking `content.awkward_expression` and `content.translationese` suggestions.
- `scripts/audit/content-quality.test.ts`
  - Covers rubric present/weak/missing states.
  - Covers metadata-rich awkward expression and translationese suggestions.
- `docs/superpowers/plans/2026-07-09-content-quality-rubric-slice.md`
  - Records the implementation plan and completion evidence.
- `docs/product_optimization/reports/content-quality-rubric-slice-2026-07-09/content-quality-report.json`
  - Current project audit output.

## Current Audit Result

- Article files: `9`
- Suggestions: `0`
- Warnings: `0`
- Failures: `0`
- Rubric articles: `9`
- Weak rubric dimensions: `4`
- Missing rubric dimensions: `2`

Weak dimensions:

- `dfrope_blog_post.md`: evidence
- `flow_matching_generative_transport.md`: evidence
- `gated_ffn_blog.md`: evidence
- `isohc_blog.md`: implication

Missing dimensions:

- `flow_matching_generative_transport.md`: limitation
- `gated_ffn_blog.md`: limitation

## Verification

Completed:

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm content:audit -- --output=docs/product_optimization/reports/content-quality-rubric-slice-2026-07-09/content-quality-report.json
corepack pnpm check
corepack pnpm build
git diff --check
```

Results:

- Focused Vitest command passed: 68 files, 392 tests.
- `content:audit` passed with 0 suggestions, 0 warnings, and 0 failures.
- `check` passed.
- `build` passed.
- `git diff --check` passed.
- Secret/contact scan passed with no matches.

## Residual Risk

- Rubric scoring is heuristic. It is suitable for review prioritization, not an authoritative quality judgment.
- The new awkward-expression patterns are intentionally conservative to avoid flooding the corpus with low-value style suggestions.
- No article text was rewritten in this slice.
