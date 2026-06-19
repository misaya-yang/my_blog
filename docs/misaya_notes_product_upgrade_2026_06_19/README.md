# Misaya Notes Product Upgrade Harness

**Date:** 2026-06-19

**Owner:** Misaya Yang / Product Engineering

**Purpose:** Turn the current product-improvement objective into bounded phases across UI taste, reader/Agent functionality, article quality, and code simplification.

---

## Harness Intent

Turn the current product-improvement objective into bounded phases across UI taste, reader/Agent functionality, article quality, and code simplification. The harness must preserve phase relatedness, code-summary writeback, and evidence handoff across long-running agent sessions.

## Coding Agent Loading Protocol

When assigned a phase goal:

1. Open this `README.md`.
2. Open `phase-manifest.md`.
3. Open `loop-contract.json`, `loop-state.json`, `feature-oracle.json`, `progress-log.md`, `agent-handoff.md`, `continuity-ledger.md`, and `next-window-prompt.md`.
4. Locate the target with:

```bash
rg -n "PHASE_ID: <ID>|GOAL_PROMPT|VALIDATION_COMMANDS|ACCEPTANCE_GATES" docs/misaya_notes_product_upgrade_2026_06_19
```

5. Open only the target phase file and files listed in that phase's `PRIMARY_CONTEXT`.
6. Create a plan before editing.
7. Treat `LIKELY_EDIT_PATHS` as the intended write boundary.
8. Complete validation, browser/runtime checks, regression scope, compliance gates, rollback notes, evidence output, and acceptance gates before claiming completion.
9. Summarize code facts and boundary decisions back into `source-packet.md` and `continuity-ledger.md`.
10. Update `progress-log.md`, `agent-handoff.md`, the phase report, and only the relevant feature `status`/`evidence` fields in `feature-oracle.json`.
11. Move to the next phase only after dependency gates are met or explicitly waived in a report.

## Long-Running Runtime Protocol

Each fresh session must start from durable files instead of hidden chat context:

- Read `docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md` and recent git history before choosing work.
- Follow `docs/misaya_notes_product_upgrade_2026_06_19/loop-contract.json`: observe, select, execute, verify, record, then decide whether to continue or stop.
- Update `docs/misaya_notes_product_upgrade_2026_06_19/loop-state.json` when the active phase, feature, iteration, decision, or blocker changes.
- Update `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md` when code facts, interfaces, contracts, or handoff boundaries change.
- Run the baseline or smoke check named by the target phase before adding new changes.
- Work on one phase and one feature-oracle item at a time.
- Mark oracle items `passing` only when evidence points to a command, report, screenshot, trace, or log.
- Leave the repo in a clean, restartable state or document the blocker in the phase report.

## Runtime Artifacts

| Artifact | Purpose |
| --- | --- |
| `docs/misaya_notes_product_upgrade_2026_06_19/loop-contract.json` | The control loop: observe, select, execute, verify, record, decide. |
| `docs/misaya_notes_product_upgrade_2026_06_19/loop-state.json` | Current phase, feature, iteration, status, last decision, and next action. |
| `docs/misaya_notes_product_upgrade_2026_06_19/feature-oracle.json` | End-to-end feature/test oracle. Agents may update status and evidence, not delete cases. |
| `docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md` | Chronological progress, current blocker, and clean-state notes for the next session. |
| `docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md` | File-based planner/generator/evaluator handoff packet. |
| `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md` | Cross-phase continuity, code summary writeback, and interface boundary ledger. |
| `docs/misaya_notes_product_upgrade_2026_06_19/next-window-prompt.md` | Copy-ready prompt for starting the next agent window. |

## Source Packet

- Current repository: `/Users/yang/projects/ai-tech-blog`.
- Design system source: `/Users/yang/Downloads/Misaya Notes Design System`.
- Prior harness evidence: `docs/misaya_notes_ui_optimization_2026_06_18`, `docs/webdeb_product_upgrade_2026_06_16`, and `docs/product_optimization`.
- Parallel review lanes captured on 2026-06-19: UI taste, reading/Agent function, article voice, and CSS/code simplification.
- No credential, connection string, production secret, or admin token is included in this harness.

## Current System Shape

Misaya Notes is a React/Vite + Express/tRPC + Drizzle application with a public research-note reader, owner publishing tools, and a grounded Blog Agent. The current product already has dark/light public theme support, owner dark-lock behavior, article seeding, content audits, AI knowledge reindexing, and Vercel-oriented production deployment. The remaining problem is quality rather than absence: the UI still reads too much like an AI-template control surface, the reading and Agent paths need stronger end-to-end reliability, article language needs less abstract sloganizing, and CSS/component boundaries are too dependent on late overrides.

## Assumptions and Decisions

