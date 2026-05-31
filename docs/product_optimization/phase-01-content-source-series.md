# Phase 01 - Content Source and Series System

**Goal:** Make the content system feel intentional by organizing articles into visible series, reading paths, and concept metadata without rewriting article substance.

**Architecture:** Prefer existing `posts.seriesSlug`, `seriesTitle`, `seriesOrder`, `featuredRank`, and `pinnedTrack` fields first. Add static series config only if needed. Avoid schema changes unless the existing fields cannot express the required product behavior.

**Tech Stack:** `seed-blog.mjs`, Markdown article files, Drizzle post fields, discovery routes, track config, optional shared series metadata module.

---

## Coding Agent Contract

- PHASE_ID: PO-01
- GOAL_TARGET: Create a coherent content series and concept metadata system using existing post metadata where possible.
- GOAL_PROMPT: Complete PO-01 Content Source and Series System for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-01-content-source-series.md`; organize public articles into stable series/concepts, preserve hidden/draft boundaries, avoid rewriting article substance, and finish after validation commands and acceptance gates pass.
- DEPENDS_ON: PO-00 baseline completed or explicitly waived
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `seed-blog.mjs`, public article markdown files, `drizzle/schema.ts`, `server/routers.ts`, `server/discovery.ts`, `client/src/lib/tracks.ts`, `client/src/pages/Track.tsx`, `client/src/pages/PostDetail.tsx`, `shared/content-ops.ts`, `shared/metadata.ts`
- LIKELY_EDIT_PATHS: `seed-blog.mjs`, `client/src/lib/tracks.ts`, shared metadata/config files, optional docs under `docs/product_optimization/`
- DO_NOT_EDIT: article technical arguments, hidden content visibility, unrelated UI shell
- VALIDATION_COMMANDS: `pnpm check`; `pnpm exec vitest run server/discovery.test.ts server/discovery.router.test.ts`
- BROWSER_CHECKS: If UI changes, check `/algorithms`, `/applications`, and one public `/post/:slug`
- ACCEPTANCE_GATES: every public post has required metadata; at least two visible series are expressible; hidden/draft posts are absent from public series/discovery/Agent surfaces; seed does not duplicate posts or unexpectedly drift dates

## Task Spec

Create a durable content organization layer:

- series definitions
- article ordering inside each series
- required background / target reader level
- concept tags
- canonical publish date behavior
- public reading path copy

The result should make the site look like a curated research archive, not a flat list of posts.

## Problem Boundary

In scope:

- Seed metadata.
- Static or database-backed series config.
- Track page series rendering requirements.
- Article page "part of series" requirements.
- Content quality checks for metadata completeness.

Out of scope:

- Rewriting technical article content.
- Adding a full external CMS.
- Building a complex graph database.
- Publishing hidden drafts unless the author explicitly chooses to.

## Context Policy

Inspect:

- `seed-blog.mjs`
- all public article markdown files
- `drizzle/schema.ts`
- `server/routers.ts`
- `server/discovery.ts`
- `client/src/lib/tracks.ts`
- `client/src/pages/Track.tsx`
- `client/src/pages/PostDetail.tsx`
- `shared/content-ops.ts`
- `shared/metadata.ts`

## Product Requirements

### R1 Series Catalog

Define at least these initial series:

- **Agent Runtime Systems:** Harness Engine, Evidence Packet, AgentLoop, future Tool ABI and Context Budget articles.
- **Agentic RAG Infrastructure:** Evidence Packet, future Chunking, Hybrid Retrieval, Retrieval Eval articles.
- **Long Context and Position Encoding:** EVQ/RoPE and future long-context articles.
- **Residual Stability:** IsoHC and future residual mixing/stability articles.

Each series must have:

- slug
- title
- one-sentence promise
- track
- ordered post slugs
- expected next article placeholders, if useful

### R2 Article Metadata Completeness

Every public post should have:

- category
- tags
- excerpt
- series membership when appropriate
- series order when in a series
- stable title and slug
- canonical published date behavior

### R3 Hidden and Draft Boundaries

Hidden/draft posts must not appear in:

- public series pages
- public track maps
- Blog Agent public source cards
- RSS
- sitemap

### R4 Content Source Consistency

Clarify the source of truth for article metadata:

- If `seed-blog.mjs` remains source of truth, document the required fields.
- If frontmatter is introduced later, this phase should only specify the migration plan, not implement it automatically.

### R5 Publish Date Safety

Repeated seeding must not accidentally move historical published dates unless the author explicitly changes a canonical date.

## Execution Capture

Required:

- content inventory before/after
- list of series and ordered posts
- evidence that hidden posts are absent from public surfaces
- `pnpm check`
- discovery tests if route behavior changes

Recommended:

```bash
pnpm exec vitest run server/discovery.test.ts server/discovery.router.test.ts
```

## Evaluator Protocol

Phase 01 is complete when:

- Public posts have complete metadata.
- At least two visible series can be rendered by later phases without inventing metadata.
- Hidden posts remain hidden from all public discovery and Agent knowledge.
- Re-running seed does not create content duplication or unexpected date drift.

## Acceptance Criteria

- The content model can answer: "What should I read next in this series?"
- The Agent and discovery surfaces can use series metadata safely.
- The implementation avoids creating a second conflicting content metadata source.

## Risks

- Adding too many metadata fields can create maintenance burden.
- Frontmatter migration can become larger than the product problem.
- Tags can become noisy if used as both concepts and series identifiers.
