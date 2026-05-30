# Phase 02 - Reader Discovery Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:brainstorming` only if changing the information architecture beyond this PRD; otherwise use `superpowers:executing-plans` or `superpowers:subagent-driven-development`.

**Goal:** Turn the existing post, category, and tag data into a real public discovery system for readers.

**Architecture:** Add public routes and tRPC queries for search, archive, categories, tags, and related navigation. Keep content backed by Postgres. Avoid adding a separate search service until the local database search ceiling is reached.

**Tech Stack:** React, Wouter, tRPC, Drizzle/Postgres, Tailwind.

---

## Task Spec

Build the reader-facing navigation that a serious personal technical blog needs:

- full-site search across public posts
- tag pages
- category pages
- archive page
- article related-post modules
- previous/next post navigation
- mobile navigation

The current data model already supports most of this, but the public UX does not expose it.

## Problem Boundary

In scope:

- Public IA and route additions.
- Query support for tag/category/search/archive.
- Article cards using real category/tag data.
- Mobile header navigation.
- Home page reframing as a personal research index.

Out of scope:

- SEO metadata and RSS generation. Those belong to Phase 04.
- Visual system overhaul beyond what is needed to expose the new routes. Phase 03 owns full visual polish.
- Comments, bookmarks, and newsletter. Those belong to Phase 06.

## Context Policy

Before editing, inspect:

- `client/src/App.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/i18n/home.ts`
- `client/src/i18n/nav.ts`
- `client/src/i18n/post.ts`
- `client/src/lib/tracks.ts`
- `server/routers.ts`
- `server/db.ts`
- `drizzle/schema.ts`
- `seed-blog.mjs`

Treat `AI Algorithms` and `AI Applications` as durable top-level tracks. Do not replace them with a generic category grid.

## Product Requirements

### R1 Public Route Map

Add routes:

- `/archive`
- `/tags/:slug`
- `/categories/:slug`
- `/search`
- `/about`
- `/projects`

`/about` and `/projects` may start as lightweight static pages in this phase if Phase 06 or Phase 07 later enriches them.

Update navigation:

- desktop nav points Archive to `/archive`, not `/#research-index`
- mobile nav provides access to Home, AI Algorithms, AI Applications, Archive, About, Projects, Scholar, Email, language switch, and Login/Profile

### R2 Server Search

Search must cover all public posts, not just the first loaded page.

Search fields:

- title
- excerpt
- content
- category name
- tag names

Search results should include:

- title
- slug
- excerpt with highlighted match if practical
- category
- tags
- published date
- reading time

Minimum search implementation:

- case-insensitive matching with pagination
- public-only filter
- limit and offset

Future-ready implementation:

- Postgres full-text search or trigram index once content grows.

### R3 Tag and Category Pages

Each tag page must show:

- tag name
- short description if available
- article count
- public posts with that tag
- sibling tags from the same posts

Each category page must show:

- category name
- description
- article count
- public posts in that category
- topic map from `trackConfigs` where applicable

### R4 Archive Page

Archive must group public posts by year and month.

Each row should show:

- date
- title
- category
- tags
- reading time
- update date if different from publish date

The archive should be optimized for scanning, not card browsing.

### R5 Article Discovery Modules

Article detail should add:

- tag links
- category link
- previous and next public posts by published date
- related posts from same tags and same category
- "continue in this track" link to `/algorithms` or `/applications`

Related posts should not be random. Ranking order:

1. shared tag count
2. same category
3. recent published date

### R6 Home Page as Research Index

Home page should emphasize:

- author identity
- current research focus
- two durable tracks
- latest public articles
- compact search
- real archive/tag/category entry points

Remove or reduce generic product-style stats unless they carry real meaning.

### R7 Mobile Navigation

At `390x844`:

- header must expose a menu or drawer for hidden links
- no horizontal overflow
- tap targets at least 44px tall where practical
- language and login/profile remain reachable

## Execution Capture

Required tests:

- Public search excludes draft/admin/hidden posts.
- Search finds posts by title, content, category, and tag.
- Tag page returns only posts with that tag.
- Category page returns only posts in that category.
- Archive groups by publish month.
- Related posts ranking is deterministic.
- Mobile nav opens and closes, and links route correctly.

Required browser checks:

- `/`
- `/archive`
- `/tags/harness-engine`
- `/categories/ai-applications`
- `/search?q=agent`
- `/post/agent-harness-engine-evaluating-tool-using-agents`
- mobile `390x844` for home and archive

## Evaluator Protocol

Phase 02 is complete when:

- A reader can find a public article through search, tag, category, archive, and related article paths.
- The home page no longer has a dead Archive nav target.
- Tag chips on public surfaces are clickable.
- The article card no longer depends on hard-coded slug heuristics for topic labels when server data is available.
- Mobile navigation exposes all primary public routes.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.

## Acceptance Criteria

- `/archive`, `/tags/:slug`, `/categories/:slug`, and `/search` render meaningful empty states and populated states.
- Search result counts match server totals.
- Public routes do not leak non-public posts.
- Reader can move from a post to at least two other relevant posts or topic surfaces.
- i18n coverage exists for new route labels and empty states.

## Risks

- Full-content SQL `LIKE` search can become slow. Add indexes and keep pagination mandatory.
- Tags currently lack descriptions. The first version can omit descriptions but should not invent content.
- `/about` and `/projects` can become generic if rushed. Keep them concise and author-specific.
