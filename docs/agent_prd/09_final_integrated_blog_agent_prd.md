# Final PRD: Right-Bottom Blog Agent

## Status

Final integrated PRD for goal-mode implementation.

This document merges product research, codebase review, Supabase architecture review, AI/retrieval design, and frontend UX review. If this document conflicts with earlier PRD files, this document wins.

## Product Thesis

The blog should gain a small, persistent, right-bottom AI assistant that helps readers understand and navigate public blog content.

It is not:

- a full-screen `/agent` product in MVP
- a chat widget embedded separately into every page
- an author intervention inbox
- a general web-browsing assistant
- an autonomous multi-agent system

It is:

- a source-grounded blog knowledge assistant
- a productized demonstration of AI application engineering
- a practical way for readers to ask, compare, and plan reading paths across public posts
- a Supabase-backed system for knowledge chunks, sessions, quotas, traces, and later pasted/file context

## Product Reference Points

| Reference                      | Relevant Pattern                                                                                                                                                                       | Product Decision                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Anthropic-style docs assistant | A docs-aware assistant is launched from a small entry and answers from documentation context.                                                                                          | Use a right-bottom launcher and floating panel, but keep desktop reading uninterrupted.                      |
| Atlassian Rovo Agents          | Rovo agents have objectives, knowledge sources, instructions, and allowed actions. Source: https://support.atlassian.com/rovo/docs/agents/                                             | Treat the assistant as a scoped knowledge agent with explicit source boundaries and registered actions.      |
| Rovo agent manifest            | Agent definitions include prompt, actions, conversation starters, and follow-up prompts. Source: https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/ | Store profile/config later; MVP uses code-defined profile and deterministic server actions.                  |
| Supabase AI & Vectors          | Supabase supports Postgres, pgvector, semantic search, keyword search, and hybrid search. Source: https://supabase.com/docs/guides/ai                                                  | Keep retrieval in Supabase; start with full-text/metadata, add pgvector later.                               |
| Supabase hybrid search         | Hybrid search combines full-text search and vector search with Postgres indexes. Source: https://supabase.com/docs/guides/ai/hybrid-search                                             | Phase 2+ can add hybrid retrieval after keyword retrieval is correct.                                        |
| Supabase rate limits           | Rate limits protect endpoints from abuse. Source: https://supabase.com/docs/guides/auth/rate-limits                                                                                    | Product-level AI quota must be server-side and atomic; do not rely only on client checks.                    |
| OpenAI File Search             | Managed file search handles parsing, chunking, embedding, retrieval, and retention policy. Source: https://platform.openai.com/docs/assistants/tools/file-search                       | If not using managed file search, reproduce ownership, chunking, retention, and source metadata in Supabase. |

## Target Users

### Anonymous Reader

Likely intent:

- understand whether the blog is worth reading
- ask one or two focused questions
- get a reading path without creating an account

Constraints:

- 2 assistant messages per day
- no upload
- history is local-first or short-lived

### Visitor JWT Reader

Likely intent:

- come back to previous reading paths
- ask deeper questions while reading
- compare posts or add small pasted context later

Constraints:

- 6 assistant messages per day
- durable history
- pasted context and `.txt` / `.md` uploads only after MVP

### Admin

Likely intent:

- inspect retrieval quality
- debug failed answers
- run evals
- understand user questions as content opportunities

Constraints:

- high quota but still tracked
- admin-only tools cannot leak hidden/admin posts to public paths

## MVP User Journey

1. A reader opens the blog and sees a small lower-right "Ask Blog" launcher.
2. The reader continues reading normally. The launcher does not look like an ad and does not block article controls.
3. The reader opens the assistant. On desktop, the panel docks to the right and the blog remains scrollable. On mobile, it opens as a bottom sheet.
4. The assistant bootstraps session tier, quota, route context, and suggested prompts.
5. On article pages, the default scope is the current article. On track/category/tag/search pages, the default scope is the current public range. On home/archive pages, the default scope is all public posts.
6. The reader asks a question.
7. The server atomically reserves quota before retrieval or model calls.
8. The Context Engine retrieves public Supabase chunks, builds a compact source bundle, and calls the model.
9. The answer appears with source cards, related questions, and quota remaining.
10. If the anonymous reader reaches 2 daily messages, the next submit is blocked before retrieval/model calls and the CTA offers visitor JWT login for 6 daily messages.

