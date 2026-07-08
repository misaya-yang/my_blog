# Agent Quota Status Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted Agent quota status rendering out of `BlogAgentRoot.tsx` into `AgentQuotaStatus.tsx`.

The change is intentionally behavior-preserving:

- Remaining quota still uses `agent.quota.remaining`.
- Low quota still uses `agent.quota.low`.
- Low quota still shows the low quota detail callout.
- Admin quota still shows the admin detail callout.
- Regular non-low visitor quota still does not show a callout.

## Files

- `client/src/components/agent/AgentQuotaStatus.tsx`
- `client/src/components/agent/AgentQuotaStatus.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Code Review Notes

- `BlogAgentRoot.tsx` now imports quota UI and policy from `AgentQuotaStatus.tsx`.
- The module reuses the existing `QuotaInfo` type through `Pick`, so no new quota shape or API contract was introduced.
- The existing `LogIn` icon import remains in `BlogAgentRoot.tsx` because the recovery action still uses it.
- No route, API, auth, storage, stream, reservation, or server behavior changed.
- No new dependency was added.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentQuotaStatus.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 52 test files, 319 tests.

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

This slice does not redesign the top toolbar density. It only makes the quota surface independently testable so a later UI pass can tune spacing and visual hierarchy with less risk.
