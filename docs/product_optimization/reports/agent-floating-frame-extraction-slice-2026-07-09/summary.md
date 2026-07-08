# Agent Floating Frame Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted the Agent floating frame container out of `BlogAgentRoot.tsx` into `AgentFloatingFrame.tsx`.

The change is intentionally behavior-preserving:

- Mobile still renders the bottom sheet wrapper with non-floating controls.
- Desktop still renders the fixed floating frame with transform-based position.
- Drag, resize, preset, reset, clamp, and localStorage persistence algorithms are unchanged.
- `BlogAgentRoot.tsx` still re-exports `AgentFloatingFrame` to preserve the previous module contract.

## Files

- `client/src/components/agent/AgentFloatingFrame.tsx`
- `client/src/components/agent/AgentFloatingFrame.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Code Review Notes

- Frame state math remains in `agentFrameState.ts`.
- The new module owns pointer-event handlers and frame persistence side effects.
- `BlogAgentRoot.tsx` now treats the frame as a container dependency and keeps panel orchestration.
- No route, stream, auth, quota, retrieval, context, source, server, or storage schema behavior changed.
- No new dependency was added.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentFloatingFrame.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 56 test files, 333 tests.

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm build
```

Passed.

```bash
git diff --check
```

Passed.

## Remaining Risk

This slice uses static render-contract tests for the frame container. It does not perform a live pointer-event drag/resize browser interaction test.
