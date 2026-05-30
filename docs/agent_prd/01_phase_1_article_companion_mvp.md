# Phase 1 PRD: Right-Bottom Blog Knowledge Agent MVP

## Goal

Build a public Rovo-like Blog Knowledge Agent that helps readers search, understand, compare, and navigate public blog posts. The MVP surface is a right-bottom floating assistant, not a full `/agent` workspace and not separate agent widgets on every page. It should work without account creation and without file uploads.

## User Stories

- As a reader, I can open a right-bottom assistant without leaving the current page.
- As a reader, I can ask questions about the current article when I am on an article detail page.
- As a reader, I can ask cross-article questions from the same assistant.
- As a reader, I can search the blog and get AI-generated knowledge cards.
- As a reader, I receive answers with cited blog sources.
- As a reader, I can ask for "explain at three levels", "compare with another post", or "what should I read next?"
- As a reader, I can ask the agent to generate a reading path or concept map.
- As the author, I can trust that hidden/admin-only posts are excluded.

## Entry Points

### Floating Assistant

Add a single fixed assistant launcher in the lower-right corner.

Desktop:

- Docked floating panel, not a centered modal.
- Blog remains visible behind the panel.
- Default scope is inferred from the current route.

Mobile:

- Bottom sheet.
- Keep the launcher compact and easy to dismiss.

The launcher should be available on public reading surfaces. Admin-only management pages may hide it unless explicitly useful for testing.

### Article Detail Context

When the reader is on an article detail page, the floating assistant should show "Ask this article" suggestions:

- Suggested prompts:
  - "Summarize the core contribution."
  - "Explain the motivation in simple terms."
  - "What assumptions does this method make?"
  - "How does this connect to other posts?"
- The assistant scope defaults to the current post.

### Global AI Page

Do not build a full `/agent` page in Phase 1.

Future optional workspace:

- `/agent` may later become an expanded workbench for saved conversations, source inspection, and admin/debug features.
- `/ai` may redirect to `/agent` only after that workspace exists.
- Phase 1 should keep the primary public experience in the right-bottom assistant.

Initial scopes:

- All public posts.
- AI Algorithms only.
- AI Applications only.
- Current selected post.
- Selected tags.

### Agent Profiles

Phase 1 has one default agent and two lightweight modes:

- **Blog Navigator:** default search/chat agent.
- **Article Explainer:** current-post specialist.
- **Reading Path Planner:** produces ordered reading plans from public posts.

These are prompt profiles, not separate autonomous agents yet.

### Home Page

Add one compact "Ask the Blog Agent" launcher affordance if useful, but do not create a separate marketing hero or duplicate chat panel.

## Core AI Behaviors

### Answer Contract

Every answer should follow this structure:

1. Direct answer.
2. Source-backed explanation.
3. Related concepts or articles.
4. Limits / uncertainty when relevant.

For technical questions, the answer should prefer:

- Definitions.
- Mechanism.
- Trade-off.
- Failure mode.
- Recommended reading path.

### Knowledge Card Contract

For search-like queries, the agent should produce compact cards:

- concept name
- one-sentence definition
- related posts
- related tags
- suggested next question

### Citation Contract

Each answer should include source references:

- Post title.
- Slug.
- Optional section heading if available.
- Short cited passage label, not full copied text.

If no public source supports the answer:

> I do not have enough source material from the public blog to answer this confidently.

### Retrieval MVP

Phase 1 does not require embeddings.

Recommended MVP retrieval:

- Split public post Markdown into chunks by headings.
- Store chunks in Postgres table `ai_knowledge_chunks`.
- Use keyword scoring first:
  - title match
  - tag/category match
  - heading match
  - body term match
- Return top 4-6 chunks to the LLM.

Why not jump straight to vector search:

- Current corpus is small.
- Keyword/metadata retrieval is easier to test.
- It avoids premature provider lock-in before DeepSeek key is available.
- It creates a clean seam for pgvector or external embeddings in Phase 2.

## Model Adapter

Use OpenAI-compatible request shape.

Current code already has `server/_core/llm.ts`, but the PRD recommends refactoring it into:

- `server/ai/modelProvider.ts`: provider config and `chatCompletion`.
- `server/ai/prompts.ts`: system prompts and answer format.
- `server/ai/retrieval.ts`: chunk retrieval.
- `server/ai/citations.ts`: source normalization.

Initial provider env:

```bash
AI_PROVIDER=deepseek
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=<server-only>
AI_MODEL=deepseek-v4-flash
```

Keep backward compatibility with the current Forge keys until DeepSeek is configured.

## Data Model

Create tables in Phase 1. Prefer the names and ownership fields from `07_right_bottom_blog_agent_supabase_plan.md` when implementation details differ.

- `ai_knowledge_chunks`
  - `id`
  - `postId`
  - `postSlug`
  - `postTitle`
  - `trackSlug`
  - `visibility`
  - `heading`
  - `chunkIndex`
  - `content`
  - `tokenEstimate`
  - `createdAt`
  - `updatedAt`

- `ai_conversations`
  - `id`
  - `ownerType`: `anonymous | visitor | admin`
  - `ownerKey`
  - `scopeType`: `site | post | category | tag`
  - `scopeValue`
  - `status`: `active | archived | flagged`
  - `messageCount`
  - `createdAt`
  - `updatedAt`

- `ai_messages`
  - `id`
  - `conversationId`
  - `role`: `user | assistant | system`
  - `content`
  - `sourceJson`
  - `tokenJson`
  - `createdAt`

## API Requirements

Add `agent` router:

- `agent.bootstrap`
  - input: route context
  - output: quota remaining, suggested prompts, session tier, current scope

- `agent.sendMessage`
  - input: conversation id optional, message text, route context, scope
  - output: assistant message, citations/source cards, usage, quota remaining

- `agent.getConversation`
  - allowed for current visitor session or admin

Legacy route names such as `ai.*` should not be introduced unless there is a compatibility reason.

## UI Requirements

Reuse `AIChatBox` for Phase 1, but polish:

- Match the blog's blue space visual system.
- Wrap it in a right-bottom launcher and floating panel.
- Add citation cards under assistant messages.
- Add "answer mode" chips:
  - Summary
  - Deep technical
  - Compare
  - Reading path
  - Concept map
- Add empty state based on current article or track.
- Add agent profile indicator and source-scope indicator.
- Add remaining quota display.

## Safety and Content Rules

- Only include `status=published` and `visibility=public` posts in public retrieval.
- Admin sessions may optionally test hidden/admin content in a separate admin-only mode, but this should be disabled by default.
- The assistant should never reveal unpublished experiment numbers or hidden article content.
- The assistant should clearly separate "from the blog" vs "general model knowledge".

## Acceptance Criteria

- The right-bottom assistant opens on public blog pages without navigating away.
- The assistant can answer a question about IsoHC with citations.
- `/post/:slug` gives current-article suggestions inside the assistant.
- Search-like questions return knowledge cards or source cards.
- `/applications` content can be queried and returns Agent Harness sources.
- Anonymous users are limited to 2 assistant messages per day before any retrieval/model call.
- EVQ hidden content is not retrievable by anonymous or visitor users.
- Failed model calls return a graceful error and preserve the user's message.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.
