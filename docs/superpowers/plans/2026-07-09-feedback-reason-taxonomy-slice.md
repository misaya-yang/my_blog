# Feedback Reason Taxonomy Slice Implementation Plan

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
Primary area: `SPEC-RELATIONSHIP`

## Goal

Let readers optionally classify why an article was useful or not useful using a compact reason taxonomy, without expanding the default feedback surface or adding a database migration.

## Scope

In:

- Add a typed feedback reason taxonomy:
  - `unclear_mechanism`
  - `needs_example`
  - `unsupported_claim`
  - `awkward_wording`
  - `missing_next_step`
  - `other`
- Keep reason controls inside the existing optional feedback details disclosure.
- Add `reason` to the public feedback mutation input as an additive optional field.
- Store reason as a private, owner-readable message prefix when present.
- Keep default quick feedback unchanged and compact.

Out:

- No database schema change.
- No durable reason column.
- No owner dashboard redesign.
- No public exposure of private feedback text.

## Expected Files

- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/ArticleFeedback.test.tsx`
- `client/src/i18n/common.ts`
- `server/engagement.router.ts`
- `server/engagement.router.test.ts`
- `docs/product_optimization/reports/feedback-reason-taxonomy-slice-2026-07-09/summary.md`

## Tasks

- [x] Add shared client-side reason constants and labels.
- [x] Render reason options only inside the optional details disclosure.
- [x] Send optional `reason` with feedback submissions and reset it on success.
- [x] Validate optional `reason` on the server.
- [x] Prefix stored private feedback message with `Feedback reason: <reason>` when reason is present.
- [x] Add tests for compact default UI, reason taxonomy exports, server persistence formatting, and invalid reason rejection.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check` and a secret/contact scan.
- [x] Write the evidence report.
- [x] Commit with `feat: add feedback reason taxonomy`.

## Verification Commands

```bash
corepack pnpm test -- client/src/components/ArticleFeedback.test.tsx server/engagement.router.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- Reason is not a durable first-class DB column in this slice. It is stored in the existing private message field for owner readability.
- Because the reason controls stay behind disclosure, browser evidence is optional; static render tests cover default compactness.

## Result

- Added optional feedback reason taxonomy to `ArticleFeedback`.
- Kept reason controls inside the existing optional details disclosure.
- Added additive server validation for `reason`.
- Stored reason in the existing private feedback message as `Feedback reason: <reason>`.
- Added focused tests for compact default UI, taxonomy stability, server formatting, and invalid reason rejection.
