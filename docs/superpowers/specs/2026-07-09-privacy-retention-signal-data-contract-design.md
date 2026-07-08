# Privacy, Retention, And Signal Data Contract Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The product handles public articles, hidden/admin/draft content, Agent conversations, pasted private context, article feedback, optional reply emails, subscriptions, search misses, run traces, and owner exports. The optimization program must make these data boundaries explicit before signals and owner dashboards become more powerful.

This spec defines privacy and retention rules for product features. It is not legal advice.

## Goals

- Prevent private context from becoming durable reader signals.
- Prevent contact data from leaking into excerpts, URLs, screenshots, or reports.
- Preserve hidden/draft/admin content boundaries.
- Keep owner exports intentional.
- Make localStorage-only state clearly non-durable.

## Non-Goals

- No legal policy drafting.
- No GDPR/CCPA compliance certification.
- No new consent-management platform.
- No encryption/storage migration in this phase.

## Current Files

- `server/ai/contextSources.ts`
- `server/ai/conversations.ts`
- `server/ai/streamRoute.ts`
- `server/ai/router.ts`
- `server/engagement.router.ts`
- `server/searchMisses.ts`
- `server/readerSignals.ts`
- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/SubscriptionForm.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`

## Data Classes

### Public Content

Includes published public articles, public tags, public categories, public series, public track metadata, and public SEO/feed data.

Allowed in public routes, search, sitemap, RSS, and Agent public sources.

### Owner Content

Includes drafts, hidden/admin articles, owner routes, debug reports, traces, eval results, and publish readiness reports.

Allowed only behind owner/admin surfaces or local repo reports.

### Private Reader Input

Includes pasted Agent context, feedback message bodies, reply email, visitor name, subscriber email, and optional interests.

Must not be exposed publicly. Must be redacted or omitted from signals unless explicitly owner-only and necessary.

### Operational Signals

Includes normalized search misses, Agent gaps, feedback summaries, content audit findings, and publish freshness findings.

Should store minimal safe evidence, not raw private payloads.

## Redaction Rules

Before using user-supplied text in signals, URLs, reports, or screenshots:

- Replace email addresses with `[redacted-email]`.
- Replace IP-like strings with `[redacted-ip]`.
- Omit private pasted context bodies.
- Mask subscriber emails in owner list summaries.
- Do not encode raw feedback messages in query params.

## Retention Rules

Phase 1:

- Use existing persistence only.
- Document localStorage-only statuses as non-durable.
- Do not add a new durable `reader_signals` table.

Phase 2:

- If durable signal status is needed, create a reviewed schema.
- Store status, kind, safe excerpt, source reference, and timestamps.
- Do not store raw private context.

Phase 3:

- Add owner-visible retention controls only if needed.

## Screenshot And Report Hygiene

Evidence reports and screenshots must not include:

- Secrets.
- Production credentials.
- Full subscriber emails unless the test intentionally uses dummy data.
- Raw private Agent pasted context.
- Hidden article text on public route evidence.

If owner routes show private data during QA, use seeded dummy data or redact the report.

## Implementation Slices

1. Centralize direct contact redaction helpers where practical.
2. Apply redaction before signal grouping and excerpts.
3. Add tests for Agent private context and feedback/subscription redaction.
4. Audit owner report/screenshot generation paths.
5. Document any remaining private data surfaces in release reports.

## Tests

Focused:

```bash
corepack pnpm test -- server/readerSignals.test.ts server/engagement.router.test.ts server/ai/contextSources.test.ts server/ai/streamRoute.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm build
```

## Acceptance Checklist

- Private Agent context does not become a reader signal excerpt.
- Contact data is redacted before signal grouping and display.
- Owner screenshots/reports do not leak real private data.
- Hidden/draft/admin content remains excluded from public search/feed/Agent sources.
- Durable signal storage is not introduced without separate review.
