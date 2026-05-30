# Phase 4 PRD: AI Application Showcase and Continuous Improvement

## Goal

Turn the Blog Agent system itself into a public demonstration of Misaya's AI application engineering ability.

This phase is not required for basic usability, but it is important for portfolio value.

## Public Showcase

Add an AI Applications article series:

1. "Building a Rovo-like Agent for a Technical Blog"
2. "Grounded Retrieval for Research Posts: Metadata Before Embeddings"
3. "Designing Scoped Agent Actions for a Technical Blog"
4. "Cost, Rate Limits, and Abuse Controls for Small AI Products"
5. "Evaluating Source-Grounded Answers Without Overbuilding"

These posts should describe architecture and trade-offs without exposing API keys, private logs, or hidden content.

## System Transparency Page

Add a public system transparency section. Prefer an AI Applications article or `/applications/blog-agent-system`; avoid introducing `/ai/system` unless routing has already standardized on `/ai`.

- What sources the AI can access.
- What it cannot access.
- How citations work.
- What agent actions are allowed.
- Privacy and retention summary.
- Known limitations.

## Observability

### Internal MVP

Track per conversation:

- model
- prompt version
- retrieval mode
- retrieved chunk ids
- latency
- token usage
- error code
- user feedback

### Optional Langfuse Integration

Langfuse-style tracing is useful because LLM applications need request-level visibility into prompts, retrieval steps, tool calls, token usage, latency, and cost.

Do not make Langfuse mandatory for Phase 1-3. Add a provider interface:

- `trace.startConversation`
- `trace.recordRetrieval`
- `trace.recordGeneration`
- `trace.recordFeedback`

Then implement a no-op/local Postgres trace first.

## Evaluation

### Golden Question Set

Create `ai_eval_questions`:

- question
- expected source slug(s)
- expected answer criteria
- forbidden claims
- difficulty
- track

Seed examples:

- "What problem does IsoHC solve?"
- "How does Agent Harness differ from a normal chatbot?"
- "Which posts should I read before understanding long-context scaling?"
- "Can you explain EVQ-Cosh?" should return unavailable/insufficient if EVQ is hidden.

### Evaluation Metrics

- source recall: did it retrieve the right post/chunk?
- answer groundedness: are claims supported by retrieved chunks?
- refusal quality: does it refuse hidden/unavailable content correctly?
- latency
- token cost
- task completion quality
- action correctness
- retrieval trace usefulness

### Feedback Loop

Admin should be able to turn bad answers into:

- retrieval tuning issue
- prompt issue
- missing article idea
- model issue
- user education issue

## Advanced Capabilities

Add only after the previous phases work:

- Semantic embeddings with pgvector.
- Hybrid keyword + vector retrieval.
- Reranking.
- Per-reader learning paths.
- "Compare two uploaded papers with blog posts."
- "Generate a study plan."
- "Create a concept graph" from posts and conversations.
- Configurable blog agents with separate instructions and allowed actions.

## Risks

- Overbuilding before real usage.
- Accidentally exposing hidden research content.
- Model cost spikes from file uploads.
- AI giving confident but unsupported technical claims.
- Admin agent workspace becoming another maintenance burden.

## Acceptance Criteria

- A public system transparency page or AI Applications article clearly explains source boundaries and privacy.
- Admin can see basic trace data for every answer.
- At least 20 golden questions exist.
- Eval command can run locally and summarize pass/fail.
- At least one public AI Applications post describes the architecture.
