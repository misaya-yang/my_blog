# Phase 05 - Code Simplification And CSS Architecture

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance to the next phase until acceptance gates pass or blockers are documented.

**Goal:** Complete the Code Simplification And CSS Architecture slice while preserving prior phase contracts and downstream handoff boundaries.

**Architecture:** This phase inherits code facts from `source-packet.md`, boundary decisions from `continuity-ledger.md`, and prior evidence from the dependency phase report.

**Tech Stack:** React/Vite frontend, Express/tRPC server, Drizzle data layer, Tailwind v4 CSS, Vitest tests, Playwright-capable browser checks, and Vercel-oriented production deployment.

---

## Machine Contract

The JSON block below is the authoritative machine-readable contract for goal-mode agents and validators. Keep it synchronized with the human-readable sections.

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "MNP-05",
    "number": "05",
    "title": "Code Simplification And CSS Architecture",
    "status": "draft",
    "type": "implementation",
    "repo_path": ".",
    "docs_path": "docs/misaya_notes_product_upgrade_2026_06_19",
    "phase_file": "docs/misaya_notes_product_upgrade_2026_06_19/phase-05-code-simplification-and-css-architecture.md",
    "depends_on": [
      "MNP-04"
    ],
    "unlocks": [
      "MNP-06"
    ]
  },
  "goal": {
    "target": "Complete the Code Simplification And CSS Architecture slice while preserving prior phase contracts and downstream handoff boundaries.",
    "prompt": "Complete MNP-05 Code Simplification And CSS Architecture for `.` by following `docs/misaya_notes_product_upgrade_2026_06_19/phase-05-code-simplification-and-css-architecture.md`; work on the matching feature-oracle item, preserve continuity with adjacent phases, write code facts back to the source packet and continuity ledger, stay inside the named edit boundaries, and finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-05-code-simplification-and-css-architecture-plan.md",
    "completion_report": "docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-05-code-simplification-and-css-architecture-report.md"
  },
  "runtime": {
    "feature_oracle": "docs/misaya_notes_product_upgrade_2026_06_19/feature-oracle.json",
    "loop_contract": "docs/misaya_notes_product_upgrade_2026_06_19/loop-contract.json",
    "loop_state": "docs/misaya_notes_product_upgrade_2026_06_19/loop-state.json",
    "progress_log": "docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md",
    "handoff": "docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md",
    "continuity_ledger": "docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md",
    "next_window_prompt": "docs/misaya_notes_product_upgrade_2026_06_19/next-window-prompt.md",
    "session_boot": {
      "read_progress": true,
      "run_baseline_check": true,
      "update_progress_before_exit": true
    },
    "agent_roles": [
      "planner",
      "generator",
      "evaluator"
    ]
  },
  "context": {
    "read_first": [
      "docs/misaya_notes_product_upgrade_2026_06_19/README.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/phase-manifest.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/loop-contract.json",
      "docs/misaya_notes_product_upgrade_2026_06_19/loop-state.json",
      "docs/misaya_notes_product_upgrade_2026_06_19/feature-oracle.json",
      "docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/next-window-prompt.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/phase-05-code-simplification-and-css-architecture.md"
    ],
    "primary_context": [
      "docs/misaya_notes_product_upgrade_2026_06_19/README.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/source-packet.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md",
      "repo files confirmed by baseline code inspection"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "external dashboards",
      "production environments",
      "unrelated modules not named by the phase contract"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "docs/misaya_notes_product_upgrade_2026_06_19/source-packet.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md",
      "docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md",
      "repo paths explicitly recorded in the source packet"
    ],
    "do_not_edit": [
      "production systems",
      "secret files",
      "deployment configuration",
      "unrelated roadmap or product scopes"
    ],
    "external_inputs": [
      "current repo and local Misaya Notes design-system folder; record credentials or external dashboards before use"
    ],
    "secrets_required": []
  },
  "tool_policy": {
    "allowed_tools": [
      "repo search",
      "shell validation"
    ],
    "approval_required": [
      "production data mutation",
      "destructive commands",
      "external service changes",
      "deployment"
    ],
    "dangerous_commands": [
      "git reset --hard",
      "rm -rf",
      "production migration"
    ]
  },
  "risk": {
    "tags": [
      "implementation"
    ],
    "data_mutation": "unknown",
    "migration_required": "unknown",
    "browser_required": "unknown",
    "ai_eval_required": "unknown",
    "external_service_required": "unknown",
    "release_blocking": "unknown"
  },
  "validation": {
    "commands": [
      {
        "id": "repo-test-discovery",
        "cwd": ".",
        "command": "pnpm check && pnpm test && pnpm build",
        "expected": "typecheck, test suite, and production build pass, or failures are recorded as blocker evidence in the phase report",
        "required": true
      }
    ],
    "browser_checks": [
      "public routes /, /algorithms, /applications, /archive, /search?q=zzzz-no-hit-ui-audit, /about, /post/goal-harness-agent-phase-protocol, /login in dark/light where UI changes apply; owner routes /manage, /manage/agent, /write must remain dark-locked"
    ],
    "regression_scope": [
      "prior phase report evidence and feature-oracle status remain valid"
    ],
    "compliance_gates": [
      "do not read or write secrets",
      "do not mutate production data",
      "document approval before external service or deployment changes"
    ],
    "acceptance_gates": [
      "phase report exists with validation or blocker evidence",
      "feature-oracle item is updated with evidence or blocker notes",
      "source-packet and continuity-ledger code summaries are updated",
      "progress-log and agent-handoff name the next concrete action"
    ],
    "rollback_plan": [
      "revert phase-scoped changes and restore runtime docs from git if validation fails"
    ]
  },
  "evidence": {
    "outputs": [
      "docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-05-code-simplification-and-css-architecture-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "progress-log entry",
      "feature-oracle evidence",
      "continuity-ledger update",
      "source-packet code summary"
    ],
    "waiver_policy": "Only mark a gate waived when the user explicitly waives it or the report documents a blocker and remaining evidence.",
    "next_phase_handoff": "State whether dependent phases are unlocked and what the next agent must know."
  },
  "stop_conditions": [
    "exact code paths are still unknown after baseline inspection",
    "credentials or approvals are required but not documented",
    "destructive commands, production data access, or out-of-scope edits are required"
  ]
}
```

## Coding Agent Contract

- PHASE_ID: MNP-05
- GOAL_TARGET: Complete the Code Simplification And CSS Architecture slice while preserving prior phase contracts and downstream handoff boundaries.
- GOAL_PROMPT: Complete MNP-05 Code Simplification And CSS Architecture for `.` by following `docs/misaya_notes_product_upgrade_2026_06_19/phase-05-code-simplification-and-css-architecture.md`; work on feature-oracle item MNP-F006; preserve dependency continuity with MNP-04; write code facts and boundary decisions back before handoff; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: MNP-04
- READ_FIRST: `docs/misaya_notes_product_upgrade_2026_06_19/README.md`, `docs/misaya_notes_product_upgrade_2026_06_19/phase-manifest.md`, this file
- PRIMARY_CONTEXT: docs/misaya_notes_product_upgrade_2026_06_19/README.md, docs/misaya_notes_product_upgrade_2026_06_19/source-packet.md, docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md, repo files confirmed by baseline code inspection
- LIKELY_EDIT_PATHS: docs/misaya_notes_product_upgrade_2026_06_19/source-packet.md, docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md, docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md, docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md, repo paths explicitly recorded in the source packet
- DO_NOT_EDIT: production systems, secret files, deployment configuration, unrelated roadmap or product scopes
- EXECUTION_MODE: plan-first; implement stepwise; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: pnpm check && pnpm test && pnpm build; add pnpm content:audit for content changes and focused Vitest/browser checks for the touched surface
- BROWSER_CHECKS: For UI-affecting phases, verify `/`, `/algorithms`, `/applications`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/about`, `/post/goal-harness-agent-phase-protocol`, `/login`, `/manage`, `/manage/agent`, and `/write` across relevant desktop/mobile viewports and dark/light or owner dark-lock state.
- REGRESSION_SCOPE: Prior phase report evidence, feature-oracle status, and continuity-ledger boundaries remain valid.
- COMPLIANCE_GATES: Do not read/write secrets, mutate production data, or change external services without documented approval. Deployment requires either the release phase or an explicit user approval note.
- ROLLBACK_PLAN: Revert phase-scoped changes and restore runtime docs from git if validation fails.
- ACCEPTANCE_GATES: Phase report exists; validation or blocker evidence is recorded; oracle item, progress log, handoff, source packet, and continuity ledger are updated.
- EVIDENCE_OUTPUT: `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-05-code-simplification-and-css-architecture-report.md`
- STOP_CONDITIONS: Stop if exact code paths, credentials, approvals, destructive commands, production data access, or out-of-scope edits are required but undocumented.

