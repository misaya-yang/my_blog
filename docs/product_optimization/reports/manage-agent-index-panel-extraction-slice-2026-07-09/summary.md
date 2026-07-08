# Manage Agent Index Panel Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracts the Agent knowledge index status panel from `ManageAgent.tsx` into `client/src/pages/manage-agent/AgentIndexStatusPanel.tsx`.

Behavior is unchanged:

- `/manage/agent` still shows index metrics.
- Stale Agent knowledge still renders release-blocker copy.
- Fresh Agent knowledge still renders release-ready copy.
- No reindex, publish, route, API, DB, auth, retrieval, or model behavior changed.

## Files

- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/ManageAgent.test.tsx`
- `client/src/pages/manage-agent/AgentIndexStatusPanel.tsx`

## Code Review Notes

- The `IndexStatus` type now lives with the component that renders it.
- The local date formatter moved with the extracted panel.
- `ManageAgent.tsx` remains the owner of queries, tabs, evals, traces, and radar state.
- The test now imports the focused panel directly.

## Verification

```bash
corepack pnpm test -- client/src/pages/ManageAgent.test.tsx
```

Passed: 61 test files, 349 tests.

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

This is a narrow extraction. The rest of `ManageAgent.tsx` remains large and should be split by tabs only when the next owner-console behavior change requires it.
