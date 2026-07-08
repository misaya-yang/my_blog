# Agent Quality Operations Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The public Agent is part of the reading experience, but its quality must be operated from the owner side. The current project already has Agent conversations, run traces, retrieval debug, eval mutations, knowledge indexing, and a `/manage/agent` route. This spec turns those pieces into a compact quality operations surface: what is fresh, what failed, what lacks sources, what should become writing work, and which evals guard the next release.

This spec is additive. It does not change providers, quotas, auth, database schema, or the streaming route contract in the first implementation pass.

## Goals

- Make Agent quality understandable without reading raw traces first.
- Add deterministic answer-quality checks beyond retrieval hit count.
- Convert weak runs into reader signals and writing backlog candidates.
- Make reindex/freshness state visible next to eval state.
- Keep advanced debugging available but secondary.
- Protect private context and hidden content boundaries.

## Non-Goals

- No model-judge dependency in the first pass.
- No autonomous browsing.
- No pgvector migration.
- No public Agent workspace separate from article/track pages.
- No provider change or new model-selection UI.
- No schema migration unless separately reviewed.

## Current Files

Client:

- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/i18n/agent.ts`
- `client/src/i18n/agentOps.ts`

Server:

- `server/ai/router.ts`
- `server/ai/evals.ts`
- `server/ai/harness.ts`
- `server/ai/conversations.ts`
- `server/ai/knowledge.ts`
- `server/ai/knowledgeDb.ts`
- `server/ai/streamRoute.ts`
- `server/readerSignals.ts`

Tests:

- `server/agent.router.test.ts`
- `server/ai/harness.test.ts`
- `server/ai/streamRoute.test.ts`
- `server/readerSignals.test.ts`
- `client/src/components/agent/BlogAgentRoot.test.ts`

## Product Model

Agent quality has five observable layers:

1. Knowledge freshness: whether public content is indexed and recent.
2. Retrieval quality: whether relevant public sources are found.
3. Answer quality: whether the answer is grounded, scoped, readable, and useful with collapsed sources.
4. Boundary quality: whether hidden/private/draft content is refused or omitted correctly.
5. Operational action: whether weak cases become backlog items.

The owner should see this hierarchy before raw logs.

## Eval Contract

Additive evaluation shape:

```ts
type AgentQualityCheck = {
  id: string;
  question: string;
  scopeType: "article" | "track" | "site";
  scopeValue?: string | null;
  expectedMode: "answer" | "narrow" | "refuse";
  expectedSources?: string[];
  checks: {
    retrievedAnySource: boolean;
    expectedSourceCovered: boolean;
    grounded: boolean;
    scoped: boolean;
    refusalBoundary: boolean;
    readableCollapsed: boolean;
    citationUsable: boolean;
  };
  failures: string[];
};
```

First-pass deterministic rules:

- `retrievedAnySource` is true when source count is greater than zero.
- `expectedSourceCovered` compares retrieved slugs or titles with configured expected sources.
- `refusalBoundary` is true when hidden/draft/private prompts produce refusal or narrowed answer.
- `readableCollapsed` is true when final answer has non-empty content before source expansion.
- `citationUsable` is true when each displayed source has title plus route or article slug.

Rules that require semantic judgment should be marked `manual_review_required` rather than faked.

## Golden Sets

Create or organize eval questions into four groups:

1. Current article questions:
   - Tests whether the Agent respects the article scope.
   - Expected sources should include the current article slug.

2. Track reading questions:
   - Tests whether the Agent builds reading paths from public track content.
   - Expected mode is answer, with multiple public sources.

3. Public corpus questions:
   - Tests cross-article retrieval.
   - Expected mode can be answer or narrow.

4. Boundary questions:
   - Tests draft, hidden, private, credential, or unsupported content boundaries.
   - Expected mode is refuse or narrow.

Do not add private or secret text to fixtures.

## Reader Signal Integration

Weak runs should become normalized signals:

- `agent_question`: normal repeated question that may justify an article or section.
- `agent_low_confidence`: completed answer with zero sources, retrieval error, or low citation coverage.
- `agent_refusal`: refusal caused by absent public source, unsafe private request, or hidden-content boundary.

Signal rules:

- Store public question text after contact redaction.
- Do not persist pasted private context.
- Store article or track scope when available.
- Group by normalized question plus route context.
- Severity is high for repeated zero-source failures, medium for refusal gaps, low for ordinary repeated questions.

## Owner UI Contract

The `/manage/agent` first screen should answer:

- Is the public knowledge index fresh?
- Are evals passing?
- Which questions repeatedly fail or lack sources?
- Which articles or tracks need content improvement?
- What changed since the last publish/reindex?

Suggested IA:

1. Quality summary row:
   - Knowledge freshness.
   - Eval pass rate.
   - No-source runs.
   - Failed/refusal runs.

2. Action queue:
   - Top Agent gaps.
   - Suggested article updates.
   - Links to editor or debug view.

3. Eval runner:
   - Existing question editor.
   - Grouped result output.
   - Failure reasons.

4. Retrieval diagnostics:
   - Debug query.
   - Source preview.
   - Retrieval strategy.

5. Advanced traces:
   - Recent runs.
   - Latency.
   - source count.
   - errors.

Raw traces should not be the default first reading surface.

## Data And Privacy

- Do not expose owner Agent quality endpoints publicly.
- Do not include hidden/draft article content in eval output.
- Do not log or persist private context body as a reader signal.
- Redact direct email and IP-like strings before storing text signals.
- Keep localStorage-only UI state local; do not treat it as product data.

## Implementation Slices

1. Add Agent signal normalization in `server/readerSignals.ts`.
2. Extend eval result shape in `server/ai/evals.ts` and `server/ai/harness.ts`.
3. Surface normalized quality summary in `server/ai/router.ts`.
4. Reorder `/manage/agent` so quality summary and action queue come before raw traces.
5. Add tests for zero-source, refusal, expected-source coverage, and private-context redaction.

## Tests

Focused:

```bash
corepack pnpm test -- server/readerSignals.test.ts server/agent.router.test.ts server/ai/harness.test.ts server/ai/streamRoute.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm build
```

Browser evidence:

- `/manage/agent` authenticated owner state.
- Eval run with mixed pass/fail cases.
- Recent trace with zero sources.
- Reindex/freshness state.

## Acceptance Checklist

- Owner can identify Agent quality risk in under one minute.
- Zero-source and refusal cases become reader signals without leaking private context.
- Evals include source coverage, scope, refusal, collapsed readability, and citation usefulness.
- Raw traces remain available but secondary.
- No provider, auth, quota, schema, or streaming contract change is required.