## Harness Runtime

- FEATURE_ORACLE: `docs/misaya_notes_product_upgrade_2026_06_19/feature-oracle.json`
- LOOP_CONTRACT: `docs/misaya_notes_product_upgrade_2026_06_19/loop-contract.json`
- LOOP_STATE: `docs/misaya_notes_product_upgrade_2026_06_19/loop-state.json`
- PROGRESS_LOG: `docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md`
- AGENT_HANDOFF: `docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md`
- NEXT_WINDOW_PROMPT: `docs/misaya_notes_product_upgrade_2026_06_19/next-window-prompt.md`
- CONTINUITY_LEDGER: `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md`

Session boot:

1. Read the runtime artifacts above.
2. Follow the loop contract: observe, select, execute, verify, record, decide.
3. Run the target phase's baseline or smoke validation before implementation when available.
4. Select one matching feature-oracle item and keep work scoped to that item and this phase.
5. Summarize inspected code facts and interface decisions back into the source packet and continuity ledger.
6. Update loop state, progress, continuity, and handoff files before exiting.

## Feature Oracle Policy

The feature oracle is the durable test list for long-running agents. Do not delete oracle cases to make completion easier. Update only `status`, `evidence`, and `notes` unless the user explicitly changes scope.

Status rules:

- `failing`: not implemented or not verified.
- `passing`: end-to-end evidence exists.
- `blocked`: a named dependency, credential, environment, or scope issue prevents completion.
- `waived`: the user explicitly waived the case and remaining risk is documented.

