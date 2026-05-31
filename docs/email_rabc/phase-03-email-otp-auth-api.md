# Phase 03 - Email OTP Auth API

**Goal:** Add server-side tRPC endpoints for requesting and verifying email OTP codes through Supabase Auth.

**Architecture:** Keep Supabase Auth behind a small provider adapter so tests can mock it and the rest of the app remains provider-agnostic. On successful OTP verification, upsert the local user and sign the existing app session cookie.

**Tech Stack:** tRPC, Supabase Auth, optional `@supabase/supabase-js`, `server/auth.ts`, `server/routers.ts`, Vitest.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-03
- GOAL_TARGET: Implement email OTP request and verify API with mocked-provider tests.
- GOAL_PROMPT: Complete EMAIL-03 Email OTP Auth API for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-03-email-otp-auth-api.md`; add request/verify email OTP routes through a provider adapter, sign app sessions after verified email, preserve owner allowlist semantics, and finish after validation commands and acceptance gates pass.
- DEPENDS_ON: EMAIL-02
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file
- PRIMARY_CONTEXT: `server/routers.ts`, `server/auth.ts`, `server/db.ts`, `server/_core/env.ts`, `server/posts.test.ts`, `server/auth.logout.test.ts`, `.env.example`, `package.json`
- LIKELY_EDIT_PATHS: `server/auth.ts`, `server/routers.ts`, `server/db.ts`, `server/_core/env.ts`, new `server/auth/*.ts` helpers if useful, auth tests, optional `package.json`
- DO_NOT_EDIT: `client/src/pages/Login.tsx`, `client/src/i18n/login.ts`, public discovery/RSS/sitemap, Agent retrieval code
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts`
- BROWSER_CHECKS: optional API smoke through login page is deferred to EMAIL-04
- ACCEPTANCE_GATES: request route validates and rate-limits email; verify route rejects invalid provider responses; verified owner email receives admin session; verified non-owner email receives reader session; password admin login still behaves as before until EMAIL-05; tests do not send real emails

## Task Spec

Add these tRPC auth procedures:

- `auth.requestEmailOtp`
- `auth.verifyEmailOtp`

Suggested inputs:

```ts
requestEmailOtp: {
  email: string;
  locale?: "en" | "zh";
}

verifyEmailOtp: {
  email: string;
  token: string;
}
```

Suggested outputs:

```ts
requestEmailOtp: {
  success: true;
  cooldownSeconds: number;
}

verifyEmailOtp: {
  success: true;
  session: BlogSession;
}
```

## Problem Boundary

In scope:

- Server-side OTP request and verify procedures.
- Provider adapter.
- Email normalization.
- Rate limiting by IP plus email.
- Local session signing.
- Tests with mocked provider.

Out of scope:

- Login page redesign.
- Production email sending verification.
- Magic Link callback.
- Social login.
- Password account support.

## Product Requirements

### R1 Provider Adapter

Create a small adapter boundary, for example:

```ts
export type EmailOtpProvider = {
  requestOtp(input: { email: string; redirectTo?: string }): Promise<void>;
  verifyOtp(input: { email: string; token: string }): Promise<{
    providerUserId: string;
    email: string;
    emailVerifiedAt: Date;
    displayName?: string | null;
  }>;
};
```

The Supabase implementation may use official Supabase JS Auth APIs or equivalent documented endpoints. Tests should inject a fake adapter.

### R2 Request Behavior

`auth.requestEmailOtp` must:

- Normalize email.
- Validate email format.
- Rate-limit by source IP and normalized email.
- Return a generic success response that does not reveal whether an account exists.
- Call Supabase Auth OTP request when `EMAIL_AUTH_ENABLED=true`.
- In disabled/local mode, return a clear feature-disabled error unless tests inject a fake provider.

### R3 Verify Behavior

`auth.verifyEmailOtp` must:

- Normalize email.
- Validate token shape, for example 6 digits if using code OTP.
- Verify against provider.
- Ensure returned provider email matches requested normalized email.
- Upsert local user through the EMAIL-02 helper.
- Sign `admin_session` for owner emails or `visitor_session` for non-owner verified readers, preserving current app compatibility.
- Return `auth.session`-compatible data.

### R4 Abuse Controls

Add separate limits for:

- request OTP attempts
- verify OTP failures

Limits can be in-memory for this personal blog phase, matching existing admin password failure limiter style, but must be server-side.

## Execution Capture

Required tests:

- Request OTP validates email and does not expose account existence.
- Request OTP is rate-limited by email/source.
- Verify OTP rejects invalid token shape.
- Verify OTP rejects provider email mismatch.
- Verify OTP for owner email creates admin session.
- Verify OTP for non-owner email creates reader session.
- No test sends real email.

Run:

```bash
pnpm check
pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts
```

## Evaluator Protocol

EMAIL-03 is complete when the backend can prove email ownership via a provider adapter and translate that into app sessions without frontend changes.

## Acceptance Criteria

- Auth tests cover owner and non-owner email flows.
- No service role key is required in the browser.
- Invalid OTPs do not create sessions.
- Admin-only procedure access still depends on verified admin session.
- Existing visitor nickname flow remains available until UI replacement phase decides how to present it.

## Risks

- Provider adapter leakage can make tests send real emails.
- Email mismatch checks are critical; never trust the email string submitted by the client after provider verification.
- In-memory rate limits reset on deploy and are acceptable only for this small product stage.
