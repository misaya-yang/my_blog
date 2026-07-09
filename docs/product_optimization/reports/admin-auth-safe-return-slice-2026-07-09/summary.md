# Admin Auth Safe Return Slice

Date: 2026-07-09
Status: Passed
Branch: dev

## Summary

Added safe owner-route return handling for admin login. When an unauthenticated owner opens `/manage`, `/manage/agent`, or `/write`, the login link now carries a constrained `returnTo` target. After successful admin login, the client returns to that owner route if and only if the target is a safe in-app owner path.

## Changed Files

- `client/src/lib/adminReturnTo.ts`
- `client/src/lib/adminReturnTo.test.ts`
- `client/src/components/ResearchShell.tsx`
- `client/src/pages/Login.tsx`
- `docs/superpowers/plans/2026-07-09-admin-auth-safe-return-slice.md`

## Behavior

- Allows owner return paths under `/manage` and `/write`, including safe query/hash parts.
- Rejects absolute URLs, protocol-relative URLs, backslash paths, `/login`, and public routes.
- Keeps server auth/session/cookie contracts unchanged.
- Does not print, store, or document credentials.

## Verification

```bash
corepack pnpm test -- client/src/lib/adminReturnTo.test.ts client/src/components/ResearchShell.test.tsx client/src/pages/ManageAgent.test.tsx client/src/pages/PostDetail.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

Results:

- Focused Vitest command ran 81 files / 453 tests: passed.
- `check`: passed after tightening `isSafeAdminReturnPath` into a type guard.
- `build`: passed.
- `git diff --check`: passed.

## Risk Notes

- This is a client navigation affordance only; owner data and mutations remain protected by server guards.
- New owner routes should be added to the safe return prefix list only after confirming they are admin-only routes.
