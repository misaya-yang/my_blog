# Right-Bottom Blog Agent Supabase Plan

## Decision

The AI feature should be a right-bottom blog assistant, not agent functionality embedded into every page.

The interaction model is close to Anthropic's "Ask AI / Ask Docs" entry, but adapted for a blog:

- A small fixed assistant launcher sits in the lower-right corner.
- Opening it shows a floating assistant panel.
- The reader should still be able to see and scroll the blog behind it on desktop.
- The panel passively knows the current page through URL, route, post slug, category, tags, and visible article metadata.
- The assistant's main knowledge source is all public blog content stored and indexed in Supabase.
- Hidden and admin-only posts must never be retrieved for anonymous or visitor users.

This supersedes the broader idea that every page needs its own agent surface. Pages provide context; the assistant is the single interaction surface.

## Product Intent

The assistant should make the blog feel AI-native without turning it into a generic chatbot.

It should answer questions like:

- "What is this site about?"
- "Which posts should I read first for long-context modeling?"
- "Explain this article in simpler technical terms."
- "Compare IsoHC and EVQ-Cosh at a conceptual level."
- "What application-engineering posts cover agent harnesses or context engines?"
- "Build me a reading path for RAG, agent systems, and evaluation."

It should not:

- Pretend to be Misaya.
- Provide unsupported details about hidden research.
- Browse the open web in MVP.
- Modify posts.
- Let uploaded files become public knowledge.

## Industry References

| Reference | Useful Pattern | Product Translation |
| --- | --- | --- |
| Anthropic docs "Ask AI" style assistant | A docs-aware assistant can sit above documentation and answer with the docs as context. | Use one floating assistant entry, but avoid fully blocking reading on desktop. |
| Atlassian Rovo Agents | Rovo agents have objectives, instructions, knowledge sources, and allowed actions. Source: https://support.atlassian.com/rovo/docs/agents/ | Treat the blog assistant as a scoped knowledge agent with explicit tools and source rules. |
| Rovo agent module | Agent definitions include prompt, conversation starters, actions, and follow-up prompts. Source: https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/ | Store agent profile/config in Supabase later; start with code-defined config. |
| Supabase AI & Vectors | Supabase supports pgvector, semantic search, keyword search, and hybrid search inside Postgres. Source: https://supabase.com/docs/guides/ai | Keep retrieval inside Supabase instead of adding a separate vector service. |
| Supabase automatic embeddings | Embeddings need async generation, sync on updates, failures, and retries. Source: https://supabase.com/docs/guides/ai/automatic-embeddings | Do not make embeddings a Phase 1 blocker; design reindexing carefully. |
| OpenAI File Search | Managed file search parses, chunks, embeds, and expires vector stores by default in some thread scenarios. Source: https://platform.openai.com/docs/assistants/tools/file-search | If not using managed file search, implement equivalent chunk, retention, and ownership metadata in Supabase. |

## UI Model

### Launcher

Desktop:

- Fixed lower-right button.
- Visual language should match the current blue technical blog style.
- Can be a small mascot or icon plus "Ask Blog".
- Shows remaining quota when low, for example `2 left`.

Mobile:

- Fixed lower-right circular icon.
- Opens as a bottom sheet.

### Panel States

1. **Closed**
   - Only launcher visible.
2. **Welcome**
   - Title: "Ask Misaya's Blog" / "问问这个博客".
   - Short sentence: "I can answer from public posts, tags, and reading paths."
   - Suggested questions based on current page.
3. **Chat**
   - Messages.
   - Source cards.
   - Remaining quota.
   - Current scope indicator: `This article`, `All public posts`, `AI Applications`, `AI Algorithms`.
4. **Source View**
   - Shows retrieved posts/chunks used for the answer.
   - Includes title, slug, tag, and short excerpt.
5. **Limit Reached**
   - Anonymous: "You have used today's 2 questions. Log in as visitor for 6."
   - Visitor: "You have used today's 6 questions. Try again tomorrow."

### Panel Layout

Desktop default:

