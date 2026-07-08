# Feedback Reason Taxonomy Slice

Date: 2026-07-09
Branch: `dev`
Spec: `SPEC-RELATIONSHIP` in `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Summary

This slice adds an optional reason taxonomy to article feedback so the owner can route feedback into clearer revisions without asking readers to write long free-form notes.

The default feedback surface remains compact. Reason options appear only after the reader opens the existing private details disclosure.

## Changed Files

- `client/src/components/ArticleFeedback.tsx`
  - Adds `ARTICLE_FEEDBACK_REASONS`.
  - Adds optional reason state and reason chips inside details.
  - Sends optional `reason` with feedback submissions.
- `client/src/i18n/common.ts`
  - Adds English and Chinese labels for the reason taxonomy.
- `client/src/styles/visual-refresh.css`
  - Adds scoped reason-chip styles with no new `!important`.
- `server/engagement.router.ts`
  - Adds additive `reason` validation.
  - Stores reason in the existing private message field as `Feedback reason: <reason>`.
- `client/src/components/ArticleFeedback.test.tsx`
  - Covers default compactness and stable taxonomy values.
- `server/engagement.router.test.ts`
  - Covers reason persistence formatting and invalid reason rejection.

## Taxonomy

- `unclear_mechanism`
- `needs_example`
- `unsupported_claim`
- `awkward_wording`
- `missing_next_step`
- `other`

## Verification

Completed:

```bash
corepack pnpm test -- client/src/components/ArticleFeedback.test.tsx server/engagement.router.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

Results:

- Focused Vitest command passed: 68 files, 395 tests.
- `check` passed.
- `build` passed.
- `git diff --check` passed.
- Secret scan passed with no matches.
- Contact scan matched only test/example fixtures and TEST-NET source addresses.
- `visual-refresh.css` `!important` count stayed flat: 199 before, 199 after.

## Residual Risk

- Reason is not a durable first-class database column in this slice. It is stored in the existing private message field to avoid schema migration.
- No browser screenshot was captured because the new controls are hidden behind the existing optional disclosure by default. Static render tests verify the default compact state remains unchanged.
