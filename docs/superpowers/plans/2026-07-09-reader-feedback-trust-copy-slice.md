# Reader Feedback Trust Copy Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-reader-relationship-subscription-design.md`
Status: Passed

## Goal

Make the public article feedback surface more honest and form-first by removing the direct email CTA and making privacy, optional reply email, and owner-backlog use explicit.

## Scope

In:

- Remove the direct `mailto:` button from `ArticleFeedback`.
- Add compact trust copy that explains private storage, optional reply email, and how feedback is used.
- Add bilingual copy for the new text.
- Add a static render test that prevents reintroducing a direct email CTA.
- Write a slice evidence report.

Out:

- No server data contract changes.
- No email automation.
- No schema migration.
- No public comments.
- No deployment.

## Expected Files

- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/ArticleFeedback.test.tsx`
- `client/src/i18n/common.ts`
- `docs/product_optimization/reports/reader-feedback-trust-copy-slice-2026-07-09/summary.md`

## Validation

```bash
corepack pnpm test -- client/src/components/ArticleFeedback.test.tsx
corepack pnpm check
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui
git diff --check
```

## Acceptance

- Public feedback UI no longer renders a `mailto:` CTA.
- Feedback copy says the note is private owner-backlog input.
- Reply email is clearly optional.
- The form remains the primary feedback path.
