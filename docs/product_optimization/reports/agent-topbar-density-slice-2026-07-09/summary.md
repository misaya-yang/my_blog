# Agent Topbar Density Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice reduced the Agent topbar and conversation-context footprint so the answer area has more room.

Changes made:

- Added `agent-topbar-primary`, `agent-topbar-meta`, `agent-scope-pill`, `agent-context-dock`, `agent-context-toggle`, and `agent-context-editor` hooks.
- Kept trust boundary details collapsed by default, including when private context is attached.
- Kept attached-context status visible in the trust summary using the existing localized context count.
- Tightened topbar, scope pill, quota badge, history button, trust boundary, and context dock spacing in `agent-surfaces.css`.

## Files

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/AgentContextSurfaces.tsx`
- `client/src/components/agent/AgentContextSurfaces.test.tsx`
- `client/src/styles/agent-surfaces.css`

## Product Review Notes

- This directly addresses the Agent page issue where trust/context hints consumed too much vertical space before the answer.
- The trust boundary remains discoverable and traceable, but no longer auto-expands into a second line just because context exists.
- Attached context still has a stronger visual state through `agent-trust-boundary-attached` and the count in summary.
- Context attachment behavior and file-pick behavior were not changed.

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

```bash
PORT=3000 NODE_ENV=production node dist/index.js
corepack pnpm audit:ui
```

Passed after starting the local production server. The first `audit:ui` attempt failed because no server was listening on `localhost:3000`; the rerun passed.

## Remaining Risk

This is a CSS and static-rendering validated density pass. It does not include a fresh manual screenshot comparison of a live long-answer Agent conversation with real provider output.
