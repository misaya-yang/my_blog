# Phase 02 - User Identity and RBAC Model

**Goal:** Add a durable local identity and role model for verified email users while preserving existing content ownership and admin gates.

**Architecture:** Extend the existing `users` table and session payloads instead of replacing the whole auth system. Supabase Auth verifies email ownership; the app stores a local user row and signs its own httpOnly session cookie for tRPC authorization.

**Tech Stack:** Drizzle/Postgres, `users` table, `server/auth.ts`, `server/db.ts`, Vitest.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-02
- GOAL_TARGET: Add local email identity and RBAC model for verified Supabase Auth users.
- GOAL_PROMPT: Complete EMAIL-02 User Identity and RBAC Model for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-02-user-identity-rbac-model.md`; extend local user/session role semantics for email-authenticated readers and owner emails, preserve existing admin protections, and finish after validation commands and acceptance gates pass.
- DEPENDS_ON: EMAIL-00, EMAIL-01
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file, `docs/email_rabc/reports/email-00-auth-baseline.md`, `docs/email_rabc/reports/email-01-provider-readiness.md`
- PRIMARY_CONTEXT: `drizzle/schema.ts`, `drizzle/relations.ts`, `server/db.ts`, `server/auth.ts`, `server/routers.ts`, `server/posts.test.ts`, `server/auth.logout.test.ts`, `server/schema-integrity.test.ts`, `.env.example`
- LIKELY_EDIT_PATHS: `drizzle/schema.ts`, new Drizzle migration, `server/db.ts`, `server/auth.ts`, `server/_core/env.ts`, auth-focused tests
- DO_NOT_EDIT: `client/src/pages/Login.tsx`, provider API implementation from EMAIL-03, public discovery/RSS/sitemap code unless tests prove role leakage
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/schema-integrity.test.ts server/posts.test.ts server/auth.logout.test.ts`
- BROWSER_CHECKS: none
- ACCEPTANCE_GATES: local user can represent email auth subject; owner email allowlist is parseable and normalized; session type can carry user id/email without exposing secrets; existing admin and visitor tests still pass; migration is generated but not applied to production without authorization

## Task Spec

Create the local identity layer needed by OTP verification.

Recommended model additions:

- `users.authProvider`: `legacy`, `supabase_email`, or compatible provider string.
- `users.authSubject`: Supabase Auth user id or provider subject.
- `users.emailVerifiedAt`: timestamp for verified email identity.
- Unique index for provider subject.
- Unique lowercased email behavior if feasible with current Drizzle/Postgres patterns.

Because `users.openId` is currently non-null and unique, do not remove it in this phase. For email-auth users, use a stable value such as `supabase:${supabaseUserId}` until a larger legacy migration is planned.

## Problem Boundary

In scope:

- Schema extension.
- Local user upsert helper.
- Role derivation helper.
- Session payload extension.
- Tests.

Out of scope:

- Calling Supabase Auth.
- Login UI changes.
- Production migration application.
- Password login removal.

## Product Requirements

### R1 Role Source of Truth

Admin authorization must be derived from normalized verified email and `OWNER_EMAILS`.

Rules:

- `normalizeEmail(" Owner@Example.COM ")` returns `owner@example.com`.
- If normalized email is in `OWNER_EMAILS`, session role is `admin`.
- If not, session role is `visitor` or `reader` according to existing app compatibility.
- A database `role="admin"` may mirror the allowlist but must not override a removed owner email.

### R2 Session Compatibility

Preserve current consumer behavior:

- `session.isAuthenticated`
- `session.isAdmin`
- `session.role`
- `session.displayName`

Add optional fields only where useful:

- `userId`
- `email`
- `authProvider`

Do not expose these fields in public HTML, RSS, sitemap, or Agent source cards.

### R3 Local User Upsert

Add a helper that can upsert a verified email identity:

Input shape:

```ts
{
  authProvider: "supabase_email";
  authSubject: string;
  email: string;
  name?: string | null;
  emailVerifiedAt: Date;
}
```

Expected behavior:

- Normalize email.
- Use `openId = "supabase:" + authSubject` for legacy compatibility.
- Update `lastSignedIn`.
- Set local `role` according to `OWNER_EMAILS`.

### R4 Legacy Compatibility

Existing Manus OAuth and password/nickname flows should keep passing tests until EMAIL-05 intentionally disables password admin login by default.

## Execution Capture

Run:

```bash
pnpm check
pnpm exec vitest run server/schema-integrity.test.ts server/posts.test.ts server/auth.logout.test.ts
```

If a migration is generated, include the migration filename in the phase completion report.

## Evaluator Protocol

EMAIL-02 is complete when the code can represent a verified email user locally and decide admin status without the login UI being changed yet.

## Acceptance Criteria

- New schema fields are reflected in tests.
- `OWNER_EMAILS` parsing rejects empty values and normalizes casing.
- Existing admin procedure tests still pass.
- No production DB migration is applied by this phase unless explicitly authorized.

## Risks

- Incorrect role precedence can accidentally keep admin access after an email is removed from `OWNER_EMAILS`.
- Removing `openId` too early would break existing OAuth/user relations.
- Unique email constraints must account for case normalization.
