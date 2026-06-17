# WebDeb Product Upgrade PRD Harness

**Date:** 2026-06-16

**Owner:** Misaya Yang / WebDeb

**Purpose:** Convert the current Product Design audit into bounded, evidence-driven implementation phases for WebDeb UI, Agent, writing, content, and release quality upgrades.

---

## Harness Intent

WebDeb should move from "a polished AI technical blog" toward "a personal AI systems research product": a reader can choose a first path, read dense articles with a calm cockpit, ask a public-source-bounded companion, and the author can turn reader questions into safer publishing and writing operations.

This harness is for coding agents. It is not a presentation PRD. Each phase names read paths, edit paths, risk gates, browser checks, validation commands, evidence outputs, and dependency unlock rules.

## Coding Agent Loading Protocol

When assigned a phase goal:

1. Open this `README.md`.
2. Open `phase-manifest.md`.
3. Open `loop-contract.json`, `loop-state.json`, `feature-oracle.json`, `progress-log.md`, `agent-handoff.md`, `continuity-ledger.md`, and `next-window-prompt.md`.
4. Locate the target phase:

```bash
rg -n "PHASE_ID: <ID>|GOAL_PROMPT|VALIDATION_COMMANDS|ACCEPTANCE_GATES" docs/webdeb_product_upgrade_2026_06_16
```

5. Open only the target phase file and files listed in that phase's `PRIMARY_CONTEXT`.
6. Create a plan before editing.
7. Treat `LIKELY_EDIT_PATHS` as the intended write boundary.
8. Run the phase validation, browser/runtime checks, regression scope, compliance gates, rollback notes, evidence output, and acceptance gates before claiming completion.
9. Summarize inspected code facts and interface decisions back into `source-packet.md` and `continuity-ledger.md`.
10. Update `progress-log.md`, `agent-handoff.md`, the phase report, and only the relevant feature `status`/`evidence`/`notes` fields in `feature-oracle.json`.
11. Move to the next phase only after dependency gates are met or explicitly waived in a report.

## Long-Running Runtime Protocol

Each fresh session starts from durable files instead of hidden chat context:

- Follow `loop-contract.json`: observe, select, execute, verify, record, decide.
- Work on one phase and one feature-oracle item at a time.
- Run the baseline or smoke check named by the target phase before adding new changes.
- Mark oracle items `passing` only when evidence points to a command, report, screenshot, trace, or log.
- Leave the repo in a clean, restartable state or document the blocker in the phase report.

## Source Packet

The source packet is `source-packet.md`. It records current code facts, visual evidence, test evidence, existing roadmap context, Product Design decisions, risk tags, and open assumptions.

Primary evidence collected during harness creation:

- `pnpm check` passed on 2026-06-16.
- `pnpm test` passed on 2026-06-16: 31 files, 194 tests. Existing `OAUTH_SERVER_URL` warning appeared in `server/seo.test.ts`.
- `pnpm content:audit` passed on 2026-06-16: 13 markdown files, 8 seed posts, 0 warnings, 0 failures.
- Local visual inspection used `http://localhost:3000/` with screenshots `webdeb-home-desktop.png`, `webdeb-home-mobile.png`, and `webdeb-post-desktop.png` in the repo root.
- Existing product optimization roadmap PO-00 through PO-08 is complete and remains historical source context, not the active phase chain.

## Runtime Artifacts

| Artifact | Purpose |
| --- | --- |
| `loop-contract.json` | The control loop: observe, select, execute, verify, record, decide. |
| `loop-state.json` | Current phase, feature, iteration, status, last decision, and next action. |
| `feature-oracle.json` | End-to-end feature/test oracle. Agents may update status and evidence, not delete cases. |
| `progress-log.md` | Chronological progress, current blocker, and clean-state notes for the next session. |
| `agent-handoff.md` | File-based planner/generator/evaluator handoff packet. |
| `continuity-ledger.md` | Cross-phase continuity, code summary writeback, and interface boundary ledger. |
| `next-window-prompt.md` | Copy-ready prompt for starting the next agent window. |

## Current System Shape

WebDeb is a Vite React app with Express, tRPC, Drizzle, seeded Markdown content, public discovery routes, an owner writing/manage surface, and a public Blog Agent.

Public surfaces:

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

Core implementation anchors:

- App routing and global Agent mount: `client/src/App.tsx`.
- Public reader shell and shared visual primitives: `client/src/components/ResearchShell.tsx`, `client/src/styles/visual-refresh.css`, `client/src/index.css`.
- Home and track discovery: `client/src/pages/Home.tsx`, `client/src/pages/Track.tsx`, `client/src/lib/tracks.ts`.
- Article cockpit: `client/src/pages/PostDetail.tsx`, `client/src/components/MarkdownRenderer.tsx`, `client/src/components/SeriesProgress.tsx`.
- Agent UI and stream client: `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/components/agent/streamClient.ts`, `client/src/components/agent/routeContext.ts`.
- Agent backend: `server/ai/router.ts`, `server/ai/harness.ts`, `server/ai/model.ts`, `server/ai/knowledge.ts`, `server/ai/knowledgeDb.ts`, `server/ai/contextSources.ts`, `server/ai/streamRoute.ts`.
- Writing and owner ops: `client/src/pages/Editor.tsx`, `client/src/pages/Manage.tsx`, `client/src/pages/ManageAgent.tsx`, `server/routers.ts`, `server/blogAdminProcedure.ts`.
- Content and release checks: `seed-blog.mjs`, `shared/content-ops.ts`, `shared/content-series.ts`, `scripts/audit`, `scripts/ai/reindex-knowledge.ts`.

