# Agent Quality Summary Contract Slice

Date: 2026-07-09
Branch: dev

## Summary

This slice adds an owner-only Agent quality summary contract for `/manage/agent`.
The overview now reads Agent knowledge and run-quality state from one Agent
endpoint, while search-miss signals remain sourced from the existing engagement
summary.

## Changed Files

- `server/ai/types.ts`: added `AgentQualitySummaryOutput`.
- `server/ai/harness.ts`: added `adminQualitySummary(ctx, { limit? })`, combining
  knowledge index status, question radar, release-blocking state, and bounded
  action items.
- `server/ai/router.ts`: exposed `agent.adminQualitySummary` with bounded `limit`
  input.
- `server/ai/harness.test.ts`: covered admin-only access, stale index action,
  no-source action, failed-run action, and bounded detail output.
- `server/agent.router.test.ts`: covered router exposure.
- `client/src/pages/ManageAgent.tsx`: added the overview query for
  `trpc.agent.adminQualitySummary`.
- `client/src/pages/manage-agent/AgentQualityOverview.tsx`: consumes the summary
  contract for Agent metrics and action queue; appends search-miss action from
  engagement data.
- `client/src/pages/manage-agent/AgentQualityOverview.test.tsx`: updated overview
  tests to use summary-shaped props and server action items.

## API Contract

Additive owner-only query:

```ts
agent.adminQualitySummary({ limit?: number })
```

Returns:

- `generatedAt`
- `knowledgeStatus`
- `radar`
- `releaseBlocking`
- `actionItems`

`limit` is accepted from 1 to 100 at the router boundary and clamped again in the
service before reading recent Agent runs.

## Privacy Boundary

The summary is guarded by the existing `assertAdminContext(ctx)` service check.
It reuses owner-only run metadata and public knowledge index status. It does not
return hidden/draft article bodies, pasted private context, feedback body text,
raw trace bodies, contact data, credentials, or model prompts.

Action details are bounded previews derived from stale public slugs, latest index
error text, run ids, error codes, and scopes. They intentionally do not include
raw Agent questions. They are intended for owner triage, not public rendering.

## Verification

- Independent sub-agent code review
  - Result: found no P0/P1 issues.
  - Fixed follow-up: removed raw Agent questions from summary action details and
    replaced generic radar error copy with summary-level error copy.
- `corepack pnpm test -- server/ai/harness.test.ts server/agent.router.test.ts client/src/pages/manage-agent/AgentQualityOverview.test.tsx client/src/pages/ManageAgent.test.tsx`
  - Result: passed; Vitest ran 66 files and 379 tests.
- `corepack pnpm test -- client/src/pages/manage-agent/AgentQualityOverview.test.tsx server/ai/harness.test.ts server/agent.router.test.ts`
  - Result: passed; Vitest ran 66 files and 379 tests.
- `corepack pnpm check`
  - Result: passed.
- `corepack pnpm build`
  - Result: passed.
- `git diff --check`
  - Result: passed with no whitespace errors.
- Secret scan over touched files
  - Result: no credential values found. One expected code literal,
    `OPENAI_API_KEY`, appears in provider-configuration error handling.

## Residual Risks

- The overview still reads search-miss state from `engagement.contentRadar.summary`;
  this is intentional because search misses are broader site-discovery signals,
  not Agent-run quality signals.
- Server `actionItems` are metadata; the client maps ids to localized UI copy
  instead of rendering server English strings directly.
- This slice does not change retrieval quality, model prompts, run persistence,
  quota, auth, or deploy configuration.
