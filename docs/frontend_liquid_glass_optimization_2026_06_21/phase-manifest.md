# Misaya Notes Sitewide Liquid Glass Frontend Optimization Harness Phase Manifest

This compact index is the loading map for coding agents. Use it with the target phase file.

## Grep Usage

Find a phase:

```bash
rg -n "PHASE_ID: FLG-XX" docs/frontend_liquid_glass_optimization_2026_06_21
```

Find all goal prompts:

```bash
rg -n "GOAL_PROMPT:" docs/frontend_liquid_glass_optimization_2026_06_21
```

Find validation commands:

```bash
rg -n "VALIDATION_COMMANDS:" docs/frontend_liquid_glass_optimization_2026_06_21
```

Find acceptance gates:

```bash
rg -n "ACCEPTANCE_GATES:" docs/frontend_liquid_glass_optimization_2026_06_21
```

## Phase Index

| PHASE_ID | File | Depends On | Goal Target | Main Validation | Evidence Output |
| --- | --- | --- | --- | --- | --- |
| FLG-00 | `phase-00-baseline-all-page-audit.md` | root | Record full route, style, command, and dirty-tree baseline. | `git status --short`, route/style inventory | `reports/flg-00-baseline-all-page-audit-report.md` |
| FLG-01 | `phase-01-design-system-foundation.md` | FLG-00 | Replace broad material overrides with compact tokens and utilities. | `pnpm check`, `pnpm test`, `pnpm build` | `reports/flg-01-design-system-foundation-report.md` |
| FLG-02 | `phase-02-public-navigation-and-home.md` | FLG-01 | Apply material system to public navigation, home, and discovery shells. | command gates plus public screenshots | `reports/flg-02-public-navigation-and-home-report.md` |
| FLG-03 | `phase-03-reader-discovery-and-agent.md` | FLG-02 | Apply material system to reader, article discovery cards, and agent companion. | command gates plus reader/agent screenshots | `reports/flg-03-reader-discovery-and-agent-report.md` |
| FLG-04 | `phase-04-owner-tools-and-editor.md` | FLG-03 | Apply dense material system to owner tools and editor workflows. | command gates plus owner/editor screenshots | `reports/flg-04-owner-tools-and-editor-report.md` |
| FLG-05 | `phase-05-motion-performance-accessibility.md` | FLG-04 | Add progressive motion, rendering, transparency, and focus behavior. | command gates plus reduced preference checks | `reports/flg-05-motion-performance-accessibility-report.md` |
| FLG-06 | `phase-06-final-qa-and-handoff.md` | FLG-05 | Close full-site QA with audits, screenshots, and handoff evidence. | full command suite plus route matrix screenshots | `reports/flg-06-final-qa-and-handoff-report.md` |

## Phase Report Index

| PHASE_ID | Required Report |
| --- | --- |
| FLG-00 | `reports/flg-00-baseline-all-page-audit-report.md` |
| FLG-01 | `reports/flg-01-design-system-foundation-report.md` |
| FLG-02 | `reports/flg-02-public-navigation-and-home-report.md` |
| FLG-03 | `reports/flg-03-reader-discovery-and-agent-report.md` |
| FLG-04 | `reports/flg-04-owner-tools-and-editor-report.md` |
| FLG-05 | `reports/flg-05-motion-performance-accessibility-report.md` |
| FLG-06 | `reports/flg-06-final-qa-and-handoff-report.md` |

## Dependency Flow

```text
FLG-00 Baseline All-Page Audit
  -> FLG-01 Design System Foundation
  -> FLG-02 Public Navigation And Home
  -> FLG-03 Reader Discovery And Agent
  -> FLG-04 Owner Tools And Editor
  -> FLG-05 Motion Performance Accessibility
  -> FLG-06 Final QA And Handoff
```

## Validation Matrix

