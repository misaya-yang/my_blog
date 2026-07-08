# Feedback Reader Signal Bridge Slice

Date: 2026-07-09
Branch: dev

## Summary

This slice wires article feedback opportunities into the existing owner-only
`engagement.contentRadar.summary()` reader signal output. The summary now returns
both `search_miss` and `article_feedback` read-model signals, sorted through the
shared reader-signal ordering helper.

## Changed Files

- `server/readerSignals.ts`
  - Exported `sortReaderSignals(signals)` so routers can reuse the same ordering
    without duplicating severity/count/date logic.
- `server/engagement.router.ts`
  - Converts feedback opportunities into `article_feedback` signals with safe
    excerpts and existing article slugs.
  - Combines feedback and search-miss signals into `readerSignals.items`.
- `server/engagement.router.test.ts`
  - Covers feedback signal output and search signal compatibility after combined
    signal output.
- `docs/superpowers/plans/2026-07-09-feedback-reader-signal-bridge-slice.md`
  - Tracks the implementation plan and verification.

## Privacy Boundary

The route remains owner-only through the existing admin guard. Feedback sample
messages are already redacted in the content radar aggregation and are redacted
again by `buildArticleFeedbackSignal`. Reply emails, subscriber emails, source
IP-like values, and private feedback contact text are not put into signal IDs,
URLs, or raw output.

## Verification

- `corepack pnpm test -- server/engagement.router.test.ts`
  - Result: failed before implementation because `readerSignals` had no feedback
    items.
- `corepack pnpm test -- server/engagement.router.test.ts server/readerSignals.test.ts`
  - Result: passed; Vitest ran 66 files and 385 tests.
- `corepack pnpm check`
  - Result: passed.
- `corepack pnpm build`
  - Result: passed.
- `git diff --check`
  - Result: passed with no whitespace errors.
- Secret scan over touched files
  - Result: no credential-like values found.
- Contact-pattern scan over touched files
  - Result: expected test fixtures and negative leak assertions only in
    `server/engagement.router.test.ts`.

## Residual Risks

- The owner UI currently receives the richer `readerSignals.items` payload but
  does not yet add a dedicated visual grouping for feedback signals.
- Signal status remains a read model; there is still no durable lifecycle
  mutation or owner note storage.
