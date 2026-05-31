# Email Auth + RBAC PRD Roadmap

**Date:** 2026-05-31

**Owner:** Misaya Yang personal AI research blog

**Purpose:** Replace the current admin-password and nickname-only login experience with production-grade email OTP authentication and server-side role-based access control. The folder name keeps the requested `email_rabc` path; the product concept is Email Auth + RBAC.

---

## Coding Agent Loading Protocol

This directory is designed for coding agents that will not load every markdown file.

## Quick Navigation

- Start here: `README.md`
- Compact phase index: `phase-manifest.md`
- Copy/paste execution prompt: `goal-prompt.md`
- Implementation rules and blocker policy: `execution-guide.md`
- Completion report template: `reports/phase-report-template.md`

When assigned the folder-level goal:

1. Open this `README.md`.
2. Open `phase-manifest.md`.
3. Open `execution-guide.md`.
4. Execute phases in dependency order:

```text
EMAIL-00 -> EMAIL-01 -> EMAIL-02 -> EMAIL-03 -> EMAIL-04 -> EMAIL-05 -> EMAIL-06 -> EMAIL-07
```

5. For each phase, open only the target phase file and its `PRIMARY_CONTEXT`.
6. Use the phase `GOAL_PROMPT` as the current sub-goal.
7. Treat `LIKELY_EDIT_PATHS` as the intended write boundary.
8. Do not edit paths listed in `DO_NOT_EDIT`.
9. Run `VALIDATION_COMMANDS`.
10. Run `BROWSER_CHECKS` for UI/product phases.
11. Check every `ACCEPTANCE_GATES` item before moving to the next phase.

Every phase file begins with a `Coding Agent Contract` block containing stable grep anchors:

- `PHASE_ID`
- `GOAL_TARGET`
- `GOAL_PROMPT`
- `DEPENDS_ON`
- `READ_FIRST`
- `PRIMARY_CONTEXT`
- `LIKELY_EDIT_PATHS`
- `DO_NOT_EDIT`
- `VALIDATION_COMMANDS`
- `BROWSER_CHECKS`
- `ACCEPTANCE_GATES`

Use these anchors instead of relying on long prose.

## Folder-Level Goal Prompt

Use `goal-prompt.md` when starting a long-running Codex goal. The same prompt is included below for convenience:

```text
You are working in /Users/yang/projects/ai-tech-blog.

Create and maintain one long-running GLOBAL GOAL:

Complete the Email Auth + RBAC roadmap in docs/email_rabc, phase by phase, from EMAIL-00 through EMAIL-07. The end state is a production-ready email OTP login system: Supabase Auth backed verification, custom SMTP readiness, owner email allowlist, durable user role mapping, hardened admin gates, reader email identity, engagement integration, and release/deliverability checks.

Start by reading only:
1. docs/email_rabc/README.md
2. docs/email_rabc/phase-manifest.md

Then execute phases in dependency order:
EMAIL-00 -> EMAIL-01 -> EMAIL-02 -> EMAIL-03 -> EMAIL-04 -> EMAIL-05 -> EMAIL-06 -> EMAIL-07

For each phase:
- Open only the target phase file and its PRIMARY_CONTEXT.
- Use the phase GOAL_PROMPT as the current sub-goal.
- Stay inside LIKELY_EDIT_PATHS unless the phase clearly requires otherwise.
- Do not edit paths listed in DO_NOT_EDIT.
- Implement the smallest complete solution for that phase.
- Run VALIDATION_COMMANDS.
- Run BROWSER_CHECKS for UI/product phases.
- Check every ACCEPTANCE_GATES item.
- If validation fails, fix and retest before moving on.
- When a phase is complete, automatically continue to the next phase.

Global constraints:
- Prefer Supabase Auth email OTP plus a custom SMTP provider over custom-built OTP storage.
- Do not build password login, open admin registration, social OAuth, MFA, passkeys, or public profile pages in this roadmap.
- Do not expose admin/hidden/draft content to non-admin readers.
- OWNER_EMAILS is the authoritative admin allowlist.
- A verified email that is not in OWNER_EMAILS becomes a reader identity, never an admin.
- External provider configuration, DNS changes, production DB migrations, deploys, and pushes require phase authorization; otherwise document them as blockers or run non-writing validation.
- Do not revert unrelated user changes.
- Do not claim completion without validation evidence.

After each phase, write a concise completion report:
- GLOBAL_GOAL_PROGRESS
- CURRENT_PHASE
- STATUS: complete or blocked
- CHANGED_FILES
- VALIDATION_COMMANDS and results
- BROWSER_CHECKS and results, if applicable
- ACCEPTANCE_GATES pass/fail evidence
- RISKS_OR_BLOCKERS
- NEXT_PHASE

Begin with EMAIL-00:
docs/email_rabc/phase-00-auth-baseline.md
```

## Folder Files

| File | Purpose |
| --- | --- |
| `README.md` | Product thesis, architecture, global constraints, and loading protocol. |
| `phase-manifest.md` | Compact phase index for grep-first execution. |
| `goal-prompt.md` | One copy/paste prompt for a new Codex goal-mode session. |
| `execution-guide.md` | Practical rules for implementation, blockers, validation evidence, and external services. |
| `phase-00-auth-baseline.md` | Baseline-only auth audit. |
| `phase-01-provider-domain-readiness.md` | Supabase Auth, SMTP, env, and DNS readiness. |
| `phase-02-user-identity-rbac-model.md` | Local user identity and role model. |
| `phase-03-email-otp-auth-api.md` | Backend OTP request/verify API. |
| `phase-04-login-ux-replacement.md` | Login page replacement with email OTP states. |
| `phase-05-admin-gate-hardening.md` | Owner-only access hardening. |
| `phase-06-reader-identity-engagement.md` | Reader identity integration with feedback, subscriptions, and Agent ownership. |
| `phase-07-release-deliverability-gate.md` | Final release, provider, browser, and deliverability gate. |
| `reports/phase-report-template.md` | Standard completion report structure. |

