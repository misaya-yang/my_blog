# Phase 04 - Article Reading and Summary Layer

**Goal:** Make long technical articles easier to enter, scan, cite, and continue from without reducing their technical depth.

**Architecture:** Add article-level reading aids and refine the article page layout. Prefer structured metadata and Markdown conventions over ad hoc per-article UI.

**Tech Stack:** `PostDetail.tsx`, `MarkdownRenderer`, article Markdown, discovery context, series metadata, Tailwind typography.

---

## Coding Agent Contract

- PHASE_ID: PO-04
- GOAL_TARGET: Add article-level summary, series position, and calmer long-form reading support.
- GOAL_PROMPT: Complete PO-04 Article Reading and Summary Layer for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-04-article-reading-summary-layer.md`; use Phase 01 series metadata, do not fabricate summaries, preserve technical depth, and finish after validation commands, browser checks, and acceptance gates pass.
- DEPENDS_ON: PO-01, PO-03
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/pages/PostDetail.tsx`, `client/src/components/MarkdownRenderer.tsx`, `client/src/index.css`, `server/discovery.ts`, `server/routers.ts`, public article markdown files, Phase 01 series metadata
- LIKELY_EDIT_PATHS: `client/src/pages/PostDetail.tsx`, `client/src/components/MarkdownRenderer.tsx`, `client/src/index.css`, article metadata/config files if introduced by PO-01
- DO_NOT_EDIT: Agent backend, unrelated home/track redesign, article technical claims
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`
- BROWSER_CHECKS: one algorithm article, one application article, one article with code/formula/table if available; mobile `390x844`, desktop `1280x800`; test TOC, code copy, overflow, footer navigation
- ACCEPTANCE_GATES: article entry layer helps reader decide how to read; series navigation hides absent/hidden data; code/formula/table rendering is stable; feedback/subscription still works

## Task Spec

Upgrade article pages with a compact technical entry layer:

- core claim
- required background
- main abstraction
- implementation relevance
- limitations
- series position
- continue-reading links

The reader should be able to understand what a dense article is about before committing to the full text.

## Problem Boundary

In scope:

- Article header layout.
- Summary block rendering.
- Series membership display.
- TOC and reading progress refinement.
- Previous/next/related/continue track links.
- Code/formula/table overflow behavior.

Out of scope:

- Rewriting all article bodies.
- Replacing Markdown renderer.
- Building a public comment system.
- Agent answer generation.

## Context Policy

Inspect:

- `client/src/pages/PostDetail.tsx`
- `client/src/components/MarkdownRenderer.tsx`
- `client/src/index.css`
- `server/discovery.ts`
- `server/routers.ts`
- article markdown files
- series metadata from Phase 01

## Product Requirements

### R1 Technical Summary Block

Each public technical article should support a compact block with:

- core claim
- problem boundary
- main abstraction
- implementation mapping
- limitations or non-goals

If explicit metadata is missing, do not fabricate. Show only available fields or use a conservative fallback from the excerpt.

### R2 Series Position

When a post belongs to a series:

- show series title
- show position in series
- show previous/next within series
- show "start series" or "continue series" action

### R3 Quieter Article Header

Reduce:

- share buttons competing with title
- decorative visuals before the reader has content context
- heavy glass container dominance

Keep:

- title
- author/date/reading time
- category/tags
- TOC
- share/copy controls as secondary actions

### R4 Long-Form Technical Rendering

Verify:

- code blocks scroll horizontally and keep copy controls accessible
- formulas do not overflow the viewport
- tables are readable on mobile
- headings produce stable anchors
- duplicate heading text does not break scroll spy

### R5 Reading Continuity

Article footer should guide:

- next in series
- related posts
- track continuation
- feedback
- subscription/RSS

## Execution Capture

Required browser checks:

- one algorithm article
- one application article
- one article with code/formula/table if available
- mobile `390x844`
- desktop `1280x800`

Capture:

- screenshot of header/summary
- screenshot of code/formula/table section
- TOC click behavior
- copy code behavior
- related/series footer behavior

## Evaluator Protocol

Phase 04 is complete when:

- A reader can decide whether and how to read an article from the header area.
- Technical depth remains intact.
- Long technical content does not overflow or become unreadable on mobile.
- Series navigation works when metadata exists and gracefully disappears when absent.

## Acceptance Criteria

- Article summary block is data-driven or explicitly conservative.
- Article page is calmer than the current decorative shell.
- Existing feedback and subscription modules still work.
- `pnpm check` and relevant rendering tests pass.

## Risks

- Auto-generating summaries can introduce incorrect claims.
- Too much header metadata can make articles feel bureaucratic.
- Series navigation must not expose hidden/draft posts.
