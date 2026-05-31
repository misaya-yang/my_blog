# Phase 01 - Provider and Domain Readiness

**Goal:** Prepare the project for production email OTP delivery without mutating external services from code.

**Architecture:** Add local configuration documentation and optional readiness checks for Supabase Auth and a transactional SMTP provider. External dashboard, DNS, and provider changes remain manual unless explicitly authorized.

**Tech Stack:** Supabase Auth, custom SMTP, Vercel env vars, DNS SPF/DKIM/DMARC, optional Node readiness script.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-01
- GOAL_TARGET: Prepare provider, domain, and environment readiness for email OTP login.
- GOAL_PROMPT: Complete EMAIL-01 Provider and Domain Readiness for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-01-provider-domain-readiness.md`; document Supabase Auth + custom SMTP setup, add safe env/readiness checks if useful, do not mutate external providers, and finish after validation commands and acceptance gates pass.
- DEPENDS_ON: EMAIL-00
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file, `docs/email_rabc/reports/email-00-auth-baseline.md`
- PRIMARY_CONTEXT: `.env.example`, `docs/deployment.md`, `package.json`, `server/_core/env.ts`, `scripts/audit/`, `server/vite-config.test.ts`
- LIKELY_EDIT_PATHS: `.env.example`, `docs/deployment.md`, `docs/email_rabc/reports/`, optional `scripts/audit/email-auth-readiness.ts`, optional `package.json`
- DO_NOT_EDIT: `client/src/pages/Login.tsx`, `server/routers.ts`, `server/auth.ts`, `drizzle/schema.ts`, production `.env.local` secrets except reading existing key names
- VALIDATION_COMMANDS: `pnpm check`; if a readiness script is added, run its package script and its focused test if added
- BROWSER_CHECKS: none
- ACCEPTANCE_GATES: setup runbook exists; env variable contract documented; readiness check is non-mutating; missing external credentials are reported as blockers not guessed; no provider/DNS mutation performed

## Task Spec

Add a provider readiness layer that tells the next engineer and the owner exactly what must exist before real OTP emails can be sent.

Recommended deliverables:

- `docs/email_rabc/reports/email-01-provider-readiness.md`
- A section in `docs/deployment.md` for Email Auth + RBAC.
- `.env.example` additions for email auth.
- Optional `scripts/audit/email-auth-readiness.ts` and `pnpm auth:email:check`.

## Problem Boundary

In scope:

- Documenting Supabase Auth and SMTP setup.
- Adding environment variable names.
- Adding non-writing checks for local env presence and URL shape.

Out of scope:

- Creating a Resend/Postmark/SendGrid account.
- Changing DNS records.
- Changing Supabase Auth SMTP settings.
- Sending production emails.
- Implementing login routes.

## Product Requirements

### R1 Environment Contract

Document these variables:

```env
EMAIL_AUTH_ENABLED="false"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
OWNER_EMAILS="owner@example.com"
AUTH_EMAIL_FROM="Misaya Blog <login@auth.misaya.online>"
AUTH_EMAIL_PROVIDER="supabase-smtp"
AUTH_EMAIL_OTP_TTL_SECONDS="600"
AUTH_EMAIL_RESEND_COOLDOWN_SECONDS="60"
```

Keep `JWT_SECRET` as required for app sessions.

### R2 External Setup Checklist

Document:

- Supabase Auth Email provider enabled.
- OTP email template uses a code, not only a magic link.
- Custom SMTP configured in Supabase Auth.
- Sender domain verified at the email provider.
- SPF and DKIM pass.
- DMARC is present or explicitly deferred.
- Production redirect URLs are configured if Magic Link is ever enabled.

### R3 Deliverability Scope

State that "all mainstream email providers" means the app sends standard transactional email to arbitrary valid addresses. It does not mean integrating Gmail, Outlook, QQ, or 163 as OAuth providers.

### R4 Non-Mutating Readiness

If a script is added, it should:

- Check required env keys.
- Check that `SUPABASE_URL` is an HTTPS Supabase URL.
- Check `OWNER_EMAILS` parses into valid lowercase emails.
- Print manual checks for SMTP/DNS.
- Exit non-zero when required local configuration is missing and `EMAIL_AUTH_ENABLED=true`.

It must not:

- Send email.
- Call provider mutation APIs.
- Read or print secrets.

## Execution Capture

Run:

```bash
pnpm check
```

If a readiness script is added:

```bash
pnpm auth:email:check
```

Record output in `docs/email_rabc/reports/email-01-provider-readiness.md`.

## Evaluator Protocol

EMAIL-01 is complete when a future agent can tell whether the codebase is ready to implement OTP and what external owner actions are still required.

## Acceptance Criteria

- `.env.example` includes email auth variables with safe placeholder values.
- `docs/deployment.md` includes an Email Auth + RBAC section or links to a dedicated runbook.
- Provider setup docs distinguish local code readiness from external dashboard/DNS setup.
- No external service is mutated.

## Risks

- Without custom SMTP, Supabase default email delivery is not production-ready.
- Poor DNS or template choices can make OTP emails land in spam even when code is correct.
- Auth email sender reputation should be separated from newsletter or marketing sender reputation.
