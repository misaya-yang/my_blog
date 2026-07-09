# Route Scroll Restoration Slice

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-reading-continuity-route-state-design.md`

## Goal

Preserve public discovery reading position when readers navigate from lists to articles and use browser back, without storing owner/editor route state or interfering with article hash deep links.

## Scope

In:

- Add a client helper for public-route scroll keys, storage parsing, and restore target policy.
- Save scroll position for home, public, and reader routes only.
- Restore saved scroll only on browser history navigation.
- Scroll to top for normal route changes without hash targets.
- Keep hash routes untouched so article heading deep links can handle their own target.

Out:

- No cross-device reading history.
- No analytics vendor or server persistence.
- No private Agent context in URL or storage.
- No owner/editor/system route restoration.
- No dependency addition.

## Tasks

- [x] Add helper tests for public route storage keys, route eligibility, hash behavior, and restore policy.
- [x] Implement `client/src/lib/routeScrollRestoration.ts`.
- [x] Wire `RouteEffectController` in `App.tsx`.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: restore public route scroll state`.

## Verification Commands

```bash
corepack pnpm test -- client/src/lib/routeScrollRestoration.test.ts client/src/pages/PostDetail.test.ts client/src/pages/Search.test.tsx
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- Restoration is session-local and bounded to public/reader routes.
- If a lazy route has not reached its previous height on the first frame, the controller retries once after a short delay.
- This does not change article heading hash behavior.