## UX Requirements

### Launcher

Desktop:

- fixed lower-right
- default `right: 24px; bottom: 24px`
- z-index above article progress UI
- height 44-48px
- rounded pill with icon + `Ask Blog` / `问问博客`
- low quota badge only when remaining quota is low

Mobile:

- fixed lower-right circular button
- 48px target
- avoids bottom navigation and major page controls

Behavior:

- app-level singleton; do not mount separate assistants inside `Home`, `PostDetail`, track pages, or search pages
- hidden on admin/manage pages by default unless test mode is explicitly enabled
- no layout shift when injected

### Desktop Panel

- fixed `right: 24px; bottom: 84px`
- default width: `min(460px, calc(100vw - 32px))`
- source view max width: 720px
- height: `min(640px, calc(100vh - 112px))`
- no full-page blur
- no full-screen takeover
- blog remains scrollable
- clicking outside does not close while generating
- close button remains available
- visual style uses current dark blue glass system: `.glass-panel`, `.glass-button`, `.signal-chip`, OKLCH tokens

### Mobile Panel

- bottom sheet
- height 85vh default, up to 92vh when keyboard is open
- sticky composer
- independent message scroll region
- focus trap inside sheet
- close returns to original page and scroll position

### Reading Interruption Rules

The assistant must not:

- navigate away on open
- cover the whole desktop viewport
- blur the full page on desktop
- hide article body behind a centered modal
- cover code-copy/share/TOC/progress controls in common desktop and mobile viewports
- discard a draft during errors or quota blocks

### State Machine

The assistant UI should implement these states explicitly:

- `closed`: only launcher visible
- `bootstrapping`: loading session, quota, route context, and prompt suggestions
- `welcome_empty`: no active messages; shows scoped prompts
- `ready`: input enabled, scope and quota visible
- `sending`: user message accepted; quota reserved; retrieval/model not yet done
- `answering`: retrieval/model running; source search progress may be shown
- `answered`: answer, source cards, follow-ups visible
- `source_view`: source cards/detail view; can return to chat
- `limit_reached_anonymous`: draft preserved; CTA to visitor identity; explains 2/day to 6/day
- `limit_reached_visitor`: draft preserved; shows reset time
- `error_retryable`: network/provider/server error; retry available; run status recorded
- `error_no_public_context`: no public sources available; suggests alternative public questions
- `unsupported_scope_or_hidden`: refuses unavailable/hidden/admin-only content without exposing private details

### Empty States

Article page:

- prompts about summary, motivation, assumptions, connections to other posts

Home/archive:

- prompts about where to start, AI Algorithms vs AI Applications, reading paths

Track/category/tag:

- prompts constrained to that scope

No indexed public content:

- show a calm setup message; do not invent suggestions from hidden/admin content

### Quota UX

Anonymous:

- after first successful answer, show "1 left today" softly
- after second successful answer, next submit is blocked
- CTA wording should feel like "Use a visitor identity to continue, 6 questions/day", not heavy account creation

Visitor:

- after 6 daily messages, next submit is blocked
- show reset time

All tiers:

- blocked requests preserve draft
- blocked requests do not call retrieval/model/tool
- quota state appears near header or composer
- quota text must not rely on color alone

## Frontend Architecture

### Component Boundary

Add an app-level assistant shell.

Recommended components:

- `BlogAgentRoot`
- `AgentLauncher`
- `AgentPanel`
- `AgentPanelContent`
- `AgentMobileSheet`
- `AgentSourceCards`
- `AgentQuotaBadge`
- `AgentScopeSwitch`

Recommended placement:

- mount `BlogAgentRoot` near the app router/root provider layer
- do not mount per-page chat panels
- use current route data to infer context

### Route Context

```ts
type AgentRouteContext = {
  path: string;
  routeType:
    | "home"
    | "post"
    | "category"
    | "tag"
    | "search"
    | "track"
    | "archive"
    | "public";
  postSlug?: string;
  postTitle?: string;
  categorySlug?: string;
  tagSlug?: string;
  trackSlug?: "ai-algorithms" | "ai-applications";
  locale: "en" | "zh";
};
```

### Agent Scope

