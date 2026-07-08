# Accessibility Automation Baseline Slice Report

Date: 2026-07-09
Branch: `dev`
Commit target: `feat: add accessibility ui audit baseline`

## Outcome

- Extended `audit:ui` with route-level accessibility baseline checks.
- Covered home, article, search zero-state, manage, and manage-agent at `320x844`.
- Added checks for main landmark, single primary heading, focusable controls, icon-only button names, `time` dateTime, active navigation `aria-current`, reduced-motion CSS, and no horizontal overflow.
- Fixed the article route's loaded state so the reader body sits inside a `main` landmark.
- Added an `h1` to unauthenticated owner route states through `AuthRequiredState`.
- Added `aria-current="page"` to active public header links.

## Changed Files

- `scripts/audit/ui-layout.ts`
- `client/src/pages/PostDetail.tsx`
- `client/src/components/ResearchShell.tsx`
- `docs/superpowers/plans/2026-07-09-accessibility-automation-baseline-slice.md`
- `docs/product_optimization/reports/accessibility-automation-baseline-slice-2026-07-09/ui-layout-checks.json`

## Evidence

- UI audit report: `docs/product_optimization/reports/accessibility-automation-baseline-slice-2026-07-09/ui-layout-checks.json`
- Total UI audit route checks: 13.
- Accessibility baseline routes: 5.
- All accessibility baseline routes passed:
  - `/`
  - `/post/goal-harness-agent-phase-protocol`
  - `/search?q=zzzz-no-hit-ui-audit`
  - `/manage`
  - `/manage/agent`

## Verification

- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/accessibility-automation-baseline-slice-2026-07-09/ui-layout-checks.json`
  - Passed.
- `corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/ResearchShell.test.tsx`
  - Passed. Vitest executed the full suite: 72 files, 417 tests.

## Code Quality Notes

- No new dependency. This follows the spec's phase-1 strategy instead of adding axe/pa11y.
- The audit stays bounded to stable DOM facts and avoids brittle visual scoring.
- The UI fixes are semantic only: no layout redesign, no route changes, no API changes.

## Known Risks

- These checks are baseline guardrails, not full WCAG certification.
- Keyboard traversal depth and screen-reader transcript checks remain future work.
