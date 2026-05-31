# Email Auth + RBAC Phase Manifest

This is the compact index for coding agents. Prefer this file plus the target phase file over loading the whole directory.

## Grep Usage

Find a phase:

```bash
rg -n "PHASE_ID: EMAIL-03" docs/email_rabc
```

Find all goal prompts:

```bash
rg -n "GOAL_PROMPT:" docs/email_rabc
```

Find validation commands:

```bash
rg -n "VALIDATION_COMMANDS:" docs/email_rabc
```

Find acceptance gates:

```bash
rg -n "ACCEPTANCE_GATES:" docs/email_rabc
```

## Phase Index

| PHASE_ID | File | Depends On | Goal Target | Main Validation |
| --- | --- | --- | --- | --- |
| EMAIL-00 | `phase-00-auth-baseline.md` | none | Capture current auth/session/admin-gate baseline and architecture decision. | `pnpm check`, targeted auth tests |
| EMAIL-01 | `phase-01-provider-domain-readiness.md` | EMAIL-00 | Prepare env/runbook/readiness checks for Supabase Auth + custom SMTP. | `pnpm check`, readiness script if added |
| EMAIL-02 | `phase-02-user-identity-rbac-model.md` | EMAIL-00, EMAIL-01 | Add local email identity and RBAC model without changing public login UX yet. | schema/auth tests |
| EMAIL-03 | `phase-03-email-otp-auth-api.md` | EMAIL-02 | Add email OTP request/verify API through a provider adapter. | auth router tests |
| EMAIL-04 | `phase-04-login-ux-replacement.md` | EMAIL-03 | Replace rough login UI with email OTP login states. | UI tests and Browser checks |
| EMAIL-05 | `phase-05-admin-gate-hardening.md` | EMAIL-03, EMAIL-04 | Harden owner-only gates around verified owner email sessions. | auth/admin tests and Browser checks |
| EMAIL-06 | `phase-06-reader-identity-engagement.md` | EMAIL-05 | Use verified reader identity for feedback, subscriptions, and Agent ownership. | engagement and agent tests |
| EMAIL-07 | `phase-07-release-deliverability-gate.md` | EMAIL-05, EMAIL-06 | Finalize deployment docs, provider checks, and production smoke evidence. | full release checklist |

## Phase Report Index

| PHASE_ID | Required Report |
| --- | --- |
| EMAIL-00 | `reports/email-00-auth-baseline.md` |
| EMAIL-01 | `reports/email-01-provider-readiness.md` |
| EMAIL-02 | `reports/email-02-user-rbac-model.md` |
| EMAIL-03 | `reports/email-03-email-otp-api.md` |
| EMAIL-04 | `reports/email-04-login-ux.md` |
| EMAIL-05 | `reports/email-05-admin-gates.md` |
| EMAIL-06 | `reports/email-06-reader-identity.md` |
| EMAIL-07 | `reports/email-07-release-readiness.md` |

Use `reports/phase-report-template.md` for every report.

## Dependency Flow

```text
EMAIL-00 Baseline
  -> EMAIL-01 Provider and Domain Readiness
      -> EMAIL-02 User Identity and RBAC Model
          -> EMAIL-03 Email OTP Auth API
              -> EMAIL-04 Login UX Replacement
              -> EMAIL-05 Admin Gate Hardening
                  -> EMAIL-06 Reader Identity Integration
                      -> EMAIL-07 Release and Deliverability Gate
```

## Validation Matrix

| PHASE_ID | Mutates DB? | Needs External Provider? | Needs Browser? | Release Blocking? |
| --- | --- | --- | --- | --- |
| EMAIL-00 | no | no | optional | no |
| EMAIL-01 | no | yes for final external setup; local checks can mock | no | yes |
| EMAIL-02 | generates migration; production apply requires authorization | no | no | yes |
| EMAIL-03 | no beyond local users upsert behavior | mock for tests; real provider optional | optional | yes |
| EMAIL-04 | no | can use mocked/local states | yes | yes |
| EMAIL-05 | no schema mutation expected | optional | yes | yes |
| EMAIL-06 | maybe, if linking engagement rows requires schema changes | no | yes | no |
| EMAIL-07 | no code required unless readiness gaps found | yes | yes | yes |

## Shared Agent Rules

- Keep the primary implementation on Supabase Auth Email OTP.
- Use OTP code entry as the MVP flow. Magic Link can be documented as a later option because callbacks and deep links add release risk.
- `OWNER_EMAILS` is authoritative for admin rights.
- Never infer admin from unverified email input.
- Never grant admin to a verified email not present in `OWNER_EMAILS`.
- Never expose raw reader emails in public pages, Agent source cards, RSS, sitemap, or JSON-LD.
- Do not store OTP codes in the application database unless a phase explicitly changes the architecture.
- Do not place Supabase service-role keys in client code.
- Do not apply production DB migrations, change DNS, change Supabase SMTP settings, deploy, or push without phase authorization.
- Prefer existing tRPC, Drizzle, cookies, tests, and UI primitives.
- Use Codex in-app Browser for local and production UI checks.
- Write the phase completion report before moving to the next phase.
- Do not mark a phase complete if any acceptance gate is unverified.
- If an external service action is missing, mark the phase blocked only after local/non-writing validation has been exhausted.

## External Inputs Checklist

These are not guaranteed to exist in the repo and may block later phases:

- Supabase dashboard access.
- SMTP provider account and credentials.
- DNS management access for `misaya.online` or an auth subdomain.
- `OWNER_EMAILS` value.
- Test inboxes for owner and non-owner login.
- Optional test inboxes for Gmail, Outlook, and QQ or 163 deliverability checks.

## Goal Setup Template

Use the exact phase file `GOAL_PROMPT` when creating a Codex sub-goal.

Example:

```text
Complete EMAIL-03 Email OTP Auth API for /Users/yang/projects/ai-tech-blog by following docs/email_rabc/phase-03-email-otp-auth-api.md; reuse the existing auth router/session architecture, keep Supabase Auth behind an adapter, preserve owner allowlist semantics, and finish only after VALIDATION_COMMANDS, BROWSER_CHECKS, and ACCEPTANCE_GATES pass or are explicitly documented as blocked.
```
