# Phase 02 - Research Index and Track Maps

**Goal:** Turn the homepage and track pages into a research navigation system: readers should see the technical map, active series, recommended paths, and latest articles without feeling they landed on an AI SaaS hero page.

**Architecture:** Reuse existing routes. Improve information architecture and rendering components rather than adding new top-level pages unless needed.

**Tech Stack:** React, Tailwind CSS, existing tRPC post/category/tag queries, `trackConfigs`, series metadata from Phase 01.

---

## Coding Agent Contract

- PHASE_ID: PO-02
- GOAL_TARGET: Convert home and track pages into research index and topic maps.
- GOAL_PROMPT: Complete PO-02 Research Index and Track Maps for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-02-research-index-track-maps.md`; use Phase 01 series metadata, avoid SaaS hero patterns, keep discovery routes intact, and finish after validation commands, browser checks, and acceptance gates pass.
- DEPENDS_ON: PO-01
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/pages/Home.tsx`, `client/src/pages/Track.tsx`, `client/src/components/ArticleCard.tsx`, `client/src/components/ResearchShell.tsx`, `client/src/lib/tracks.ts`, `client/src/i18n/home.ts`, `seed-blog.mjs`
- LIKELY_EDIT_PATHS: `client/src/pages/Home.tsx`, `client/src/pages/Track.tsx`, `client/src/components/ArticleCard.tsx`, `client/src/lib/tracks.ts`, `client/src/i18n/home.ts`, `client/src/index.css`
- DO_NOT_EDIT: Agent backend, schema, article body content
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`
- BROWSER_CHECKS: `/` at `390x844`, `768x1024`, `1280x800`, `1440x900`; `/algorithms`; `/applications`; check console errors, overflow, first viewport hierarchy, keyboard focus
- ACCEPTANCE_GATES: homepage reads as research index; algorithms/applications maps are distinct; series/paths visible; archive/search/tag/category routes remain reachable

## Task Spec

Restructure:

- `/` as a personal research index.
- `/algorithms` as an algorithm research map.
- `/applications` as an AI application engineering map.

Readers should immediately understand:

- what the author studies
- which series are active
- where to start
- what each track is about
- which article to read next

## Problem Boundary

In scope:

- Home page layout and copy.
- Track page layout and topic maps.
- Article list/card/list presentation.
- Series cards and reading path modules.
- Empty/low-content states.

Out of scope:

- Rewriting article content.
- Adding a complex interactive graph.
- Changing admin/editor pages.
- Changing Agent backend behavior.

## Context Policy

Inspect:

- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/lib/tracks.ts`
- `client/src/i18n/home.ts`
- `seed-blog.mjs`
- series metadata from Phase 01

## Product Requirements

### R1 Home as Research Index

The home first viewport should prioritize:

- author identity
- two-track research map
- active series
- latest or recommended article
- search access

Reduce:

- oversized SaaS-like hero structure
- generic chip rows
- stats as primary content
- repeated feature-card layout

### R2 Track Differentiation

Algorithms and Applications should not feel like the same page with different copy.

Algorithms should emphasize:

- mechanisms
- mathematical/architectural invariants
- long-context and stability questions

Applications should emphasize:

- Agent runtime
- RAG/context engineering
- evaluation and observability
- production AI system constraints

### R3 Series and Reading Paths

Each track should show:

- active series
- ordered reading path
- next planned article placeholder when useful
- key concepts
- representative articles

### R4 Article List as Ledger

Article lists should read like a research ledger:

- strong title
- compact metadata
- series/track/concept chips
- concise abstract
- reading time/date

Avoid making every post look like a large marketing card.

### R5 Discovery Continuity

Existing Archive/Search/Tag/Category routes must still be reachable and useful.

## Execution Capture

Required browser checks:

- `/` at `390x844`, `768x1024`, `1280x800`, `1440x900`
- `/algorithms` desktop and mobile
- `/applications` desktop and mobile
- empty/low-content state if easy to simulate

Capture:

- screenshots
- first viewport hierarchy note
- console errors
- horizontal overflow status
- keyboard focus check for search and primary links

## Evaluator Protocol

Phase 02 is complete when:

- The homepage reads as a research index rather than a SaaS landing page.
- Track pages communicate different intellectual maps.
- Series metadata from Phase 01 is visible and useful.
- Existing article discovery remains intact.

## Acceptance Criteria

- A new reader can choose a starting path in under one screen.
- Track pages expose series and concepts, not just articles.
- Mobile layouts preserve the research map without long, decorative stacking.
- `pnpm check`, relevant tests, and browser checks pass.

## Risks

- Overloading the home page with maps can reduce clarity.
- Too many series placeholders can make the site look emptier.
- Track maps must gracefully handle few published posts.
