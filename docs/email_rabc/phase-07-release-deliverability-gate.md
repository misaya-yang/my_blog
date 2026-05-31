# Phase 07 - Release and Deliverability Gate

**Goal:** Make email auth releasable by validating configuration, UI flows, admin gates, deliverability assumptions, and deployment documentation.

**Architecture:** Treat email login release as a cross-system gate: app code, Supabase Auth, SMTP provider, DNS, Vercel env vars, browser UX, and admin authorization must all pass or be documented as blocked.

**Tech Stack:** Vercel deployment, Supabase Auth dashboard, SMTP provider dashboard, DNS, Browser, project tests.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-07
- GOAL_TARGET: Finalize release and deliverability checks for Email Auth + RBAC.
- GOAL_PROMPT: Complete EMAIL-07 Release and Deliverability Gate for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-07-release-deliverability-gate.md`; validate local tests, browser flows, deployment docs, provider readiness, and production smoke checks, and finish only after acceptance gates pass or external blockers are clearly documented.
- DEPENDS_ON: EMAIL-05, EMAIL-06
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file
- PRIMARY_CONTEXT: `docs/deployment.md`, `.env.example`, `package.json`, `server/auth.ts`, `server/routers.ts`, `client/src/pages/Login.tsx`, `server/posts.test.ts`, `server/engagement.router.test.ts`, `server/agent.router.test.ts`, `scripts/audit/`
- LIKELY_EDIT_PATHS: `docs/deployment.md`, `docs/email_rabc/reports/`, `.env.example`, optional readiness scripts/tests
- DO_NOT_EDIT: application auth logic unless a release-blocking bug is found and fixed with tests; production provider settings unless explicitly authorized
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`; `pnpm audit:baseline:quick`; optional `pnpm auth:email:check`
- BROWSER_CHECKS: local `/login`; local owner login if test OTP available; local non-owner login if test OTP available; `/manage` access/deny; production `/login` after deploy if authorized; mobile `390x844`
- ACCEPTANCE_GATES: release report exists; full validation commands pass; external provider checklist is pass/blocker; admin/non-admin auth behavior verified; production deployment status recorded if deploy authorized; rollback notes documented

## Task Spec

Create `docs/email_rabc/reports/email-07-release-readiness.md` with:

- Local validation results.
- Browser check results.
- Provider/DNS checklist.
- Env checklist for Vercel.
- Test inbox results if available.
- Production deployment status if authorized.
- Rollback plan.

## Problem Boundary

In scope:

- Documentation.
- Final validation.
- Non-mutating readiness checks.
- Production smoke only if deployment and external provider use are authorized.

Out of scope:

- New auth feature work.
- New providers.
- Email marketing automation.
- Large UI redesign.

## Product Requirements

### R1 Provider Checklist

Record status for:

- Supabase Auth Email provider enabled.
- Custom SMTP enabled.
- Sender domain verified.
- SPF passing.
- DKIM passing.
- DMARC present or explicitly deferred.
- OTP template short, branded, and not marketing-heavy.
- Rate limits acceptable for expected traffic.

### R2 Test Inbox Matrix

If test accounts are available, verify delivery to at least:

- Gmail
- Outlook/Hotmail
- one Chinese mailbox such as QQ or 163

If accounts are unavailable, document as blocker. Do not invent deliverability results.

### R3 Production Smoke

If deploy is authorized:

- Open `https://misaya.online/login`.
- Request OTP to owner test email.
- Verify owner can reach `/manage`.
- Verify non-owner email cannot reach `/manage`.
- Verify logout clears session.

If deploy is not authorized, complete local release readiness and mark production smoke as blocked.

### R4 Rollback Plan

Document:

- env flag to disable email login
- whether legacy password fallback exists
- previous deployment rollback path
- how to restore admin access safely

## Execution Capture

Run:

```bash
pnpm check
pnpm test
pnpm build
pnpm audit:baseline:quick
```

If available:

```bash
pnpm auth:email:check
```

Browser checks must use Codex in-app Browser, not the user's Chrome.

## Evaluator Protocol

EMAIL-07 is complete when the system can be shipped or the only remaining blockers are external credentials/DNS/provider actions explicitly listed for the owner.

## Acceptance Criteria

- Release readiness report exists.
- All local validation commands pass.
- Browser evidence covers login, admin allow/deny, logout, and mobile.
- Provider/DNS status is documented.
- No raw reader email appears in public discovery, RSS, sitemap, or Agent source cards.
- Rollback plan is actionable.

## Risks

- Email delivery can pass technically but still land in spam; test inbox evidence matters.
- Production auth failures can lock out the owner if no fallback or rollback plan exists.
