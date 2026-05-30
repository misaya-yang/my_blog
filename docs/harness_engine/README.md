# AI Tech Blog Harness Engine PRD Roadmap

**Date:** 2026-05-30

**Owner:** Misaya Yang personal AI research blog

**Purpose:** Convert the current product, code, UI, SEO, and operations audit into executable Harness Engine Phase modules for future Codex development.

---

## Harness Engine Contract

Each Phase in this directory is written as a small harness module rather than a loose recommendation list.

Every module defines:

- **Task Spec:** the product or engineering behavior to build.
- **Problem Boundary:** what is in scope, out of scope, and why the phase exists.
- **Context Policy:** the files, routes, data, and prior decisions an implementing agent must inspect before editing.
- **Execution Capture:** the observable traces the phase must produce, such as tests, browser checks, bundle reports, route inventories, or screenshots.
- **Evaluator Protocol:** deterministic checks and acceptance criteria used to decide whether the phase is complete.

This mirrors the harness idea in `agent_harness_engine_blog.md`: make work observable, repeatable, and debuggable from evidence rather than from a good-looking transcript.

## Audit Inputs

Skills and plugins used:

- Superpowers: skill loading, parallel agent delegation, plan/PRD discipline.
- Build Web Apps: frontend inspection and rendered UI validation.
- Browser: local `http://localhost:3000/` desktop and mobile viewport inspection.
- Four parallel explorer agents: architecture/code, UI/visual design, product/blog capability, SEO/performance/release.

Local verification run:

- `pnpm check`: passed.
- `pnpm test`: passed, 2 test files and 16 tests.
- `pnpm build`: passed; warning that main JS chunk is about `1,270.45 kB` raw and `375.45 kB` gzip.
- `pnpm dev`: served at `http://localhost:3000/`.
- Browser desktop check: home page rendered, no relevant console errors.
- Browser mobile check at `390x844`: no horizontal overflow observed, but header hides primary navigation without a replacement menu.

Important local caveat:

- The local dev server had no database content loaded, so the rendered home showed zero posts. The PRD still uses seed files and database-backed routes as the source of product truth.

## Current Product Shape

The project is a Vite + React SPA with Express/tRPC, Drizzle/Postgres, Wouter routing, Tailwind v4, shadcn/Radix primitives, Markdown, KaTeX, and code highlighting.

Public routes:

- `/`
- `/algorithms`
- `/applications`
- `/post/:slug`
- `/login`
- `/404` plus client fallback

Owner routes:

- `/write`
- `/write/:slug`
- `/manage`

The intended product is a personal AI research blog, not a generic AI news site. The content axis is strong: AI algorithms and AI application engineering. The implementation already has posts, categories, tags, draft/published state, visibility state, visitor/admin sessions, a Markdown research editor, and seed content.

The missing layer is the reader and distribution system: true content discovery, public archive routes, SEO, RSS, author brand, feedback, related posts, and operational confidence.

## Highest-Impact Findings

### P0 Reliability Bugs

- Editing an existing article can clear its tags because `posts.getBySlug` returns only the post row while `Editor.tsx` expects `existingPost.tags`; saving then submits an empty `tagIds` array.
- Publishing from `Manage.tsx` updates `status` only. A post can become `published` but remain `admin` or `hidden`, so it still does not appear publicly.
- Post/category/tag/version relations lack database foreign keys and cascade behavior, making orphan rows likely over time.
- Multi-step writes are not transactional. Post create/update plus tag writes can leave partial state.

### P1 Reader Product Gaps

- Search only filters the 20 loaded posts on the client.
- Tags and categories exist in data but are not public navigation surfaces.
- Archive is a hash link to the home research index, not a real archive route.
- Article pages lack related posts, previous/next navigation, series navigation, and tag/category links.
- About, Projects/Works, newsletter/RSS entry points, and feedback loops are missing.

### P1 Visual and UX Gaps