## Task Spec

Execute MNP-05 by using the phase contract, updating MNP-F006, and preserving the dependency chain `MNP-00 Current Product Contract And Evidence Audit
  -> MNP-01 UI Anti Slop Visual System
  -> MNP-02 Reading Experience And Format Rendering
  -> MNP-03 Blog Agent Product Reliability
  -> MNP-04 Article Voice And Quality System
  -> MNP-05 Code Simplification And CSS Architecture
  -> MNP-06 Release Evidence And Production Verification`.

## Cross-Phase Continuity

- Depends on: MNP-04
- Unlocks: MNP-06
- Feature-oracle item: MNP-F006
- Continuity ledger: `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md`
- Prior-phase evidence to inherit: the MNP-04 phase report, progress-log entry, oracle evidence, and continuity-ledger boundary notes
- Boundary this phase must preserve for later phases: code/interface facts written by prior phases and any downstream contract named in the continuity ledger
- Handoff this phase must produce: phase report, progress-log entry, oracle evidence, source-packet code summary, continuity-ledger update, and agent-handoff next action

## Code Summary Writeback

Before claiming completion, inspect the code paths allowed by this phase and write back:

- `source-packet.md`: summarize discovered files, services, routes, schemas, tests, commands, and runtime constraints.
- `continuity-ledger.md`: record interface boundaries, dependency assumptions, changed contracts, and any downstream phase impact.
- `agent-handoff.md`: state the next concrete action, active feature-oracle item, validation evidence, and blocker status.
- Phase report: link validation output and the exact code-summary update.

## Problem Boundary

In scope:

- Work needed to satisfy MNP-F006 for Code Simplification And CSS Architecture.
- Code inspection and summary writeback required to keep later phases aligned.

Out of scope:

- Production data mutation without explicit approval.
- Production data mutation.
- Unrelated feature work outside this phase chain.

## Context Policy

Before editing, inspect:

- Start with this phase file, `source-packet.md`, `continuity-ledger.md`, and the MNP-04 phase report.
- Confirm inherited code facts and boundaries before editing.
- Expand repo context only to paths you record back into the source packet.

Do not load unrelated files unless a blocker requires expanding context.

## Requirements

### R1 Continuity-Preserving Execution

MNP-05 must update MNP-F006, produce durable evidence, and write code/interface facts back so the next phase can continue without hidden chat context.

## Test and Regression Requirements

Run `pnpm check`, `pnpm test`, and `pnpm build`; add `pnpm content:audit` for content changes and focused route/eval checks when the phase touches UI or AI behavior. Preserve prior phase acceptance evidence.

## Compliance and Safety Requirements

Do not expose secrets, mutate production data, or use external services unless the required approval and source packet entry exist. Deployment requires either the release phase or an explicit user approval note.

## Rollback and Recovery

Revert phase-scoped code changes, restore runtime docs from git, and mark the oracle item blocked if validation cannot be recovered.

## Execution Capture

Write the phase report, append progress-log evidence, update oracle evidence, update continuity-ledger boundaries, and refresh agent-handoff next action.

Use ``docs/misaya_notes_product_upgrade_2026_06_19/reports/phase-report-template.md`` when writing the phase report.

## Evaluator Protocol

Reject completion if evidence is missing, code facts were not written back, continuity boundaries are stale, or the phase tries to unlock dependent work without a report.

## Acceptance Criteria

- MNP-F006 has evidence or a documented blocker.
- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-05-code-simplification-and-css-architecture-report.md` exists or is named as blocked evidence.
- `source-packet.md`, `continuity-ledger.md`, `progress-log.md`, and `agent-handoff.md` reflect the latest code facts and next action.

## Risks

- Phase isolation can break if downstream boundary changes are not recorded.
- Implementation can drift if code summaries stay stale.
- Long-running agents can repeat work if handoff evidence is incomplete.
