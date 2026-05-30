# Rovo-Like Blog Agent Product Strategy PRD

Date: 2026-05-30

## 1. Product Thesis

The blog should evolve from a static technical archive into a Rovo-like personal knowledge agent system.

The core product is an AI teammate for the blog. It should search, explain, compare, synthesize, and execute scoped knowledge tasks across Misaya Yang's public technical writing. This creates a product loop:

- Readers get faster comprehension of complex technical posts.
- The blog becomes navigable as a technical knowledge graph, not just a chronological archive.
- The site demonstrates real AI application capability through RAG, context engineering, agent instructions, actions, session memory, file uploads, rate limits, and observability.

The system should feel closer to "Rovo for this blog" than "a support chatbot". Author intervention is a future advanced capability, not the center of the product.

## 2. Core Needs

### Reader Needs

- Understand dense algorithm/application articles without reading every line first.
- Ask "what does this mean?", "how does this compare?", and "what should I read next?"
- See answers grounded in specific blog passages.
- Upload a small file or paper excerpt and ask how it relates to the blog's ideas.
- Keep a conversation history across visits.
- Ask the agent to produce reading paths, concept maps, comparisons, and implementation takeaways.

### Author Needs

- Avoid repeatedly answering the same basic questions.
- See where readers get stuck.
- See what readers ask and where retrieval fails.
- Use aggregate questions as source material for future posts.
- Show AI application engineering skill publicly through a polished, credible product.

### Portfolio Needs

- Demonstrate practical AI application abilities beyond algorithm research:
  - RAG and retrieval design.
  - Context engineering.
  - Conversation persistence.
  - Rate limiting and cost control.
  - File ingestion.
  - Human-in-the-loop workflow.
  - Evaluation and observability.

## 3. Product Positioning

Working name: **Misaya Blog Agent**

Primary promise:

> Search the blog, understand the ideas, and ask an agent to build a technical path through the knowledge.

Product modes:

- **Blog Search:** AI-powered search with knowledge cards and source grounding.
- **Agent Chat:** Ask a configurable blog agent questions across posts, tags, tracks, and uploaded sources.
- **Knowledge Matrix:** Explore relationships across AI Algorithms and AI Applications.
- **Reading Path Agent:** Generate a custom sequence of posts based on reader level and goals.
- **Paper/File Lens:** Upload a paper excerpt or notes and ask how they relate to the blog.
- **Research Map Agent:** Produce a concept map, comparison table, or study plan from selected sources.

## 4. Benchmark Findings

The product should borrow patterns from several mature categories:

| Reference | Useful Pattern | Product Implication |
| --- | --- | --- |
| Atlassian Rovo Agents | Rovo agents are configurable AI teammates with objectives, parameters, knowledge sources, and specialized skills/actions. | Model the blog feature as one or more scoped agents, not one generic assistant. Source: https://support.atlassian.com/rovo/docs/agents/ |
| Rovo Studio | Agents define identity, instructions, knowledge sources, skills, and where they can be used. | Add admin-configurable agent profiles later: "Article Explainer", "Research Mapper", "Application Architect". Source: https://support.atlassian.com/studio/docs/what-is-rovo-studio/ |
| Rovo Search / Chat | Rovo combines search, chat, knowledge cards, definitions, suggested prompts, and actions over organizational knowledge. | Phase 1 should include AI search/knowledge cards, not only a chat box. Source: https://support.atlassian.com/rovo/docs/what-is-rovo/ |
| OpenAI Responses API + File Search | Hosted file search can search vector stores and return source-grounded results. | Design around a retriever-result-answer pipeline with citations, even if DeepSeek is used for generation later. Source: https://platform.openai.com/docs/guides/tools-file-search/ |
| OpenAI rate limits | Production AI systems need request and token caps, usage tiers, and retry/backoff behavior. | Track quotas by salted anonymous identity hash, visitorId, and admin separately. Source: https://platform.openai.com/docs/guides/rate-limits |
| DeepSeek API | DeepSeek supports OpenAI-compatible chat completions with `base_url=https://api.deepseek.com`. | Keep the model adapter provider-neutral and OpenAI-style. Source: https://api-docs.deepseek.com/ |
| Google NotebookLM | Users understand source-grounded AI through source selection, source summaries, and focused questions. | Let users ask across all public posts or selected article/tag/track sources. Source: https://support.google.com/notebooklm/answer/16215270 |
| Dify Knowledge | Knowledge bases need ingestion, metadata, retrieval testing, and adjustable retrieval strategies. | Treat blog posts as a first-class knowledge base with metadata: track, tags, visibility, slug. Source: https://docs.dify.ai/en/use-dify/knowledge/readme |
| Langfuse | LLM tracing captures prompts, responses, retrieval steps, tools, token usage, latency, and quality signals. | Add lightweight internal traces first; optionally integrate Langfuse later. Source: https://langfuse.com/docs/observability/overview |

## 5. Non-Goals

- No autonomous internet browsing in Phase 1.
- No public access to hidden/admin-only posts.
- No official email login in Phase 1 unless the author later decides to connect a provider.
- No complex agent tool marketplace in early phases.
- No unbounded file upload or long-context dumping.
- No live author participation in Phases 1-3. That is a separate future R&D problem.

## 6. Success Metrics

### Reader Value

- 30% of article readers open the AI companion.
- 40% of AI users click at least one cited source or article anchor.
- Median first answer latency under 5 seconds for Phase 1.
- Less than 5% of conversations receive "not enough context" for questions about public articles.

### Author Value

- Admin can see aggregate agent usage, failed retrievals, and popular questions.
- At least 5 reusable article ideas are generated from aggregate questions per month.
- Agent workflows can generate a reading path or research map in under 15 seconds.

### Engineering Portfolio Value

- Public AI Applications case study page explains architecture, constraints, and evaluation.
- The app tracks token usage, retrieval sources, and feedback for every AI answer.
- The system has clear quota and abuse controls before file upload is enabled.

## 7. Product Principles

1. **Grounded before clever:** Every factual answer should cite blog sources or say it lacks source support.
2. **Agent boundaries are explicit:** The system can explain and synthesize, but it does not pretend to be Misaya.
3. **Visibility rules are sacred:** Public readers never retrieve hidden or admin-only content.
4. **Progressive capability:** Start with article Q&A, then memory, files, scoped agent workflows, and observability.
5. **Portfolio-grade transparency:** The AI system itself becomes a documented engineering artifact.
6. **Actions are scoped:** Any agent action must have narrow permissions, visible inputs, and auditable outputs.
