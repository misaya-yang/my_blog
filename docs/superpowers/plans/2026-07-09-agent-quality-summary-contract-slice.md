# Agent Quality Summary Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for this tightly coupled server/client slice. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an owner-only Agent quality summary data contract so `/manage/agent` overview can load Agent quality state from one endpoint instead of composing multiple raw tool queries.

**Architecture:** Add additive `adminQualitySummary({ limit? })` to the Agent service and router. It reuses existing knowledge status and question radar builders, returns bounded action metadata, and does not mutate state. The overview consumes this summary for Agent-specific quality signals while keeping search misses from the existing engagement content radar.

**Tech Stack:** TypeScript, tRPC, existing Agent service, existing Vitest suites, React owner UI.

## Global Constraints

- No new dependency.
- No DB schema, auth, stream, retrieval, quota, model-provider, reindex, or public route contract changes.
- Endpoint is owner-only through the existing `assertAdminContext` service guard.
- Do not include hidden/draft/private content, pasted context bodies, feedback bodies, contact data, credentials, or raw trace bodies in the summary.
- Keep existing `adminKnowledgeStatus`, `adminQuestionRadar`, and `/manage/agent` tabs available.
- Additive types only.

## Tasks

### Task 1: Server Summary Contract

**Files:**
- Modify: `server/ai/types.ts`
- Modify: `server/ai/harness.ts`
- Modify: `server/ai/router.ts`
- Modify: `server/agent.router.test.ts`
- Modify: `server/ai/harness.test.ts`

- [x] Add `AgentQualitySummaryOutput` with `generatedAt`, `knowledgeStatus`, `radar`, `releaseBlocking`, and bounded `actionItems`.
- [x] Add `adminQualitySummary(ctx, { limit? })` to `AgentService`.
- [x] Implement the service by calling existing `getKnowledgeStatus()` and `conversationStore.listRuns()`, then `buildQuestionRadar()`.
- [x] Build action items for stale/errored index, no-source runs, and failed runs.
- [x] Add router input validation with `limit` clamped like `adminQuestionRadar`.
- [x] Add tests for admin-only access, stale index action, weak-run action, and router exposure.

### Task 2: Overview Consumption

**Files:**
- Modify: `client/src/pages/ManageAgent.tsx`
- Modify: `client/src/pages/manage-agent/AgentQualityOverview.tsx`
- Modify: `client/src/pages/manage-agent/AgentQualityOverview.test.tsx`

- [x] Query `trpc.agent.adminQualitySummary`.
- [x] Use summary data for overview knowledge/radar/action state.
- [x] Keep existing raw index and question radar queries for their tabs.
- [x] Keep search misses from `engagement.contentRadar.summary`.
- [x] Update tests for the summary-shaped props.

### Task 3: Evidence And Commit

**Files:**
- Create: `docs/product_optimization/reports/agent-quality-summary-contract-slice-2026-07-09/summary.md`

- [x] Run focused server and client tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check` and a secret scan over touched files.
- [x] Write the slice report with changed files, API contract, privacy boundary, verification, and residual risk.
- [x] Commit the slice.

## Self-Review

- Spec coverage: covers Wave 3 Agent quality summary data contract and strengthens the previous overview slice.
- Placeholder scan: no `TODO` / `TBD` placeholders.
- Risk posture: additive owner-only read endpoint with bounded output.
