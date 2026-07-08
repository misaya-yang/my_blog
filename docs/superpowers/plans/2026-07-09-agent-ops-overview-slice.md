# Agent Ops Overview Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for this tightly coupled UI slice. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/manage/agent` answer owner quality-risk questions in the first screen before raw index/debug/eval/trace tools.

**Architecture:** Add a client-only `AgentQualityOverview` component that composes existing `adminKnowledgeStatus`, `adminQuestionRadar`, and `contentRadar.summary` data. No new route, server method, database field, or eval contract is introduced in this slice.

**Tech Stack:** React, existing `ResearchShell` primitives, lucide icons, Vitest static markup tests, existing i18n dictionaries.

## Global Constraints

- No new dependency.
- No DB, auth, tRPC, Agent stream, retrieval, quota, provider, or reindex behavior changes.
- No private feedback body, pasted context, contact detail, or hidden/draft content in the overview.
- Keep raw index/debug/eval/trace/idea tabs available.
- No broad CSS rewrite; use existing owner/agent console classes.
- Browser evidence is required because this changes a visible owner UI route.

## Tasks

### Task 1: Overview Component

**Files:**
- Create: `client/src/pages/manage-agent/AgentQualityOverview.tsx`
- Create: `client/src/pages/manage-agent/AgentQualityOverview.test.tsx`

- [x] Render a quality summary row with knowledge freshness, no-source runs, failed runs, and search miss count.
- [x] Render a bounded action queue that prioritizes stale index/error, no-source runs, failed runs, and search misses.
- [x] Render an all-clear state when no action is present.
- [x] Redact by construction: show only counts, scopes, slugs, run IDs, public queries, and suggested prompts already returned by owner endpoints.
- [x] Add static tests for stale index priority, no-source/failed/search-miss actions, and all-clear state.

### Task 2: Wire First-Screen IA

**Files:**
- Modify: `client/src/pages/ManageAgent.tsx`
- Modify: `client/src/i18n/agentOps.ts`

- [x] Add an `overview` tab as the default tab.
- [x] Put `AgentQualityOverview` before raw index/debug/eval/trace tooling.
- [x] Keep existing tabs and panels available.
- [x] Add English and Chinese strings for summary labels, action labels, all-clear copy, and owner route hints.

### Task 3: Evidence And Commit

**Files:**
- Create: `docs/product_optimization/reports/agent-ops-overview-slice-2026-07-09/summary.md`
- Add browser evidence under that report directory when feasible.

- [x] Run focused tests for `AgentQualityOverview` and `ManageAgent`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run a browser check or document the auth/local-server blocker if unavailable.
- [x] Run `git diff --check` and a secret scan over touched files.
- [x] Write the slice report with changed files, UI behavior, verification, screenshots/checks, and risks.
- [x] Commit the slice.

## Self-Review

- Spec coverage: covers SPEC-OPS owner first-screen IA without changing backend contracts.
- Placeholder scan: no `TODO` / `TBD` placeholders.
- Risk posture: client-only composition from existing owner-only data.
