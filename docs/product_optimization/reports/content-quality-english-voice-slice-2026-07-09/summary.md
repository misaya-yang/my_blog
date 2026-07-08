# Content Quality English Voice Slice

Date: 2026-07-09
Status: Passed
Spec: `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`
Plan: `docs/superpowers/plans/2026-07-09-content-quality-english-voice-slice.md`

## Summary

Extended the article content-quality audit to catch high-confidence English AI-ish phrasing, subjective framing, and vague improvement claims as non-blocking suggestions. This complements the existing Chinese copy checks and keeps the audit deterministic, local, and dependency-free.

## Changed Files

- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- `docs/superpowers/plans/2026-07-09-content-quality-english-voice-slice.md`

## User-Visible Behavior

- English filler phrases such as "in this article", "it is worth noting", "deep dive", "game-changing", "paradigm shift", and "revolutionary" are now style suggestions.
- English subjective framing such as "I think", "we can see", "clearly", and "interestingly" is now flagged as a style suggestion.
- English vague improvement claims such as "significantly improves" and "dramatically improves" are now readability suggestions.
- Code fences remain excluded.
- These findings remain suggestions and do not fail the release gate.

## Verification

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts
```

Result: passed. Vitest executed the full configured suite: 49 test files, 305 tests passed.

```bash
corepack pnpm content:audit
```

Result: passed. Current corpus: 9 article files, 6 skipped root/project Markdown files, 0 failures, 0 warnings, 1 suggestion at `gated_ffn_blog.md:353` for unsupported certainty.

```bash
corepack pnpm check
```

Result: passed.

```bash
corepack pnpm build
```

Result: passed.

```bash
git diff --check
```

Result: passed.

## Known Risks

- The English pattern list is intentionally conservative. It will not catch every awkward phrase, but it avoids making subjective style suggestions too noisy.
- The existing `gated_ffn_blog.md:353` suggestion is not fixed in this slice because this change only improves detection; article rewrites should stay reviewable and explicit.
