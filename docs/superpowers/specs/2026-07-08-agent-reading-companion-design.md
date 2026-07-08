# Agent Reading Companion Design

Date: 2026-07-08
Status: Proposed
Parent spec: [Reading and writing loop optimization](./2026-07-08-reading-writing-loop-optimization-design.md)

## Summary

The Agent should behave like a reading companion for the current article and public research corpus. It should not feel like a separate chatbot product bolted onto the page. The default experience should make the answer readable first, keep sources inspectable second, and convert weak or repeated questions into author-facing improvement signals.

This spec keeps current API and persistence contracts additive. It does not change model providers, auth, quota, or database schema in the first implementation slice.

## Goals

- Preserve the recent fixes for elapsed time, answer-first scroll, collapsed sources, compact trust toolbar, and desktop frame resizing.
- Reduce `BlogAgentRoot.tsx` responsibility overload.
- Make source and citation UX verifiable without occupying default answer space.
- Add answer-quality eval dimensions beyond retrieval-only checks.
- Improve follow-up prompts so the Agent supports reading tasks.
- Define UI fixtures and tests for long answers, no-source answers, mobile sheet, and private context.

## Non-Goals

- No provider change.
- No route or tRPC breaking change.
- No DB migration in the first Agent refactor.
- No hiding sources.
- No exposing private pasted context outside the current session.
- No new dependency for drag, resize, markdown, or streaming.

## Current Files

Client:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- `client/src/components/agent/AgentMarkdown.tsx`
- `client/src/components/agent/messageState.ts`
- `client/src/components/agent/routeContext.ts`
- `client/src/components/agent/sourceCardLinks.ts`
- `client/src/components/agent/sourceCards.test.ts`
- `client/src/components/agent/streamClient.ts`
- `client/src/components/agent/types.ts`
- `client/src/styles/agent-surfaces.css`
- `client/src/i18n/agent.ts`

Server:

- `server/ai/router.ts`
- `server/ai/streamRoute.ts`
- `server/ai/harness.ts`
- `server/ai/evals.ts`
- `server/ai/knowledge.ts`
- `server/ai/contextSources.ts`
- `server/ai/conversations.ts`
- `server/ai/types.ts`
- `server/ai/quota.ts`

Owner tools:

- `client/src/pages/ManageAgent.tsx`
- `client/src/i18n/agentOps.ts`

## UX Contract

### Default Answer Layout

Default order:

1. User question.
2. Assistant answer body.
3. Compact answer metadata: elapsed time, scope, source count.
4. Collapsed source summary.
5. Follow-up prompts.
6. Trace and recovery controls only when useful.

Rules:

- Final answer completion must not scroll the panel to the source list.
- Sources are collapsed by default.
- Source details expand inside a bounded internal scroll region.
- Long titles wrap safely or truncate intentionally.
- No page-level horizontal scroll.
- Composer remains reachable after final answer.

### Source Summary

Collapsed state:

- Shows source count.
- Shows first one or two source title chips.
- Shows a clear "view sources" control.
- Does not include long excerpts.

Expanded state:

- Uses row-style source cards.
- Shows title, article, section, type, and open action.
- Excerpts are second-level details, not default row content.
- Max height should be viewport-relative, such as 35vh on desktop.

### Trust Boundary

Default:

- One-line trust explanation in the toolbar.
- Scope visible: current article, public notes, or broader public corpus.
- Private pasted context is identified as session-only.

Elevated state:

- When private context is attached, the warning becomes more visible.
- When no reliable public source is found, answer should narrow or refuse.

### Follow-Up Prompts

Prompts should be reading tasks, not generic assistant actions.

Examples:

- Explain this paragraph.
- Compare this with the previous section.
- Show the source passages.
- Turn this into reading notes.
- Build a reading path from this topic.
- Ask a narrower question.

Rules:

- Prompt text should be short.
- Prompts should derive from route context where possible.
- Prompts should not repeat if the same intent is already active.

## Component Boundary Design

Target split from `BlogAgentRoot.tsx`:

```text
client/src/components/agent/
  BlogAgentRoot.tsx
  AgentLauncher.tsx
  AgentFloatingFrame.tsx
  AgentPanel.tsx
  AgentMessageList.tsx
  AgentComposer.tsx
  AgentSourceSummary.tsx
  AgentTrustToolbar.tsx
  AgentContextDock.tsx
  AgentHistoryPanel.tsx
  AgentReasoningTrace.tsx
  agentFrameState.ts
  agentScrollPolicy.ts
  agentElapsed.ts
```

