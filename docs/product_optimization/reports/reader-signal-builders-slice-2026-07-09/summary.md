# Reader Signal Builders Slice

Date: 2026-07-09
Branch: dev

## Summary

This slice completes the read-model `ReaderSignalKind` builder contract without
adding storage, mutations, UI state, or schema changes. All seven signal kinds
now have pure builder coverage or existing builder coverage, deterministic
grouping IDs, explicit severity rules, and direct-contact redaction.

## Changed Files

- `server/readerSignals.ts`
  - Added `in_revision` to `ReaderSignalStatus`.
  - Added optional `suggestedAction` metadata.
  - Added `normalizeSignalSource` and `normalizeSignalText`.
  - Added builders for `agent_question`, `agent_low_confidence`,
    `agent_refusal`, `article_feedback`, and `publish_freshness`.
  - Kept existing `search_miss` and `content_audit` builders compatible.
- `server/readerSignals.test.ts`
  - Added tests for alias normalization, redaction, lifecycle status, Agent
    signal severity, aggregate sorting, feedback signals, and publish freshness
    signals.
- `docs/superpowers/plans/2026-07-09-reader-signal-builders-slice.md`
  - Added and tracked this implementation plan.

## Privacy Boundary

The builders redact direct email addresses and IP-like strings before creating
stable user-text keys. They do not accept pasted private Agent context, feedback
contact fields, subscriber emails, hidden/draft article bodies, credentials, or
raw private payloads.

This is still a read model: statuses default to `new`, `in_revision` is only a
lifecycle value, and no durable owner status is created or mutated.

## Verification

- `corepack pnpm test -- server/readerSignals.test.ts`
  - Result: passed; Vitest ran 66 files and 384 tests.
- `corepack pnpm test -- server/readerSignals.test.ts server/engagement.router.test.ts`
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
  - Result: expected fake email/IP fixtures only in `server/readerSignals.test.ts`
    redaction tests.

## Residual Risks

- The new builders are not yet wired into `/manage` or `/manage/agent` owner
  surfaces beyond existing search-miss consumption.
- `suggestedAction` is metadata text, not a durable action object or URL
  contract.
- Durable signal status, owner notes, and resolution links remain intentionally
  out of scope until schema review.
