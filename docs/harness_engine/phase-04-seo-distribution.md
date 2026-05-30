# Phase 04 - SEO Distribution Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use current official documentation for any library added for head management or feed generation.

**Goal:** Make the blog understandable and shareable to search engines, social platforms, feed readers, and humans saving links.

**Architecture:** Add site configuration, route-aware metadata, canonical URLs, Open Graph/Twitter fields, JSON-LD, robots, sitemap, and RSS/Atom without yet requiring a full framework migration.

**Tech Stack:** Vite React SPA, Express/tRPC API, XML generation, JSON-LD, route-aware head management.

---

## Task Spec

The current site has one static `<title>` and description in `client/index.html`. This phase creates the distribution layer expected from a personal technical blog:

- unique metadata per public route
- article share previews
- search engine directives
- machine-readable sitemap
- feed reader support
- structured data

## Problem Boundary

In scope:

- Site-level config for domain, author, default metadata, social links.
- Dynamic metadata for public client routes.
- Server endpoints or generated files for `robots.txt`, `sitemap.xml`, `rss.xml`.
- JSON-LD for home and article pages.
- Favicon and web manifest basics.
- Share image strategy.

Out of scope:

- SSR or pre-rendering content into HTML. That belongs to Phase 05.
- Newsletter subscription backend. That belongs to Phase 06.
- Full image generation pipeline for OG images unless a simple static/default approach is chosen.

## Context Policy

Before editing, inspect:

- `client/index.html`
- `client/src/App.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/i18n/home.ts`
- `client/src/i18n/post.ts`
- `server/app.ts`
- `server/routers.ts`
- `server/db.ts`
- `api/index.ts`
- `vercel.json`
- `seed-blog.mjs`
- `drizzle/schema.ts`

Confirm the production domain before finalizing canonical URLs. If no production domain is configured, use a required environment variable such as `SITE_URL` and fail clearly in production if missing.

## Product Requirements

### R1 Site Configuration

Create a single source of truth for:

- site name
- default title template
- default description
- canonical base URL
- author name
- author email
- Scholar URL
- language alternates
- default OG image
- feed title and description

This configuration should be usable by both client and server code without duplicating strings.

### R2 Route Metadata

Each public route should set:

- title
- description
- canonical URL
- Open Graph title
- Open Graph description
- Open Graph type
- Open Graph URL
- Open Graph image
- Twitter card fields
- language

Article metadata should use:

- post title
- excerpt
- published date
- updated date
- category
- tags
- author
- cover or default OG image

### R3 Structured Data

Home page JSON-LD:

- `WebSite`
- `Person`
- optional `Blog`

Article page JSON-LD:

- `BlogPosting`
- headline
- description
- author
- datePublished
- dateModified
- keywords
- canonical URL
- image if present

### R4 Robots and Sitemap

`/robots.txt` must return:

- allow public routes
- disallow owner routes such as `/write` and `/manage`
- sitemap URL

`/sitemap.xml` must include:

- home
- algorithms
- applications
- archive
- about
- projects
- public tag/category pages if Phase 02 exists
- public article pages

Hidden/admin/draft posts must not be included.

### R5 RSS or Atom Feed

`/rss.xml` must include recent public posts with:

- title
- link
- GUID
- published date
- updated date
- excerpt
- category
- tags
- author

Feed content can use excerpts first. Full content may be added later after sanitization.

### R6 Share Preview Strategy

Minimum:

- one high-quality static default OG image in `client/public`
- article-specific `coverImage` used when present and valid

Preferred:

- generated OG image endpoint or build-time asset for article title + author

Do not block the phase on generated OG images if static default preview is production-ready.

## Execution Capture

Required tests:

- `robots.txt` returns 200 and includes sitemap.
- `sitemap.xml` returns valid XML and excludes draft/admin/hidden posts.
- `rss.xml` returns valid XML and excludes draft/admin/hidden posts.
- Article page metadata uses the loaded post.
- Unknown post does not emit article JSON-LD.

Required manual/browser checks:

- Inspect document head on `/`, `/algorithms`, `/applications`, `/archive`, and one article.
- Validate one article JSON-LD with a structured data parser or snapshot test.
- Open generated `rss.xml` in browser and verify readable XML.

## Evaluator Protocol

Phase 04 is complete when:

- Every public route has unique metadata.
- `/robots.txt`, `/sitemap.xml`, and `/rss.xml` return 200.
- Public feeds and sitemap exclude non-public content.
- Article pages include `BlogPosting` JSON-LD.
- Share preview tags are present and use valid absolute URLs.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.

## Acceptance Criteria

- Static title `AI Tech Blog` is no longer the only title for every route.
- Canonical URLs are absolute and environment-driven.
- Robots disallows owner-only routes.
- RSS link is discoverable from HTML head.
- Sitemap updates when public posts change.

## Risks

- Client-side metadata helps social sharing after hydration but does not fully solve crawler first HTML. Phase 05 must address renderability.
- Incorrect canonical domain can harm SEO. Require explicit production configuration.
- Raw Markdown content in feeds can produce invalid XML. Escape or sanitize all feed fields.
