# Phase 05 - Article Companion Productization

**Goal:** Make the existing Blog Agent feel like a contextual article companion rather than a generic floating chatbot.

**Architecture:** Reuse the current global `BlogAgentRoot`, route context, conversations, source cards, quotas, and context attachment. Improve entry points, prompts, source details, and article/track-specific behavior before adding new backend capabilities.

**Tech Stack:** React, tRPC Agent router, `BlogAgentRoot`, route context, Agent harness, `ai_knowledge_chunks`, `ai_context_sources`.

---

## Coding Agent Contract

- PHASE_ID: PO-05
- GOAL_TARGET: Productize the existing Blog Agent as an article/track-aware companion.
- GOAL_PROMPT: Complete PO-05 Article Companion Productization for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-05-article-companion-productization.md`; keep the existing Agent architecture, improve route-aware prompts/source UX/quota/context states, preserve hidden content boundaries, and finish after validation commands, browser checks, and acceptance gates pass.
- DEPENDS_ON: PO-00, PO-04
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/components/agent/routeContext.ts`, `client/src/i18n/agent.ts`, `server/ai/router.ts`, `server/ai/harness.ts`, `server/ai/knowledge.ts`, `drizzle/schema.ts`, `client/src/pages/PostDetail.tsx`, `client/src/pages/Track.tsx`, `client/src/pages/ManageAgent.tsx`
- LIKELY_EDIT_PATHS: `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/components/agent/routeContext.ts`, `client/src/i18n/agent.ts`, limited `server/ai/*` changes if required for source metadata
- DO_NOT_EDIT: schema unless required and separately planned, retrieval overhaul from PO-06, PDF ingestion, public `/agent` workspace, author impersonation
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts`
- BROWSER_CHECKS: article page companion prompt; applications track companion; quota blocked/low state if feasible; attach `.txt` or `.md`; mobile `390x844` keyboard/focus behavior
- ACCEPTANCE_GATES: prompts differ by route; source cards link only to public posts; companion states are understandable; existing conversations/history still work

## Task Spec

Productize the assistant around current reader context:

- article-aware suggested prompts
- track-aware reading path prompts
- source detail display
- related question chips
- quota and identity states that feel intentional
- context attachment lifecycle visibility

The companion should answer: "How can this site help me understand this article or research area faster?"

## Problem Boundary

In scope:

- Blog Agent UI and route context.
- Suggested prompts by article/track/search/archive route.
- Source card detail UX.
- Quota exhausted state.
- Context attachment visibility and deletion if supported by backend.
- Browser accessibility/focus behavior.

Out of scope:

- Autonomous web browsing.
- Public `/agent` workspace.
- PDF ingestion.
- Multi-agent workflows.
- Author impersonation.
- Full rewrite of Agent backend.

## Context Policy

Inspect:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/routeContext.ts`
- `client/src/i18n/agent.ts`
- `server/ai/router.ts`
- `server/ai/harness.ts`
- `server/ai/knowledge.ts`
- `drizzle/schema.ts`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/ManageAgent.tsx`

## Product Requirements

### R1 Article-Aware Entry

On article pages, the companion should offer prompts such as:

- explain the core abstraction
- summarize implementation implications
- compare this article with another post
- generate a reading checklist
- identify prerequisites

Prompts must be grounded in current route context and public source availability.

### R2 Track-Aware Entry

On `/algorithms` and `/applications`, prompts should focus on:

- reading path generation
- topic map explanation
- "which article should I read first?"
- concept comparison within the track

### R3 Source Detail UX

Source cards should make grounding inspectable:

- post title
- slug/link
- excerpt
- relevance reason
- category/tags
- ideally heading/section if available

If section-level source is not implemented, the UI should not pretend it is.

### R4 Quota and Identity States

Quota states should explain:

- remaining requests
- whether visitor login helps
- when the user is blocked
- whether admin has separate limits

Avoid making quota feel like a broken error.

### R5 Context Attachment State

If pasted/file context is attached, the companion should show:

- count of attached sources
- supported file types
- size/limit state
- delete/clear behavior if backend supports it, or honest "attached for this conversation" copy if not

## Execution Capture

Required tests:

```bash
pnpm exec vitest run server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Required browser checks:

- article page, open companion, click suggested prompt
- applications track page, open companion
- quota low/blocked state if feasible
- attach `.txt` or `.md` context
- mobile `390x844` focus and keyboard behavior

## Evaluator Protocol

Phase 05 is complete when:

- The companion feels context-aware on articles and track pages.
- Source cards provide enough evidence for trust.
- Quota/context states are understandable.
- No hidden/admin content appears in public assistant results.

## Acceptance Criteria

- Suggested prompts differ by route type.
- Source cards link to public posts only.
- Mobile companion is usable with keyboard and touch.
- Existing conversations/history continue to work.
- `pnpm check`, targeted agent tests, and browser checks pass.

## Risks

- Over-personalizing prompts can imply the agent knows more than public content.
- Source details can overclaim section-level grounding before backend supports it.
- UI work should not be coupled to retrieval rewrites in the same phase.
