# Misaya Notes Sitewide Liquid Glass Frontend Optimization Harness

**Date:** 2026-06-21

**Owner:** Product/engineering

**Purpose:** Turn the Apple-inspired Liquid Glass redesign into a full-site, evidence-driven execution plan for every public, reader, agent, owner, and editor page.

---

## Harness Intent

This harness prevents the redesign from becoming one large stylesheet patch. It decomposes the work into page groups, shared material foundations, interaction effects, accessibility gates, and screenshot evidence. The target visual direction is an Apple-informed web approximation of Liquid Glass layered over the current dark research notebook identity.

## Coding Agent Loading Protocol

When assigned a phase goal:

1. Open this `README.md`.
2. Open `phase-manifest.md`.
3. Open `loop-contract.json`, `loop-state.json`, `feature-oracle.json`, `progress-log.md`, `agent-handoff.md`, `continuity-ledger.md`, and `next-window-prompt.md`.
4. Locate the target with:

```bash
rg -n "PHASE_ID: <ID>|GOAL_PROMPT|VALIDATION_COMMANDS|ACCEPTANCE_GATES" docs/frontend_liquid_glass_optimization_2026_06_21
```

5. Open only the target phase file and the files named in that phase's `PRIMARY_CONTEXT`.
6. Create a short implementation plan before editing.
7. Treat `LIKELY_EDIT_PATHS` as the write boundary.
8. Complete validation, browser/runtime checks, regression scope, compliance gates, rollback notes, evidence output, and acceptance gates before claiming completion.
9. Summarize code facts and boundary decisions back into `source-packet.md` and `continuity-ledger.md`.
10. Update `progress-log.md`, `agent-handoff.md`, the phase report, and the active feature item in `feature-oracle.json`.
11. Move to the next phase only after the dependency gates pass or a waiver is documented in the previous phase report.

## Long-Running Runtime Protocol

Each fresh session starts from durable files instead of hidden chat context:

- Read `progress-log.md` and recent `git status --short` output before choosing work.
- Follow `loop-contract.json`: observe, select, execute, verify, record, decide.
- Update `loop-state.json` when the active phase, feature, iteration, decision, or blocker changes.
- Update `continuity-ledger.md` when code facts, interfaces, contracts, or handoff boundaries change.
- Run the validation command group named by the target phase before marking the phase complete.
- Work on one phase and one feature-oracle item at a time.
- Mark oracle items `passing` only when evidence points to a command, report, screenshot, trace, or log.
- Leave the repo restartable or document the blocker in the phase report.

## Source Packet

`source-packet.md` contains the current route map, stack facts, style entrypoints, source-backed Liquid Glass interpretation, and protected dirty-tree notes.

## Runtime Artifacts

| Artifact | Purpose |
| --- | --- |
| `loop-contract.json` | The control loop: observe, select, execute, verify, record, decide. |
| `loop-state.json` | Current phase, feature, iteration, status, last decision, and next action. |
| `feature-oracle.json` | End-to-end feature and evidence oracle. |
| `progress-log.md` | Chronological progress, validation, blocker, and restart notes. |
| `agent-handoff.md` | File-based planner, generator, and evaluator handoff packet. |
| `continuity-ledger.md` | Cross-phase code facts, interface boundaries, and design decisions. |
| `next-window-prompt.md` | Copy-ready prompt for a fresh agent window. |

## Current System Shape

- Frontend: Vite, React 19, Wouter, Tailwind v4 CSS import flow, Radix/shadcn components, lucide-react icons, framer-motion already available.
- Backend contract: Express, tRPC, Drizzle/Postgres. This redesign does not alter API, auth, schema, analytics, or content contracts.
- Route matrix: `/`, `/algorithms`, `/applications`, `/archive`, `/search`, `/tags/:slug`, `/categories/:slug`, `/about`, `/post/:slug`, `/write`, `/write/:slug`, `/manage`, `/manage/agent`, `/login`, `/404`, fallback NotFound.
- Style entrypoints: `client/src/index.css`, `public-components.css`, `visual-refresh.css`, `agent-surfaces.css`, `owner-tools.css`, and the currently overgrown `liquid-materials.css` imported last from `client/src/main.tsx`.
- Key risk: the existing `liquid-materials.css` is 973 lines and acts like a broad override layer. FLG-01 must replace that approach with a smaller foundation and component-scoped adoption path.

