# Agent Panel Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted the main Agent panel shell out of `BlogAgentRoot.tsx` into `AgentPanel.tsx`.

The change is intentionally behavior-preserving:

- `BlogAgentRoot.tsx` still owns stream state, route state, context attachment state, history state, and all callbacks.
- `AgentPanel.tsx` owns only panel rendering, local submit event handling, message display, topbar display, context dock rendering, and composer rendering.
- The previous `BlogAgentRoot.tsx` module export for `AgentPanel` is preserved through a re-export.
- Desktop still renders `role="complementary"`.
- Mobile still renders `role="dialog"` with `aria-modal="true"`.
- Empty conversation still renders welcome title, body, and suggested prompts.
- History-open state still renders the history panel.

## Files

- `client/src/components/agent/AgentPanel.tsx`
- `client/src/components/agent/AgentPanel.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Code Review Notes

- The lazy `AgentMarkdown` boundary moved with the message-rendering surface.
- `scopeLabel` moved with the panel because it is now only used by panel rendering.
- No stream, scroll, source, quota, context, route, auth, server, or storage behavior changed.
- No new dependency was added.
- `BlogAgentRoot.tsx` dropped from 1240 lines to 747 lines in this slice.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentPanel.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 59 test files, 342 tests.

```bash
corepack pnpm test
```

Passed: 59 test files, 342 tests.

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

This slice uses static render-contract tests for panel semantics and major empty/history states. It does not add a browser-level long-answer visual test for the extracted panel.
