# Route Scroll Restoration Slice

Date: 2026-07-09
Branch: dev
Spec source: `docs/superpowers/specs/2026-07-09-reading-continuity-route-state-design.md`

## Summary

Added session-local scroll restoration for public reading routes. The app now saves scroll position for home/public/reader routes, restores it on browser history navigation, keeps normal link navigation at the top of the next route, and leaves hash routes to article heading navigation.

## Changed Files

- `client/src/App.tsx`
- `client/src/lib/routeScrollRestoration.ts`
- `client/src/lib/routeScrollRestoration.test.ts`
- `docs/superpowers/plans/2026-07-09-route-scroll-restoration-slice.md`
- `docs/product_optimization/reports/route-scroll-restoration-slice-2026-07-09/*`
- `docs/product_optimization/reports/performance-budget-latest.json`

## User-Visible Behavior

- Reader scrolls a public list, opens an article, and browser back restores the list position.
- Normal route navigation still lands at the top of the destination route.
- Article `#heading` links are not overridden by route scroll restoration.
- Owner, editor, auth, and unknown routes are excluded from scroll persistence.

## Evidence

- `docs/product_optimization/reports/route-scroll-restoration-slice-2026-07-09/browser-checks.json`
- `docs/product_optimization/reports/route-scroll-restoration-slice-2026-07-09/ui-layout-checks.json`

Browser check result:

- normal article navigation scrolls to top: passed
- home scroll position is saved before route navigation: passed
- browser back restores saved home scroll: passed

## Validation

```bash
corepack pnpm test -- client/src/lib/routeScrollRestoration.test.ts client/src/pages/PostDetail.test.ts client/src/pages/Search.test.tsx
corepack pnpm check
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/route-scroll-restoration-slice-2026-07-09/ui-layout-checks.json
corepack pnpm audit:performance
corepack pnpm audit:css -- --no-output
git diff --check
```

Result: passed.

Note: the focused Vitest command currently runs the repo Vitest suite under this configuration; 74 files and 429 tests passed.

## Risk Notes

- Restoration is local to the current browser session and does not sync across devices.
- The hook stores route path/query and scroll offset only; it does not persist private Agent context or owner/editor routes.
- A retry is used after history navigation so lazy route height has a chance to settle before final restoration.
