# Phase 00 - Baseline All-Page Audit

> Enter plan-first mode before editing. Execute this phase only, write durable evidence, and unlock FLG-01 only after acceptance gates pass.

**Goal:** Record the complete route, style, command, source, and dirty-tree baseline for the sitewide Liquid Glass redesign.

**Architecture:** This phase is documentation and evidence only. It confirms the local code map that later implementation phases inherit.

**Tech Stack:** Vite, React 19, Wouter, Tailwind v4 CSS imports, Radix/shadcn components, lucide-react icons, Express/tRPC backend.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "FLG-00",
    "number": "00",
    "title": "Baseline All-Page Audit",
    "status": "planned",
    "type": "baseline",
    "repo_path": ".",
    "docs_path": "docs/frontend_liquid_glass_optimization_2026_06_21",
    "phase_file": "docs/frontend_liquid_glass_optimization_2026_06_21/phase-00-baseline-all-page-audit.md",
    "depends_on": [],
    "unlocks": [
      "FLG-01"
    ]
  },
  "goal": {
    "target": "Record the complete route, style, command, source, and dirty-tree baseline for the sitewide Liquid Glass redesign.",
    "prompt": "Complete FLG-00 Baseline All-Page Audit by following docs/frontend_liquid_glass_optimization_2026_06_21/phase-00-baseline-all-page-audit.md; work on FLG-F001; record route, style, command, source, and dirty-tree evidence; keep edits inside harness docs; finish after validation and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-00-baseline-all-page-audit-plan.md",
    "completion_report": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-00-baseline-all-page-audit-report.md"
  },
  "runtime": {
    "feature_oracle": "docs/frontend_liquid_glass_optimization_2026_06_21/feature-oracle.json",
    "loop_contract": "docs/frontend_liquid_glass_optimization_2026_06_21/loop-contract.json",
    "loop_state": "docs/frontend_liquid_glass_optimization_2026_06_21/loop-state.json",
    "progress_log": "docs/frontend_liquid_glass_optimization_2026_06_21/progress-log.md",
    "handoff": "docs/frontend_liquid_glass_optimization_2026_06_21/agent-handoff.md",
    "continuity_ledger": "docs/frontend_liquid_glass_optimization_2026_06_21/continuity-ledger.md",
    "next_window_prompt": "docs/frontend_liquid_glass_optimization_2026_06_21/next-window-prompt.md",
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
      "docs/frontend_liquid_glass_optimization_2026_06_21/README.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/source-packet.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/continuity-ledger.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-00-baseline-all-page-audit.md"
    ],
    "primary_context": [
      "client/src/App.tsx",
      "client/src/main.tsx",
      "client/src/index.css",
      "client/src/styles/public-components.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/agent-surfaces.css",
      "client/src/styles/owner-tools.css",
      "client/src/styles/liquid-materials.css",
      "package.json"
    ],
    "context_budget": "focused"
  },
  "boundaries": {
    "likely_edit_paths": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/source-packet.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/continuity-ledger.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/progress-log.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/agent-handoff.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/feature-oracle.json",
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-00-baseline-all-page-audit-report.md"
    ],
    "do_not_edit": [
      "client runtime files",
      "server runtime files",
      "database schema files",
      "deployment configuration",
      "secret files"
    ]
  },
  "tool_policy": {
    "allowed_tools": [
      "repo search",
      "shell validation",
      "web source citation"
    ],
    "approval_required": [
      "deployment",
      "migration",
      "production data access",
      "destructive command"
    ]
  },
  "risk": {
    "tags": [
      "frontend",
      "baseline",
      "dirty-tree"
    ],
    "data_mutation": "no",
    "migration_required": "no",
    "browser_required": "yes",
    "ai_eval_required": "no",
    "external_service_required": "no",
    "release_blocking": "no"
  },
  "validation": {
    "commands": [
      {
        "id": "git-status",
        "cwd": ".",
        "command": "git status --short",
        "expected": "Existing modified and untracked files are recorded without reverting them.",
        "required": true
      },
      {
        "id": "route-inventory",
        "cwd": ".",
        "command": "rg -n \"<Route path|component=\\{NotFound\\}|BlogAgentRoot\" client/src/App.tsx",
        "expected": "All app routes and the global agent root are visible in output.",
        "required": true
      },
      {
        "id": "style-entry-inventory",
        "cwd": ".",
        "command": "wc -l client/src/styles/liquid-materials.css client/src/styles/visual-refresh.css client/src/styles/owner-tools.css client/src/index.css client/src/main.tsx",
        "expected": "Line counts identify global style scale and material-layer risk.",
        "required": true
      }
    ],
    "browser_checks": [
      "Record the required screenshot matrix for later phases: /, /algorithms, /applications, /archive, /search?q=zzzz-no-hit-ui-audit, /tags/agent-systems, /categories/ai-applications, /about, /post/goal-harness-agent-phase-protocol, /login, /404, /manage, /manage/agent, /write at 390x844, 768x1024, 1440x1000, and 1728x1117."
    ],
    "regression_scope": [
      "No runtime code changes in FLG-00.",
      "All existing dirty-tree entries stay intact."
    ],
    "compliance_gates": [
      "Do not read secrets.",
      "Do not deploy.",
      "Do not mutate production data.",
      "Do not revert existing user changes."
    ],
    "acceptance_gates": [
      "Source packet records routes, scripts, style entrypoints, source references, and dirty-tree risk.",
      "Continuity ledger records public contract boundaries and material-layer correction target.",
      "Phase report exists with command evidence.",
      "Feature oracle FLG-F001 is updated."
    ],
    "rollback_plan": [
      "Restore only FLG-00 harness docs from git if documentation validation fails."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-00-baseline-all-page-audit-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "source-packet update",
      "continuity-ledger update",
      "feature-oracle evidence",
      "progress-log entry"
    ],
    "waiver_policy": "Only user-waived gates may be marked waived.",
    "next_phase_handoff": "FLG-01 may start after this report confirms the material-layer correction target."
  },
  "stop_conditions": [
    "Route inventory cannot be read from local files.",
    "Style entrypoint inventory cannot be read from local files.",
    "A secret or production system is required."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: FLG-00
- GOAL_TARGET: Record the complete route, style, command, source, and dirty-tree baseline for the sitewide Liquid Glass redesign.
- GOAL_PROMPT: Complete FLG-00 Baseline All-Page Audit by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-00-baseline-all-page-audit.md`; work on feature-oracle item FLG-F001; write source packet, continuity ledger, progress, handoff, and phase report evidence before unlocking FLG-01.
- DEPENDS_ON: none
- READ_FIRST: `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/App.tsx`, `client/src/main.tsx`, `client/src/index.css`, `client/src/styles/public-components.css`, `client/src/styles/visual-refresh.css`, `client/src/styles/agent-surfaces.css`, `client/src/styles/owner-tools.css`, `client/src/styles/liquid-materials.css`, `package.json`
- LIKELY_EDIT_PATHS: `docs/frontend_liquid_glass_optimization_2026_06_21/source-packet.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/continuity-ledger.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/progress-log.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/agent-handoff.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/feature-oracle.json`, `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-00-baseline-all-page-audit-report.md`
- DO_NOT_EDIT: runtime code, server code, schema files, deployment configuration, secret files
- EXECUTION_MODE: plan-first; inspect; record; validate; hand off
- VALIDATION_COMMANDS: `git status --short`; `rg -n "<Route path|component=\\{NotFound\\}|BlogAgentRoot" client/src/App.tsx`; `wc -l client/src/styles/liquid-materials.css client/src/styles/visual-refresh.css client/src/styles/owner-tools.css client/src/index.css client/src/main.tsx`
- BROWSER_CHECKS: Record screenshot matrix requirements for the later browser phases.
- REGRESSION_SCOPE: FLG-00 does not mutate runtime code and must preserve dirty-tree entries.
- COMPLIANCE_GATES: Do not read secrets, deploy, mutate production data, or revert existing user changes.
- ROLLBACK_PLAN: Restore FLG-00 harness docs from git if documentation validation fails.
- ACCEPTANCE_GATES: Source packet, continuity ledger, phase report, progress log, handoff, and oracle evidence are updated.
- EVIDENCE_OUTPUT: `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-00-baseline-all-page-audit-report.md`
- STOP_CONDITIONS: Stop if local route/style inventory cannot be read or a production system is required.

## Task Spec

Inspect the app route map, style entrypoints, script gates, dirty-tree state, and source-backed frontend techniques. Record the facts in the harness docs and write FLG-00 evidence.

## Problem Boundary

In scope:

- Route inventory.
- Style entrypoint inventory.
- Validation command inventory.
- Source-backed material and browser capability notes.
- Dirty-tree risk documentation.

Out of scope:

- Runtime code changes.
- Deployment.
- Database or auth changes.
- Visual redesign implementation.

## Context Policy

Load only the harness files named above plus the local files in `PRIMARY_CONTEXT`. Expand context only when a command output points to a missing route or style entrypoint that must be recorded.

## Requirements

### R1 Full-Page Baseline

Record every route group and page category that must be covered by later visual QA.

### R2 Material-Layer Risk

Record the current `liquid-materials.css` scale and import position so FLG-01 can correct the design direction.

### R3 Source-Backed Technique Packet

Record Apple, MDN, and web.dev sources that define design intent and browser constraints.

## Test and Regression Requirements

Execute the three command probes named above and store the outputs or summaries in the phase report.

## Compliance and Safety Requirements

No secrets, deployment, production data, migration, destructive command, or unrelated revert is allowed.

## Rollback and Recovery

If a harness document becomes invalid, restore only the FLG-00 scoped documentation changes from git and retry the validator.

## Execution Capture

Write `reports/flg-00-baseline-all-page-audit-report.md`, update FLG-F001 evidence, append progress, and refresh the next handoff.

## Evaluator Protocol

Reject completion if any route group, style entrypoint, command gate, dirty-tree risk, or source category is missing from the source packet.

## Acceptance Criteria

- FLG-F001 has evidence.
- The phase report exists.
- The source packet and continuity ledger contain current code facts.
- FLG-01 has an actionable handoff.

## Risks

- Missing a route creates partial redesign.
- Ignoring dirty-tree state can overwrite user work.
- Treating Liquid Glass as only a color palette repeats the rejected result.
