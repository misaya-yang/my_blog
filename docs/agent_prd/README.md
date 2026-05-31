# Blog AI Agent PRD Index

This folder defines a phased product plan for adding a Rovo-like Blog Agent layer to Misaya Yang's AI Tech Blog.

The goal is not a generic chatbot and not primarily an author-support inbox. The product should act like a personal technical knowledge agent for the blog: it can search, explain, compare, plan reading paths, generate research maps, operate over uploaded sources, and eventually run scoped actions over the blog knowledge base.

## Documents

- [00_product_strategy.md](./00_product_strategy.md): Product thesis, target users, Rovo-like benchmark findings, success metrics.
- [01_phase_1_article_companion_mvp.md](./01_phase_1_article_companion_mvp.md): MVP for article-grounded Q&A, blog search, knowledge cards, citations, and public AI entry points.
- [02_phase_2_identity_sessions_files_limits.md](./02_phase_2_identity_sessions_files_limits.md): Visitor identity, durable conversation history, upload support, abuse control, and quota design.
- [03_phase_3_agent_workflows_admin.md](./03_phase_3_agent_workflows_admin.md): Agent actions, task workflows, admin knowledge operations, and evaluation workspace.
- [04_phase_4_ai_application_showcase.md](./04_phase_4_ai_application_showcase.md): Turn the system into a portfolio-grade AI application case study with observability, evaluation, and public engineering writeups.
- [05_execution_backlog.md](./05_execution_backlog.md): Implementation-oriented backlog for future Codex execution.
- [06_future_author_intervention_rnd.md](./06_future_author_intervention_rnd.md): Future R&D note for author intervention/live participation. This is intentionally out of the MVP path.
- [07_right_bottom_blog_agent_supabase_plan.md](./07_right_bottom_blog_agent_supabase_plan.md): Refined plan for a right-bottom assistant that knows the whole blog through Supabase-backed knowledge, sessions, files, and quotas.
- [08_prd_review_and_execution_guardrails.md](./08_prd_review_and_execution_guardrails.md): Final review notes, conflict resolution, and goal-mode execution guardrails.
- [09_final_integrated_blog_agent_prd.md](./09_final_integrated_blog_agent_prd.md): Final integrated PRD after product, backend, AI/retrieval, and frontend sub-agent review. Use this first for future goal-mode execution.

## Recommended Sequence

1. Read `09_final_integrated_blog_agent_prd.md` first; it overrides older conflicts.
2. Build Supabase public knowledge chunks and retrieval before any model-facing polish.
3. Add atomic quota, agent router, and right-bottom assistant UI.
4. Improve source-grounded answer quality and visitor history.
5. Add pasted context and `.txt` / `.md` uploads only after the core assistant is stable.
6. Treat direct author intervention as a future hard problem after the agent platform is stable.

## Persistent Operating Memory

- New public articles are not agent-readable until `ai_knowledge_chunks` is rebuilt.
- After any seeded article addition, article content rewrite, title/excerpt/tag/category change, or public/hidden/admin/draft visibility change, run `pnpm content:publish` or run `pnpm db:seed` followed by `pnpm ai:reindex`.
- Do not consider a content deployment complete until `/manage/agent` retrieval/debug can find the new article by title, slug, and core topic terms.
- Uploaded visitor files remain conversation-local context and must not be promoted into public `ai_knowledge_chunks` unless an explicit admin workflow does that later.

## Current Codebase Anchors

- Reuse `client/src/components/AIChatBox.tsx` as the initial chat surface, but restyle it to match the current dark space research identity.
- Reuse `server/_core/llm.ts` as the OpenAI-compatible model adapter. Later, point it to DeepSeek using `base_url=https://api.deepseek.com` and a server-side API key.
- Reuse existing `auth.session`, `visitorLogin`, and `adminLogin` flows as identity foundations.
- Reuse existing article visibility rules so hidden/admin-only posts are never exposed to public AI retrieval.
- Extend Drizzle/Supabase with AI-specific tables instead of overloading `posts`, `post_versions`, or `users`.
