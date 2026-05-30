# PRD Review and Execution Guardrails

## Review Date

2026-05-30

## Review Result

The PRD set is ready to be used as goal-mode implementation input after the consistency fixes below. After the final multi-agent review, `09_final_integrated_blog_agent_prd.md` is the first document future Codex runs should read.

The authoritative product shape is:

- A single right-bottom blog assistant.
- Supabase-backed blog knowledge retrieval.
- No per-page agent surfaces.
- No full `/agent` public workspace in MVP.
- Anonymous users get 2 assistant messages per day.
- Visitor JWT users get 6 assistant messages per day.
- Quota must be checked before retrieval or model calls.
- Files are deferred behind pasted text and `.txt` / `.md` support.

## Authoritative Documents

Use these as the primary sources when implementation details conflict:

1. `09_final_integrated_blog_agent_prd.md`
2. `07_right_bottom_blog_agent_supabase_plan.md`
3. `05_execution_backlog.md`
4. `01_phase_1_article_companion_mvp.md`
5. `02_phase_2_identity_sessions_files_limits.md`

If there is a conflict, use `09_final_integrated_blog_agent_prd.md` first, then `07_right_bottom_blog_agent_supabase_plan.md`. The earlier strategy and later showcase docs are still useful, but the final integrated PRD controls product shape, database safety, user experience, and goal-mode order.

## Consistency Fixes Applied

### UI Surface

Old direction:

- Build `/agent` or `/ai` as the primary public AI experience.
- Add per-page article companion surfaces.

Reviewed direction:

- Build one lower-right assistant launcher and panel.
- Use current route/page metadata as context.
- Treat `/agent` as optional future workbench, not MVP.

### API Names

Old direction:

- `ai.startConversation`
- `ai.sendMessage`
- `ai.getConversation`

Reviewed direction:

- `agent.bootstrap`
- `agent.sendMessage`
- `agent.getConversation`
- `agent.listConversations`
- `agent.reindexKnowledge`

Do not introduce `ai.*` routes unless a compatibility requirement appears later.

### Quota

Old direction:

- Anonymous and visitor quotas were too permissive and inconsistent.

Reviewed direction:

- Anonymous: 2 assistant messages/day.
- Visitor JWT: 6 assistant messages/day.
- Admin: env-configured high quota, still tracked.
- Quota blocks must happen before retrieval/model/tool calls.

### Database

Use Supabase/Postgres as the system of record.

Required MVP tables:

- `ai_knowledge_chunks`
- `ai_conversations`
- `ai_messages`
- `ai_usage_buckets`
- `ai_agent_runs`

Later tables:

- `ai_tool_calls`
- `ai_pasted_sources`
- `ai_uploaded_files`
- `ai_uploaded_file_chunks`
- `ai_agent_profiles`
- `ai_eval_questions`

Do not store raw IP addresses. Use salted hashes.

### Retrieval

Old risk:

- Jumping directly to a complex RAG/vector chain.

Reviewed direction:

- Start with Supabase full-text/metadata retrieval.
- Chunk only public published posts for public retrieval.
- Add pgvector later as an optional hybrid retrieval improvement.
- Keep visibility filters mandatory at the database query layer.

### File Handling

Old risk:

- Adding PDF upload and file storage too early.

Reviewed direction:

- Start with pasted text.
- Then `.txt` and `.md` uploads.
- Store extracted text chunks and metadata in Supabase.
- Defer PDF until the base assistant and file retention model are stable.
- Uploaded/pasted context is conversation-local by default.

### Admin

Admin tooling should focus on:

- Retrieval inspection.
- Conversation/task traces.
- Quota and cost visibility.
- Evaluation sets.
- Article idea discovery.

Admin tooling should not:

- Become an author-reply inbox.
- Allow AI to publish/edit posts automatically.
- Expose hidden/admin posts to public users.

## Recommended Goal-Mode Order

### Goal 1: Schema and Retrieval Foundation

Implement `ai_knowledge_chunks`, chunk indexing, and public-only retrieval tests.

Exit criteria:

- Published public posts are indexed.
- Draft/hidden/admin posts are excluded.
- Retrieval returns source metadata.

### Goal 2: Quota and Agent Router

Implement `ai_conversations`, `ai_messages`, `ai_usage_buckets`, `ai_agent_runs`, and `agent.sendMessage`.

Exit criteria:

- Anonymous is blocked on the 3rd daily message.
- Visitor is blocked on the 7th daily message.
- Quota blocks do not call retrieval or model provider.
- Model errors are persisted.

### Goal 3: Right-Bottom Assistant UI

Implement launcher, docked panel, mobile bottom sheet, route context, source cards, and quota display.

Exit criteria:

- Blog remains readable behind the assistant on desktop.
- Mobile sheet is usable.
- i18n is complete.
- Source cards link to posts.

### Goal 4: Source-Grounded Answer Quality

Improve prompts, answer contracts, knowledge cards, refusal behavior, and current-post boosting.

Exit criteria:

- IsoHC questions cite IsoHC.
- Agent Harness questions cite the AI Applications post.
- EVQ hidden content is refused for anonymous/visitor users.

### Goal 5: Visitor History

Add durable visitor conversation history and ownership checks.

Exit criteria:

- Visitor can resume their own conversations.
- Visitor cannot read another visitor's conversations.
- Anonymous history remains local-first or short-lived.

### Goal 6: Pasted Context, Then Text/Markdown Upload

Add conversation-local pasted sources first, then `.txt` / `.md` uploads.

Exit criteria:

- Pasted context appears as a separate source type.
- Uploaded text is chunked in Supabase.
- Retention cleanup exists.
- PDF remains deferred.

### Goal 7: Admin Agent Operations

Add `/manage/agent`, retrieval debugger, traces, feedback, eval sets, and article ideas.

Exit criteria:

- Admin can inspect retrieval without model calls.
- Admin can run local evals.
- Admin can convert useful conversations into article ideas.

## Hard Checks Before Each Goal Is Marked Done

- `pnpm check`
- `pnpm test`
- `pnpm build`
- Browser smoke test for the affected public route.
- Public user cannot retrieve hidden/admin/draft content.
- Quota behavior is tested when the goal touches agent calls.

## Known Non-Goals

- No live author intervention.
- No arbitrary web browsing.
- No public full-screen `/agent` workspace in MVP.
- No PDF upload in the first file milestone.
- No automatic article publishing or editing by AI.
