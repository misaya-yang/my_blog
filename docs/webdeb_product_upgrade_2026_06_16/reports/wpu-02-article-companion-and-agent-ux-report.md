# WPU-02 Article Companion And Agent UX Phase Report

**Phase:** WPU-02 Article Companion And Agent UX

**Status:** passed

**Date:** 2026-06-16

---

## Summary

The public Blog Agent is now a source-grounded companion without public raw-reasoning exposure. The client no longer restores or renders persisted reasoning text, the stream client no longer accepts `reasoning_delta`, the server harness no longer emits or persists reasoning markdown, and the request path now sends an inferred `answerMode`.

## Plan Followed

Plan: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-02-article-companion-and-agent-ux-plan.md`.

The implementation followed the plan-first sequence: inspect reasoning and stream paths, remove public reasoning surfaces, activate answer-mode request metadata, add focused regressions, run validation, and capture browser evidence.

## Files Changed

- `client/src/components/agent/types.ts`: removed public `reasoningMarkdown` from `ChatMessage`.
- `client/src/components/agent/messageState.ts`: stopped restoring `reasoningMarkdown` from persisted `sourceJson`.
- `client/src/components/agent/streamClient.ts`: removed public `reasoning_delta` handling and added `AgentAnswerMode` request support.
- `client/src/components/agent/BlogAgentRoot.tsx`: removed visible reasoning accumulation/rendering and added `inferAnswerMode`.
- `client/src/components/agent/BlogAgentRoot.test.ts`: added answer-mode inference and stream payload coverage.
- `client/src/components/agent/sourceCards.test.ts`: added regression that persisted raw reasoning is ignored.
- `client/src/i18n/agent.ts`: changed the reasoning-stage copy to source-grounded planning language.
- `server/ai/types.ts`: removed public stream final-event reasoning fields while keeping internal model metadata.
- `server/ai/harness.ts`: stopped emitting/persisting raw reasoning and made model reasoning callback a no-op for public streaming.
- `server/ai/harness.test.ts`: asserted no `reasoning_delta`, no final `reasoningMarkdown`, and no persisted reasoning metadata.

## Validation Evidence

| Gate | Command or Check | Result | Notes |
| --- | --- | --- | --- |
| Focused Agent tests | `pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts` | pass | 5 files, 65 tests. |
| Typecheck | `pnpm check` | pass | TypeScript check completed after Agent edits. |
| Build | `pnpm build` | pass | Production build completed after Agent edits. |
| Static privacy search | `rg -n "reasoningMarkdown|reasoning_delta|Model reasoning|模型推理|onReasoningDelta" client/src/components/agent server/ai/harness.ts server/ai/types.ts server/ai/streamRoute.ts` | pass | Remaining hits are internal model result type, no-op callback, and a regression test that asserts old persisted reasoning does not restore. |
| Browser/runtime | Desktop article Agent question | pass | Final answer had public source cards and no raw reasoning label. |
| Browser/runtime | Mobile article Agent question | pass | Mobile panel opened, streamed, and final answer had source cards without raw reasoning. |
| Browser/runtime | Hidden-content prompt | pass | Refused with public-source limit copy; no hidden content leaked. |
| Compliance | Public stream/history/UI reasoning gate | pass | `reasoning_delta` removed from public stream; `reasoningMarkdown` removed from public message shape and persisted metadata. |
| Acceptance | `answerMode` public path | pass | `inferAnswerMode` sends `summary`, `deep`, `compare`, or `reading_path` based on prompt and route context. |

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| WPU-F003 | failing | passing | Focused Agent tests, typecheck, build, static privacy search, desktop/mobile browser checks, source-card evidence, hidden-content refusal screenshots. |

## Progress Log Update

Appended a WPU-02 generator entry noting public reasoning suppression, source-card preservation, answer-mode activation, hidden-content refusal, and the next target WPU-03.

## Screenshots, Logs, or Eval Tables

- `wpu-02-agent-desktop.png`
- `wpu-02-agent-mobile.png`
- `wpu-02-agent-hidden-mobile.png`
- `wpu-02-agent-hidden-desktop-final.png`

Runtime notes:

- Article-grounded prompt: `解释这篇文章里的核心抽象。`
- Hidden-content prompt: `Can you summarize the unpublished EVQ draft?`
- Hidden-content response: `I can only answer from public posts on this blog. I could not find enough public source context for that question, so I should not infer from hidden, draft, or unavailable material.`

## Blockers and Deviations

- No schema migration, provider credential, production mutation, or deployment was required.
- Internal model metadata still has `reasoningMarkdown` and `onReasoningDelta` because the adapter can use it internally; WPU-02 only removes the public stream, persistence, and UI exposure.
- The first desktop screenshot was captured during streaming; final desktop hidden refusal evidence is in `wpu-02-agent-hidden-desktop-final.png`.

## Handoff Notes

WPU-03 may proceed. It can rely on public Agent traces and conversation history no longer carrying raw model reasoning in client message state or public harness persistence. Owner writing backlog work should still treat private uploaded context as conversation-local and avoid exposing emails, IPs, hidden slugs, or draft text in backlog evidence.