- Treat the current product, not older roadmap docs, as the contract of truth.
- The downloaded design system is useful source material, but its heavy dark-cobalt/glass direction must be selectively corrected rather than copied blindly.
- Public reader UI should become a quiet research publication. Owner/admin UI should become a dense, opaque operational tool.
- This commit publishes the optimization harness and evidence plan. It does not claim that all UI/product phases are already implemented.
- The user's explicit "提交并推送部署" request is the approval for committing, pushing, and triggering the normal production deployment path for this documentation update.

## Phase Order

| Phase | Name | Core Outcome | Report |
| --- | --- | --- | --- |
| Phase 00 | Current Product Contract And Evidence Audit | Code facts, validation commands, and interface boundaries are written back for Misaya Notes Product Upgrade Harness. | `reports/mnp-00-current-product-contract-and-evidence-audit-report.md` |
| Phase 01 | UI Anti Slop Visual System | Replace the AI-template feel with a calmer publication/admin visual system while preserving theme switching and readability. | `reports/mnp-01-ui-anti-slop-visual-system-report.md` |
| Phase 02 | Reading Experience And Format Rendering | Make the article path and Markdown/KaTeX/code/table rendering feel reliable on desktop, tablet, and mobile. | `reports/mnp-02-reading-experience-and-format-rendering-report.md` |
| Phase 03 | Blog Agent Product Reliability | Make grounded answers, source-card anchors, failures, quotas, uploads, and admin evals understandable and recoverable. | `reports/mnp-03-blog-agent-product-reliability-report.md` |
| Phase 04 | Article Voice And Quality System | Tighten summaries, UI labels, intros, conclusions, and bilingual terminology so the writing sounds precise rather than generated. | `reports/mnp-04-article-voice-and-quality-system-report.md` |
| Phase 05 | Code Simplification And CSS Architecture | Reduce late CSS overrides, consolidate tokens, and extract high-risk pure logic without changing public contracts. | `reports/mnp-05-code-simplification-and-css-architecture-report.md` |
| Phase 06 | Release Evidence And Production Verification | Run checks, browser smoke, content freshness, production reachability, and rollback notes before declaring a shipped phase. | `reports/mnp-06-release-evidence-and-production-verification-report.md` |

## Roadmap Cohesion

The phase chain is `MNP-00 Current Product Contract And Evidence Audit
  -> MNP-01 UI Anti Slop Visual System
  -> MNP-02 Reading Experience And Format Rendering
  -> MNP-03 Blog Agent Product Reliability
  -> MNP-04 Article Voice And Quality System
  -> MNP-05 Code Simplification And CSS Architecture
  -> MNP-06 Release Evidence And Production Verification`. Each phase must inherit prior report evidence, preserve code/interface boundaries in the continuity ledger, and update the next handoff before unlocking dependent work.

## New Window Prompt

Use `docs/misaya_notes_product_upgrade_2026_06_19/next-window-prompt.md` when starting a new Codex, Claude Code, or compatible agent window. Prefer the exact target phase `GOAL_PROMPT` from the phase file when assigning implementation work.

## Shared Harness Rules

- Stay inside phase boundaries.
- Plan before editing.
- Do not claim completion without durable evidence.
- Document blockers and user waivers explicitly.

## Global Non-Goals

- Do not mutate production data.
- Do not expand beyond the named phase chain without updating the manifest and continuity ledger.
- Do not store or print production credentials in docs, commit history, screenshots, or logs.
- Do not redesign into a marketing landing page, generic SaaS dashboard, or decorative AI-news surface.

## Global Compliance Gates

- Do not expose secrets.
- Do not perform destructive commands.
- Document approval before external service, migration, deployment, or production data changes.

## Standard Verification Commands

```bash
pnpm check
pnpm test
pnpm build
pnpm content:audit
python3 /Users/yang/.codex/skills/prd-phase-harness/scripts/validate_harness_prd.py docs/misaya_notes_product_upgrade_2026_06_19 --allow-placeholders
```

## Required Browser or Runtime Checks

Public routes: `/`, `/algorithms`, `/applications`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/about`, `/post/goal-harness-agent-phase-protocol`, and `/login` at desktop and mobile sizes in dark and light mode. Owner routes: `/manage`, `/manage/agent`, and `/write` must remain dark-locked and usable under a light browser preference. Agent checks must include source-card navigation, partial failure, no-source fallback, low quota, and uploaded context limits.

## External Inputs and Approvals

- External inputs currently captured are the current repo, the local design-system folder, prior repo-local harnesses, and read-only review findings.
- Any credential, dashboard, Figma file, deployment target, DNS/provider change, or migration approval must be added to the source packet before use.
- Current deploy assumption: pushing `main` to `origin` triggers the configured production deployment. Verify the public site after push before claiming release success.
