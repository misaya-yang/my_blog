# WebDeb Product Upgrade PRD Harness Continuity Ledger

**Created:** 2026-06-16

**Harness Folder:** `docs/webdeb_product_upgrade_2026_06_16`

---

## Purpose

This file preserves cross-phase continuity for long-running agents. Treat it as the bridge between product intent, code facts, execution evidence, and the next agent's starting point.

## Phase Continuity Chain

| Phase | Feature | Depends On | Unlocks | Handoff Boundary | Required Writeback |
| --- | --- | --- | --- | --- | --- |
| WPU-00 | WPU-F001 | none | WPU-01 | baseline report plus source facts | source-packet and continuity-ledger code facts |
| WPU-01 | WPU-F002 | WPU-00 | WPU-02 | UI screenshots, visual decisions, reader IA contract | source-packet visual/code summary and next Agent surface assumptions |
| WPU-02 | WPU-F003 | WPU-01 | WPU-03 | Agent trust, source-card, reasoning, answer-mode contract | source-packet Agent API/UI summary and privacy decisions |
| WPU-03 | WPU-F004 | WPU-02 | WPU-04 | owner backlog, feedback, radar, and writing workflow contract | source-packet owner-workflow summary and data/privacy boundaries |
| WPU-04 | WPU-F005 | WPU-03 | WPU-05 | content atlas, seed/fallback, search, SEO, freshness contract | source-packet content/discovery/release assumptions |
| WPU-05 | WPU-F006 | WPU-04 | none | release evidence packet | final source-packet status and residual risks |

## Interface Boundary Ledger

| Boundary | Current Fact | Source | Last Verified | Owner Phase |
| --- | --- | --- | --- | --- |
| App routes | Public and owner routes are mounted in `client/src/App.tsx`; global Blog Agent is mounted after Router. | `client/src/App.tsx` | 2026-06-16 | WPU-00 |
| Public visual system | Dark-only research notebook with cobalt/sky accent; `visual-refresh.css` is large and currently has user changes. | `client/src/styles/visual-refresh.css` | 2026-06-16 | WPU-01 |
| Home IA | Home uses intro rail, search, an explicit `StartHerePath`, latest note, and two track panels. New readers can choose newest note, applications path, or algorithms path from the first screen. | `client/src/pages/Home.tsx`, `client/src/i18n/home.ts`, `client/src/styles/visual-refresh.css`, WPU-01 screenshots | 2026-06-16 | WPU-01 |
| Article IA | Article page keeps title/meta/tags primary, shows a compact reading guide with series position and article companion entry, and keeps mobile TOC/entry aids visible through final CSS override. | `client/src/pages/PostDetail.tsx`, `client/src/styles/visual-refresh.css`, WPU-01 screenshots | 2026-06-16 | WPU-01 |
| Public Agent UI | Blog Agent supports route scope, streaming, history, quota, private text context, source cards, cancel, mobile sheet, and inferred `answerMode` request metadata. Public message state no longer carries `reasoningMarkdown`. | `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/components/agent/streamClient.ts`, `client/src/components/agent/messageState.ts`, WPU-02 report | 2026-06-16 | WPU-02 |
| Agent trust boundary | Public stream/history/UI no longer emits, persists, restores, or renders raw model reasoning. Hidden/draft prompts are bounded to public-source insufficiency/refusal copy, and source cards remain public-article only. | `server/ai/types.ts`, `server/ai/harness.ts`, `client/src/components/agent/sourceCards.test.ts`, WPU-02 screenshots | 2026-06-16 | WPU-02 |
| Writing workbench | Editor supports Markdown, preview, snippets, versions, publish, series and track metadata. New drafts can be seeded from `/write?idea=...&source=...` backlog links. Publish stale warnings remain visible as warning toasts. | `client/src/pages/Editor.tsx`, WPU-03 report | 2026-06-16 | WPU-03 |
| Owner signal backlog | `/manage` combines feedback, search misses, and Agent radar ideas into an owner-only writing backlog. Feedback status is database-backed; Agent idea status remains a documented localStorage gap. | `client/src/pages/Manage.tsx`, `server/engagement.router.ts`, WPU-03 tests | 2026-06-16 | WPU-03 |
| Owner AgentOps | ManageAgent has index, debug, evals, traces, question radar, and idea extraction; idea status is currently localStorage. | `client/src/pages/ManageAgent.tsx` | 2026-06-16 | WPU-03 |
| Owner privacy boundary | Feedback/search-miss backlog evidence redacts email/IP-like contact data. Admin-only content radar is enforced through `blogAdminProcedure`; Agent admin methods call `assertAdminContext`. | `server/searchMisses.ts`, `server/engagement.router.ts`, `server/ai/harness.ts`, WPU-03 tests | 2026-06-16 | WPU-03 |
| Content source | `seed-blog.mjs` uses `contentSeriesCatalog` for primary series metadata; `server/publicSeedPosts.ts` now derives fallback primary series metadata from the same catalog. | `seed-blog.mjs`, `server/publicSeedPosts.ts`, `shared/content-series.ts`, WPU-04 tests | 2026-06-16 | WPU-04 |
| Discovery/search | Public discovery filters public content before alias/token-aware matching. Search misses remain in-memory but are redacted before owner backlog display. | `server/discovery.ts`, `server/searchMisses.ts`, WPU-04 tests | 2026-06-16 | WPU-04 |
| SEO/feed routes | Dynamic robots, sitemap, and RSS routes are registered server-side. RSS now includes `lastBuildDate` and per-item `atom:updated`; sitemap/RSS exclude hidden drafts in tests and route checks. | `server/seo.ts`, `server/seo.test.ts`, WPU-04 browser evidence | 2026-06-16 | WPU-04 |
| Release gate | `content:publish` exists, but release evidence must force route/feed/Agent/UI checks and mark skipped checks as blocked or waived. | `package.json`, `docs/product_optimization/reports/po-08-publish-freshness-latest.json` | 2026-06-16 | WPU-05 |
| Release readiness | WPU-05 local gates pass: typecheck, tests, content audit, content publish, build, baseline quick, UI audit, browser route checks, Agent smoke, hidden-content refusal. Deployment was approved in the 2026-06-17 review turn. | WPU-05 report, `wpu-05-*` evidence files | 2026-06-17 | WPU-05 |

## Code Summary Writeback Rules

- After inspecting code, summarize discovered files, services, routes, schemas, tests, runtime commands, and interface decisions back into `source-packet.md`.
- Record cross-phase interface decisions here before handoff, especially API contracts, state shape, route assumptions, visual tokens, eval criteria, privacy boundaries, and rollback boundaries.
- If a phase changes a boundary another phase depends on, update that dependent phase's report handoff and the relevant oracle item notes.
- If a second agent cannot identify the next concrete action from this file, `progress-log.md`, and `agent-handoff.md`, stop and write a blocker instead of guessing.

## Current Continuity Status

- WPU-00 status: passing.
- WPU-01 status: passing.
- WPU-02 status: passing.
- WPU-03 status: passing.
- WPU-04 status: passing.
- WPU-05 status: passing.
- Active phase: complete.
- Active feature-oracle item: complete.
- Current decision: release has passed local review gates and deployment is approved.
- Next action: commit, push, deploy, and verify production routes.
