# Blog Agent Execution Backlog

This backlog converts the PRD into implementation slices. It is not a full step-by-step implementation plan; future Codex execution should create a detailed plan from these slices before coding.

## Slice 0: Foundation

Objective: prepare the codebase for AI routes without changing user-facing behavior.

Tasks:

- Add provider-neutral env names:
  - `AI_PROVIDER`
  - `AI_BASE_URL`
  - `AI_API_KEY`
  - `AI_MODEL`
- Refactor `server/_core/llm.ts` into `server/ai/modelProvider.ts` while preserving current behavior.
- Add tests for model payload normalization.
- Create `server/ai/prompts.ts`.
- Create `server/ai/types.ts`.

## Slice 1: Public Knowledge Chunk Index

Objective: create source material for grounded answers.

Tasks:

- Add Drizzle schema for `ai_knowledge_chunks`.
- Create migration.
- Add chunk builder for public published posts.
- Add seed/index script:
  - `pnpm ai:index`
- Add tests:
  - public posts included
  - hidden/admin/draft posts excluded
  - chunks preserve post title, slug, track, tags, heading

## Slice 2: Agent Router and Quota MVP

Objective: answer questions against selected public sources while enforcing limits before retrieval/model calls.

Tasks:

- Add `agent` router with:
  - `bootstrap`
  - `sendMessage`
  - `getConversation`
- Add tables:
  - `ai_conversations`
  - `ai_messages`
  - `ai_usage_buckets`
  - `ai_agent_runs`
- Add retrieval function.
- Add prompt contract requiring citations.
- Add quota checks:
  - anonymous: 2 messages/day
  - visitor: 6 messages/day
  - admin: configurable high limit
- Add tests:
  - public retrieval works
  - EVQ hidden content is excluded
  - anonymous is blocked on the 3rd daily message
  - visitor is blocked on the 7th daily message
  - quota block does not call retrieval or model provider
  - model errors are persisted as failed assistant messages

## Slice 3: UI MVP

Objective: make AI usable from the blog.

Tasks:

- Add lower-right assistant launcher.
- Add docked desktop panel and mobile bottom sheet.
- Feed current route/post/category context into the assistant.
- Restyle `AIChatBox` for the blog visual identity inside the floating panel.
- Add citation cards.
- Add suggested prompts.
- Add knowledge cards.
- Add agent profile indicator.
- Add source-scope indicator.
- Add remaining quota display.
- Add i18n strings for English/Chinese.

## Slice 4: Visitor History and Rate Limits

Objective: make usage durable after the quota MVP is stable.

Tasks:

- Add conversation ownership checks.
- Add visitor conversation history.
- Add user-facing rate limit messages.
- Add admin conversation inspection.

## Slice 5: Pasted Context and File Uploads

Objective: allow visitors to add conversation-local context without introducing an unsafe file system.

Tasks:

- Add `ai_pasted_sources` table.
- Add pasted text source UI.
- Add source citations for pasted context.
- Add `ai_uploaded_files` table.
- Add `ai_uploaded_file_chunks` table.
- Add upload endpoint for `.txt` and `.md` only.
- Add file source citations.
- Add retention cleanup.
- Defer PDF until the base assistant is stable.

## Slice 6: Agent Workflows

Objective: add Rovo-like scoped agent tasks and admin knowledge operations.

Tasks:

- Add `ai_agent_profiles`.
- Add `ai_agent_runs`.
- Add `/manage/agent`.
- Add Blog Navigator, Article Explainer, Reading Path Planner.
- Add `build_reading_path`, `compare_posts`, and `build_concept_map` actions.
- Add retrieval debugger.
- Add article idea creation from conversation/task history.

## Slice 7: Observability and Evaluation

Objective: make the system measurable.

Tasks:

- Add trace records per model call.
- Add feedback buttons.
- Add golden question eval table.
- Add local eval script.
- Add public AI Applications writeup.

## Suggested First Implementation Plan

Start with Slice 0-3 only.

Reason:

- It creates immediate visible value.
- It avoids file complexity too early.
- It gives enough real usage data to design Phase 2 better.

## Definition of Done for MVP

- A reader can ask questions about public posts.
- Answers cite blog sources.
- The agent can generate a reading path.
- The agent can produce source-backed knowledge cards.
- Anonymous users are limited to 2 daily messages.
- Visitor users are limited to 6 daily messages.
- Hidden/admin/draft posts are excluded.
- Admin can test the AI surface.
- The UI matches the current dark blue research style.
- The project builds and deploys on Vercel.