- Width: 420-480px.
- Height: 640px max, constrained by viewport.
- Right side docked, not centered modal.
- No page-wide blur by default.
- Clicking outside does not close while generating.

Expanded desktop:

- Optional 720px width for source inspection.
- Still does not take over the whole screen.

Mobile:

- Bottom sheet, 85-92vh.
- Background remains visible but interaction focus is the sheet.

## Core System

The system should be split into five small server-side modules. These are architectural boundaries, not necessarily five large services.

### 1. Harness Engine

Responsible for one assistant turn.

Flow:

1. Resolve session from existing auth.
2. Build identity key.
3. Check quota before doing retrieval or model calls.
4. Create or load conversation.
5. Ask Context Engine for relevant blog context.
6. Run model with strict answer contract.
7. Optionally execute allowed tools.
8. Persist messages, sources, usage, and trace.
9. Increment quota after accepted request.
10. Return answer, sources, usage, and remaining quota.

Important rule:

- If quota is exceeded, no retrieval and no model call should happen.

### 2. Context Engine

Responsible for deciding what the model can see.

Inputs:

- user message
- route context: path, postSlug, categorySlug, tagSlug
- identity role: anonymous, visitor, admin
- conversation summary
- selected scope

Outputs:

- source bundle
- source IDs
- short context string for the model
- retrieval diagnostics for admin

MVP retrieval strategy:

1. Always include current public post if the user is on a public post page.
2. Search public post metadata: title, excerpt, category, tags.
3. Search `ai_knowledge_chunks` with Postgres full-text search.
4. Rank by current-page boost, title/tag match, recency, and chunk text match.
5. Return top 6-10 chunks within a token budget.

Phase 2 retrieval:

- Add pgvector embeddings in Supabase.
- Use hybrid retrieval: keyword candidates + vector candidates + metadata rerank.
- Keep the same table ownership and visibility filters.

### 3. Tool Manager

MVP should not let the model call arbitrary tools.

Use deterministic server-side tools first:

- `get_site_overview`
- `search_public_posts`
- `get_current_post_context`
- `get_related_posts`
- `build_reading_path`
- `compare_posts`
- `get_quota_status`

Each tool has:

- name
- description
- input schema
- allowed roles
- cost unit
- visibility rule
- logged output summary

Later, model tool-calling can be enabled only for these registered tools.

Forbidden tools:

- publish post
- edit post
- read hidden/admin content for public users
- arbitrary SQL
- arbitrary web search
- impersonate author

### 4. File Manager

Because there is no independent file system, MVP files should be Supabase-first.

Recommendation:

- Do not store arbitrary binary files in MVP.
- Accept pasted text first.
- Then support small `.txt` / `.md` uploads by reading client-side or server-side and storing extracted text chunks in Supabase.
- PDF support should be deferred until the base assistant, pasted context, and `.txt` / `.md` uploads are stable because PDF parsing quality and cost can become a distraction.

Stored data:

- file metadata
- extracted text chunks
- owner identity
- conversation ID
- retention expiry
- parse status

File context must be conversation-local. Uploaded content must not enter the public blog knowledge base unless admin explicitly promotes it later.

### 5. Session and Quota Engine

This is the most important operational boundary.

User tiers:

| Tier | Identity | Daily Assistant Messages | Uploads | History |
| --- | --- | ---: | ---: | --- |
| Anonymous | salted IP + UA hash | 2 | 0 | ephemeral |
| Visitor JWT | existing `visitorId` cookie | 6 | later | durable |
| Admin | existing admin session | high but tracked | later | durable |

Quota actions:

- `assistant_message`
- `retrieval_query`
- `tool_call`
- `file_upload`
- `file_parse`

MVP limit should enforce `assistant_message` first. Other counters are stored for observability and later limits.

Quota windows:

- daily window for public product simplicity
- optional 10-minute burst window for abuse control

Important:

- Store quota in Supabase, not memory.
- Use atomic insert/update or database transaction.
- Avoid raw IP storage. Use salted hash.
- Reset by UTC day or configured site timezone; use one consistently.

