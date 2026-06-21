# Phase 04 - Owner Tools And Editor

> Enter plan-first mode before editing. Execute this phase only, write durable evidence, and unlock FLG-05 only after acceptance gates pass.

**Goal:** Optimize Manage, ManageAgent, and Editor with dense material surfaces while preventing owner CSS from overriding public pages.

**Architecture:** This phase isolates owner/editor styling and keeps operational workflows efficient.

**Tech Stack:** React owner pages, Tiptap editor, DashboardLayout, owner-tools CSS, existing shadcn/Radix controls.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "FLG-04",
    "number": "04",
    "title": "Owner Tools And Editor",
    "status": "planned",
    "type": "implementation",
    "repo_path": ".",
    "docs_path": "docs/frontend_liquid_glass_optimization_2026_06_21",
    "phase_file": "docs/frontend_liquid_glass_optimization_2026_06_21/phase-04-owner-tools-and-editor.md",
    "depends_on": [
      "FLG-03"
    ],
    "unlocks": [
      "FLG-05"
    ]
  },
  "goal": {
    "target": "Optimize Manage, ManageAgent, and Editor with dense material surfaces while preventing owner CSS from overriding public pages.",
    "prompt": "Complete FLG-04 Owner Tools And Editor by following docs/frontend_liquid_glass_optimization_2026_06_21/phase-04-owner-tools-and-editor.md; work on FLG-F005; apply dense material surfaces to Manage, ManageAgent, Editor, dashboards, forms, tables, toolbars, and editor canvas boundaries; keep public styles isolated; finish after command gates, owner/editor screenshots, and report updates.",
    "plan_required": true,
    "plan_output": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-04-owner-tools-and-editor-plan.md",
    "completion_report": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-04-owner-tools-and-editor-report.md"
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
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-04-owner-tools-and-editor.md"
    ],
    "primary_context": [
      "client/src/pages/Manage.tsx",
      "client/src/pages/ManageAgent.tsx",
      "client/src/pages/Editor.tsx",
      "client/src/components/DashboardLayout.tsx",
      "client/src/components/editor",
      "client/src/styles/owner-tools.css",
      "client/src/styles/liquid-materials.css",
      "client/src/styles/agent-surfaces.css"
    ],
    "context_budget": "focused"
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/pages/Manage.tsx",
      "client/src/pages/ManageAgent.tsx",
      "client/src/pages/Editor.tsx",
      "client/src/components/DashboardLayout.tsx",
      "client/src/components/editor",
      "client/src/styles/owner-tools.css",
      "client/src/styles/liquid-materials.css",
      "client/src/styles/agent-surfaces.css",
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-04-owner-tools-and-editor-report.md"
    ],
    "do_not_edit": [
      "public route files except shared compatibility notes",
      "server files",
      "database schema files",
      "content markdown files",
      "deployment configuration",
      "secret files"
    ]
  },
  "tool_policy": {
    "allowed_tools": [
      "repo search",
      "shell validation",
      "browser screenshot"
    ],
    "approval_required": [
      "new dependency",
      "deployment",
      "migration",
      "production data access",
      "destructive command"
    ]
  },
  "risk": {
    "tags": [
      "frontend",
      "owner-tools",
      "editor"
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
        "id": "typecheck",
        "cwd": ".",
        "command": "pnpm check",
        "expected": "TypeScript completes without errors.",
        "required": true
      },
      {
        "id": "unit-suite",
        "cwd": ".",
        "command": "pnpm test",
        "expected": "Vitest completes without failures.",
        "required": true
      },
      {
        "id": "production-build",
        "cwd": ".",
        "command": "pnpm build",
        "expected": "Vite and server bundle complete without errors.",
        "required": true
      }
    ],
    "browser_checks": [
      "Capture /manage, /manage/agent, and /write at 390x844, 768x1024, 1440x1000, and 1728x1117.",
      "Check owner tables, forms, editor toolbar, editor canvas, and keyboard focus states.",
      "Check public route / after owner CSS changes to confirm no owner-public bleed."
    ],
    "regression_scope": [
      "No public-page visual regression from owner CSS.",
      "No editor content contract change.",
      "No backend or database contract change."
    ],
    "compliance_gates": [
      "Do not read secrets.",
      "Do not deploy.",
      "Do not mutate production data.",
      "Do not change schema.",
      "Do not revert existing user changes."
    ],
    "acceptance_gates": [
      "Owner tools use dense material surfaces without losing scan speed.",
      "Editor canvas and toolbar remain usable and focused.",
      "Owner CSS does not override public surfaces.",
      "Owner/editor screenshots exist.",
      "Feature oracle FLG-F005 is updated."
    ],
    "rollback_plan": [
      "Restore FLG-04 scoped owner, editor, CSS, and harness docs from git if validation fails."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-04-owner-tools-and-editor-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "command evidence",
      "owner screenshots",
      "editor screenshots",
      "feature-oracle evidence",
      "continuity-ledger update"
    ],
    "waiver_policy": "Only user-waived gates may be marked waived.",
    "next_phase_handoff": "FLG-05 receives owner/editor focus, density, and public-bleed notes."
  },
  "stop_conditions": [
    "A schema change is required.",
    "Editor content contract change is required.",
    "Owner CSS cannot be isolated from public pages."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: FLG-04
- GOAL_TARGET: Optimize Manage, ManageAgent, and Editor with dense material surfaces while preventing owner CSS from overriding public pages.
- GOAL_PROMPT: Complete FLG-04 Owner Tools And Editor by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-04-owner-tools-and-editor.md`; work on feature-oracle item FLG-F005; preserve public and backend contracts; write command and screenshot evidence before unlocking FLG-05.
- DEPENDS_ON: FLG-03
- READ_FIRST: `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`, this file
- PRIMARY_CONTEXT: owner pages, dashboard layout, editor components, owner CSS, material utilities, and agent surfaces named in the machine contract
- LIKELY_EDIT_PATHS: owner pages, dashboard layout, editor components, owner CSS, material utilities, agent surfaces, and FLG-04 report files
- DO_NOT_EDIT: public route files except shared compatibility notes, server files, schema files, content markdown, deployment configuration, secret files
- EXECUTION_MODE: plan-first; implement owner/editor surfaces; validate; capture screenshots; hand off
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`
- BROWSER_CHECKS: Capture owner/editor routes and public route regression screenshots across required viewports.
- REGRESSION_SCOPE: Preserve public visuals, editor content contracts, backend contracts, and database contracts.
- COMPLIANCE_GATES: Do not read secrets, deploy, mutate production data, change schema, or revert existing user changes.
- ROLLBACK_PLAN: Restore FLG-04 scoped owner, editor, CSS, and harness docs from git if validation fails.
- ACCEPTANCE_GATES: Owner/editor surfaces are dense and usable; owner CSS is isolated; screenshots exist; FLG-F005 is updated.
- EVIDENCE_OUTPUT: `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-04-owner-tools-and-editor-report.md`
- STOP_CONDITIONS: Stop if schema change, editor contract change, or owner-public style isolation failure is required.

## Task Spec

Make owner and editor workflows feel refined and material-aware while keeping operational density and keyboard efficiency.

## Problem Boundary

In scope:

- Manage and ManageAgent dashboards.
- Editor page, toolbar, fields, and canvas boundaries.
- Owner CSS isolation.
- Focus and table/form readability.

Out of scope:

- Public redesign.
- Article reader changes.
- Backend schema or API changes.
- Deployment.

## Context Policy

Inspect owner and editor files listed above. Check public route selectors before changing owner CSS.

## Requirements

### R1 Dense Owner Surfaces

Cards, tables, forms, and toolbars use material depth without becoming spacious marketing UI.

### R2 Editor Usability

The editor canvas stays readable and stable while surrounding controls gain material hierarchy.

### R3 Style Isolation

Owner CSS selectors do not override public routes.

## Test and Regression Requirements

Execute command gates and capture owner/editor screenshots plus a public route regression screenshot.

## Compliance and Safety Requirements

No secrets, deployment, production data, migration, destructive command, schema change, or unrelated revert is allowed.

## Rollback and Recovery

Restore FLG-04 scoped edits if validation or screenshots fail.

## Execution Capture

Write `reports/flg-04-owner-tools-and-editor-report.md`, update FLG-F005 evidence, append progress, and update the next handoff.

## Evaluator Protocol

Reject completion if owner tools lose density, focus states are unclear, or public pages inherit owner styling.

## Acceptance Criteria

- FLG-F005 has evidence.
- Owner/editor screenshots exist for required viewports.
- Public route regression screenshot exists.
- Commands pass or blockers are documented.

## Risks

- Owner interfaces can become too decorative.
- Broad owner selectors can damage public pages.
- Editor focus and input readability can regress.
