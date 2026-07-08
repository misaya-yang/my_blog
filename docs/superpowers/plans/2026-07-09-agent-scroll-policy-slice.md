# Agent Scroll Policy Slice Plan

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`

## Scope

Extract and test Agent message scrolling policy without changing the visible Agent UI or streaming contracts.

## Goals

- Move scroll decision ownership into `agentScrollPolicy.ts`.
- Keep submit behavior: follow the new answer start/stream by default.
- Keep streaming behavior: follow only when the reader is already near the bottom.
- Keep final and failure behavior: stop following so sources do not pull the viewport down.
- Keep `BlogAgentRoot.tsx` as orchestrator, not policy owner.

## Non-Goals

- No Agent UI component split in this slice.
- No drag/resize behavior changes.
- No source card layout changes.
- No route, tRPC, DB, provider, quota, auth, or persistence changes.
- No new dependency.

## Intended Files

- `client/src/components/agent/agentScrollPolicy.ts`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- `docs/product_optimization/reports/agent-scroll-policy-slice-2026-07-09/summary.md`

## Implementation Steps

1. Add pure scroll-policy event helpers.
2. Replace inline `shouldFollowStreamRef` mutations in `BlogAgentRoot` with helper calls.
3. Update tests to import scroll policy from its owning module.
4. Add tests for submit, stream update near/far from bottom, final, failed, and message-scroll effect conditions.
5. Run focused tests and local gates.

## Verification Commands

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

## Risks

- A refactor can accidentally re-enable final auto-scroll. Keep explicit final/failure tests.
- Null scroller behavior should remain permissive for initial submit/open states.
- This slice has no visual change; evidence is code diff plus tests/gates rather than screenshots.
