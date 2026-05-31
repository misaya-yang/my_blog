# Phase 00 - Product Optimization Baseline

**Goal:** Establish a current-state baseline for product surfaces, content inventory, visual density, Agent behavior, and release freshness before product optimization begins.

**Architecture:** Add or use existing audit commands and manual browser checks. This phase should produce evidence, not product changes.

**Tech Stack:** Existing Vite/React app, tRPC routes, Drizzle schema, seed content, audit scripts, Browser verification.

---

## Coding Agent Contract

- PHASE_ID: PO-00
- GOAL_TARGET: Capture a product optimization baseline without changing product behavior.
- GOAL_PROMPT: Complete PO-00 Product Optimization Baseline for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-00-product-optimization-baseline.md`; produce a baseline report only, keep product code unchanged, and finish after validation commands and route/Agent checks are recorded.
- DEPENDS_ON: none
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `package.json`, `seed-blog.mjs`, `client/src/App.tsx`, `client/src/pages/Home.tsx`, `client/src/pages/Track.tsx`, `client/src/pages/PostDetail.tsx`, `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/pages/ManageAgent.tsx`, `server/discovery.ts`, `server/ai/router.ts`, `server/ai/harness.ts`
- LIKELY_EDIT_PATHS: `docs/product_optimization/reports/` or a single baseline report file under this directory
- DO_NOT_EDIT: product source files, schema, article markdown, seed data
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`; `pnpm audit:baseline:quick`
- BROWSER_CHECKS: `/`, `/algorithms`, `/applications`, one public `/post/:slug`, `/manage/agent` if reachable; viewports `390x844`, `768x1024`, `1280x800`, `1440x900`
- ACCEPTANCE_GATES: content inventory complete; route inventory complete; visual baseline recorded; Agent golden question table recorded; publish freshness status recorded or explicitly blocked

## Task Spec

Capture a baseline that answers:

- What public content exists, and which posts are draft/hidden/public?
- Which series metadata already exists in the database or seed files?
- Which routes are active and which product surfaces depend on seeded content?
- How does the home/track/article UI currently look at desktop and mobile sizes?
- What can the Blog Agent answer today, and where does retrieval fail?
- Does `content:publish` keep public content, Agent chunks, RSS, sitemap, and archive in sync?

## Problem Boundary

In scope:

- Documentation, route inventory, content inventory, screenshots, Agent sample questions, and command output summaries.
- No product code changes.

Out of scope:

- Redesigning UI.
- Changing schema.
- Changing Agent retrieval.
- Editing article content.

## Context Policy

Before running the baseline, inspect:

- `README.md`
- `package.json`
- `seed-blog.mjs`
- `drizzle/schema.ts`
- `client/src/App.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/pages/ManageAgent.tsx`
- `server/discovery.ts`
- `server/ai/router.ts`
- `server/ai/harness.ts`
- `docs/harness_engine/README.md`
- `docs/agent_prd/09_final_integrated_blog_agent_prd.md`

## Product Requirements

### R1 Content Inventory

Create a table with:

- title
- slug
- content path
- category
- status
- visibility
- tags
- series metadata if present
- whether the article appears in sitemap/RSS/archive after publish

### R2 Route Inventory

Check:

- `/`
- `/algorithms`
- `/applications`
- `/archive`
- `/search`
- `/tags/:slug` for at least `agent-systems`
- `/categories/:slug` for both categories
- one public `/post/:slug`
- `/about`
- `/manage/agent` authenticated or unauthenticated fallback

### R3 Visual Baseline

Capture screenshots and notes for:

- visual density
- first viewport information hierarchy
- repeated glass/glow/star/grid motifs
- article reading width and decoration level
- mobile navigation and horizontal overflow

### R4 Agent Baseline

Ask at least eight golden questions:

- one about IsoHC
- one about Agent Harness Engine
- one about Evidence Packet
- one about AgentLoop
- one cross-article comparison
- one "what should I read next?" question
- one hidden EVQ-related query that should not leak hidden content
- one out-of-scope query that should refuse or answer with limited context

For each answer record:

- whether it has source cards
- whether source cards point to public posts
- whether the answer says insufficient context when appropriate
- latency/quota status if visible

### R5 Publish Freshness Baseline

Run or document:

```bash
pnpm content:publish
```

Then verify:

- public posts remain public
- hidden posts remain hidden
- `ai_knowledge_chunks` reflects only public content
- RSS/sitemap/archive ordering is not unexpectedly changed by repeated seeding

If the command cannot be run safely in the current environment, document why and mark it as a required release check.

## Execution Capture

Required traces:

- command outputs for `pnpm check`, `pnpm test`, and `pnpm build`
- optional `pnpm audit:baseline:quick`
- route screenshot table
- Agent golden question table
- content inventory table
- known blockers list

## Evaluator Protocol

Phase 00 is complete when:

- The baseline identifies all current public posts and hidden/draft posts.
- The route inventory confirms which product surfaces are working.
- The visual baseline shows where UI density is hurting reading.
- The Agent baseline identifies source-grounding and retrieval gaps.
- The publish freshness check is either passed or documented as a blocker.

## Acceptance Criteria

- Baseline report can be used before and after every following phase.
- No product files are changed.
- Gaps are categorized as product, UI, content, Agent, or release issues.

## Risks

- Local database absence may make route checks incomplete.
- Running `content:publish` mutates the database and should only be done when intended.
- Screenshots without seeded content can understate article/list issues.
