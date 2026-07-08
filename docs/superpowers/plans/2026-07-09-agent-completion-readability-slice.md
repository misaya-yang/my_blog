# Agent Completion Readability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make completed Agent answers read first, keep source and follow-up affordances compact, and prove the completed state with tests and browser evidence.

**Architecture:** This is a bounded Agent UX hardening slice. Keep the stream protocol, retrieval, DB schema, quota, auth, and route contracts unchanged. Frontend changes live in Agent components and CSS; one additive server normalization change improves generated follow-up task wording without changing the public answer shape.

**Tech Stack:** React, TypeScript, existing i18n dictionaries, existing CSS variables in `agent-surfaces.css`, Vitest, Playwright-backed `audit:ui`.

## Global Constraints

- No new dependency.
- No public leak of hidden, draft, admin-only, private, pasted, credential, or contact data.
- No deployment, force push, schema migration, destructive data operation, or credential mutation without explicit owner approval.
- No broad CSS rewrite or page rewrite in a single commit.
- Agent final state must not auto-scroll to sources.
- Sources remain collapsed by default and expanded source lists must stay bounded and overflow-safe.
- Light and dark modes must remain readable.
- Do not increase broad CSS `!important` debt without reporting it.

---

### Task 1: Follow-Up Tasks Contract

**Files:**
- Create: `client/src/components/agent/agentFollowUpTasks.ts`
- Modify: `client/src/components/agent/AgentRelatedQuestions.tsx`
- Modify: `client/src/components/agent/AgentRelatedQuestions.test.tsx`
- Modify: `client/src/i18n/agent.ts`

**Interfaces:**
- Produces: `AGENT_FOLLOW_UP_TASK_LIMIT: 3`
- Produces: `getVisibleAgentFollowUpTasks(questions: string[]): string[]`
- Consumes: existing `AgentRelatedQuestions` props.

- [x] Add the helper with trimming, dedupe, and a hard three-item display limit.
- [x] Update `AgentRelatedQuestions` to render a compact reading-task list instead of free-form wrapped chips.
- [x] Rename visible copy from "Related questions" to "Continue reading" / "继续阅读".
- [x] Add static render tests for trimming, dedupe, display limit, title copy, and disabled buttons.

### Task 2: Assistant Bubble And Source Layout

**Files:**
- Modify: `client/src/components/agent/AgentPanel.tsx`
- Modify: `client/src/components/agent/AgentSourceCards.tsx`
- Modify: `client/src/components/agent/sourceCards.test.ts`
- Modify: `client/src/styles/agent-surfaces.css`

**Interfaces:**
- Consumes: existing `ChatMessage.sourceCards`.
- Produces: stable classes `agent-message-bubble-assistant`, `agent-message-bubble-user`, `agent-source-list`, `agent-source-detail`.

- [x] Give assistant answers full available row width while keeping user messages narrower.
- [x] Add `aria-controls` to the source toggle and a stable expanded list id from React `useId`.
- [x] Keep source details as second-level disclosure, but ensure long titles/excerpts cannot create horizontal overflow.
- [x] Add source card static render assertions for collapsed default controls and expanded list linkage.
- [x] Add CSS constraints without increasing the `!important` count.

### Task 3: Server Follow-Up Fallback Language

**Files:**
- Modify: `server/ai/model.ts`
- Modify: `server/ai/model.test.ts`

**Interfaces:**
- Preserve: `normalizeAgentAnswer(parsed, sourceCards)` still works.
- Add: optional third argument `{ message?: string; routeContext?: AgentRouteContext }`.

- [x] Add prompt guidance that `relatedQuestions` should be reading-task follow-ups in the user's language.
- [x] Localize fallback follow-ups when the model omits related questions.
- [x] Keep explicit model-provided follow-ups after trim/dedupe, capped at four.
- [x] Add tests for Chinese fallback and English fallback.

### Task 4: Audit Fixture And Evidence

**Files:**
- Modify: `scripts/audit/ui-layout.ts`
- Create: `docs/product_optimization/reports/agent-completion-readability-slice-2026-07-09/summary.md`
- Generated: `docs/product_optimization/reports/agent-completion-readability-slice-2026-07-09/ui-layout-checks.json`

**Interfaces:**
- Consumes: existing `AUDIT_BASE_URL` and `--output=` behavior.
- Produces: report JSON with completed-answer fixture checks.

- [x] Update the Agent answer fixture to use the new assistant bubble and follow-up task classes.
- [x] Add fixture checks that follow-up tasks do not overflow and expanded source content remains bounded.
- [x] Run focused Vitest tests for Agent components and server model normalization.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run local production server and `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/agent-completion-readability-slice-2026-07-09/ui-layout-checks.json`.
- [x] Write the report with commands, evidence, and remaining risk.
- [x] Run `git diff --check`, inspect the diff, commit the slice.

## Self-Review

- Spec coverage: covers SPEC-AGENT answer visibility, collapsed sources, source overflow, reading-task follow-ups, and browser evidence. It does not claim to complete Agent ops, retrieval quality, or owner cockpit specs.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: helper names and optional `normalizeAgentAnswer` options are defined before use.