Boundary rules:

- `BlogAgentRoot.tsx` owns route context, open state, session key, and top-level orchestration.
- `AgentFloatingFrame.tsx` owns drag, resize, clamp, presets, and localStorage frame persistence.
- `AgentPanel.tsx` owns panel composition but not streaming.
- `AgentMessageList.tsx` owns message rendering and scroll anchors.
- `AgentSourceSummary.tsx` owns collapsed and expanded sources.
- `AgentReasoningTrace.tsx` owns elapsed display and stage durations.
- Pure functions move to small files with direct unit tests.

Refactor rule:

- Extract without changing behavior first.
- Then make visual or UX adjustments in follow-up commits.

## Streaming And Scroll Policy

States:

- idle
- submitted
- streaming
- final
- failed
- recovered

Policy:

- On submit: scroll to the new answer start.
- During stream: follow only if the user is already near the bottom.
- On final: do not scroll to sources.
- On failed: keep recovery action visible.
- On history restore: do not auto-scroll unexpectedly.

Tests:

- final event does not jump to sources.
- near-bottom stream follows.
- non-near-bottom stream does not steal scroll.
- failed response keeps composer and recovery visible.

## Elapsed Time Contract

Display:

- Use final stream `elapsedMs` when available.
- Fall back to persisted `sourceJson.latencyMs` for history.
- Fall back to trace-derived max only when final elapsed is absent.

Trace:

- Stage durations are displayed as ordered deltas.
- Negative or out-of-order deltas are clamped.
- Summary shows final elapsed, not the largest trace status as if it were total duration.

Tests:

- final elapsed wins over max trace status.
- persisted latency works for history.
- stage deltas are ordered and clamped.

## Answer Quality Evaluation

Current evals are retrieval-heavy. Add answer-level dimensions:

1. Grounding: answer cites relevant public sources when retrieval is used.
2. Faithfulness: answer does not invent unsupported claims.
3. Scope control: current article scope is respected.
4. Refusal boundary: weak source confidence leads to a narrower answer or refusal.
5. Readability: answer is useful without expanding sources.
6. Citation usability: expanded source includes enough information to verify.

Suggested eval output:

```ts
type AgentAnswerEval = {
  question: string;
  expectedMode: "answer" | "refuse" | "narrow";
  expectedSources?: string[];
  checks: {
    grounded: boolean;
    faithful: boolean;
    scoped: boolean;
    readableCollapsed: boolean;
    citationUsable: boolean;
  };
  failures: string[];
};
```

No model judge is required for the first pass. Start with deterministic checks where possible, then document where human review is needed.

## UI Fixtures

Required fixture scenarios:

- Long answer with five sources.
- Short answer with one source.
- No-source refusal.
- Current article scope.
- Public corpus scope.
- Pasted private context.
- Retrieval error with recovery.
- Quota warning.
- Desktop drag and resize.
- Mobile bottom sheet.
- Long Chinese source title.
- Long English code-like source title.

Fixtures can be implemented as tests or a local story route if the repo already has a showcase pattern. Do not add Storybook.

## Accessibility

- Escape closes the panel when focus is inside Agent.
- Mobile sheet traps focus while open.
- Desktop frame controls are keyboard reachable.
- Resize handle has accessible label if exposed.
- Source expand buttons have descriptive labels.
- Icons have labels or are hidden from assistive tech.
- Reduced motion disables non-essential transitions.

## Tests

Focused:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts
corepack pnpm test -- client/src/components/agent/sourceCards.test.ts
corepack pnpm test -- server/ai/harness.test.ts server/ai/streamRoute.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm audit:ui
corepack pnpm build
```

Browser:

- `/post/goal-harness-agent-phase-protocol`
- 1440x900 light and dark.
- 390x844 light and dark.
- Long answer and five sources.
- No-source refusal.

## Implementation Slices

1. Extract pure helpers: frame clamp, scroll policy, elapsed time, source labels.
2. Extract source summary and trace components.
3. Extract frame and panel components.
4. Add UI fixtures and tests.
5. Add answer-quality eval fields and owner display.
6. Tune visual density after the article page visual contract is stable.

## Acceptance Checklist

- `BlogAgentRoot.tsx` responsibility is reduced.
- Final answer remains visible after stream completion.
- Sources are accessible but not default-dominant.
- Agent panel has no horizontal overflow.
- Elapsed time semantics are correct.
- Answer-quality checks exist beyond retrieval hit rate.
- No public API or DB contract break.
