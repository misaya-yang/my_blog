# Admin Auth Safe Return Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-admin-auth-session-boundary-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Return an owner to the intended owner route after admin login while keeping the return path constrained to safe in-app owner routes.

## Scope

In:

- Add a client helper for safe owner `returnTo` handling.
- Update owner auth-required login links to include the current route as `returnTo`.
- Update login success navigation to use safe `returnTo` when present.
- Add focused tests.
- Write evidence report.

Out:

- No auth provider changes.
- No password reset flow.
- No server session or cookie contract changes.
- No credential documentation.
- No public route redirect behavior changes.

## Tasks

- [x] Add safe return helper and tests.
- [x] Wire `AuthRequiredState` login link to safe `returnTo`.
- [x] Wire `Login` success redirect to safe `returnTo`.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: return admins to intended owner route`.

## Risk Notes

- Reject protocol-relative, absolute, and non-owner return values.
- Do not print or document admin credentials.
- This is a client navigation affordance only; server auth guards remain authoritative.
