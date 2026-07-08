# Admin Auth And Session Boundary Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md)

## Summary

Owner routes are powerful: writing, publishing, managing content, and Agent operations. This spec defines the auth/session boundary so UI improvements and backlog flows do not accidentally weaken admin protection or expose private operational data.

## Goals

- Keep admin-only routes and mutations protected.
- Make login/logout/session states clear in UI.
- Avoid committing or documenting production credentials.
- Preserve public route behavior for non-admin readers.
- Keep owner links safe when seeded from reader signals or Agent gaps.

## Non-Goals

- No new auth provider.
- No password reset flow in this spec.
- No role system unless separately approved.
- No schema migration.

## Current Evidence

- Client auth hook exists in `client/src/_core/hooks/useAuth.ts`.
- Login page exists in `client/src/pages/Login.tsx`.
- Auth router and session code exist in `server/auth.router.ts` and `server/auth.ts`.
- Admin procedure guard exists in `server/blogAdminProcedure.ts`.
- Owner routes are `/write`, `/write/:slug`, `/manage`, and `/manage/agent`.

## Boundary Contract

### Public Reader

- Can read only public published posts and public discovery routes.
- Can submit feedback or subscriptions through allowed public engagement endpoints.
- Cannot see owner navigation as an available action.
- Cannot infer hidden/draft article titles from errors, search, Agent sources, RSS, sitemap, or static index.

### Admin Owner

- Can access write/manage routes after verified session.
- Can include unpublished content only through admin-aware endpoints.
- Can perform post/category/tag mutations only through guarded procedures.
- Can see operational reports where private content has been redacted or is intentionally local/admin-only.

### Session UI

- Unauthorized owner routes should show a clear login-required state.
- Login success should return owner to the intended route when safe.
- Logout should invalidate the session and return to a public-safe or login route.
- Session expiry should not leave stale owner data visible as active UI.

### Secret Handling

- Admin passwords, tokens, cookies, database URLs, provider keys, and production credentials are never written to docs, reports, commit messages, screenshots, or chat output.
- Tests must use fake credentials or environment stubs.
- Debug output should indicate missing configuration without printing values.

## Acceptance Checklist

- Owner route tests cover unauthenticated, authenticated, and logout behavior.
- Admin mutations are protected by `blogAdminProcedure` or an equivalent guard.
- Public discovery and Agent tests prove hidden/draft content remains hidden.
- Backlog/editor links use safe intent params, not private reader text or credentials.
- Docs and reports contain no credential-like values.

## Validation

```bash
corepack pnpm test -- server/auth.logout.test.ts server/posts.test.ts server/discovery.router.test.ts client/src/pages/ManageAgent.test.tsx client/src/pages/PostDetail.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```
