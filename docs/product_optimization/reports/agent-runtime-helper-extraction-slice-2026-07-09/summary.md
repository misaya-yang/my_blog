# Agent Runtime Helper Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice reduces `BlogAgentRoot.tsx` orchestration noise by moving pure Agent companion helper logic into `agentCompanionRuntime.ts`.

No stream, tRPC, quota, retrieval, source-card, storage, CSS, auth, route, or visual behavior was intentionally changed.

## Changed Files

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/agentCompanionRuntime.ts`
- `client/src/components/agent/agentCompanionRuntime.test.ts`
- `docs/superpowers/plans/2026-07-09-agent-runtime-helper-extraction-slice.md`

## User-Visible Behavior

- No intended UI behavior change.
- Existing imports from `BlogAgentRoot.tsx` remain compatible through re-exports.
- Hidden-route behavior remains unchanged.
- Answer-mode inference remains unchanged.
- Companion prompt and welcome fallback behavior remains unchanged.
- Context file attachment type detection and fallback MIME behavior remain unchanged.
- Mobile focus-trap element filtering remains unchanged.

## Simplification Notes

- `BlogAgentRoot.tsx` dropped from 747 lines to 651 lines.
- Pure helper responsibilities now live in `agentCompanionRuntime.ts`.
- `BlogAgentRoot.tsx` continues to own state, effects, refs, tRPC mutations, streaming, context attachment, history selection, and rendering composition.
- The next higher-risk extraction remains stream submission orchestration, but this slice intentionally avoids it.

## Verification

Focused Agent tests:

```bash
corepack pnpm test -- client/src/components/agent/agentCompanionRuntime.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/AgentPanel.test.tsx
```

Passed. Vitest ran 65 files and 375 tests.

Typecheck:

```bash
corepack pnpm check
```

Passed.

Production build:

```bash
corepack pnpm build
```

Passed.

## Code Review Notes

- Read-only subagent review agreed the safest next extraction is pure companion strategy/helper logic and explicitly recommended not extracting `handleSubmit` yet.
- This implementation includes the recommended policy helpers and also moves adjacent pure session/file/focus helpers so the root keeps less utility code.
- The added tests cover prompt fallback, welcome copy, session identity keys, file kind classification, fallback MIME type, and focusable filtering.

## Remaining Risk

- This is not a visual slice and has no screenshot evidence.
- The focusable-element helper is pure but DOM-shaped; tests use fake elements because the project Vitest environment is Node.
- `BlogAgentRoot.tsx` is still a large orchestrator. Stream submission and context mutation should be split only in a later, separately tested slice.
