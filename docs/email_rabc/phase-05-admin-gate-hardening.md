# Phase 05 - Admin Gate Hardening

**Goal:** Make owner-only access depend on verified owner email sessions and disable the shared admin password path by default.

**Architecture:** Preserve existing admin procedure boundaries, but change how admin sessions are created and verified. `OWNER_EMAILS` remains authoritative; password admin login is retained only as an explicitly enabled local fallback.

**Tech Stack:** tRPC admin procedures, `server/auth.ts`, `server/routers.ts`, `useAuth`, admin pages, Vitest, Browser.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-05
- GOAL_TARGET: Harden admin access around verified owner email sessions.
- GOAL_PROMPT: Complete EMAIL-05 Admin Gate Hardening for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-05-admin-gate-hardening.md`; make owner-only gates depend on verified owner email sessions, disable shared password login by default, preserve admin UX, and finish after validation commands, browser checks, and acceptance gates pass.
- DEPENDS_ON: EMAIL-03, EMAIL-04
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file
- PRIMARY_CONTEXT: `server/auth.ts`, `server/routers.ts`, `client/src/_core/hooks/useAuth.ts`, `client/src/pages/Manage.tsx`, `client/src/pages/ManageAgent.tsx`, `client/src/pages/Editor.tsx`, `client/src/pages/Login.tsx`, `server/posts.test.ts`, `server/content-ops.router.test.ts`, `server/engagement.router.test.ts`, `server/agent.router.test.ts`
- LIKELY_EDIT_PATHS: `server/auth.ts`, `server/routers.ts`, `client/src/_core/hooks/useAuth.ts`, `client/src/pages/Login.tsx`, auth/admin tests, `.env.example`, `docs/deployment.md`
- DO_NOT_EDIT: article content, public discovery behavior unless a role leak is found, Supabase provider dashboard settings
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/posts.test.ts server/content-ops.router.test.ts server/engagement.router.test.ts server/agent.router.test.ts server/auth.logout.test.ts`; `pnpm build`
- BROWSER_CHECKS: non-owner email cannot open `/manage`; owner email can open `/manage` when mocked/local auth allows; `/write` redirects or blocks unauthenticated users; `/manage/agent` remains owner-only; logout clears session
- ACCEPTANCE_GATES: shared admin password login is disabled by default; owner allowlist controls admin; non-owner verified email cannot access owner procedures; legacy fallback requires explicit env opt-in; no hidden/admin content leaks

## Task Spec

Tighten admin semantics after email OTP is available.

Required behavior:

- `verifyAdminSession` only returns true for a signed session whose normalized verified email is in `OWNER_EMAILS`.
- `adminLogin` password route is disabled unless `LEGACY_ADMIN_PASSWORD_LOGIN=true`.
- Error copy for disabled password login does not reveal configuration details to public users.
- Tests can still create admin callers through email-session helpers rather than password where appropriate.

## Problem Boundary

In scope:

- Admin session verification.
- Legacy password fallback gating.
- Admin route tests.
- Login page cleanup if password UI still exists.

Out of scope:

- MFA.
- Audit log tables.
- Team member management.
- Remote deploy.

## Product Requirements

### R1 Owner Allowlist Authority

Admin access checks must use normalized verified email and `OWNER_EMAILS`.

If an owner removes an email from `OWNER_EMAILS`, the next session verification should no longer grant admin for that email after cookie refresh or session expiry. Prefer checking allowlist at verification time over only at login time if feasible.

### R2 Legacy Fallback

If retained:

```env
LEGACY_ADMIN_PASSWORD_LOGIN="false"
```

Rules:

- False or missing in production means password admin login is unavailable.
- True enables old password path for local emergency use only.
- Tests should cover both disabled and enabled behavior if the route remains.

### R3 Protected Surfaces

Verify owner-only behavior for:

- post create/update/delete
- taxonomy create/update/delete
- feedback/subscriber list
- Agent admin retrieval/evals/status/radar/runs
- `/write`
- `/manage`
- `/manage/agent`

### R4 Cookie Hardening

Review:

- `HttpOnly`
- `Secure`
- `SameSite`
- path
- logout clearing both old and new cookies

Prefer `SameSite=Lax` for same-site blog auth unless a tested cross-site requirement exists.

## Execution Capture

Run:

```bash
pnpm check
pnpm exec vitest run server/posts.test.ts server/content-ops.router.test.ts server/engagement.router.test.ts server/agent.router.test.ts server/auth.logout.test.ts
pnpm build
```

Browser:

- Non-owner reader session blocked from `/manage`.
- Owner session reaches `/manage`.
- Logout returns to anonymous state.

## Evaluator Protocol

EMAIL-05 is complete when a leaked or guessed shared password is no longer the production admin risk.

## Acceptance Criteria

- Password admin login is not a production default.
- Owner email allowlist is tested.
- Non-owner verified users cannot call admin procedures.
- Existing public reader routes still work.
- Browser checks confirm admin and non-admin routing.

## Risks

- Removing password tests without replacing owner-email tests can weaken coverage.
- Cookie changes can break Vercel/proxy production sessions if not checked behind HTTPS.
