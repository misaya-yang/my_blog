# Agent Scroll Policy Slice Report

Date: 2026-07-09

## What Changed

- Expanded `agentScrollPolicy.ts` from a near-bottom helper into the owner of Agent stream-follow decisions.
- Added `getNextAgentStreamFollowState` for submit, status, answer delta, final, and failed events.
- Added `shouldScrollAgentMessagesToEnd` for the message-list effect guard.
- Updated `BlogAgentRoot.tsx` to call the policy helpers instead of owning inline scroll decisions.
- Updated tests to import scroll policy directly from `agentScrollPolicy.ts`.

## Behavior Preserved

- Submit starts following the new answer stream.
- Streaming status and answer deltas follow only when the reader is already near the bottom.
- Final and failed events stop following so expanded sources cannot pull the viewport down.
- Null scroller still behaves permissively for initial near-bottom checks.

## Files Changed

- `client/src/components/agent/agentScrollPolicy.ts`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- `docs/superpowers/plans/2026-07-09-agent-scroll-policy-slice.md`

## Verification

Completed:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

Notes:

- The focused test command ran the full current Vitest suite: 45 files, 278 tests passed.
- `content:audit` passed with 0 failures, 0 warnings, and 1 existing non-blocking suggestion in `gated_ffn_blog.md:353`.
- The first `audit:ui` attempt failed because no local server was listening on `localhost:3000`; after starting `corepack pnpm dev`, `audit:ui` passed.
- This slice has no intended visual change; no screenshots were captured.
