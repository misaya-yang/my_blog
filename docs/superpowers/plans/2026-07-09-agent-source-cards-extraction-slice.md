# Agent Source Cards Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting the Agent source summary/cards UI into a dedicated component module while preserving the answer-first collapsed source behavior.

## Scope

In:

- Move `AgentSourceCards`, preview chip, current-page detection, source link interception, and source scroll helpers out of `BlogAgentRoot.tsx`.
- Keep the existing collapsed-by-default and bounded expanded source list behavior.
- Add focused tests for source-section labels, current-page detection, and same-page source navigation.
- Write a slice evidence report.

Out:

- No source UI redesign.
- No source ranking, retrieval, citation, stream, DB, or API changes.
- No mobile sheet or desktop frame changes.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentSourceCards.tsx`
- `client/src/components/agent/sourceCards.test.ts`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-source-cards-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/sourceCards.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines `AgentSourceCards`.
- Source summary remains collapsed by default.
- Same-page source links still scroll to the matching heading instead of navigating.
- Source card section labels prefer heading, then context label, then site fallback.
- Current-page detection still works with query/hash-free path comparison.
