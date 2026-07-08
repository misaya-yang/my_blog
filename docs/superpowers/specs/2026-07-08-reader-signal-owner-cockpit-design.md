# Reader Signal Backlog And Owner Cockpit Design

Date: 2026-07-08
Status: Proposed
Parent spec: [Reading and writing loop optimization](./2026-07-08-reading-writing-loop-optimization-design.md)

## Summary

The product already has search, Agent conversations, feedback, content audits, publish freshness checks, and Agent knowledge indexing. These pieces should feed one author-facing loop: what readers could not find, what they asked the Agent, where answers were weak, and what articles need revision.

This spec defines a `ReaderSignal` model and owner cockpit direction. It does not require a database migration in the first implementation slice, but it must leave a clear path to durable storage.

## Goals

- Convert reader behavior into an actionable author backlog.
- Unify search misses, Agent gaps, feedback, and content audit findings.
- Make `/manage/agent` understandable as an editorial improvement cockpit.
- Preserve current debug tools behind advanced sections.
- Make publish and reindex status visible as release readiness signals.

## Non-Goals

- No public user profile system.
- No analytics vendor integration.
- No email automation.
- No ranking algorithm based on private personal data.
- No DB schema migration until the data contract is reviewed.

## Current Inputs

Existing signal sources:

- `server/searchMisses.ts`
- `server/discovery.ts`
- `server/discovery.router.ts`
- `server/engagement.router.ts`
- `server/ai/conversations.ts`
- `server/ai/evals.ts`
- `server/ai/harness.ts`
- `server/ai/knowledgeDb.ts`
- `scripts/audit/content-quality.ts`
- `scripts/audit/publish-freshness.ts`
- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/components/ArticleFeedback.tsx`

## ReaderSignal Contract

Internal additive model:

```ts
type ReaderSignalKind =
  | "search_miss"
  | "agent_question"
  | "agent_low_confidence"
  | "agent_refusal"
  | "article_feedback"
  | "content_audit"
  | "publish_freshness";

type ReaderSignalStatus =
  | "new"
  | "triaged"
  | "planned"
  | "resolved"
  | "ignored";

type ReaderSignal = {
  id: string;
  kind: ReaderSignalKind;
  status: ReaderSignalStatus;
  severity: "low" | "medium" | "high";
  articleSlug?: string;
  trackSlug?: string;
  query?: string;
  excerpt?: string;
  sourceRef?: string;
  count?: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
  notes?: string;
};
```

Rules:

- The shape is internal first. Do not expose it as a public API contract before review.
- IDs can be derived for aggregated signals in a first pass.
- Signals should not store secrets, private context, raw credentials, or personal contact data.
- Pasted private Agent context must not be persisted as a signal body.

## Signal Normalization

### Search Misses

Input:

- Raw query.
- Result count.
- Suggested recovery route if any.
- Timestamp.

Normalization:

- Lowercase and trim query for grouping.
- Group repeated miss terms.
- Attach likely track when discovery logic can infer one.
- Severity increases with repeated misses.

### Agent Questions

Input:

- Question text.
- Scope.
- Article slug if current article.
- Source count.
- Error or refusal status.

Normalization:

- Do not persist private attachments.
- Group similar questions by normalized text and route.
- Create `agent_low_confidence` when answer has weak source coverage.
- Create `agent_refusal` when refusal is expected or caused by source limits.

### Article Feedback

Input:

- Article slug.
- Feedback category.
- Optional text.
- Timestamp.

Normalization:

- Map to article slug.
- Strip or avoid direct personal identifiers.
- Severity depends on repeated negative feedback or explicit content confusion.

### Content Audit Findings

Input:

- File or article slug.
- Rule code.
- Severity.
- Message.
- Line when available.

Normalization:

- Structural failures become high severity.
- Style recommendations become low or medium severity.
- Findings are grouped by article and rule code.

### Publish Freshness

Input:

- Knowledge index freshness.
- Seed and DB publish mismatch.
- Track coverage.
- Stale indexed article.

Normalization:

- Stale public article index becomes high severity when article is published.
- Draft-only or hidden articles are not public failures.

## Persistence Strategy

Phase 1:

- Build a read model from existing sources on request.
- Persist only where existing persistence already exists.
- Keep this additive and avoid schema migration.

Phase 2:

- Add durable `reader_signals` storage after reviewing the model.
- Add status mutation endpoints.
- Add aggregation snapshots if needed for performance.

Phase 3:

- Connect resolved signals to publish events or article revisions.

Decision rule:

- If implementation finds an existing table or JSON persistence pattern that cleanly fits the model, use it.
- If not, document the migration separately before modifying schema.

## Owner Cockpit IA

Route:

- Primary target: `/manage/agent`
- Possible later split: `/manage/signals`

Top-level sections:

1. Release readiness.
2. Content gaps.
3. Weak Agent answers.
4. Search misses.
5. Article quality issues.
6. Knowledge index health.
7. Advanced debug tools.

### Release Readiness

Display:

- UI audit status.
- Typecheck status if available from latest local report.
- Content audit status.
- Agent eval status.
- Knowledge index freshness.
- Last publish refresh result.

Acceptance:

- Owner can see whether the site is safe to ship.
- Each failed state links to the relevant report or action.

### Improvement Queue

Columns:

- Priority.
- Article or topic.
- Signal type.
- Evidence.
- Suggested next action.
- Status.

Actions:

- Mark triaged.
- Mark planned.
- Open article editor.
- Open Agent debug.
- Mark resolved.
- Ignore with note.

Acceptance:

- Owner can decide what to improve next in under one minute.
- Debug information is available but not the default surface.

## UI Contract

- This is an operational owner screen, not a marketing page.
- Use compact tables or grouped rows where data is dense.
- Avoid large decorative cards.
- Use tabs only when they separate actual jobs.
- Use badges for status sparingly and consistently.
- Keep advanced debug behind collapsible details.

## Tests

Unit:

- Signal normalization groups repeated search misses.
- Private context is not persisted.
- Content audit findings map to article slugs when possible.
- Publish freshness failures generate high severity signals.

Server:

- Admin-only signal endpoint requires admin auth.
- Status mutations validate allowed transitions.
- Ignored signals require a note if implementation supports notes.

Client:

- Empty state explains what will appear.
- Release readiness renders pass and fail states.
- Queue supports status changes.
- Advanced debug remains reachable.

Commands:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
corepack pnpm build
```

## Privacy And Safety

- Do not persist production secrets.
- Do not persist private pasted Agent context.
- Do not expose admin-only signals publicly.
- Avoid storing direct personal identifiers unless an existing feature already handles consent and retention.
- Signal excerpts should be bounded and sanitized.

## Implementation Slices

1. Define signal normalization helpers and tests.
2. Build read-only owner queue from existing sources.
3. Add release readiness panel from existing reports.
4. Add status actions only after persistence path is approved.
5. Connect resolved status to publish freshness and reindex evidence.

## Acceptance Checklist

- Search misses and Agent gaps appear in one owner view.
- Content audit findings are visible as article work, not just terminal output.
- Knowledge index freshness is part of release readiness.
- Debug tools remain available but secondary.
- No schema migration occurs without a follow-up plan.
