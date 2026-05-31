# Phase 06 - Agent Quality and Operations

**Goal:** Improve Blog Agent reliability through retrieval quality, golden evals, reindex visibility, trace review, and admin operations.

**Architecture:** Build on the existing Agent schema and `/manage/agent` surface. Prefer incremental search/eval improvements before introducing pgvector or large retrieval infrastructure.

**Tech Stack:** tRPC Agent router, Agent harness, Drizzle/Postgres, `ai_knowledge_chunks`, `ai_agent_runs`, `ManageAgent`, Vitest.

---

## Coding Agent Contract

- PHASE_ID: PO-06
- GOAL_TARGET: Make Blog Agent quality observable and improvable through evals, traces, retrieval debug, and reindex status.
- GOAL_PROMPT: Complete PO-06 Agent Quality and Operations for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-06-agent-quality-operations.md`; improve admin Agent quality workflows incrementally, avoid pgvector/PDF/autonomous browsing, and finish after validation commands, Agent checks, browser checks, and acceptance gates pass.
- DEPENDS_ON: PO-00, PO-05
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `server/ai/router.ts`, `server/ai/harness.ts`, `server/ai/knowledge.ts`, `client/src/pages/ManageAgent.tsx`, `drizzle/schema.ts`, `scripts/ai/reindex-knowledge.ts`, `package.json`, `docs/agent_prd/09_final_integrated_blog_agent_prd.md`
- LIKELY_EDIT_PATHS: `server/ai/*`, `client/src/pages/ManageAgent.tsx`, `scripts/ai/reindex-knowledge.ts`, tests under `server/` and `client/src/components/agent/`
- DO_NOT_EDIT: public visual redesign, article content, pgvector migration, PDF ingestion, public agent workspace
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/ai/knowledge.test.ts server/ai/harness.test.ts server/ai/quota.test.ts server/agent.router.test.ts`; `pnpm ai:reindex`
- BROWSER_CHECKS: `/manage/agent` debug/eval/trace states; public article companion answer with source cards
- ACCEPTANCE_GATES: index status is inspectable; golden questions include success/refusal cases; retrieval failures are actionable; public answers are sourced or refuse

## Task Spec

Make Agent quality observable and improvable:

- index status
- reindex workflow or clear script-only policy
- golden question sets
- retrieval debug
- eval regression runs
- trace detail
- failed query and no-source analysis

## Problem Boundary

In scope:

- Admin Agent operations.
- Retrieval quality baseline.
- Golden question management.
- Source-grounded answer checks.
- Reindex status and freshness.
- Run/trace detail review.

Out of scope:

- pgvector migration unless justified by measured baseline failure.
- PDF/document workspace.
- autonomous browsing.
- live author intervention.
- automatic article publishing.

## Context Policy

Inspect:

- `server/ai/router.ts`
- `server/ai/harness.ts`
- `server/ai/knowledge.ts`
- `server/ai/eval*` if present
- `client/src/pages/ManageAgent.tsx`
- `drizzle/schema.ts`
- `scripts/ai/reindex-knowledge.ts`
- `package.json`
- `docs/agent_prd/09_final_integrated_blog_agent_prd.md`

## Product Requirements

### R1 Index Status

Admin should be able to see:

- chunk count
- last reindex time if available
- public post coverage
- hidden/draft excluded count
- latest reindex error if any

If reindex remains CLI-only, the UI must say so clearly and link to the command in docs.

### R2 Golden Question Sets

Create or expose a golden set covering:

- IsoHC
- Agent Harness Engine
- Evidence Packet
- AgentLoop
- cross-article comparison
- reading path request
- hidden EVQ refusal
- out-of-scope refusal

Each golden question should have expected source constraints and pass/fail notes.

### R3 Retrieval Quality

Improve or evaluate:

- current-post boost
- track/category scope
- tag/concept matching
- section heading extraction if available
- no-source behavior

Before pgvector, prefer DB full-text/metadata search if current in-memory search becomes insufficient.

### R4 Trace Detail

Admin should see enough to debug:

- request route context
- retrieved sources
- prompt/answer mode metadata when safe
- model status
- quota decision
- failure reason
- latency/token/cost if available

Do not expose secrets or private user data.

### R5 Eval Regression

Admin eval runs should produce:

- pass/fail summary
- failed question list
- missing source list
- date/time
- model/provider if available

## Execution Capture

Required tests:

```bash
pnpm exec vitest run server/ai/knowledge.test.ts server/ai/harness.test.ts server/ai/quota.test.ts server/agent.router.test.ts
```

Required commands:

```bash
pnpm check
pnpm test
pnpm build
pnpm ai:reindex
```

Browser checks:

- `/manage/agent` debug empty/populated states
- eval run state
- trace detail state
- public article companion answer with source cards

## Evaluator Protocol

Phase 06 is complete when:

- Admin can determine whether knowledge is fresh.
- Golden questions can be run and interpreted.
- Retrieval failures produce actionable information.
- Public Agent answers stay grounded in public content or refuse.

## Acceptance Criteria

- Hidden/draft content does not appear in public knowledge chunks or source cards.
- Golden set includes both success and refusal cases.
- Retrieval debug identifies why an answer lacked sources.
- Existing Blog Agent UI continues to work.

## Risks

- Adding eval UI without stable eval data creates false confidence.
- Full retrieval rewrites can destabilize a working MVP.
- Trace surfaces can leak prompts, secrets, or user context if not redacted.
