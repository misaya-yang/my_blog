# Agent Backlog Source Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop creating new `agent_radar` backlog links and normalize the legacy alias to canonical `agent_question` before seeding editor scaffolds.

**Architecture:** Keep this as a small client-only compatibility slice. Update the `/manage` Agent backlog link source and add a tiny Editor source normalizer so old URLs continue to work without writing legacy labels into drafts.

**Tech Stack:** React, TypeScript, Vitest, no new dependency.

## Global Constraints

- No route shape changes beyond query param value normalization.
- Preserve old `/write?...&source=agent_radar` compatibility.
- Do not inject private feedback bodies, Agent context, or contact values into editor content.
- Do not change editor publish behavior, storage, schema, or auth.

---

## Task 1: Canonical Agent Backlog Source

**Files:**
- Modify: `client/src/pages/Manage.tsx`
- Modify: `client/src/pages/Editor.tsx`
- Test: existing client page tests if impacted.

**Interfaces:**
- Produces:
  - New Agent backlog links use `source=agent_question`.
  - Editor normalizes `agent_radar` to `agent_question` before scaffold text.

- [x] Change `WritingBacklogPanel` Agent idea `draftHref` from `source=agent_radar` to `source=agent_question`.
- [x] Add `normalizeBacklogSource(source: string)` in `Editor.tsx` with `agent_radar -> agent_question`.
- [x] Use normalized source in the safe scaffold source line.
- [x] Keep all existing source values otherwise unchanged.

## Task 2: Evidence And Commit

**Files:**
- Create: `docs/product_optimization/reports/agent-backlog-source-normalization-slice-2026-07-09/summary.md`
- Modify: `docs/superpowers/plans/2026-07-09-agent-backlog-source-normalization-slice.md`

- [x] Run focused tests that cover touched surfaces: `corepack pnpm test -- client/src/pages/ManageAgent.test.tsx client/src/pages/Manage.test.tsx client/src/pages/Editor.test.tsx` if files exist, otherwise run `corepack pnpm test -- client/src/pages/ManageAgent.test.tsx`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Run a secret/contact scan over touched files without scanning `.env*`.
- [x] Write report with changed files, privacy boundary, verification commands, and residual risks.
- [x] Commit with `fix: normalize agent backlog source`.

## Self-Review

- Spec coverage: canonicalizes new Agent backlog source values and preserves legacy alias compatibility.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: no new exported API.
