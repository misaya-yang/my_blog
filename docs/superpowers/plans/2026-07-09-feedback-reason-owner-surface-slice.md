# Feedback Reason Owner Surface Slice Implementation Plan

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
Primary area: `SPEC-RELATIONSHIP`

## Goal

Make structured article feedback reasons visible and usable in owner tools without adding a database column or exposing private message bodies in URLs.

## Scope

In:

- Move feedback reason constants and message prefix parsing into a shared helper.
- Use the shared helper in `ArticleFeedback` and the engagement router.
- Strip the private reason prefix from owner message excerpts.
- Aggregate feedback reasons per article opportunity in `contentRadar.summary`.
- Display feedback reason chips in `/manage` feedback rows and Content Radar opportunities.
- Add focused tests and browser evidence for loaded owner UI.

Out:

- No schema migration.
- No new durable reason column.
- No feedback status lifecycle mutation changes.
- No public route changes.

## Expected Files

- `shared/feedbackReasons.ts`
- `shared/feedbackReasons.test.ts`
- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/ArticleFeedback.test.tsx`
- `client/src/pages/Manage.tsx`
- `server/engagement.router.ts`
- `server/engagement.router.test.ts`
- `docs/product_optimization/reports/feedback-reason-owner-surface-slice-2026-07-09/summary.md`

## Tasks

- [x] Add shared feedback reason constants, label-key helper, formatter, and parser.
- [x] Refactor `ArticleFeedback` and server validation to use shared constants.
- [x] Parse stored reason prefixes in content radar aggregation.
- [x] Return per-article `reasonCounts` from feedback opportunities.
- [x] Display reason badge on individual feedback rows and reason count chips on Content Radar opportunities.
- [x] Keep private message text redacted and stripped of reason prefixes.
- [x] Add focused tests for shared parsing, server aggregation, and UI taxonomy compatibility.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Capture browser evidence for `/manage` loaded state with reason chips.
- [x] Run `git diff --check` and a secret/contact scan.
- [x] Write the evidence report.
- [x] Commit with `feat: surface feedback reasons in manage`.

## Verification Commands

```bash
corepack pnpm test -- shared/feedbackReasons.test.ts client/src/components/ArticleFeedback.test.tsx server/engagement.router.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- Reason parsing is based on the private message prefix introduced by the previous slice. It is compatible with existing feedback without a prefix.
- Durable first-class reason storage remains a later schema-reviewed step.
