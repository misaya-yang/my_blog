# Owner Cockpit Release Risk Summary Slice

Date: 2026-07-09
Status: Passed
Branch: dev

## Summary

Added a compact `/manage` Owner Cockpit panel above Writing Backlog. It summarizes release risk, high reader signals, backlog count, and Agent gaps so the owner can see the next operational priority before scanning longer lists.

## Changed Files

- `client/src/pages/manageOwnerCockpit.ts`
- `client/src/pages/manageOwnerCockpit.test.ts`
- `client/src/pages/Manage.tsx`
- `client/src/i18n/manage.ts`
- `docs/superpowers/plans/2026-07-09-owner-cockpit-release-risk-summary-slice.md`

## Behavior

- Publish freshness risk is prioritized as the next action when present.
- If there is no release risk, backlog work is prioritized before Agent gap review.
- If no release risk, backlog, or Agent gap exists, the panel shows a clear state.
- The panel uses existing owner-only data only; no new route, tRPC contract, DB schema, or public exposure was added.

## Verification

```bash
corepack pnpm test -- client/src/pages/manageOwnerCockpit.test.ts client/src/pages/manageReaderSignals.test.ts
corepack pnpm check
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/owner-cockpit-release-risk-summary-slice-2026-07-09/ui-layout-checks.json
git diff --check
```

Results:

- Focused Vitest command ran 79 files / 445 tests: passed.
- `check`: passed.
- `build`: passed.
- `audit:ui`: passed.
- `git diff --check`: passed.

## Visual Evidence

- `docs/product_optimization/reports/owner-cockpit-release-risk-summary-slice-2026-07-09/ui-layout-checks.json`
- `docs/product_optimization/reports/owner-cockpit-release-risk-summary-slice-2026-07-09/manage-owner-cockpit-desktop.png`

The screenshot was taken with a local signed admin cookie. In this environment, owner data requests did not fully settle before capture, so the screenshot is used as layout evidence for panel placement, not as populated-data evidence. Summary decision logic is covered by `manageOwnerCockpit.test.ts`.

## Risk Notes

- This is a summary layer over existing data, not a source of truth.
- The cockpit intentionally avoids raw private payloads and only references normalized reader signals.
- Future work can add direct links from the next-action callout to the exact reader signal or release report once status persistence exists.
