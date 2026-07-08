# Agent Source Summary Slice Plan

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`

## Scope

Extract Agent source-summary rules from `BlogAgentRoot.tsx` into a focused pure module while preserving the current collapsed-by-default UX.

## Goals

- Move collapsed source limit and visible-source selection into `agentSourceSummary.ts`.
- Move source preview title selection into the same module.
- Keep collapsed state showing first two source chips and a hidden count.
- Keep expanded state showing all source rows.
- Keep source card links, current-page detection, and scroll-to-source behavior unchanged.

## Non-Goals

- No visual redesign in this slice.
- No source card persistence or server changes.
- No citation ranking changes.
- No new dependency.

## Intended Files

- `client/src/components/agent/agentSourceSummary.ts`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/sourceCards.test.ts`
- `docs/product_optimization/reports/agent-source-summary-slice-2026-07-09/summary.md`

## Implementation Steps

1. Add `AGENT_COLLAPSED_SOURCE_LIMIT`, `getVisibleSourceCards`, `getHiddenSourceCount`, and `getSourcePreviewTitle`.
2. Wire `AgentSourceCards` and preview chips through the new module.
3. Update tests to import source-summary rules from the owning module.
4. Add tests for hidden count and fallback title selection.
5. Run focused tests and local gates.

## Verification Commands

```bash
corepack pnpm test -- client/src/components/agent/sourceCards.test.ts client/src/components/agent/BlogAgentRoot.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

## Risks

- Accidentally changing collapsed count would reintroduce source crowding. Keep the limit explicit and tested.
- Preview title fallback must remain stable for user context and site-level sources.
- This is a behavior-preserving extraction; screenshot evidence is not required unless visual output changes.
