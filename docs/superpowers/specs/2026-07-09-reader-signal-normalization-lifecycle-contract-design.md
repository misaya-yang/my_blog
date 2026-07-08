# ReaderSignal Normalization And Lifecycle Contract Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

`ReaderSignal` is the bridge between reader behavior and owner action. The existing contract names search misses, Agent questions, low-confidence answers, refusals, article feedback, content audit findings, and publish freshness. This spec turns that model into executable builder, grouping, severity, privacy, and lifecycle rules.

The first implementation stays a read model where possible. Durable storage requires separate review.

## Goals

- Implement all `ReaderSignalKind` builders with tests.
- Define stable grouping keys and severity rules.
- Keep signal status semantics consistent across owner screens.
- Redact personal contact data and avoid private context persistence.
- Make future durable storage a safe additive step.

## Non-Goals

- No schema migration in the first pass.
- No analytics vendor.
- No personal profile system.
- No automatic content rewriting.

## Current Files

- `server/readerSignals.ts`
- `server/readerSignals.test.ts`
- `server/searchMisses.ts`
- `server/engagement.router.ts`
- `server/ai/conversations.ts`
- `server/ai/harness.ts`
- `scripts/audit/content-quality.ts`
- `scripts/audit/publish-freshness.ts`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`

## Signal Kinds

Required kinds:

```ts
type ReaderSignalKind =
  | "search_miss"
  | "agent_question"
  | "agent_low_confidence"
  | "agent_refusal"
  | "article_feedback"
  | "content_audit"
  | "publish_freshness";
```

Each kind must define:

- input shape.
- grouping key.
- severity rule.
- status default.
- public/private data boundary.
- owner-facing suggested action.

## Grouping Rules

Stable IDs should be deterministic for aggregated read-model signals:

- `search_miss:<normalized_query>`
- `agent_question:<scope>:<normalized_question>`
- `agent_low_confidence:<scope>:<normalized_question_or_run_group>`
- `agent_refusal:<scope>:<normalized_reason_or_question>`
- `article_feedback:<article_slug_or_id>:<feedback_type>`
- `content_audit:<article_or_file>:<rule_code>`
- `publish_freshness:<check_code>:<article_or_global>`

Normalization:

- Trim.
- Collapse whitespace.
- Lowercase where language-safe.
- Redact direct contact data before key generation when text is user supplied.
- Truncate only after enough stable text remains.

## Severity Rules

Default severity:

- `high`: repeated zero-source Agent answers, blocking content audit failures, stale public Agent index, repeated not-useful feedback.
- `medium`: Agent refusals from missing public coverage, repeated search misses, publish freshness warnings affecting public routes.
- `low`: ordinary repeated Agent questions, style warnings, one-off low-risk feedback.

Severity can increase with count, recency, or release-blocking state. It should not increase from private or personal data.

## Lifecycle Rules

Statuses:

- `new`: generated and unreviewed.
- `triaged`: owner has reviewed and accepted it as real.
- `planned`: owner intends to write or fix.
- `resolved`: owner has fixed or intentionally addressed it.
- `ignored`: owner reviewed and declined.

Phase 1:

- Read-model signals default to `new`.
- Local-only UI status may be used only as a visible temporary affordance.
- Do not pretend localStorage status is durable.

Phase 2:

- Add durable status mutation endpoints only after schema review.
- Record owner note and timestamp.

Phase 3:

- Link resolved signals to post revisions, publish events, or eval results.

## Suggested Action Contract

Each signal should expose an owner action:

- Open editor with safe query params.
- Open existing article.
- Open search/debug context.
- Open Agent run trace.
- Run content audit or publish verification command.

Actions must never encode private message bodies in URLs.

## Privacy Contract

- Redact direct email addresses.
- Redact IP-like strings.
- Do not persist pasted private Agent context.
- Do not expose subscriber emails in signal excerpts.
- Do not include hidden/draft/admin article text in public-derived signals.

## Implementation Slices

1. Add builder input types for all signal kinds.
2. Add grouping/severity helpers with focused tests.
3. Add feedback and Agent signal builders.
4. Add publish freshness signal builder.
5. Surface normalized signals in owner routes without durable status mutation.

## Tests

Focused:

```bash
corepack pnpm test -- server/readerSignals.test.ts server/engagement.router.test.ts server/agent.router.test.ts scripts/audit/publish-freshness.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm build
```

## Acceptance Checklist

- Every `ReaderSignalKind` has a builder and tests.
- Grouping keys are deterministic and privacy-safe.
- Severity rules are explicit and tested.
- Local UI status is not represented as durable state.
- Private context and contact data are not leaked into signals.
