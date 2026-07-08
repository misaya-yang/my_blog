# Agent Failure Helpers Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted Agent failure and completion state mapping out of `BlogAgentRoot.tsx` into `agentFailure.ts`.

The change is intentionally behavior-preserving:

- Anonymous quota blocks still use anonymous quota copy.
- Non-anonymous quota blocks still use visitor quota copy.
- Client timeout maps to `timeout`.
- Client abort maps to `cancelled`.
- Generic client send failure maps to `failed`.
- Server abort and timeout error codes map to the matching state.
- Empty no-public-source completions map to `no_source`.

## Files

- `client/src/components/agent/agentFailure.ts`
- `client/src/components/agent/agentFailure.test.ts`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Code Review Notes

- Stream event handling remains in `BlogAgentRoot.tsx`.
- Error classification now lives beside Agent helper modules and is covered by focused tests.
- No route, stream parser, retry policy, source, auth, quota, server, or storage behavior changed.
- No new dependency was added.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/agentFailure.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 58 test files, 339 tests.

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

This is a pure helper extraction slice. It does not change retry policy or user-facing recovery copy.
