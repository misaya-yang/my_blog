# Phase 3 PRD: Agent Workflows and Admin Knowledge Operations

## Goal

Move from "chat over posts" to a small Rovo-like agent platform for the blog. The agent should perform scoped knowledge tasks, expose its sources and steps, and give the admin tools to improve the knowledge base.

Author live intervention is intentionally out of scope for Phase 3.

The public interaction surface remains the right-bottom assistant. `/manage/agent` is the admin workspace; a public `/agent` full-page workbench is optional future scope, not required for Phase 3.

## Product Principle

The agent should be useful because it can do structured work over the blog knowledge base, not because it pretends to be the author.

## Agent Profiles

### Blog Navigator

Purpose:

- Search across public posts.
- Explain terms.
- Recommend related posts.
- Create knowledge cards.

Inputs:

- natural language query
- optional track/tag/post scope

Outputs:

- answer with citations
- source cards
- related concepts

### Article Explainer

Purpose:

- Explain the current article at multiple depths.
- Extract assumptions, mechanism, failure modes, and implementation implications.

Outputs:

- layered explanation
- section-level source references
- suggested follow-up questions

### Reading Path Planner

Purpose:

- Build a learning path through AI Algorithms and AI Applications content.

Inputs:

- reader level
- goal
- time budget
- preferred track

Outputs:

- ordered path
- why each article matters
- prerequisite concepts
- checkpoint questions

### Research Mapper

Purpose:

- Generate a concept graph or comparison matrix across selected articles.

Outputs:

- concept nodes
- relation labels
- comparison table
- unresolved gaps in the blog corpus

### Application Architect

Purpose:

- Translate blog concepts into AI application architecture patterns.
- Connect agent, RAG, context engineering, evaluation, and observability ideas.

Outputs:

- architecture sketch
- trade-off list
- implementation checklist

## Agent Actions

Phase 3 actions should be narrow, auditable, and read-heavy.

Allowed public actions:

- `search_posts`
- `get_post_summary`
- `get_related_posts`
- `build_reading_path`
- `build_concept_map`
- `compare_posts`
- `analyze_uploaded_source`

Admin-only actions:

- `reindex_knowledge`
- `inspect_retrieval`
- `run_eval_set`
- `mark_bad_answer`
- `create_article_idea`
- `edit_agent_prompt`

Forbidden actions:

- publish posts automatically
- edit posts automatically
- expose hidden/admin-only posts to public users
- send messages as the author
- browse arbitrary web pages without explicit future scope

## Admin Workspace

Add `/manage/agent`.

Tabs:

- Overview
- Conversations
- Retrieval Debugger
- Agent Profiles
- Evaluations
- Article Ideas

### Overview

Show:

- total conversations
- top questions
- failed retrievals
- most cited posts
- quota usage
- model cost estimate

### Conversations

Not an inbox for author replies. It is an observability and product learning surface.

Show:

- conversation/task title
- agent profile
- scope
- visitor/anonymous
- feedback
- status
- tokens
- latency
- sources used

Admin actions:

- inspect
- archive
- delete
- mark as useful
- convert to article idea
- add to eval set

### Retrieval Debugger

Admin can enter a query and see:

- chunk candidates
- scores
- filters
- final context sent to model
- answer
- citation mapping

### Agent Profiles

Admin can configure:

- display name
- short description
- system instruction
- allowed actions
- default scope
- starter prompts

Keep this simple in Phase 3. It can be a DB-backed JSON config, not a full no-code builder.

## Data Model Additions

- `ai_agent_profiles`
  - `id`
  - `key`
  - `name`
  - `description`
  - `systemPrompt`
  - `allowedActionsJson`
  - `starterPromptsJson`
  - `enabled`
  - `createdAt`
  - `updatedAt`

- `ai_agent_runs`
  - `id`
  - `conversationId`
  - `profileKey`
  - `taskType`
  - `status`
  - `inputJson`
  - `outputJson`
  - `traceJson`
  - `createdAt`
  - `updatedAt`

- `ai_article_ideas`
  - `id`
  - `sourceConversationId`
  - `title`
  - `summary`
  - `trackSlug`
  - `status`: `new | accepted | dismissed | drafted`
  - `createdAt`

## Acceptance Criteria

- The right-bottom assistant supports at least three profiles: Blog Navigator, Article Explainer, Reading Path Planner.
- `/manage/agent` shows conversation/task history and retrieval traces.
- Admin can run a retrieval debugger query without calling the model.
- Admin can convert a useful conversation into an article idea.
- Agent actions are explicit and logged.
- No agent action can publish or modify public blog content.
