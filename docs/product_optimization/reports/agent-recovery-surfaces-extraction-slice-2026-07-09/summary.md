# Agent Recovery Surfaces Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted Agent notice, bootstrap unavailable, and message recovery rendering out of `BlogAgentRoot.tsx` into `AgentRecoverySurfaces.tsx`.

The change is intentionally behavior-preserving:

- Warning/error notice tones are unchanged.
- Bootstrap unavailable retry UI is unchanged.
- Cancelled, failed, and timeout messages with a recovery prompt still expose retry.
- Anonymous quota-blocked messages still expose visitor continuation.
- Messages without a recovery state still render no recovery surface.

## Files

- `client/src/components/agent/AgentRecoverySurfaces.tsx`
- `client/src/components/agent/AgentRecoverySurfaces.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Code Review Notes

- `BlogAgentRoot.tsx` now imports recovery surfaces and keeps retry/visitor callback ownership.
- `getRecoveryMessageKey` moved with the recovery UI because it only maps recovery display copy.
- Failure-state calculation helpers remain in the root for now because they are tied to stream final handling.
- No route, stream, auth, quota, retrieval, server, or storage behavior changed.
- No new dependency was added.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentRecoverySurfaces.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 54 test files, 329 tests.

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

This is a structural extraction slice. It does not redesign error recovery copy or retry policy.
