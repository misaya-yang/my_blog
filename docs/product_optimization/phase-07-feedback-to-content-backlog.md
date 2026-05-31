# Phase 07 - Feedback to Content Backlog

**Goal:** Turn subscriptions, article feedback, and Agent questions into a private author-facing content radar.

**Architecture:** Reuse existing feedback/subscriber/Agent trace data. Add owner workflows before adding public community features.

**Tech Stack:** Engagement routes, Agent traces, Manage pages, Drizzle/Postgres, tRPC, optional export.

---

## Coding Agent Contract

- PHASE_ID: PO-07
- GOAL_TARGET: Convert private reader signals into an owner-facing content backlog.
- GOAL_PROMPT: Complete PO-07 Feedback to Content Backlog for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-07-feedback-to-content-backlog.md`; reuse existing feedback/subscriber/Agent trace data, keep everything owner-only and privacy-conscious, and finish after validation commands, browser checks, and acceptance gates pass.
- DEPENDS_ON: PO-06
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `drizzle/schema.ts`, `server/routers.ts`, `server/engagement.router.test.ts`, `server/ai/router.ts`, `server/ai/harness.ts`, `client/src/pages/Manage.tsx`, `client/src/pages/ManageAgent.tsx`, `client/src/components/ArticleFeedback.tsx`, `client/src/components/SubscriptionForm.tsx`
- LIKELY_EDIT_PATHS: `server/routers.ts`, `server/ai/*`, `client/src/pages/Manage.tsx`, `client/src/pages/ManageAgent.tsx`, related tests
- DO_NOT_EDIT: public comment system, reader profiles, public analytics pages, email delivery provider unless explicitly requested
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/engagement.router.test.ts server/agent.router.test.ts`
- BROWSER_CHECKS: article feedback submit; owner feedback review; subscriber/interest status; ManageAgent idea/content radar state
- ACCEPTANCE_GATES: owner can identify writing opportunities; signals are linked to article/track context; private data stays private; subscription delivery state remains honest

## Task Spec

Create a content backlog loop:

- identify articles readers find useful or incomplete
- collect common subscription interests
- surface Agent questions with poor retrieval or no-source answers
- group repeated questions into candidate article ideas
- let owner mark ideas as reviewed/planned/dismissed

## Problem Boundary

In scope:

- Owner-only review and triage.
- Aggregated feedback and Agent question summaries.
- Export or lightweight status fields.
- Privacy-conscious display.

Out of scope:

- Public comments.
- Reader profiles.
- Email automation beyond existing subscription capture.
- Public voting.
- Author auto-replies.

## Context Policy

Inspect:

- `drizzle/schema.ts`
- `server/routers.ts`
- `server/engagement.router.test.ts`
- `server/ai/router.ts`
- `server/ai/harness.ts`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/SubscriptionForm.tsx`

## Product Requirements

### R1 Feedback Inbox

Owner should see:

- article title
- useful/not useful
- optional message
- reply email if provided
- status: new/reviewed/hidden
- created date

Existing privacy boundaries must remain: public users cannot list feedback.

### R2 Subscription Interest Summary

Owner should see:

- subscriber count
- preferred language breakdown
- top interest phrases
- export path if no email provider is connected

Subscription UI should remain honest about whether delivery is connected.

### R3 Agent Question Radar

Owner should see:

- frequent questions
- no-source answers
- failed runs
- out-of-scope patterns
- questions by article/track context

This should feed article ideas, not become public analytics.

### R4 Article Idea Workflow

Allow the owner to triage ideas:

- new
- reviewed
- planned
- dismissed

Each idea should link back to supporting signals: feedback, subscription interests, or Agent traces.

### R5 Privacy and Retention

Only store/display the minimum needed:

- avoid exposing raw private conversation text where aggregated summary is enough
- redact emails except where needed for owner follow-up/export
- document retention expectations

## Execution Capture

Required tests:

```bash
pnpm exec vitest run server/engagement.router.test.ts server/agent.router.test.ts
```

Browser checks:

- article feedback submission
- owner feedback review
- subscriber export/status
- ManageAgent idea extraction or content radar state

## Evaluator Protocol

Phase 07 is complete when:

- Reader signals can become actionable writing backlog items.
- Owner can separate reviewed and unreviewed signals.
- No private data appears on public pages.
- Subscription trust gap is either resolved or clearly communicated.

## Acceptance Criteria

- Owner can answer: "What should I write next based on reader confusion?"
- Feedback and Agent questions can be traced back to article/track context.
- Public readers see no private admin data.
- `pnpm check`, targeted tests, and browser checks pass.

## Risks

- Too much analytics can distract from writing.
- Email/subscriber data creates privacy obligations.
- Public comments would add moderation burden and are intentionally out of scope.
