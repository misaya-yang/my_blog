# Reader Relationship And Subscription Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The product has article feedback, visitor identity, subscriptions, subscriber export, rate limiting, and owner content radar. These should become a modest reader relationship loop: readers can say what helped, what confused them, and what topics they care about; the owner can use that signal without pretending the product has a full newsletter automation system.

The tone must be honest. If email delivery is not connected, the UI should not imply a polished newsletter pipeline.

## Goals

- Make feedback and subscription surfaces compact, readable, and trustworthy.
- Convert topic interests and feedback into owner-readable backlog signals.
- Preserve privacy and rate limiting.
- Avoid collecting unnecessary personal data.
- Make subscriber export useful without exposing it publicly.

## Non-Goals

- No email automation in this phase.
- No marketing CRM.
- No public comments/community.
- No reader profile dashboard.
- No tracking vendor integration.
- No schema migration unless separately reviewed.

## Current Files

Client:

- `client/src/components/SubscriptionForm.tsx`
- `client/src/components/ArticleFeedback.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/i18n/common.ts`
- `client/src/i18n/manage.ts`

Server:

- `server/engagement.router.ts`
- `server/readerSignals.ts`
- `server/rateLimit.ts`
- `server/db.ts`

Tests:

- `server/engagement.router.test.ts`
- `server/readerSignals.test.ts`

## Reader UX Contract

Article feedback should answer:

- Was this useful?
- What was unclear or missing?
- Is reply contact optional?
- What happens after submission?

Subscription should answer:

- What will the reader receive today?
- What is not automated yet, if applicable?
- Which topics are they interested in?
- How is their email used?

Rules:

- Keep article feedback below the main reading flow.
- Do not make feedback a large interruption.
- Keep optional email/name fields clearly optional.
- Avoid owner direct email as the primary visual call-to-action when the form exists.
- Do not show private reader data on public pages.

## Data Contract

Existing data can remain the source of truth:

- Feedback:
  - post id/slug.
  - type: useful or not useful.
  - optional structured reason.
  - optional message.
  - optional reply email/name.
  - status.

- Subscription:
  - email.
  - optional name.
  - language.
  - topic interests.
  - source route.

Derived reader signals:

- `article_feedback`: repeated not-useful feedback or explicit confusion.
- `search_miss`: already covered by discovery.
- `agent_question`: covered by Agent quality operations.
- Subscription interest clusters can influence backlog but should not be exposed as individual personal records.

## Feedback Reason Taxonomy

Optional feedback reason values:

- `unclear_mechanism`: reader could not follow how the mechanism works.
- `needs_example`: reader needs a concrete example, diagram, or walkthrough.
- `unsupported_claim`: reader wants evidence, metric, source, or caveat.
- `awkward_wording`: reader found the wording hard to parse or unnatural.
- `missing_next_step`: reader does not know what to read or do next.
- `other`: reader supplied free-form context.

Rules:

- Reason is optional.
- The public form should not become a long survey.
- Reasons can shape owner backlog grouping.
- Direct contact data in free-form message is redacted before signal excerpts.

## Privacy And Safety

- Keep rate limiting on feedback and subscriptions.
- Do not expose reply email in reader signals.
- Mask email in owner lists unless full export is explicitly triggered.
- Redact direct contact data before rendering feedback snippets in backlog.
- Do not store private Agent context as feedback or subscription metadata.

## Owner UI Contract

`/manage` should show:

- New feedback count.
- Not-useful feedback count.
- Active subscriber count.
- Top topic interests.
- Language breakdown.
- Feedback backlog items.
- Subscriber export action.

The owner should be able to:

- Mark feedback reviewed.
- Hide inappropriate feedback.
- Open related article.
- Start a draft or revision from an aggregated signal.
- Export subscribers intentionally.

## Copy Contract

Copy should be concrete and low-hype.

Avoid:

- "Join the revolution."
- "Never miss an update" if delivery is not automated.
- "AI-powered personalized insights" unless implemented.

Prefer:

- "Get occasional updates when new public notes are published."
- "Tell me which topic you want more of."
- "Reply email is optional and only used if I need to follow up."

Chinese copy should avoid overly subjective or self-promotional phrasing. English copy should avoid generic SaaS newsletter phrasing.

## Implementation Slices

1. Tighten public feedback/subscription copy and layout.
2. Add optional feedback reason capture without making the public form feel like a survey.
3. Add reader signal normalization for article feedback and subscription topic clusters where safe.
4. Improve `/manage` feedback and subscription summary hierarchy.
5. Add tests for redaction, rate limits, feedback reasons, and backlog shaping.
6. Add browser evidence for article feedback and manage export surfaces.

## Tests

Focused:

```bash
corepack pnpm test -- server/engagement.router.test.ts server/readerSignals.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

Browser evidence:

- Article feedback form desktop and mobile.
- Subscription form in public context.
- `/manage` feedback summary.
- Subscriber export action visible only to owner.

## Acceptance Checklist

- Reader-facing relationship surfaces are compact and honest.
- Optional personal data is clearly optional.
- Owner can see actionable interest and feedback patterns.
- Feedback snippets and signals do not leak direct contact data.
- No new email automation is implied or introduced.
