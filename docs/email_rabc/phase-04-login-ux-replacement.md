# Phase 04 - Login UX Replacement

**Goal:** Replace the rough password/nickname-first login page with a polished email OTP login experience.

**Architecture:** Use the EMAIL-03 auth procedures from the existing React/tRPC frontend. Keep the first screen simple: email entry, code entry, resend cooldown, session result, and clear admin/reader outcome after verification.

**Tech Stack:** React, tRPC, `Login.tsx`, i18n dictionaries, existing shadcn/Radix primitives, Codex in-app Browser.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-04
- GOAL_TARGET: Ship email OTP login UX for readers and owner access.
- GOAL_PROMPT: Complete EMAIL-04 Login UX Replacement for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-04-login-ux-replacement.md`; replace the current password/nickname-first login screen with email OTP states, preserve accessible UI and route behavior, and finish after validation commands, browser checks, and acceptance gates pass.
- DEPENDS_ON: EMAIL-03
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file
- PRIMARY_CONTEXT: `client/src/pages/Login.tsx`, `client/src/i18n/login.ts`, `client/src/_core/hooks/useAuth.ts`, `client/src/components/ResearchShell.tsx`, `client/src/lib/trpc.ts`, `server/routers.ts`, `server/auth.ts`
- LIKELY_EDIT_PATHS: `client/src/pages/Login.tsx`, `client/src/i18n/login.ts`, `client/src/_core/hooks/useAuth.ts`, focused auth UI tests if present or added
- DO_NOT_EDIT: `drizzle/schema.ts`, Supabase provider adapter unless a UI integration bug proves it necessary, public article rendering, Agent retrieval
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts`; `pnpm build`
- BROWSER_CHECKS: `/login` desktop; `/login` mobile `390x844`; email request state; code entry state; wrong code error if fake/local provider allows; post-login redirect; `/manage` denied for non-owner reader
- ACCEPTANCE_GATES: login first screen is email-based; admin password is not the visible primary path; OTP states are accessible; resend cooldown is visible; successful owner and reader sessions route correctly; copy is calm and not SaaS-like

## Task Spec

Redesign `/login` around email OTP.

Recommended screen states:

- `email_entry`
- `otp_sent`
- `verifying`
- `verified_reader`
- `verified_owner`
- `error_retryable`
- `rate_limited`
- `provider_not_configured`

## Problem Boundary

In scope:

- Login page layout and copy.
- tRPC mutation wiring.
- Client-side validation and input ergonomics.
- Browser checks.

Out of scope:

- New auth providers.
- Full account settings page.
- Public profile pages.
- MFA/passkeys.
- Newsletter sending.

## Product Requirements

### R1 Primary Email Flow

The primary form should ask for:

- email address
- 6-digit code after request succeeds

It should support:

- paste full code
- submit with Enter
- resend after cooldown
- change email

### R2 Role Outcome Clarity

After verification:

- owner email: show brief owner success and navigate to `/manage` or previous admin-intended route when available
- non-owner email: show reader success and navigate back home or previous route

Do not tell a user that an email is not an owner email before verification.

### R3 Legacy Visitor Flow

If nickname visitor login remains, make it secondary and clearly optional:

- It should not be the main login tab.
- It should not look equivalent to a real account.
- It should explain that email login is required for durable identity.

If the phase removes nickname UI, ensure any feature depending on visitor sessions still works through email reader sessions.

### R4 Error Copy

Use generic, non-enumerating errors:

- "Could not send a code. Try again later."
- "The code is invalid or expired."
- "Email login is not configured yet."

Avoid:

- "This email does not exist."
- "This email is not an admin."

### R5 Accessibility and Mobile

Requirements:

- Labels for email and code inputs.
- `inputMode="email"` for email.
- `inputMode="numeric"` and `autoComplete="one-time-code"` for OTP.
- No horizontal overflow at `390x844`.
- Buttons retain visible loading and disabled states.

## Execution Capture

Run:

```bash
pnpm check
pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts
pnpm build
```

Browser:

- Open `/login`.
- Request code with invalid email and verify validation.
- Request code with a valid email in mocked/local mode if available.
- Enter wrong code and verify error state if mocked/local mode supports it.
- Check mobile `390x844`.

## Evaluator Protocol

EMAIL-04 is complete when `/login` looks and behaves like a real email login product surface rather than a debug panel.

## Acceptance Criteria

- The visible primary login method is email OTP.
- Admin password copy is removed or demoted behind a clearly legacy/development-only affordance.
- Browser checks produce no relevant console errors.
- The page remains visually consistent with the current personal research identity.

## Risks

- If provider config is missing, the UI can look broken unless the disabled state is explicit.
- If admin and reader outcomes are shown too early, the flow can leak owner email information.