## Product Thesis

The blog should support email login for any mainstream mailbox provider without becoming a SaaS account system.

The target behavior:

- Any reader can enter a valid email address and receive a one-time verification code.
- Gmail, Outlook, iCloud, QQ, 163, company mailboxes, and other normal inboxes should work as recipients.
- The app treats email ownership as the identity proof.
- Only emails in `OWNER_EMAILS` get admin capabilities.
- Everyone else gets a reader identity that can later support feedback, subscriptions, Agent history, and bookmarks.

The implementation should not build its own OTP database if Supabase Auth can provide the verification primitive.

## Recommended Architecture

Use:

- **Supabase Auth Email OTP** for identity verification.
- **Custom SMTP provider** configured in Supabase Auth for production deliverability.
- **Existing Drizzle/Postgres `users` table** as the local product user and role mirror.
- **Existing app JWT cookies** for server-side tRPC authorization, with stronger payloads.
- **`OWNER_EMAILS` allowlist** as the source of truth for admin access.

Do not:

- Keep admin password login as the main production path.
- Grant admin based only on a database row created by a public login.
- Put service-role keys in the browser.
- Mix auth emails with newsletter/marketing emails.
- Treat successful subscription as an authenticated account.

## External Setup Reality

This roadmap has unavoidable external dependencies:

- A Supabase project with Auth enabled.
- A transactional email provider account such as Resend, Postmark, SendGrid, Mailgun, Brevo, or AWS SES.
- DNS access for `misaya.online` or a subdomain such as `auth.misaya.online`.
- Verified SPF, DKIM, and preferably DMARC records.
- Vercel environment variables.

If these are missing, implementation agents should stop the affected phase as `blocked` after completing local/non-writing checks.

## Current Codebase Anchors

Existing auth surfaces:

- `server/auth.ts`: signed `admin_session` and `visitor_session` cookies.
- `server/routers.ts`: `auth.session`, `visitorLogin`, `adminLogin`, logout, and admin procedure guard.
- `client/src/pages/Login.tsx`: nickname visitor tab plus admin password tab.
- `client/src/_core/hooks/useAuth.ts`: current session state consumed by admin and Agent surfaces.
- `drizzle/schema.ts`: `users` table currently centered on `openId`, with `email` and `role` but no email-auth metadata.
- `server/_core/cookies.ts`: session cookie options.
- `docs/deployment.md` and `.env.example`: deployment and env documentation.

Existing protected owner surfaces:

- `/write`
- `/write/:slug`
- `/manage`
- `/manage/agent`
- admin tRPC procedures for posts, taxonomy, engagement, and Agent operations.

## Source References

Use official docs as the product and implementation reference:

- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase passwordless email logins: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase `signInWithOtp`: https://supabase.com/docs/reference/javascript/auth-signinwithotp
- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Resend domain verification: https://resend.com/docs/dashboard/domains/introduction

Important implications from these references:

- Supabase Auth supports magic links and OTP.
- Production email Auth should use a custom SMTP provider.
- Supabase's default email sender is restricted and rate-limited.
- Deliverability depends on domain verification and email authentication records.

## Phase Order

| Phase | Name | Core Outcome |
| --- | --- | --- |
| EMAIL-00 | Auth Baseline and Decision Record | Snapshot current login/session/admin gates and record the chosen email OTP architecture. |
| EMAIL-01 | Provider and Domain Readiness | Add env/runbook/readiness checks for Supabase Auth and custom SMTP without mutating external services. |
| EMAIL-02 | User Identity and RBAC Model | Extend local user/session model for email-authenticated readers and owner allowlist admin roles. |
| EMAIL-03 | Email OTP Auth API | Add request/verify OTP tRPC endpoints through a provider adapter and tests with mocked Supabase Auth. |
| EMAIL-04 | Login UX Replacement | Replace the rough password/nickname-first login page with a polished email OTP flow. |
| EMAIL-05 | Admin Gate Hardening | Make owner-only access depend on verified owner email sessions; legacy password login becomes disabled by default. |
| EMAIL-06 | Reader Identity Integration | Connect verified reader identity to feedback, subscriptions, and Agent conversation ownership without leaking emails. |
| EMAIL-07 | Release and Deliverability Gate | Document provider setup, validate production config, run browser checks, and add release evidence. |

## Global Non-Goals

- Password accounts.
- Social OAuth.
- Passkeys.
- MFA enrollment.
- Public user profiles.
- Team/organization management.
- User-generated public comments as part of auth work.
- Newsletter sending automation beyond auth email deliverability.
- Replacing Supabase Auth with a hand-rolled OTP table.

## Standard Verification Commands

Run the smallest relevant subset for each phase, and the full set before release:

```bash
pnpm check
pnpm test
pnpm build
pnpm audit:baseline:quick
```

Auth-focused phases should also run:

```bash
pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts
```

Engagement identity phases should also run:

```bash
pnpm exec vitest run server/engagement.router.test.ts server/agent.router.test.ts
```

UI phases should use the Codex in-app Browser against:

- `/login`
- `/manage`
- `/manage/agent`
- one public article
- mobile `390x844`
