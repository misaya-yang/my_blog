# Email Auth + RBAC Execution Guide

This guide is for implementation agents. It keeps the phase PRDs actionable without requiring the whole folder in context.

## Read Order

For every run:

1. `docs/email_rabc/README.md`
2. `docs/email_rabc/phase-manifest.md`
3. `docs/email_rabc/execution-guide.md`
4. The current phase file only
5. Files listed in that phase's `PRIMARY_CONTEXT`

Do not bulk-load every phase file.

## Phase Completion Reports

Each completed or blocked phase must write a report in `docs/email_rabc/reports/`.

Use this naming pattern:

| Phase | Report |
| --- | --- |
| EMAIL-00 | `reports/email-00-auth-baseline.md` |
| EMAIL-01 | `reports/email-01-provider-readiness.md` |
| EMAIL-02 | `reports/email-02-user-rbac-model.md` |
| EMAIL-03 | `reports/email-03-email-otp-api.md` |
| EMAIL-04 | `reports/email-04-login-ux.md` |
| EMAIL-05 | `reports/email-05-admin-gates.md` |
| EMAIL-06 | `reports/email-06-reader-identity.md` |
| EMAIL-07 | `reports/email-07-release-readiness.md` |

Start from `reports/phase-report-template.md`.

## Implementation Rules

- Keep each phase narrowly scoped.
- Prefer existing tRPC router patterns over new route frameworks.
- Prefer existing JWT cookie/session patterns over introducing browser-managed Supabase sessions for app authorization.
- Keep Supabase Auth behind a server-side adapter.
- Test the adapter with mocks; do not send real OTP emails in unit tests.
- Use normalized emails everywhere: `trim().toLowerCase()`.
- Treat `OWNER_EMAILS` as an allowlist, not as UI copy.
- Non-owner verified users are readers, not admins.
- Never expose raw reader email on public pages.
- Never put Supabase service-role secrets in client code.
- Never commit `.env.local`.

## External Action Policy

These actions require explicit user/phase authorization:

- Applying production DB migrations.
- Changing DNS records.
- Changing Supabase Auth provider settings.
- Configuring custom SMTP in Supabase.
- Sending real OTP emails for production smoke tests.
- Deploying to production.
- Pushing commits.

If authorization or credentials are missing:

1. Complete all local/non-writing work.
2. Write the phase report.
3. Mark the phase `blocked`.
4. List exact missing inputs.
5. Do not fake pass/fail evidence.

## Blocker Checklist

Use this checklist before marking a phase blocked:

- Is the blocker external to the repository?
- Did local validation run as far as possible?
- Is there a mock or non-writing alternative?
- Is the missing credential/action named concretely?
- Is the next user action obvious?

Examples of valid blockers:

- Missing Supabase Auth admin access for SMTP configuration.
- Missing SMTP provider account or API/SMTP credentials.
- Missing DNS access for SPF/DKIM/DMARC.
- Production migration needed but not authorized.
- No test inbox available for Gmail/Outlook/QQ or 163 delivery checks.

Examples that are not blockers:

- Tests fail.
- TypeScript errors.
- UI state is awkward.
- Unsure which file owns a behavior.

Those require debugging and fixes.

## Recommended Test Progression

Use the smallest relevant tests while editing:

```bash
pnpm exec vitest run server/posts.test.ts server/auth.logout.test.ts
```

For schema/user changes:

```bash
pnpm exec vitest run server/schema-integrity.test.ts server/posts.test.ts server/auth.logout.test.ts
```

For admin gate changes:

```bash
pnpm exec vitest run server/posts.test.ts server/content-ops.router.test.ts server/engagement.router.test.ts server/agent.router.test.ts server/auth.logout.test.ts
```

For engagement/Agent identity changes:

```bash
pnpm exec vitest run server/engagement.router.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Before release:

```bash
pnpm check
pnpm test
pnpm build
pnpm audit:baseline:quick
```

## Browser Protocol

Use Codex in-app Browser, not the user's Chrome.

Core routes:

- `http://localhost:3000/login`
- `http://localhost:3000/manage`
- `http://localhost:3000/manage/agent`
- one public article
- mobile viewport `390x844`

For production smoke only when authorized:

- `https://misaya.online/login`
- `https://misaya.online/manage`
- `https://misaya.online/manage/agent`

Record what was checked and what was observed in the phase report.

## Security Invariants

These must stay true after every phase:

- Anonymous users cannot create, update, or delete posts.
- Verified non-owner email users cannot create, update, or delete posts.
- Verified non-owner email users cannot list feedback, subscribers, Agent evals, or admin traces.
- Hidden/admin/draft content is excluded from public discovery, RSS, sitemap, and public Agent sources.
- OTP request and verify endpoints do not reveal whether an email is registered or an owner email.
- Logout clears every active auth cookie used by the app.

If any invariant breaks, stop the phase and fix it before continuing.
