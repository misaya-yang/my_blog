# Agent Launcher Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted the Agent launcher button out of `BlogAgentRoot.tsx` into `AgentLauncher.tsx`.

The change is intentionally behavior-preserving:

- `aria-expanded`, `aria-controls`, `aria-label`, and title remain passed through.
- Closed state still renders the book icon.
- Open state still renders the close icon.
- Low-quota dot still renders when `lowQuota` is true.
- `BlogAgentRoot.tsx` still re-exports `AgentLauncher` to preserve the previous module contract.

## Files

- `client/src/components/agent/AgentLauncher.tsx`
- `client/src/components/agent/AgentLauncher.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentLauncher.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 57 test files, 335 tests.

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

This is a structural extraction slice. It does not redesign launcher placement or behavior.
