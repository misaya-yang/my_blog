# Phase 00 - Auth Baseline and Decision Record

**Goal:** Capture the current authentication, session, and owner-gate behavior before changing login.

**Architecture:** Produce a baseline report only. Do not change product code. The report should identify current password and nickname flows, protected routes, session cookies, user schema constraints, and the chosen Email OTP + RBAC target architecture.

**Tech Stack:** Existing Express/tRPC auth router, `server/auth.ts`, Drizzle schema, React login page, Vitest.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-00
- GOAL_TARGET: Capture current auth baseline and record Email OTP + RBAC implementation decision.
- GOAL_PROMPT: Complete EMAIL-00 Auth Baseline for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-00-auth-baseline.md`; produce a baseline report only, do not change product code, and finish after validation commands and acceptance gates pass.
- DEPENDS_ON: none
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file
- PRIMARY_CONTEXT: `server/auth.ts`, `server/routers.ts`, `client/src/pages/Login.tsx`, `client/src/_core/hooks/useAuth.ts`, `drizzle/schema.ts`, `server/posts.test.ts`, `server/auth.logout.test.ts`, `.env.example`, `docs/deployment.md`
- LIKELY_EDIT_PATHS: `docs/email_rabc/reports/`
- DO_NOT_EDIT: `server/**`, `client/**`, `drizzle/**`, `package.json`, `.env*`
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts`
- BROWSER_CHECKS: optional `/login` visual snapshot only; no product changes expected
- ACCEPTANCE_GATES: baseline report exists; current auth flows documented; admin-only surfaces listed; external dependencies listed; target architecture decision recorded; no product code changed

## Task Spec

Create `docs/email_rabc/reports/email-00-auth-baseline.md` with:

- Current login UX summary.
- Current cookies and JWT payloads.
- Current admin guard behavior.
- Current user table constraints.
- Current tests covering auth.
- Known security/product gaps.
- Decision record: Supabase Auth Email OTP + custom SMTP + `OWNER_EMAILS` allowlist.

## Problem Boundary

In scope:

- Reading code.
- Running validation.
- Writing a docs report.

Out of scope:

- Editing auth implementation.
- Adding dependencies.
- Generating migrations.
- Changing production provider settings.

## Context Policy

Use `rg` to locate auth call sites:

```bash
rg -n "adminLogin|visitorLogin|verifyAdminSession|resolveBlogSession|adminProcedure|isAdmin|visitor_session|admin_session" server client/src
```

Use the report to record exact file references. Do not load unrelated docs or entire generated reports.

## Product Requirements

### R1 Current State Inventory

The report must list:

- password admin login
- nickname visitor login
- logout behavior
- session query behavior
- owner-only routes
- admin tRPC procedures

### R2 Risk Inventory

The report must identify:

- shared password weakness
- no email identity proof
- no durable reader account
- limited role semantics
- operational dependency on `ADMIN_PASSWORD`
- any cookie setting concerns observed in `server/_core/cookies.ts`

### R3 Decision Record

The report must state:

- OTP code entry is the MVP.
- Magic Link is deferred unless a later phase explicitly adds callback handling.
- Supabase Auth verifies email ownership.
- Custom SMTP is required for production.
- `OWNER_EMAILS` is authoritative for admin authorization.

## Execution Capture

Run:

```bash
pnpm check
pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts
git status --short
```

Capture command outcomes in the report.

## Evaluator Protocol

EMAIL-00 is complete when another agent can read the report and understand exactly what is being replaced and what must remain protected.

## Acceptance Criteria

- `docs/email_rabc/reports/email-00-auth-baseline.md` exists.
- The report has no unverified claims about external provider configuration.
- The worktree has no product code changes.
- Validation evidence is included.

## Risks

- If the baseline skips admin procedure inventory, later phases may miss a protected route.
- If the decision record is vague, later phases may accidentally build custom OTP storage or password accounts.
