# Product Optimization PRD Roadmap

**Date:** 2026-05-31

**Owner:** Misaya Yang personal AI research blog

**Purpose:** Define the next product stage after the completed Harness Engine and Blog Agent PRDs. This roadmap turns the current blog from a capable technical site into a more memorable AI research product: a content system with series, research maps, calmer reading, article-level AI assistance, and operational quality loops.

---

## Coding Agent Loading Protocol

This directory is designed for coding agents that will not load every markdown file.

When assigned a phase goal:

1. Open this `README.md`.
2. Open `phase-manifest.md`.
3. Locate the target with:

```bash
rg -n "PHASE_ID: PO-05|GOAL_PROMPT|VALIDATION_COMMANDS|ACCEPTANCE_GATES" docs/product_optimization
```

4. Open only the target phase file and the files listed in that phase's `PRIMARY_CONTEXT`.
5. Do not load the whole directory unless blocked.
6. Set the execution goal from the phase's `GOAL_PROMPT`.
7. Treat `LIKELY_EDIT_PATHS` as the intended write boundary.
8. Complete `VALIDATION_COMMANDS`, `BROWSER_CHECKS`, and `ACCEPTANCE_GATES` before claiming completion.

Every phase file begins with a `Coding Agent Contract` block containing stable grep anchors:

- `PHASE_ID`
- `GOAL_TARGET`
- `GOAL_PROMPT`
- `DEPENDS_ON`
- `PRIMARY_CONTEXT`
- `LIKELY_EDIT_PATHS`
- `DO_NOT_EDIT`
- `VALIDATION_COMMANDS`
- `BROWSER_CHECKS`
- `ACCEPTANCE_GATES`

Use these anchors instead of relying on long-form prose.

## Product Thesis

The blog should not compete as a generic AI news site or generic portfolio. Its strongest positioning is:

> A personal AI systems research archive that is also an interactive knowledge product.

The product should help readers understand dense AI technical ideas, follow a curated path through related concepts, and ask a grounded assistant about the author's public writing.

This roadmap assumes the previous foundations already exist:

- Basic publishing, discovery, archive, search, tags, categories, SEO, RSS, feedback, and subscriptions.
- Blog Agent MVP with conversations, source cards, user context attachment, quotas, debug/eval/admin routes.
- Dual tracks: `AI Algorithms` and `AI Applications`.

The next stage should therefore avoid repeating foundation work and instead focus on structure, polish, trust, and knowledge utility.

## Parallel Review Inputs

Three parallel explorer agents reviewed the current product before this roadmap was written:

- **Content and information architecture review:** inspected `seed-blog.mjs`, article markdown, `client/src/lib/tracks.ts`, `client/src/i18n/home.ts`, `docs/harness_engine`, and `docs/agent_prd`.
- **UI and reading experience review:** inspected `Home.tsx`, `Track.tsx`, `PostDetail.tsx`, `ArticleCard.tsx`, `ResearchShell.tsx`, `SubscriptionForm.tsx`, `index.css`, and `phase-03-visual-identity-reading.md`.
- **Functional and engineering feasibility review:** inspected `package.json`, `App.tsx`, `server/routers.ts`, `server/discovery.ts`, `server/ai/*`, `BlogAgentRoot.tsx`, `ManageAgent.tsx`, and `drizzle/schema.ts`.

The reviews agreed on the main direction:

- Do not build more generic blog basics.
- Do not start a large rewrite.
- Do not over-expand the Agent into autonomous browsing, PDF ingestion, public agent workspace, or author impersonation.
- Do improve series structure, research maps, reading quality, article-level AI assistance, Agent quality operations, and content freshness.

See `agent-review-summary.md` for the condensed review notes.

For execution, use `phase-manifest.md` as the compact index.

## Current Product Shape

Public product surfaces:

- `/`
- `/algorithms`
- `/applications`
- `/archive`
- `/search`
- `/tags/:slug`
- `/categories/:slug`
- `/about`
- `/post/:slug`
- global `BlogAgentRoot`

Owner surfaces:

- `/write`
- `/write/:slug`
- `/manage`
- `/manage/agent`

Relevant existing capabilities:

- `posts.seriesSlug`, `seriesTitle`, `seriesOrder`, `featuredRank`, and `pinnedTrack` already exist in the schema.
- Discovery routes already filter public content and support search/tag/category/archive/related context.
- Engagement already stores subscriptions and private article feedback.
- Agent schema already has `ai_knowledge_chunks`, conversations, messages, context sources, usage buckets, and agent run traces.
- `pnpm content:publish` already composes `pnpm db:seed` and `pnpm ai:reindex`.

Important current gaps:

