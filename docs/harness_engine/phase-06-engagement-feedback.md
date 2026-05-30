# Phase 06 - Engagement and Feedback Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use product-first brainstorming only if changing the feedback model beyond this PRD.

**Goal:** Add lightweight reader return loops without turning the personal blog into a social network.

**Architecture:** Use the existing visitor JWT concept for low-friction feedback, subscriptions, and optional bookmarks. Keep email/newsletter integration replaceable and privacy-conscious.

**Tech Stack:** React, tRPC, Drizzle/Postgres, signed visitor cookies, optional email provider or webhook integration.

---

## Task Spec

Create the smallest useful engagement system for a personal research blog:

- RSS discoverability from Phase 04
- newsletter or update subscription entry
- article feedback
- optional lightweight comments
- optional bookmarks or "read later" using visitor JWT
- contact path that is more intentional than copying an email address

## Problem Boundary

In scope:

- Reader subscription UI and backend capture.
- Article feedback model.
- Visitor session reuse.
- Minimal moderation workflow for owner.
- Privacy and rate-limit basics.

Out of scope:

- Full user accounts with passwords.
- OAuth provider setup.
- Public profile pages.
- Real-time notifications.
- Complex comment threading.

## Context Policy

Before editing, inspect:

- `server/auth.ts`
- `server/routers.ts`
- `drizzle/schema.ts`
- `client/src/pages/Login.tsx`
- `client/src/_core/hooks/useAuth.ts`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Home.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/i18n/login.ts`
- `client/src/i18n/post.ts`
- `client/src/i18n/home.ts`

Assume visitor identity is lightweight and not security-strong. Do not ask readers for more data than the feature requires.

## Product Requirements

### R1 Subscription Entry

Add a visible but restrained subscription surface:

- home page compact form or link
- article footer form
- RSS link

Minimum fields:

- email
- optional preferred language
- optional topic interests

If no email provider is configured:

- store subscription intent in database
- show a clear success state
- document export or provider integration path

### R2 Article Feedback

Add a feedback module to article pages:

- useful / not useful
- optional short text
- optional reader nickname from visitor session
- optional email only if reader wants a reply

Feedback should capture:

- post id
- visitor id if available
- feedback type
- message
- createdAt
- user agent or coarse source if useful for debugging

### R3 Lightweight Comments Option

If comments are implemented in this phase, keep them simple:

- one-level comments only
- visitor nickname required
- moderation status: pending, approved, hidden
- owner can approve/hide/delete from management area
- public article shows approved comments only

If comments are deferred, feedback must still ship.

### R4 Bookmarks or Read Later Option

Visitor JWT can support:

- bookmark article
- show bookmarked state on article card/detail
- simple `/bookmarks` page for the visitor

This is optional behind feedback/subscription because bookmarks are less important until repeat readership grows.

### R5 Contact Surface

Replace raw email-only interaction with:

- copy email button retained
- contact CTA on About or article footer
- optional short contact form routed to owner notification or stored inquiry

Contact form should be rate-limited and not expose owner-only endpoints.

### R6 Moderation and Owner Workflow

Owner must be able to:

- view recent feedback
- filter by post
- mark feedback as reviewed
- approve/hide comments if comments exist
- export subscriber list if no provider is integrated

This can be a section inside `/manage` in the first version.

## Execution Capture

Required tests:

- anonymous reader can submit allowed feedback if product permits it, or is prompted for visitor nickname if required
- visitor reader can submit feedback with visitor id
- public article never shows unapproved comments
- owner can list feedback
- non-owner cannot list feedback
- subscription validates email
- duplicate subscription behavior is deterministic
- rate limiting prevents rapid repeated submissions

Required browser checks:

- home subscription entry
- article feedback success
- login visitor flow
- owner moderation empty and populated state

## Evaluator Protocol

Phase 06 is complete when:

- A reader can subscribe or follow updates.
- A reader can leave article feedback.
- The existing visitor login has a clear product purpose.
- Owner can review feedback or subscriber data.
- Public pages do not expose private visitor or subscriber data.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.

## Acceptance Criteria

- Feedback submission has loading, success, error, and rate-limited states.
- Subscription has validation and duplicate behavior.
- Article footer has a clear return loop: related posts, RSS/newsletter, feedback.
- Privacy copy is concise and honest.
- Admin-only moderation/API routes enforce admin session.

## Risks

- Comments can add moderation burden. Ship feedback first if time is constrained.
- Storing emails creates privacy obligations. Keep data minimal and document removal/export path.
- Visitor JWT is not a strong account identity. Do not attach sensitive features to it.
