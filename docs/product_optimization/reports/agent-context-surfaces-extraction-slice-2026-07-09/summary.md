# Agent Context Surfaces Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted the Agent conversation context dock and trust boundary out of `BlogAgentRoot.tsx` into `AgentContextSurfaces.tsx`.

The change is intentionally behavior-preserving:

- Context open/close state remains owned by `BlogAgentRoot.tsx`.
- Context text, attach action, file-pick action, disabled state, and loading state remain passed from the root.
- Trust boundary still expands when attached context exists.
- Public-source trust copy and conversation-local context copy are unchanged.

## Files

- `client/src/components/agent/AgentContextSurfaces.tsx`
- `client/src/components/agent/AgentContextSurfaces.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Code Review Notes

- `BlogAgentRoot.tsx` now passes the formatted scope label into `AgentTrustBoundary`, avoiding another scope helper move in this slice.
- The new component module owns only display concerns and local text selection.
- The root still owns context mutation, upload flow, notices, and submission behavior.
- No route, stream, retrieval, auth, quota, server, or storage behavior changed.
- No new dependency was added.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentContextSurfaces.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 53 test files, 323 tests.

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

This slice does not yet compress the top toolbar or context area visually. It prepares that UI work by separating the context/trust surface from the Agent root orchestration.
