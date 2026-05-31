# Phase 06 - Reader Identity and Engagement Integration

**Goal:** Use verified reader email identity to improve feedback, subscriptions, and Agent ownership without exposing private emails.

**Architecture:** Treat verified non-owner email users as durable readers. Keep public surfaces privacy-preserving and use email identity only for private owner workflows or user-owned state.

**Tech Stack:** tRPC engagement router, Agent identity, `server/auth.ts`, `server/ai/identity.ts`, React feedback/subscription components, Drizzle/Postgres.

---

## Coding Agent Contract

- PHASE_ID: EMAIL-06
- GOAL_TARGET: Connect verified reader identity to engagement and Agent ownership.
- GOAL_PROMPT: Complete EMAIL-06 Reader Identity and Engagement Integration for `/Users/yang/projects/ai-tech-blog` by following `docs/email_rabc/phase-06-reader-identity-engagement.md`; use verified email sessions for durable reader identity in feedback/subscriptions/Agent ownership, preserve privacy boundaries, and finish after validation commands, browser checks, and acceptance gates pass.
- DEPENDS_ON: EMAIL-05
- READ_FIRST: `docs/email_rabc/README.md`, `docs/email_rabc/phase-manifest.md`, `docs/email_rabc/execution-guide.md`, this file
- PRIMARY_CONTEXT: `server/auth.ts`, `server/routers.ts`, `server/ai/identity.ts`, `server/ai/harness.ts`, `server/ai/conversations.ts`, `client/src/components/ArticleFeedback.tsx`, `client/src/components/SubscriptionForm.tsx`, `client/src/components/agent/BlogAgentRoot.tsx`, `server/engagement.router.test.ts`, `server/agent.router.test.ts`
- LIKELY_EDIT_PATHS: `server/auth.ts`, `server/routers.ts`, `server/ai/identity.ts`, `client/src/components/ArticleFeedback.tsx`, `client/src/components/SubscriptionForm.tsx`, `client/src/i18n/engagement.ts` if present, engagement/agent tests
- DO_NOT_EDIT: public RSS/sitemap metadata except to verify no leak, article markdown, provider adapter unless auth identity bug requires it
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/engagement.router.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts`; `pnpm build`
- BROWSER_CHECKS: logged-in reader article feedback; logged-in reader subscription form; Agent panel quota/session label; logout privacy check; mobile article feedback
- ACCEPTANCE_GATES: verified reader identity is durable; feedback can associate private user id without public leak; subscription can reuse verified email with consent; Agent ownership key is stable and non-email; anonymous flow still works

## Task Spec

Upgrade reader-facing features to understand verified email sessions.

Important principle:

> A verified email session can reduce friction, but it should not silently publish or expose that email.

## Problem Boundary

In scope:

- Private association of feedback/subscription/Agent conversations with user identity.
- UI prefill or consent copy.
- Tests for privacy.

Out of scope:

- Public profiles.
- Public comments.
- Newsletter sending.
- Account settings.
- Data export UI.

## Product Requirements

### R1 Feedback

When a verified reader submits article feedback:

- Store local `userId` or stable owner key if schema supports it.
- Do not require re-entering nickname.
- Email reply field should be optional and explicit.
- Owner-only feedback list may show email if stored and intended for reply.
- Public article pages never show reader email.

### R2 Subscription

When a verified reader subscribes:

- Prefill email or offer "use signed-in email" if the UI can do so clearly.
- Require explicit submit; do not auto-subscribe on login.
- Keep duplicate behavior deterministic.
- Store preferred language/interests as before.

### R3 Agent Identity

For verified readers:

- Use a stable non-raw-email identity key, such as local user id or salted hash.
- Preserve existing anonymous and visitor quota behavior.
- Avoid showing raw email in Agent source cards or public logs.

### R4 Privacy Copy

Add concise copy where needed:

- "Your email is used for sign-in and private owner replies. It is never shown publicly."

Do not over-explain auth internals in the UI.

## Execution Capture

Run:

```bash
pnpm check
pnpm exec vitest run server/engagement.router.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts
pnpm build
```

Browser:

- Sign in as non-owner reader in mocked/local mode.
- Submit feedback from a public article.
- Subscribe from home or article footer.
- Open Agent and confirm reader quota/session state.

## Evaluator Protocol

EMAIL-06 is complete when email login has a product purpose beyond admin access and reader privacy remains intact.

## Acceptance Criteria

- Engagement tests prove non-owner verified sessions cannot access owner-only data.
- Public page snapshots contain no raw reader emails.
- Agent identity is stable across sessions for the same verified user when feasible.
- Anonymous readers can still browse and use public flows.

## Risks

- Silent email reuse can feel invasive. Prefer explicit consent for subscription and reply fields.
- Raw emails in logs, DOM, or source cards are a privacy bug.
