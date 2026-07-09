# Agent Helper Extraction Slice 3 Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract Agent frame, scroll, and elapsed-time pure helpers from `BlogAgentRoot.tsx` without changing public Agent behavior.

**Architecture:** Keep `BlogAgentRoot.tsx` as the public component and compatibility export surface. Move pure helper logic into small files under `client/src/components/agent/`, then re-export helpers from `BlogAgentRoot.tsx` so existing tests and imports keep working.

**Tech Stack:** React 19, TypeScript, existing Vitest tests, no new dependencies.

## Global Constraints

- No UI behavior change.
- No route, tRPC, DB, auth, quota, model provider, or persistence contract change.
- No new dependency.
- Existing `BlogAgentRoot.test.ts` imports should continue to work.
- Keep drag, resize, elapsed, and scroll tests green.

---

## File Structure

- Create: `client/src/components/agent/agentFrameState.ts`
  - Owns frame constants, presets, persisted frame parsing, default state, clamping, preset validation, and preset shortcut labels.
- Create: `client/src/components/agent/agentScrollPolicy.ts`
  - Owns `isAgentNearBottom`.
- Create: `client/src/components/agent/agentElapsed.ts`
  - Owns final elapsed and trace-stage duration helpers.
- Modify: `client/src/components/agent/BlogAgentRoot.tsx`
  - Imports helper functions from new modules.
  - Re-exports helpers for compatibility.
  - Removes duplicate local helper implementations.
- Create: `docs/product_optimization/reports/agent-helper-extraction-slice-3-2026-07-08/summary.md`
  - Records verification evidence.

## Task 1: Extract Frame State Helpers

**Files:**
- Create: `client/src/components/agent/agentFrameState.ts`
- Modify: `client/src/components/agent/BlogAgentRoot.tsx`

**Interfaces:**
- Produces: `AGENT_FRAME_STORAGE_KEY`
- Produces: `AGENT_FRAME_PRESETS`
- Produces: `type AgentFramePreset`
- Produces: `type AgentFrameState`
- Produces: `getDefaultAgentFrameState(viewport?)`
- Produces: `clampAgentFrameState(input, viewport?)`
- Produces: `readStoredAgentFrameState()`
- Produces: `isAgentFramePreset(value)`
- Produces: `getAgentFramePresetShortcut(preset)`

- [x] **Step 1: Move frame constants and helpers**

Create `agentFrameState.ts` with the exact existing constants and functions from `BlogAgentRoot.tsx`.

- [x] **Step 2: Import and re-export from root**

In `BlogAgentRoot.tsx`, import frame helpers and add:

```ts
export {
  AGENT_FRAME_PRESETS,
  AGENT_FRAME_STORAGE_KEY,
  clampAgentFrameState,
  getAgentFramePresetShortcut,
  getDefaultAgentFrameState,
  isAgentFramePreset,
  readStoredAgentFrameState,
} from "./agentFrameState";
export type { AgentFramePreset, AgentFrameState } from "./agentFrameState";
```

- [x] **Step 3: Run Agent tests**

Run:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts
```

Expected: PASS.

## Task 2: Extract Scroll Policy Helper

**Files:**
- Create: `client/src/components/agent/agentScrollPolicy.ts`
- Modify: `client/src/components/agent/BlogAgentRoot.tsx`

**Interfaces:**
- Produces: `isAgentNearBottom(element, threshold?)`

- [x] **Step 1: Move helper**

Move `isAgentNearBottom` unchanged into `agentScrollPolicy.ts`.

- [x] **Step 2: Import and re-export from root**

In `BlogAgentRoot.tsx`:

```ts
import { isAgentNearBottom } from "./agentScrollPolicy";
export { isAgentNearBottom } from "./agentScrollPolicy";
```

- [x] **Step 3: Run Agent tests**

Run:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts
```

Expected: PASS.

## Task 3: Extract Elapsed And Trace Helpers

**Files:**
- Create: `client/src/components/agent/agentElapsed.ts`
- Modify: `client/src/components/agent/BlogAgentRoot.tsx`

**Interfaces:**
- Consumes: `ChatMessage`, `AgentTraceEntry`
- Produces: `type AgentTraceStageDuration`
- Produces: `getAgentDisplayElapsedMs(message)`
- Produces: `getTraceStageDurations(entries)`

- [x] **Step 1: Move helpers**

Move the existing elapsed helpers into `agentElapsed.ts`, importing only types from `./types`.

- [x] **Step 2: Import and re-export from root**

In `BlogAgentRoot.tsx`:

```ts
import {
  getAgentDisplayElapsedMs,
  getTraceStageDurations,
} from "./agentElapsed";
export {
  getAgentDisplayElapsedMs,
  getTraceStageDurations,
} from "./agentElapsed";
export type { AgentTraceStageDuration } from "./agentElapsed";
```

- [x] **Step 3: Run Agent tests**

Run:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts
```

Expected: PASS.

## Task 4: Evidence, Validation, Commit

**Files:**
- Create: `docs/product_optimization/reports/agent-helper-extraction-slice-3-2026-07-08/summary.md`

- [x] **Step 1: Run final checks**

Run:

```bash
git diff --check
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts
corepack pnpm check
corepack pnpm build
```

Expected: all PASS.

- [x] **Step 2: Write evidence summary**

Record passed commands and state that this slice is behavior-preserving extraction only.

- [x] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/plans/2026-07-08-agent-helper-extraction-slice-3.md client/src/components/agent/BlogAgentRoot.tsx client/src/components/agent/agentFrameState.ts client/src/components/agent/agentScrollPolicy.ts client/src/components/agent/agentElapsed.ts docs/product_optimization/reports/agent-helper-extraction-slice-3-2026-07-08/summary.md
git commit -m "refactor: extract blog agent helpers"
```

Expected: commit succeeds on `dev`.

## Self-Review

- Spec coverage: covers the Agent spec's helper extraction target for frame, scroll, and elapsed logic.
- Out of scope: visual Agent redesign, source card refactor, panel split, and answer-quality eval.
- Placeholder scan: no empty implementation sections.
- Type consistency: all exported helper names match current test imports through `BlogAgentRoot.tsx`.