```ts
type AgentScope =
  | { type: "site" }
  | { type: "post"; value: string }
  | { type: "category"; value: string }
  | { type: "tag"; value: string }
  | { type: "track"; value: "ai-algorithms" | "ai-applications" };
```

### i18n

Add `client/src/i18n/agent.ts`.

Required key groups:

- `agent.launcher.*`
- `agent.header.*`
- `agent.scope.*`
- `agent.welcome.*`
- `agent.prompts.*`
- `agent.input.*`
- `agent.sources.*`
- `agent.quota.*`
- `agent.error.*`
- `agent.refusal.*`

Chinese tone:

- technical and calm
- avoid cheap words like "magic"
- prefer "问问这个博客" and "基于公开文章、标签与阅读路径回答"

## Backend Architecture

### Modules

Prefer focused modules under `server/ai/`:

- `identity.ts`: resolve anonymous/visitor/admin identity key
- `quota.ts`: atomic quota reserve and remaining quota
- `retrieval.ts`: public knowledge search and source bundle creation
- `conversations.ts`: conversation/message persistence and ownership checks
- `harness.ts`: turn orchestration
- `prompts.ts`: system prompts and answer schema
- `types.ts`: shared server types
- `modelProvider.ts`: optional wrapper over existing `server/_core/llm.ts`

The existing `server/_core/llm.ts` can be reused initially. Quota must happen before any call into it.

### Harness Engine

MVP definition: a single-turn orchestrator, not an autonomous agent loop.

Flow:

1. Resolve session with existing `resolveBlogSession`.
2. Build identity:
   - anonymous: salted IP + UA bucket hash
   - visitor: existing `visitorId`
   - admin: admin identity key
3. Atomically reserve `assistant_message` quota.
4. If blocked, return quota response before retrieval/model/tool calls.
5. Create or load conversation with ownership check.
6. Persist user message.
7. Build source bundle with Context Engine.
8. Call model with answer schema and `toolChoice = none` in MVP.
9. Validate returned `sourceIds` against the source bundle.
10. Persist assistant message, source metadata, usage, and run trace.
11. Return answer, source cards, related questions, run status, and quota remaining.

### Context Engine

Inputs:

- user message
- route context
- selected scope
- identity role
- short conversation history

Outputs:

- `contextText`
- `sources`
- `retrievedChunkIds`
- `diagnostics` for admin only

Token budget:

- current post chunks: 2-3 max
- all-public retrieval chunks: 6-8 max
- max 1-2 chunks per post in cross-post answers
- total source context target: 4k-8k tokens

### Tool Manager

MVP uses deterministic server actions, not model-chosen tools.

Allowed deterministic actions:

- `search_public_posts`
- `get_current_post_context`
- `get_related_posts`
- `build_reading_path`
- `compare_posts`
- `get_quota_status`

MVP model calls should use `toolChoice = none`.

Later model tool-calling may be enabled only for registered tools and must log to `ai_tool_calls`.

Forbidden:

- arbitrary SQL
- arbitrary web browsing
- reading hidden/admin content in public mode
- publishing/editing posts
- impersonating the author

## Supabase Data Model

### Required MVP Tables

Use UUIDs for externally visible or guessable records.

#### `ai_knowledge_chunks`

Purpose: public blog knowledge base.

Fields:

- `id`
- `chunkType`: `post_chunk | post_metadata_chunk | site_overview_chunk`
- `postId` nullable, references `posts(id)` on delete cascade
- `postSlug`
- `postTitle`
- `categorySlug`
- `tagSlugs`
- `statusSnapshot`
- `visibilitySnapshot`
- `locale`
- `chunkIndex`
- `heading`
- `sectionPath`
- `content`
- `summary`
- `keywords`
- `contentHash`
- `tokenEstimate`
- `createdAt`
- `updatedAt`

Constraints and indexes:

- unique `(postId, chunkIndex)` for post chunks
- index `(postId)`
- index `(postSlug)`
- index `(statusSnapshot, visibilitySnapshot)`
- GIN full-text index in SQL migration
- optional pgvector column and vector index later

#### `ai_conversations`

Fields:

- `id` UUID
- `ownerType`: `anonymous | visitor | admin`
- `ownerKey`
- `title`
- `status`: `active | archived | flagged`
- `scopeType`: `site | post | category | tag | track`
- `scopeValue`
- `activePostId` nullable, references `posts(id)` on delete set null
- `summary`
- `messageCount`
- `totalInputTokens`
- `totalOutputTokens`
- `expiresAt`
- `createdAt`
- `updatedAt`
- `lastMessageAt`

