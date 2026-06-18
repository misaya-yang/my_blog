# Misaya Notes UI Optimization Harness Phase Manifest

This is the compact index for coding agents. Prefer this file plus the target phase file over loading the whole folder.

## Grep Usage

Find a phase:

```bash
rg -n "PHASE_ID: MNUI-XX" docs/misaya_notes_ui_optimization_2026_06_18
```

Find all goal prompts:

```bash
rg -n "GOAL_PROMPT:" docs/misaya_notes_ui_optimization_2026_06_18
```

Find validation commands:

```bash
rg -n "VALIDATION_COMMANDS:" docs/misaya_notes_ui_optimization_2026_06_18
```

Find acceptance gates:

```bash
rg -n "ACCEPTANCE_GATES:" docs/misaya_notes_ui_optimization_2026_06_18
```

## Phase Index

| PHASE_ID | File | Depends On | Goal Target | Main Validation | Evidence Output |
| --- | --- | --- | --- | --- | --- |
| MNUI-00 | `phase-00-baseline-design-audit.md` | none | Capture current UI, design-system facts, validation commands, and visual risk inventory before implementation begins. | `pnpm check` plus browser gates | `reports/mnui-00-baseline-design-audit-report.md` |
| MNUI-01 | `phase-01-design-tokens-and-shared-primitives.md` | MNUI-00 | Align global tokens and shared UI primitives with the downloaded Misaya Notes design system without adding dependencies or changing public contracts. | `pnpm check` plus browser gates | `reports/mnui-01-design-tokens-and-shared-primitives-report.md` |
| MNUI-02 | `phase-02-public-reader-ia-and-responsive-surfaces.md` | MNUI-01 | Apply the design-system reader model to Home, Archive, Search, Track, and Post surfaces with responsive evidence. | `pnpm check` plus browser gates | `reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md` |
| MNUI-03 | `phase-03-blog-agent-and-trust-surface.md` | MNUI-02 | Make the Blog Agent feel like a grounded article companion with clear source boundaries, mobile ergonomics, and evidence-backed answer states. | `pnpm check` plus browser gates | `reports/mnui-03-blog-agent-and-trust-surface-report.md` |
| MNUI-04 | `phase-04-owner-tools-and-system-states.md` | MNUI-03 | Bring owner-only manage, write, login, and Agent Ops states into the same design language while preserving auth and content boundaries. | `pnpm check` plus browser gates | `reports/mnui-04-owner-tools-and-system-states-report.md` |
| MNUI-05 | `phase-05-release-evidence-and-design-regression-gates.md` | MNUI-04 | Create a complete local release evidence packet for the UI optimization without deploying or mutating production systems. | `pnpm check` plus browser gates | `reports/mnui-05-release-evidence-and-design-regression-gates-report.md` |

## Phase Report Index

| PHASE_ID | Required Report |
| --- | --- |
| MNUI-00 | `reports/mnui-00-baseline-design-audit-report.md` |
| MNUI-01 | `reports/mnui-01-design-tokens-and-shared-primitives-report.md` |
| MNUI-02 | `reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md` |
| MNUI-03 | `reports/mnui-03-blog-agent-and-trust-surface-report.md` |
| MNUI-04 | `reports/mnui-04-owner-tools-and-system-states-report.md` |
| MNUI-05 | `reports/mnui-05-release-evidence-and-design-regression-gates-report.md` |

## Dependency Flow

```text
MNUI-00 Baseline Design Audit
  -> MNUI-01 Design Tokens And Shared Primitives
  -> MNUI-02 Public Reader IA And Responsive Surfaces
  -> MNUI-03 Blog Agent And Trust Surface
  -> MNUI-04 Owner Tools And System States
  -> MNUI-05 Release Evidence And Design Regression Gates
```

## Validation Matrix

| PHASE_ID | Mutates Data | Needs Browser/UI | Needs Agent/LLM Eval | Needs Migration | Needs External Service | Release Blocking |
| --- | --- | --- | --- | --- | --- | --- |
| MNUI-00 | no | yes | no | no | no | yes |
| MNUI-01 | no | yes | no | no | no | yes |
| MNUI-02 | no | yes | no | no | no | yes |
| MNUI-03 | no | yes | yes | no | no | yes |
| MNUI-04 | no | yes | no | no | no | yes |
| MNUI-05 | no | yes | yes | no | no | yes |

## Risk Matrix

| PHASE_ID | Primary Risk | Stop Condition |
| --- | --- | --- |
| MNUI-00 | baseline, ui, frontend, browser | Stop if local dependencies cannot install or the dev server cannot start after two documented attempts. |
| MNUI-01 | ui, frontend, browser | Stop if a required primitive change would break a public component API. |
| MNUI-02 | ui, frontend, browser | Stop if a desired reader behavior requires schema changes. |
| MNUI-03 | ui, frontend, browser, agent, ai, eval, security | Stop if live Agent execution requires missing provider credentials. |
| MNUI-04 | ui, frontend, browser, auth, security | Stop if authenticated owner evidence requires credentials not present locally. |
| MNUI-05 | ui, frontend, browser, agent, ai, eval, security, release | Stop if full test/build evidence fails and the failure cannot be scoped to a pre-existing issue. |

## Runtime Artifacts

| Artifact | Path | Agent Rule |
| --- | --- | --- |
| Loop Contract | `docs/misaya_notes_ui_optimization_2026_06_18/loop-contract.json` | Follow observe, select, execute, verify, record, decide before claiming progress. |
| Loop State | `docs/misaya_notes_ui_optimization_2026_06_18/loop-state.json` | Keep active phase, feature, iteration, status, and next action current. |
| Feature Oracle | `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json` | Update only status, evidence, and notes for the feature being worked. |
| Progress Log | `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md` | Append session start/end, validation, and blocker notes. |
| Agent Handoff | `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md` | Keep planner, generator, and evaluator notes file-based and brief. |
| Continuity Ledger | `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md` | Preserve phase relatedness, code-summary writeback, and interface boundary decisions. |
| Next Window Prompt | `docs/misaya_notes_ui_optimization_2026_06_18/next-window-prompt.md` | Use this to restart work in a fresh context window. |

## Agent Role Handoffs

- Planner role: refine phase context, maintain source packet, and keep oracle cases observable.
- Generator role: execute one phase and one feature-oracle item, then write evidence.
- Evaluator role: review files, screenshots, command output, accessibility notes, and oracle status from durable artifacts.
- Broad UI, Agent, owner, and release phases require evaluator review before unlock.

## Goal Setup Templates

Use the exact phase file `GOAL_PROMPT` when creating an agent goal. Do not execute a phase until dependency acceptance gates are met or explicitly waived in the prior report.

Example:

```text
Complete MNUI-00 Baseline Design Audit for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-00-baseline-design-audit.md`; work on feature-oracle item MNUI-F001; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
```

## Shared Agent Rules

- Use the exact phase `GOAL_PROMPT` when starting a goal.
- Open only `READ_FIRST` and `PRIMARY_CONTEXT` before planning.
- Expand edit scope only when a blocker is documented in the phase report.
- Write the phase report before moving on.
- Update the feature oracle status only with evidence, blocker notes, or an explicit waiver.

## External Inputs Checklist

- Read-only design source: `/Users/yang/Downloads/Misaya Notes Design System`.
- Local dev server: `http://localhost:3000` when started by the phase runner.
- Authenticated owner-route evidence: use only already-configured local auth state.
- Production deploy, migrations, provider dashboard changes, DNS changes, dependency additions, and destructive git operations require explicit user approval.