- Track pages are still mostly article lists with static topic copy.
- Articles are not organized into visible series or reading paths.
- UI still overuses deep-space, glass, star/grid, and abstract visual motifs.
- Article reading works but the content is still inside a decorative shell.
- Blog Agent is global and useful, but not yet productized as article/track-specific assistance.
- Agent quality checks exist but need stronger golden sets, source-level citation expectations, and operational surfaces.
- Subscription copy is honest but still says email delivery is not connected; this is a trust gap.
- Repeated seeding can affect published timestamps unless canonical dates are handled carefully.

## Phase Order

| Phase | Name | Core Outcome |
| --- | --- | --- |
| Phase 00 | Product Optimization Baseline | Snapshot current routes, content inventory, Agent status, visual density, and known gaps before changing product surfaces. |
| Phase 01 | Content Source and Series System | Turn scattered markdown/seed content into a coherent series and concept metadata system. |
| Phase 02 | Research Index and Track Maps | Redesign home and track information architecture around research paths, not SaaS-style hero sections. |
| Phase 03 | Visual Shell and Reading Calm | Reduce template-like visual noise while preserving the dark technical research identity. |
| Phase 04 | Article Reading and Summary Layer | Make article pages easier to enter, scan, cite, and continue from without reducing depth. |
| Phase 05 | Article Companion Productization | Make the existing Blog Agent feel context-aware and useful on article/track pages. |
| Phase 06 | Agent Quality and Operations | Strengthen retrieval quality, evals, traces, reindex status, and admin operational workflows. |
| Phase 07 | Feedback to Content Backlog | Convert reader feedback, subscriptions, and Agent questions into an actionable writing backlog. |
| Phase 08 | Publish Quality and Knowledge Freshness | Harden publish/reindex/RSS/sitemap/archive/Agent freshness checks into a release gate. |

## Roadmap Cohesion

These phases are ordered as one product loop, not as independent wishlist items:

```text
Baseline
  -> Content Source / Series
  -> Research Index + Article Reading
  -> Article Companion
  -> Agent Quality Operations
  -> Feedback Backlog
  -> Publish Freshness Gate
```

How to read the sequence:

- **PO-00** creates the evidence baseline before changes.
- **PO-01** makes content metadata reliable enough for every later public surface.
- **PO-02** and **PO-04** turn that metadata into reader navigation: research maps, series, summaries, and continuation paths.
- **PO-03** is the visual/readability layer that supports PO-02 and PO-04 without changing product scope.
- **PO-05** productizes the existing Blog Agent around articles and tracks.
- **PO-06** makes Agent behavior measurable and operable.
- **PO-07** converts reader and Agent signals into the author's next writing backlog.
- **PO-08** closes the loop by ensuring published content, public discovery, feeds, and Agent knowledge remain fresh together.

If an implementation agent needs a narrower goal, choose one phase and use its `GOAL_PROMPT`. Do not combine adjacent phases unless the user explicitly asks for a larger goal.

## Shared Harness Contract

Each phase is written as a harness module. Implementation agents should treat each file as a bounded product task.

Each phase defines:

- **Task Spec:** the product behavior to build.
- **Problem Boundary:** in-scope and out-of-scope work.
- **Context Policy:** files/routes/data to inspect before editing.
- **Product Requirements:** concrete requirements.
- **Execution Capture:** traces/screenshots/tests required.
- **Evaluator Protocol:** how to decide completion.
- **Acceptance Criteria:** user-visible and engineering acceptance.
- **Risks:** scope, technical, and product risks.

Each phase also includes a machine-scannable `Coding Agent Contract` at the top. That block is authoritative for agent goal setup, file loading, edit boundaries, validation commands, and acceptance gates.

## Global Non-Goals

Do not include these in this stage:

- Full public social network or comment community.
- Autonomous internet browsing.
- PDF ingestion and full document workspace.
- Public `/agent` workspace separate from the blog surfaces.
- Author impersonation or live author handoff.
- pgvector migration before DB full-text/metadata search and eval baselines are exhausted.
- Full visual redesign detached from the existing product identity.

## Standard Verification Commands

Run the smallest relevant subset for each phase, and the full set before release:

```bash
pnpm check
pnpm test
pnpm build
pnpm audit:baseline:quick
```

Agent-focused phases should also run:

```bash
pnpm exec vitest run server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Discovery/engagement phases should also run:

```bash
pnpm exec vitest run server/discovery.test.ts server/discovery.router.test.ts server/engagement.router.test.ts
```

Content freshness phases should run:

```bash
pnpm content:publish
```

When a local server is running:

```bash
AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
```

## Required Browser Viewports

For product/UI phases, capture at least:

- desktop `1440x900`
- desktop `1280x800`
- tablet-ish `768x1024`
- mobile `390x844`

Required routes depend on phase, but default to:

- `/`
- `/algorithms`
- `/applications`
- one public `/post/:slug`
- `/manage/agent` when authenticated or as unauthenticated fallback