Indexes:

- `(ownerType, ownerKey, updatedAt)`
- `(status, expiresAt)`
- `(scopeType, scopeValue)`

#### `ai_messages`

Fields:

- `id` UUID
- `conversationId` references `ai_conversations(id)` on delete cascade
- `role`: `user | assistant | system`
- `status`: `created | completed | failed | blocked`
- `content`
- `sourceJson`
- `usageJson`
- `errorCode`
- `createdAt`

Rules:

- `sourceJson` stores source metadata and IDs, not hidden/admin raw content
- conversation reads must check `(ownerType, ownerKey)` unless admin

#### `ai_usage_buckets`

Fields:

- `id`
- `identityType`: `anonymous | visitor | admin`
- `identityKey`
- `actionType`: `assistant_message | retrieval_query | tool_call | file_upload | file_parse`
- `windowType`: `day | burst`
- `windowStart`
- `requestCount`
- `inputTokens`
- `outputTokens`
- `createdAt`
- `updatedAt`

Constraint:

- unique `(identityType, identityKey, actionType, windowType, windowStart)`

#### `ai_agent_runs`

Purpose: turn-level trace, not autonomous workflow.

Fields:

- `id` UUID
- `conversationId`
- `userMessageId`
- `assistantMessageId`
- `identityType`
- `identityKey`
- `model`
- `scopeType`
- `scopeValue`
- `retrievalStrategy`
- `retrievedChunkIds`
- `toolCallIds`
- `inputTokens`
- `outputTokens`
- `latencyMs`
- `status`: `started | completed | failed | blocked`
- `errorCode`
- `createdAt`
- `completedAt`

### Later Tables

- `ai_tool_calls`
- `ai_pasted_sources`
- `ai_uploaded_files`
- `ai_uploaded_file_chunks`
- `ai_agent_profiles`
- `ai_eval_questions`

## Quota Design

### Limits

| Tier        |                     Limit |
| ----------- | ------------------------: |
| Anonymous   |  2 assistant messages/day |
| Visitor JWT |  6 assistant messages/day |
| Admin       | env-configured high limit |

### Counting Rule

Reserve quota when the server accepts a user message for processing.

Do not count:

- malformed input rejected by validation
- requests blocked before processing
- bootstrap requests

Count:

- accepted assistant messages even if retrieval/model later fails

Record failure status so the admin can inspect provider/retrieval issues.

### Atomic Reserve

Quota must be reserved atomically before retrieval/model calls.

Recommended SQL shape:

```sql
insert into ai_usage_buckets (...)
values (..., 1, ...)
on conflict (...) do update
set request_count = ai_usage_buckets.request_count + 1,
    updated_at = now()
where ai_usage_buckets.request_count < :limit
returning request_count;
```

If no row returns, the request is over quota and must stop.

### Identity Keys

Anonymous:

- `sha256(ip + "|" + userAgentBucket + "|" + serverSalt)`
- store only the hash

Visitor:

- existing `visitorId` from visitor JWT

Admin:

- stable admin key
- still tracked

### Window

Use UTC day in the database. The UI can display reset time in the user's locale.

## Retrieval Design

### MVP Retrieval

Start with Supabase/Postgres full-text and metadata retrieval.

Chunk types:

- `post_chunk`: body split by heading
- `post_metadata_chunk`: title, excerpt, tags, category, one-line summary
- `site_overview_chunk`: generated map of the blog's public topics and tracks

Ranking:

- `statusSnapshot = published` and `visibilitySnapshot = public` are hard filters
- current post boost
- title/category/tag match boost
- heading match boost
- full-text body score
- small recency boost
- diversity cap: max 1-2 chunks per post for cross-post answers

Lightweight query expansion:

- long-context terms map to RoPE, DF-RoPE, position encoding, sequence extrapolation, aliasing
- agent terms map to harness engine, context policy, tool sandbox, evaluator, traces

Source bundle format:

```text
[Source S1]
Post: Agent Harness Engine
Slug: agent-harness-engine
Section: Context Engineering
Excerpt: ...
```

### Future Retrieval