## Assumptions and Decisions

- Preserve the dark research notebook/cockpit identity.
- Treat Liquid Glass as selective material for navigation, controls, overlays, rails, agent shell, and bento surfaces.
- Keep prose, code, tables, formulas, source cards, and editor canvases readable with opaque or near-opaque surfaces.
- Add no dependency during the foundation phase.
- Use official and primary documentation for browser capability choices.
- Do not deploy during this harness unless a later user message explicitly requests deployment.

## Phase Order

| Phase | Name | Core Outcome | Report |
| --- | --- | --- | --- |
| Phase 00 | Baseline All-Page Audit | Full route, style, command, and risk inventory is recorded. | `reports/flg-00-baseline-all-page-audit-report.md` |
| Phase 01 | Design System Foundation | Shared material tokens and utilities replace broad palette overrides. | `reports/flg-01-design-system-foundation-report.md` |
| Phase 02 | Public Navigation And Home | Header, home, track, search, archive, taxonomy, about, login, and NotFound share the material system. | `reports/flg-02-public-navigation-and-home-report.md` |
| Phase 03 | Reader Discovery And Agent | Article reader, discovery cards, TOC/actions, and agent companion become layered and readable. | `reports/flg-03-reader-discovery-and-agent-report.md` |
| Phase 04 | Owner Tools And Editor | Manage, ManageAgent, and Editor receive dense owner-grade material surfaces without public-page bleed. | `reports/flg-04-owner-tools-and-editor-report.md` |
| Phase 05 | Motion Performance Accessibility | View transitions, scroll effects, container behavior, transparency reduction, motion reduction, and rendering performance are verified. | `reports/flg-05-motion-performance-accessibility-report.md` |
| Phase 06 | Final QA And Handoff | Full-site screenshots, commands, audits, and handoff evidence close the harness. | `reports/flg-06-final-qa-and-handoff-report.md` |

## Roadmap Cohesion

The chain is `FLG-00 -> FLG-01 -> FLG-02 -> FLG-03 -> FLG-04 -> FLG-05 -> FLG-06`. Each phase inherits the prior report, preserves public contracts, records code-summary writeback, and updates the next handoff.

## New Window Prompt

Use `next-window-prompt.md` when starting a new Codex, Claude Code, or compatible agent window. Prefer the target phase `GOAL_PROMPT` from the phase file.

## Shared Harness Rules

- Stay inside phase boundaries.
- Plan before editing.
- Prefer component-scoped classes and existing components over global cascade expansion.
- Do not claim completion without durable evidence.
- Document blockers and waivers explicitly.

## Global Non-Goals

- No deployment.
- No database migration.
- No auth, analytics, tRPC, or SEO contract changes.
- No new package unless a phase report names the reason and the user approves.
- No unrelated copy rewrite or content markdown rewrite.

## Global Compliance Gates

- Do not expose secrets.
- Do not perform destructive commands.
- Do not mutate production data.
- Document approval before external service, migration, deployment, DNS, or production changes.

## Standard Verification Commands

```bash
git status --short
pnpm check
pnpm test
pnpm build
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick
```

## Required Browser or Runtime Checks

- Desktop and mobile screenshots for `/`, `/algorithms`, `/applications`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/tags/agent-systems`, `/categories/ai-applications`, `/about`, `/post/goal-harness-agent-phase-protocol`, `/login`, `/404`, `/manage`, `/manage/agent`, `/write`.
- Viewports: `390x844`, `768x1024`, `1440x1000`, `1728x1117`.
- Agent launcher closed and open states.
- Light mode, dark mode, reduced motion, reduced transparency, keyboard focus, no horizontal overflow, header height at or below 72px, readable contrast without blur.

## External Inputs and Approvals

- Web sources used for design and browser behavior are listed in `source-packet.md`.
- No credentials, dashboards, deployments, migrations, DNS changes, or production data access are approved for this harness.