## Assumptions and Decisions

- Design mode is **Redesign - Preserve**. Keep the dark research identity, route slugs, public content boundaries, bilingual capability, and existing Radix/shadcn/lucide stack.
- Design dials: `DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 5`.
- The active product gap is not basic blog functionality. It is reader task clarity, article IA, public-source-bounded Agent trust, writing-to-backlog workflow, content atlas quality, and release evidence.
- The current dirty user change in `client/src/styles/visual-refresh.css` is treated as user work. Agents must read and preserve it unless assigned a CSS phase that explicitly edits that file.
- Do not add pgvector, PDF ingestion, public `/agent` workspace, autonomous browsing, or author impersonation in this harness.

## Phase Order

| Phase | Name | Core Outcome | Report |
| --- | --- | --- | --- |
| WPU-00 | Baseline Product Audit | Current system facts, screenshots, gates, and risk inventory are recorded. | `reports/wpu-00-baseline-product-audit-report.md` |
| WPU-01 | Reader IA And Visual System | Home, article, mobile reader, and visual token debt are turned into a clear reader task surface. | `reports/wpu-01-reader-ia-and-visual-system-report.md` |
| WPU-02 | Article Companion And Agent UX | Public Agent no longer leaks raw reasoning, exposes useful answer modes, and feels like an article companion. | `reports/wpu-02-article-companion-and-agent-ux-report.md` |
| WPU-03 | Writing Workbench And Content Backlog | Editor, Manage, AgentOps radar, search misses, and feedback become a practical author writing loop. | `reports/wpu-03-writing-workbench-and-content-backlog-report.md` |
| WPU-04 | Content Atlas And Article Quality | Tracks, series, metadata, taxonomy changes, thumbnails, and article quality become coherent and fresh. | `reports/wpu-04-content-atlas-and-article-quality-report.md` |
| WPU-05 | Release And Evaluation Gates | UI, Agent, content freshness, privacy, and build gates become a single release evidence packet. | `reports/wpu-05-release-and-evaluation-gates-report.md` |

## Roadmap Cohesion

```text
WPU-00 Baseline
  -> WPU-01 Reader IA and Visual System
      -> WPU-02 Article Companion and Agent UX
          -> WPU-03 Writing Workbench and Content Backlog
              -> WPU-04 Content Atlas and Article Quality
                  -> WPU-05 Release and Evaluation Gates
```

WPU-01 makes the public reader surface understandable. WPU-02 makes the Agent trustworthy on that surface. WPU-03 turns reader and Agent signals into author work. WPU-04 makes the content graph and taxonomy reliable enough for readers and Agent retrieval. WPU-05 closes the release loop.

## Shared Harness Rules

- Do not expose hidden, admin-only, draft, private, or unpublished content in public UI, RSS, sitemap, search, or Agent source cards.
- Do not show raw model reasoning to public readers.
- Preserve route slugs and public URLs unless the user explicitly approves an SEO migration.
- Keep UI edits aligned with the existing dark research identity and single cobalt accent.
- Prefer existing routes, schemas, and tests before adding new infrastructure.
- Every phase must update `source-packet.md`, `continuity-ledger.md`, `progress-log.md`, `agent-handoff.md`, `feature-oracle.json`, and its phase report before exit.

## Global Non-Goals

- No deployment unless the user explicitly asks.
- No production data mutation.
- No destructive git commands.
- No PDF ingestion, public standalone Agent workspace, autonomous browsing, or live author handoff.
- No full visual reset detached from the current identity.
- No external dashboard or provider changes without documented approval.

## Global Compliance Gates

- Privacy: private uploaded context stays conversation-local and must have deletion or expiry evidence before any expansion.
- Security: no secret values in docs, logs, reports, or source cards.
- Content boundary: hidden/draft/admin posts are excluded from public discovery and Agent knowledge.
- Accessibility: UI phases require keyboard, focus, reduced-motion, mobile, and copy contrast checks.
- Copyright/licensing: generated or sourced visual assets must be documented before release.
- Release: build, tests, content freshness, browser checks, and Agent eval evidence must be captured before release claims.

## Standard Verification Commands

Baseline and release:

```bash
pnpm check
pnpm test
pnpm build
pnpm content:audit
```

Agent-focused phases:

```bash
pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts
```

Content freshness phases:

```bash
pnpm ai:reindex
pnpm content:verify
pnpm content:publish
```

Browser checks should run against a live local server:

```bash
pnpm dev
AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
```

## Required Browser or Runtime Checks

Required public viewports for UI phases:

- desktop `1440x900`
- desktop `1280x800`
- tablet `768x1024`
- mobile `390x844`

Required routes by default:

- `/`
- `/algorithms`
- `/applications`
- `/search?q=zzzz-no-hit-ui-audit`
- `/post/goal-harness-agent-phase-protocol`
- `/manage/agent` as authenticated state if available, otherwise unauthenticated fallback plus code-level owner checks

## External Inputs and Approvals

- No external Figma, dashboard, credential, production database, or deployment target is required for WPU-00 through WPU-04.
- WPU-05 may run release gates locally. Deployment requires explicit user approval.
- Any migration or persistent data change requires a dry-run plan and rollback notes before execution.

## New Window Prompt

Use `next-window-prompt.md` when starting a new Codex, Claude Code, or compatible agent window. Prefer the exact target phase `GOAL_PROMPT` from the phase file when assigning implementation work.