Add pgvector/hybrid retrieval only after:

- keyword retrieval works
- visibility tests are stable
- golden eval baseline exists

## Answer Contract

Use a machine-checkable output shape.

```ts
type AgentAnswer = {
  answerType:
    | "direct"
    | "explanation"
    | "comparison"
    | "reading_path"
    | "refusal";
  answerMarkdown: string;
  sourceIds: string[];
  sourceCards: SourceCard[];
  relatedQuestions: string[];
  confidence: "high" | "medium" | "low";
  refusalReason?:
    | "no_public_source"
    | "hidden_or_unavailable"
    | "outside_blog_scope"
    | "unsafe_or_forbidden";
};

type SourceCard = {
  sourceId: string;
  postTitle: string;
  postSlug: string;
  categorySlug?: string;
  tagSlugs: string[];
  heading?: string;
  excerpt: string;
  relevanceReason: string;
};
```

Server validation:

- every returned `sourceId` must exist in the current source bundle
- if model cites unknown sources, retry once or downgrade to low-confidence/refusal
- normal answers need at least one public source
- cross-post answers should prefer 2-4 source cards

Length:

- default answer should be concise for a floating panel
- deep technical mode may be longer
- reading paths should be structured but compact

Refusals:

- no public source: state that public blog material is insufficient
- hidden/admin/unpublished: do not confirm hidden title/content; state that the assistant only accesses public posts
- outside blog scope: explain the assistant is scoped to this blog
- author/private/unpublished metrics: do not pretend to be the author and do not invent private results

## API Shape

Add `agent` router.

### `agent.bootstrap`

Input:

- route context

Output:

- session tier
- quota limit
- quota remaining
- reset time
- current scope
- suggested prompts
- active conversation summary when allowed

### `agent.sendMessage`

Input:

- `conversationId?`
- `message`
- `routeContext`
- `scope`
- `answerMode?`

Output:

- `conversationId`
- `messageId`
- `answer`
- `sourceCards`
- `relatedQuestions`
- `quota`
- `runStatus`

### `agent.getConversation`

Visitor/admin only.

Rules:

- visitor must match `(ownerType, ownerKey)`
- admin can inspect
- anonymous history is local-first/short-lived and not broadly listable

### `agent.listConversations`

Visitor/admin only.

### `agent.reindexKnowledge`

Admin only.

Rules:

- default indexes public published posts only
- deletes or isolates chunks when a post becomes hidden/admin/draft
- records counts: created, updated, deleted, skipped

Release invariant:

- Every content deployment that adds or changes public seeded posts must run the knowledge reindex step after the post seed step.
- Current command: `pnpm content:publish`, equivalent to `pnpm db:seed && pnpm ai:reindex`.
- If Vercel auto-deploys after git push, the database/knowledge update is still a separate Supabase operation; the deployment is incomplete until `ai_knowledge_chunks` reflects the latest public article set.
- Verification must include a retrieval/debug query for the new article title, slug, and primary topic terms.

## Source and Visibility Rules

Public/visitor retrieval:

- use `searchPublicKnowledgeChunks`
- hard filter `published + public`
- no caller-provided visibility override

Admin retrieval:

- use a separate admin function
- requires admin session
- clearly labeled test mode

Hidden/admin questions:

- do not return hidden title, summary, source card, or similar hidden metadata
- answer with public-boundary refusal

Reindex:

- public index must not retain stale chunks after a post is unpublished or made hidden/admin

## File and Pasted Context

MVP:

- no file upload
- no PDF
- no binary storage

Phase after MVP:

1. pasted text as conversation-local source
2. `.txt` upload
3. `.md` upload
4. PDF only after retention, parsing, quota, and source display are stable

Rules:

- pasted/uploaded content never enters the public blog knowledge base by default
- retention defaults to 7 days for visitor sources
- source cards must distinguish blog source vs user-provided source

## Evaluation

Create at least 20 golden questions before adding pgvector or complex workflows.

Seed questions:

- What problem does IsoHC solve?
- What exact invariants does IsoHC preserve?
- How is IsoHC different from doubly stochastic mixing?
- How does DF-RoPE address long-sequence extrapolation?
- What are the two RoPE failure modes discussed in the DF-RoPE post?
- Compare DF-RoPE with YaRN or LongRoPE.
- How does Agent Harness differ from a normal chatbot?
- What is the role of Context Engineering in the harness post?
- Build me a reading path for long-context modeling.
- Build me a reading path for agent systems and evaluation.
- Can you explain EVQ-Cosh?
- What unpublished metrics prove IsoHC is better?

