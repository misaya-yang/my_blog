# Reader Feedback Trust Copy Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice improves the public article feedback surface to match the reader relationship spec. The form is now the primary feedback path; the previous direct email button is removed.

The new trust copy states:

- feedback is stored privately for the owner backlog,
- reply email is optional,
- feedback is used for revisions, examples, and follow-up notes.

## Files

- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/ArticleFeedback.test.tsx`
- `client/src/i18n/common.ts`

## Code Review Notes

- No server data contract changed.
- No email automation is implied or added.
- The test explicitly rejects `mailto:` and the previous owner email from the rendered component.
- The section accessible label now includes the article title without leaking private data.

## Verification

```bash
corepack pnpm test -- client/src/components/ArticleFeedback.test.tsx
```

Passed: 63 test files, 353 tests.

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm build
```

Passed.

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui
```

Passed and refreshed `docs/product_optimization/reports/ui-layout-checks-latest.json`.

```bash
git diff --check
```

Passed.

## Remaining Risk

The owner still needs richer feedback triage actions in `/manage`; this slice only fixes the public article feedback surface.
