# Agent Runtime Helper Extraction Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for this tightly coupled extraction. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `BlogAgentRoot.tsx` orchestration noise by moving pure runtime helper logic into a focused module while preserving every existing public export and Agent behavior.

**Architecture:** Add `agentCompanionRuntime.ts` for route/session/prompt/file/focus helpers that do not own React state, tRPC state, streaming, quota, retrieval, source cards, or UI rendering. `BlogAgentRoot.tsx` remains the orchestrator and re-exports compatibility helpers.

**Tech Stack:** TypeScript, React, Vitest, existing Agent component modules.

## Global Constraints

- No new dependency.
- No route, DB schema, auth, tRPC, quota, retrieval, stream, source-card, storage, CSS, or model-provider contract changes.
- No visual behavior change in this slice.
- Preserve existing imports from `BlogAgentRoot.tsx` by re-exporting moved helpers.
- Do not touch production credentials, deployment, migrations, force-push, or destructive operations.
- Keep extraction leaf-sized and behavior-preserving.

## Tasks

### Task 1: Extract Pure Runtime Helpers

**Files:**
- Create: `client/src/components/agent/agentCompanionRuntime.ts`
- Modify: `client/src/components/agent/BlogAgentRoot.tsx`

- [x] Move `inferAnswerMode` to the helper module.
- [x] Move `isBlogAgentHiddenRoute` to the helper module.
- [x] Move companion prompt/welcome builders to the helper module.
- [x] Move session identity key helper to the helper module using a minimal structural type.
- [x] Move context file kind and fallback MIME helpers to the helper module.
- [x] Move focusable-element lookup to the helper module.
- [x] Re-export the existing public helpers from `BlogAgentRoot.tsx`.
- [x] Keep `BlogAgentRoot.tsx` owning all state, effects, handlers, refs, mutations, and rendering composition.

### Task 2: Focused Tests And Evidence

**Files:**
- Create: `client/src/components/agent/agentCompanionRuntime.test.ts`
- Modify: `client/src/components/agent/BlogAgentRoot.test.ts`
- Create: `docs/product_optimization/reports/agent-runtime-helper-extraction-slice-2026-07-09/summary.md`

- [x] Add tests for prompt fallback, session identity keys, context file kinds, fallback MIME type, and focusable filtering.
- [x] Keep existing `BlogAgentRoot.test.ts` import compatibility for `inferAnswerMode` and `isBlogAgentHiddenRoute`.
- [x] Run focused Agent tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check` and a secret scan over touched files.
- [x] Write the slice report with changed files, behavior, verification, simplification notes, and residual risk.
- [x] Commit the slice.

## Self-Review

- Spec coverage: covers Wave 2 remaining `BlogAgentRoot` extraction without taking on stream or visual behavior.
- Placeholder scan: no `TODO` / `TBD` placeholders.
- Risk posture: helper extraction only; public module exports remain compatible.