Metrics:

- `source_recall@6`
- `chunk_recall@6`
- `groundedness`
- `citation_validity`
- `refusal_accuracy`
- `answer_completeness`
- `latency_p50`
- `latency_p95`
- `token_cost_per_answer`
- `quota_guard`
- `visibility_leak_rate`

MVP thresholds:

- citation validity: 100%
- hidden/admin leak rate: 0%
- source recall@6: at least 85% on golden set
- refusal accuracy: at least 95%
- p95 non-file latency target: under 8 seconds
- quota-blocked requests call zero retrieval/model/tool functions

## Implementation Goals

### Goal 1: Schema and Public Knowledge Index

Implement:

- `ai_knowledge_chunks`
- public chunk builder
- reindex script/admin route
- public-only retrieval

Exit criteria:

- public published posts indexed
- hidden/admin/draft posts excluded
- public-to-hidden transition removes or isolates stale chunks
- source metadata returned

### Goal 2: Quota and Agent Router

Implement:

- `ai_conversations`
- `ai_messages`
- `ai_usage_buckets`
- `ai_agent_runs`
- `agent.bootstrap`
- `agent.sendMessage`

Exit criteria:

- anonymous blocked on 3rd daily message
- visitor blocked on 7th daily message
- concurrent quota tests cannot exceed limit
- quota block calls zero retrieval/model/tool functions
- LLM failure persists user message and failed run

### Goal 3: Right-Bottom Assistant UI

Implement:

- `BlogAgentRoot`
- `AgentLauncher`
- `AgentPanel`
- `AgentMobileSheet`
- `AgentSourceCards`
- `client/src/i18n/agent.ts`

Exit criteria:

- single app-level assistant instance
- desktop panel does not exceed 480px default width and 640px default height
- desktop page remains scrollable while panel is open
- mobile bottom sheet remains usable with keyboard open
- quota state visible
- source cards link to `/post/:slug`
- screenshots checked at 1440x900, 1280x800, and 390x844

### Goal 4: Source-Grounded Answer Quality

Implement:

- answer schema
- source id validation
- refusal templates
- current-post boost
- related questions

Exit criteria:

- IsoHC answers cite IsoHC
- Agent Harness answers cite the applications post
- EVQ hidden content is refused for public/visitor users
- normal answers have source cards

### Goal 5: Visitor History

Implement:

- visitor conversation history
- ownership checks
- list/get conversation APIs

Exit criteria:

- visitor can resume own conversations
- visitor cannot read another visitor's conversations
- anonymous conversations are not broadly listable

### Goal 6: Pasted Context, Then Text/Markdown Upload

Implement after the core assistant is stable:

- pasted source storage
- source cards for pasted context
- `.txt` and `.md` upload
- retention cleanup

Exit criteria:

- pasted/uploaded context is conversation-local
- retention cleanup works
- PDF remains deferred

### Goal 7: Admin Agent Operations

Implement:

- `/manage/agent`
- retrieval debugger
- traces
- feedback
- eval set runner
- article idea extraction

Exit criteria:

- admin can inspect retrieval without model calls
- admin can run local evals
- admin can convert useful conversations into article ideas

## Non-Goals

Not in MVP:

- public full-screen `/agent` workspace
- separate per-page agent widgets
- free LLM tool-calling
- autonomous plan-act-observe loops
- multiple configurable public agent profiles
- complex concept graph visualization
- pgvector/hybrid retrieval
- PDF upload
- arbitrary web browsing
- live author intervention
- automatic article editing/publishing
- long-term personalization memory

## Verification

Every implementation goal must run:

- `pnpm check`
- `pnpm test`
- `pnpm build`
- browser smoke test of affected public route

Security checks:

- public user cannot retrieve hidden/admin/draft content
- visitor cannot read another visitor's conversation
- quota blocks happen before retrieval/model/tool calls
- source IDs are validated server-side

UX checks:

- no desktop full-screen takeover
- no full-page desktop blur
- draft preserved on quota/error
- i18n complete for Chinese and English
- source cards readable and clickable
