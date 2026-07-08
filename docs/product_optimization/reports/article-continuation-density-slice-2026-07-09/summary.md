# Article Continuation Density Slice

Date: 2026-07-09
Branch: dev

## Scope

- Added an article continuation contract to `client/src/lib/articleLayout.ts`:
  - continuation max width: `78ch`
  - response split breakpoint: `900px`
  - response order: feedback, then subscription
  - secondary order: author, then share
- Reworked the post-body footer in `client/src/pages/PostDetail.tsx` into one `article-continuation-shell`.
- Moved share tools below reader response and author context so the first post-body continuation remains reading-oriented.
- Kept all existing share handlers, author links, feedback mutation, subscription mutation, and related/series links intact.
- Changed `SubscriptionForm` rows to stack vertically so the article subscription column no longer crushes the optional topics input at desktop/tablet widths.
- Added scoped continuation styles in `client/src/styles/visual-refresh.css` without increasing legacy `!important` count.

## Evidence

- Browser probe JSON: `docs/product_optimization/reports/article-continuation-density-slice-2026-07-09/article-continuation-probes.json`
- UI audit JSON: `docs/product_optimization/reports/article-continuation-density-slice-2026-07-09/ui-layout-checks.json`
- Viewport screenshots:
  - `desktop-light-1440.png`
  - `desktop-dark-1440.png`
  - `tablet-light-1024.png`
  - `tablet-dark-1024.png`
  - `boundary-light-899.png`
  - `boundary-dark-899.png`
  - `boundary-light-900.png`
  - `boundary-dark-900.png`
  - `mobile-light-390.png`
  - `mobile-dark-390.png`

Probe results for `/post/goal-harness-agent-phase-protocol`:

| Case | Overflow | Response columns | Subscription width | Share width |
| --- | --- | --- | --- | --- |
| 1440 light | false | `368.094px 320px` | 320px | 416px |
| 1440 dark | false | `368.094px 320px` | 320px | 416px |
| 1024 light | false | `423.125px 346.969px` | 347px | 416px |
| 1024 dark | false | `423.125px 346.969px` | 347px | 416px |
| 899 light | false | `786.094px` | 786px | 416px |
| 899 dark | false | `786.094px` | 786px | 416px |
| 900 light | false | `423.125px 346.969px` | 347px | 416px |
| 900 dark | false | `423.125px 346.969px` | 347px | 416px |
| 390 light | false | `326px` | 326px | 326px |
| 390 dark | false | `326px` | 326px | 326px |

Document-order check:

- Desktop shell document Y: `15794`, handoff document Y: `15525`.
- Tablet shell document Y: `15565`, handoff document Y: `15300`.
- Mobile shell document Y: `19431`, handoff document Y: `19058`.
- In all checked viewports, continuation appears after the handoff and before response/share utilities.

## CSS Debt

- `!important` count in `client/src/styles/visual-refresh.css`: 199 -> 199.
- New dependencies: none.
- New broad selectors: none outside article continuation/readability scope.
- Viewport font sizing: no new readable-text viewport font sizing.
- Hard-coded color debt: unchanged; this slice uses existing `--public-*` tokens for new continuation surfaces.

## Verification

- `corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/ArticleFeedback.test.tsx client/src/components/SeriesProgress.test.tsx` passed. Vitest executed the current suite: 63 files, 359 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-continuation-density-slice-2026-07-09/ui-layout-checks.json` passed.
- `git diff --check` passed.
- Sensitive scan found no actual credentials. Matches were limited to plan constraints and the scan command itself.

## Review Notes

- Subagent review found three issues before commit:
  - continuation order contract did not match DOM order;
  - `900px` split contract only covered the response grid, not head/meta;
  - one new selector pair was wider than necessary.
- Fixes applied:
  - contract now records secondary order as `author -> share`, matching the intended low-priority utility order;
  - continuation head/meta are stacked below `900px` and split at `900px+`;
  - author/share selectors are scoped under `.paper-reader-main` and `.article-continuation-meta`.
- Added 899/900px light/dark browser probes after the review fix.

## Residual Risk

- The feedback form itself is still visually heavy because it exposes the full private-feedback form after the first continuation path. A later slice should consider a progressive disclosure variant for optional message/contact fields.
- This slice does not change Agent answer/source behavior or Markdown rendering coverage.