| PHASE_ID | Mutates Data | Needs Browser/UI | Needs Agent/LLM Eval | Needs Migration | Needs External Service | Release Blocking |
| --- | --- | --- | --- | --- | --- | --- |
| FLG-00 | no | yes | no | no | no | no |
| FLG-01 | no | yes | no | no | no | no |
| FLG-02 | no | yes | no | no | no | no |
| FLG-03 | no | yes | no | no | no | no |
| FLG-04 | no | yes | no | no | no | no |
| FLG-05 | no | yes | no | no | no | no |
| FLG-06 | no | yes | no | no | no | no |

## Risk Matrix

| PHASE_ID | Primary Risk | Stop Condition |
| --- | --- | --- |
| FLG-00 | Hidden page or style scope produces partial redesign | Stop if route/style inventory cannot be completed from local files. |
| FLG-01 | Foundation repeats the disliked large override pattern | Stop if material utilities exceed a compact shared layer or require a package. |
| FLG-02 | Public pages become glossy but less usable | Stop if screenshots show compressed nav, duplicate CTAs, or weak contrast. |
| FLG-03 | Reader or agent surfaces reduce comprehension | Stop if prose, code, tables, formulas, or source cards lose contrast. |
| FLG-04 | Owner tools become decorative instead of efficient | Stop if forms, tables, or editor canvas lose density or keyboard focus. |
| FLG-05 | Motion or blur harms accessibility/performance | Stop if reduced preference states are not honored. |
| FLG-06 | QA evidence is incomplete | Stop if commands or route screenshots are missing. |

## Runtime Artifacts

| Artifact | Path | Agent Rule |
| --- | --- | --- |
| Loop Contract | `docs/frontend_liquid_glass_optimization_2026_06_21/loop-contract.json` | Follow observe, select, execute, verify, record, decide. |
| Loop State | `docs/frontend_liquid_glass_optimization_2026_06_21/loop-state.json` | Keep active phase, feature, iteration, status, and next action current. |
| Feature Oracle | `docs/frontend_liquid_glass_optimization_2026_06_21/feature-oracle.json` | Update only status, evidence, and notes for the active feature. |
| Progress Log | `docs/frontend_liquid_glass_optimization_2026_06_21/progress-log.md` | Append session start, validation, and blocker notes. |
| Agent Handoff | `docs/frontend_liquid_glass_optimization_2026_06_21/agent-handoff.md` | Keep planner, generator, and evaluator notes file-based. |
| Continuity Ledger | `docs/frontend_liquid_glass_optimization_2026_06_21/continuity-ledger.md` | Preserve code-summary writeback and interface boundary decisions. |
| Next Window Prompt | `docs/frontend_liquid_glass_optimization_2026_06_21/next-window-prompt.md` | Use this to restart work in a fresh context window. |

## Agent Role Handoffs

- Planner role: keep page coverage, source guidance, phase boundaries, and acceptance gates explicit.
- Generator role: execute one phase/feature item, preserve public contracts, and write evidence.
- Evaluator role: review commands, screenshots, contrast, reduced preferences, and handoff completeness.
- A single agent may play all roles when evidence is objective and recorded.

## Goal Setup Templates

Use the exact phase file `GOAL_PROMPT` when creating an agent goal. If a phase has dependencies, do not execute it until dependency acceptance gates are met or explicitly waived in the previous phase report.

Example:

```text
Complete FLG-01 Design System Foundation for `.` by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-01-design-system-foundation.md`; stay inside named edit boundaries; finish only after validation, browser checks, rollback notes, evidence, and acceptance gates pass or blockers are documented.
```

## Shared Agent Rules

- Use the exact phase `GOAL_PROMPT` when starting a goal.
- Open only `READ_FIRST` and `PRIMARY_CONTEXT` before planning.
- Expand edit scope only when a blocker is documented.
- Write the phase report before moving on.

## External Inputs Checklist

- Approved references: Apple HIG Materials, WWDC25 Meet Liquid Glass, MDN browser docs, web.dev browser docs.
- Blocked without new approval: credentials, deployment, migrations, production data, DNS, payment/provider changes.
