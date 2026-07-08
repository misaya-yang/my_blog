# Feedback Reason Owner Surface Slice Report

Date: 2026-07-09
Branch: `dev`
Commit target: `feat: surface feedback reasons in manage`

## Outcome

- Added shared feedback reason taxonomy and message prefix formatter/parser in `shared/feedbackReasons.ts`.
- Refactored reader feedback UI and server validation to use the shared taxonomy.
- Parsed stored private message prefixes in `contentRadar.summary`.
- Added per-article `reasonCounts` to feedback opportunities without a schema migration.
- Updated `/manage` so owner-facing feedback rows show a localized reason badge and clean message body.
- Updated Content Radar opportunities so reason counts appear as compact chips.
- Kept internal `Feedback reason: ...` prefixes out of owner-visible excerpts and writing backlog evidence.

## Verification

- `corepack pnpm test -- shared/feedbackReasons.test.ts client/src/components/ArticleFeedback.test.tsx server/engagement.router.test.ts`
  - Passed. The command executed the repository Vitest suite: 69 files, 398 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- `git diff --check`
  - Passed.
- Browser check with mocked tRPC data at `http://localhost:4179/manage`
  - Desktop 1440x900: reason label visible, clean message visible, no internal prefix, horizontal overflow 0, no console errors.
  - Mobile 390x844: reason label visible, clean message visible, no internal prefix, horizontal overflow 0, no console errors.

## Evidence

- Desktop screenshot: `docs/product_optimization/reports/feedback-reason-owner-surface-slice-2026-07-09/manage-feedback-reasons-desktop.png`
- Mobile screenshot: `docs/product_optimization/reports/feedback-reason-owner-surface-slice-2026-07-09/manage-feedback-reasons-mobile.png`
- Browser assertion JSON: `docs/product_optimization/reports/feedback-reason-owner-surface-slice-2026-07-09/browser-checks.json`

## Risk Notes

- This is intentionally additive and compatible with existing data. Feedback without a reason prefix is preserved as a legacy free-form message.
- Reason storage remains prefix-based inside the private message until a separate schema-reviewed migration adds a first-class column.
- The browser check uses mocked owner data to avoid production credentials and provider dependencies.