- The current design is recognizable but overuses deep-space, glass, blue-purple glow, stars, grids, and abstract wave SVGs. Repetition makes it feel closer to an AI SaaS template than a personal research notebook.
- Copy such as `Explore Frontiers / Understand Intelligence / Drive Innovation` is generic.
- The mobile header hides primary navigation without a hamburger or drawer.
- The 404 page is visually disconnected from the rest of the site.
- Font tokens and loaded fonts are inconsistent: CSS references `Noto Sans SC` in prose, but the HTML loads `Noto Serif SC`.

### P1 SEO, Performance, and Release Gaps

- Public content is client-rendered via tRPC. Search crawlers receive a mostly empty app shell.
- `client/index.html` has only static title and description. There is no canonical, article-level metadata, Open Graph, Twitter Card, JSON-LD, sitemap, robots, or RSS.
- Vercel rewrites all non-API paths to `index.html`; unknown routes likely return HTTP 200 and then show client-side 404.
- `App.tsx` eagerly imports public pages, editor, manager, login, Markdown, KaTeX, and highlighting dependencies into the main bundle path.
- `vitePluginManusRuntime()` appears in the production plugin list, and `dist/public/index.html` is about `367.76 kB` raw.
- Image rendering uses raw `<img>` and Markdown default image rendering, with no sizing, lazy loading, or responsive formats.
- ErrorBoundary exposes stack traces to users.
- There is no CI workflow gating `check`, `test`, `build`, Lighthouse, or accessibility smoke tests.

## Phase Order

| Phase | Status | Result |
| --- | --- | --- |
| Phase 00 - Baseline Audit Harness | Complete | Repeatable audit command and baseline reports. |
| Phase 01 - Content Integrity Harness | Complete | Transactional post/tag writes, visibility safety, FK migration. |
| Phase 02 - Reader Discovery Harness | Complete | Archive, search, tag/category pages, related context. |
| Phase 03 - Visual Identity Harness | Complete | Personal research UI, navigation, responsive shell. |
| Phase 04 - SEO Distribution Harness | Complete | Metadata, JSON-LD, sitemap, robots, RSS, social assets. |
| Phase 05 - Renderability and Performance Harness | Complete | Server fallback snapshots, 404/noindex, lazy public bundles. |
| Phase 06 - Engagement Harness | Complete | Subscriptions, article feedback, owner review/export. |
| Phase 07 - Content Ops and Release Harness | Complete | Taxonomy ops, version restore, curation metadata, content health, CI gates, docs. |

## Files

- `phase-00-baseline-audit.md`
- `phase-01-content-integrity.md`
- `phase-02-reader-discovery.md`
- `phase-03-visual-identity-reading.md`
- `phase-04-seo-distribution.md`
- `phase-05-renderability-performance.md`
- `phase-06-engagement-feedback.md`
- `phase-07-content-ops-release.md`

## Audit Commands

Phase 00 adds repo-local audit commands:

```bash
pnpm audit:baseline
```

Runs `pnpm check`, `pnpm test`, `pnpm build`, parses production asset sizes from `dist/public`, checks route status when `AUDIT_BASE_URL` is provided, and writes `docs/harness_engine/reports/latest-baseline.json`.

```bash
pnpm audit:baseline:quick
```

Skips `check/test/build` and records the same route inventory, known gaps, metadata capability, accessibility signals, and bundle sizes if `dist/public` already exists.

For rendered browser checks, use the Codex Browser plugin against the required Phase 00 viewport set:

- desktop default viewport for `/`, `/algorithms`, `/applications`, `/login`, and one public article
- mobile `390x844` for `/` and one public article

When a local server is running, route HTTP status checks can be added to the report:

```bash
AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
```

Latest release checklist:

```bash
pnpm check
pnpm test
pnpm build
pnpm audit:baseline:quick
```

Phase reports:

- `reports/phase-05-renderability-performance.md`
- `reports/phase-06-engagement-feedback.md`
- `reports/phase-07-content-ops-release.md`
