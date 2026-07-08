# Manage Reader Signal Ledger Slice

## Summary

This slice makes normalized reader signals visible in the owner-only `/manage` Content Radar. It keeps the existing server contract intact and reads from `engagement.contentRadar.summary().readerSignals.items`.

The ledger shows the top five signals with kind, severity, count, stable article/query/source text, and a bounded excerpt. It sits under the subscription summary so writing opportunities remain the primary radar surface.

## Changed Files

- `client/src/pages/Manage.tsx`
  - Adds `readerSignals` to the local radar summary type.
  - Renders a compact normalized signal ledger in the Content Radar right column.
- `client/src/pages/manageReaderSignals.ts`
  - Adds display-only signal type and label helpers.
  - Keeps unknown future signal kinds/severities readable by falling back to raw values.
- `client/src/pages/manageReaderSignals.test.ts`
  - Covers known labels, future fallback behavior, and safe primary text selection.
- `client/src/i18n/manage.ts`
  - Adds English and Chinese copy for the ledger, kinds, and severity labels.

## Privacy Boundary

- No backend route, database schema, auth, or durable status mutation changed.
- The UI only renders safe owner-readable fields: kind, severity, count, article slug/query/source reference, and excerpt.
- No subscriber emails, private Agent context, credentials, contact fields, or raw private payloads are displayed or committed.

## Verification

- `corepack pnpm test -- client/src/pages/manageReaderSignals.test.ts server/engagement.router.test.ts`
  - Passed via the project Vitest runner: 68 files, 390 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- Browser evidence with a safe mocked tRPC loaded state:
  - `manage-reader-signals-desktop.png`: `/manage`, 1440x900, ledger visible, no horizontal overflow.
  - `manage-reader-signals-mobile.png`: `/manage`, 390x844, ledger visible, no horizontal overflow.
  - `browser-checks.json`: confirms `hasNormalizedSignalsText`, `hasSignalFixtureText`, and `hasContentRadarText` are true for both viewports.
- `git diff --check`
  - Passed.
- Secret/contact scan over touched source, plan, and report files
  - Passed with no matches.

## Residual Risks

- Browser validation uses a safe mocked `engagement.contentRadar.summary` response because local data requests stayed in loading state in this environment. This validates loaded layout and overflow behavior, not production data availability.
- This slice makes signals visible only. Durable signal lifecycle actions such as acknowledging, hiding, or converting directly to a draft remain future work.