## Supabase Data Model

### `ai_conversations`

Purpose: durable assistant threads.

Fields:

- `id`
- `ownerType`: `anonymous | visitor | admin`
- `ownerKey`: hashed anonymous key, visitorId, or admin key
- `title`
- `status`: `active | archived | flagged`
- `scopeType`: `site | post | category | tag`
- `scopeValue`
- `activePostId`
- `summary`
- `messageCount`
- `totalInputTokens`
- `totalOutputTokens`
- `createdAt`
- `updatedAt`
- `lastMessageAt`

Indexes:

- `(ownerType, ownerKey, updatedAt)`
- `(scopeType, scopeValue)`

### `ai_messages`

Purpose: message history.

Fields:

- `id`
- `conversationId`
- `role`: `user | assistant | system`
- `content`
- `status`: `created | completed | failed | blocked`
- `sourceJson`
- `usageJson`
- `createdAt`

Indexes:

- `(conversationId, createdAt)`

### `ai_knowledge_chunks`

Purpose: Supabase-native blog knowledge base.

Fields:

- `id`
- `postId`
- `postSlug`
- `postTitle`
- `categorySlug`
- `tagSlugs`
- `visibilitySnapshot`
- `statusSnapshot`
- `chunkIndex`
- `heading`
- `content`
- `contentTsvector`
- `embedding` optional pgvector in Phase 2
- `tokenEstimate`
- `contentHash`
- `createdAt`
- `updatedAt`

Indexes:

- `(postId)`
- `(postSlug)`
- `(visibilitySnapshot, statusSnapshot)`
- GIN index on `contentTsvector`
- optional HNSW/IVFFlat vector index later

Critical rule:

- Public retrieval must filter `statusSnapshot = published` and `visibilitySnapshot = public`.
- Admin retrieval can include hidden/admin only when explicitly testing admin mode.

### `ai_usage_buckets`

Purpose: durable rate limiting.

Fields:

- `id`
- `identityType`: `anonymous | visitor | admin`
- `identityKey`
- `actionType`
- `windowType`: `day | burst`
- `windowStart`
- `count`
- `tokenCount`
- `createdAt`
- `updatedAt`

Unique constraint:

- `(identityType, identityKey, actionType, windowType, windowStart)`

### `ai_agent_runs`

Purpose: audit each assistant turn.

Fields:

- `id`
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
- `status`
- `errorCode`
- `createdAt`

### `ai_tool_calls`

Purpose: tool audit.

Fields:

- `id`
- `runId`
- `toolName`
- `inputJson`
- `outputSummary`
- `status`
- `latencyMs`
- `createdAt`

### `ai_uploaded_files`

Phase 2.

Fields:

- `id`
- `conversationId`
- `ownerType`
- `ownerKey`
- `fileName`
- `mimeType`
- `byteSize`
- `textHash`
- `parseStatus`
- `expiresAt`
- `createdAt`

### `ai_uploaded_file_chunks`

Phase 2.

Fields:

- `id`
- `fileId`
- `conversationId`
- `chunkIndex`
- `content`
- `contentTsvector`
- `embedding` optional
- `tokenEstimate`
- `createdAt`

## API Shape

Add an `agent` router.

### `agent.bootstrap`

Input:

- current path
- post slug optional

Output:

- session tier
- quota remaining
- suggested prompts
- current page context summary
- open conversations for visitor/admin

### `agent.sendMessage`

Input:

- `conversationId?`
- `message`
- `routeContext`
- `scope`

Output:

- `conversationId`
- assistant message
- sources
- quota remaining
- run status

### `agent.getConversation`

Visitor/admin only for durable history.

Anonymous can only use current in-memory/local conversation ID plus server validation if retained.

### `agent.listConversations`

Visitor/admin only.

### `agent.reindexKnowledge`

Admin only.

Initial implementation can be synchronous for small blog volume. Later it can become a job queue.

## Answer Contract

Every assistant answer should include:

1. Direct answer.
2. Source-backed explanation.
3. Related posts or next reading step when useful.
4. Clear uncertainty when the blog does not contain enough context.

