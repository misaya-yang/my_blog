# Content Quality English Voice Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`
Status: Passed

## Goal

Extend the article content audit to catch high-confidence English AI-ish phrasing, subjective framing, and vague performance claims as non-blocking suggestions. This complements the existing Chinese style checks and keeps article voice concrete without adding an LLM dependency.

## Scope

In:

- Add English template/filler phrase detection.
- Add English subjective framing detection.
- Add English vague improvement claim detection.
- Keep all new findings at `suggestion` severity.
- Add focused tests and write a slice evidence report.

Out:

- No automatic article rewriting.
- No model-based judge.
- No new dependency.
- No release-blocking style failures.
- No deploy.

## Expected Files

- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- `docs/product_optimization/reports/content-quality-english-voice-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts
corepack pnpm content:audit
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- English phrases such as "in this article", "it is worth noting", "deep dive", and "paradigm shift" produce style suggestions.
- English phrases such as "I think", "we can see", and "clearly" produce subjective-framing suggestions.
- English vague improvement claims such as "significantly improves" produce readability suggestions.
- Code fences remain excluded from these checks.
- Suggestions do not fail `content:audit`.