The assistant should say:

- "I can answer from public posts on this blog."
- "I do not have enough public blog context for that."
- "That post is not publicly available."

It should not mention hidden post titles to public users unless they are already visible in public metadata.

## Retrieval Without a Full RAG Chain

The first version can avoid a heavy RAG chain.

Use a simple, reliable pipeline:

1. Admin reindex splits public posts into chunks and stores them in Supabase.
2. User asks a question.
3. Server searches `posts`, `categories`, `tags`, and `ai_knowledge_chunks`.
4. Server builds a compact source bundle.
5. Model answers only from the bundle plus current route metadata.

This is still RAG in product behavior, but not a complex chain. It is a controlled Supabase retrieval layer.

## Implementation Phases

### Phase A: Floating Assistant Shell

- Add lower-right launcher.
- Add docked panel.
- Add i18n.
- Add current route context collection.
- Add quota display but no model call yet.

### Phase B: Supabase Knowledge Index

- Add `ai_knowledge_chunks`.
- Add admin reindex command or route.
- Chunk only published public posts.
- Add keyword/full-text search.
- Add tests that hidden/admin posts are excluded.

### Phase C: Harness + Quota MVP

- Add `ai_conversations`, `ai_messages`, `ai_usage_buckets`, `ai_agent_runs`.
- Add `agent.bootstrap`.
- Add `agent.sendMessage`.
- Enforce:
  - anonymous: 2 messages/day
  - visitor: 6 messages/day
  - admin: configurable high limit
- Persist usage before and after run safely.

### Phase D: Source-Grounded Answers

- Connect retrieval bundle to model.
- Show source cards in assistant panel.
- Add suggested questions by page type.
- Add refusal behavior for missing/hidden content.

### Phase E: Visitor History

- Visitor can reopen prior conversations.
- Anonymous sees current local conversation only.
- Login upsell appears after quota or after a useful answer.

### Phase F: File Context

- Start with pasted text as "temporary source".
- Then support `.txt` and `.md` upload stored as Supabase chunks.
- Add PDF only after the base system is stable.

### Phase G: Optional pgvector

- Add embedding column.
- Add reindex embeddings.
- Add hybrid search.
- Keep keyword search as fallback.

## Tests That Matter

Backend:

- Anonymous quota blocks on the 3rd daily message.
- Visitor quota blocks on the 7th daily message.
- Quota block does not call model.
- Public retrieval never returns `hidden` or `admin` chunks.
- Current post is boosted when asking from a post page.
- Reindex updates changed posts and removes deleted/unpublished chunks.
- Failed model call records run status without losing user message.

Frontend:

- Launcher appears on public pages.
- Panel opens without navigating away.
- Desktop panel does not cover the whole blog.
- Mobile opens as bottom sheet.
- Quota remaining is visible.
- Source cards are readable and link to posts.
- Limit reached state preserves draft input.

Security:

- No raw IP is stored.
- Visitor cannot read another visitor's conversation.
- Anonymous conversation IDs cannot be guessed to retrieve history.
- Admin-only endpoints reject visitor/anonymous.

## Final Decisions for Implementation

1. Mascot/icon: start with a restrained book/spark assistant icon; a custom mascot can be added after the shell works.
2. Anonymous retention: keep anonymous conversation state local-first; the server may persist the active conversation for up to 24 hours only for quota/audit continuity.
3. Admin quota: use env-configured high daily limits, with a safe local default.
4. PDF support timing: defer PDF until after pasted context and `.txt` / `.md` uploads are stable; pgvector is not required before PDF, but the base retrieval and quota system must already work.

## Recommendation

Build the assistant in this order:

1. UI shell and route context.
2. Supabase knowledge chunks with full-text search.
3. Quota engine.
4. Harness engine with source-grounded answers.
5. Visitor conversation history.
6. File/pasted-context support.
7. Optional pgvector hybrid retrieval.

This order keeps the database safe, avoids premature RAG complexity, and still makes the blog feel like an AI-native application from the first usable release.
