# Phase 06 - Final QA And Handoff

> Enter plan-first mode before editing. Execute this phase only, write durable evidence, and close the harness only after acceptance gates pass.

**Goal:** Verify the complete sitewide Liquid Glass redesign with command gates, route screenshots, audit evidence, and restartable handoff notes.

**Architecture:** This phase is evaluation and small defect correction inside scoped frontend files when evidence finds a blocking issue.

**Tech Stack:** Existing scripts, Playwright screenshots, Vite build, Vitest, TypeScript.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "FLG-06",
    "number": "06",
    "title": "Final QA And Handoff",
    "status": "planned",
    "type": "evaluation",
    "repo_path": ".",
    "docs_path": "docs/frontend_liquid_glass_optimization_2026_06_21",
    "phase_file": "docs/frontend_liquid_glass_optimization_2026_06_21/phase-06-final-qa-and-handoff.md",
    "depends_on": [
      "FLG-05"
    ],
    "unlocks": []
  },
  "goal": {
    "target": "Verify the complete sitewide Liquid Glass redesign with command gates, route screenshots, audit evidence, and restartable handoff notes.",
    "prompt": "Complete FLG-06 Final QA And Handoff by following docs/frontend_liquid_glass_optimization_2026_06_21/phase-06-final-qa-and-handoff.md; work on FLG-F007; run the full command suite, capture the full route screenshot matrix, record audit evidence, fix only phase-scoped blocking frontend defects, and close the harness with final reports.",
    "plan_required": true,
    "plan_output": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-06-final-qa-and-handoff-plan.md",
    "completion_report": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-06-final-qa-and-handoff-report.md"
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
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-06-final-qa-and-handoff.md"
    ],
    "primary_context": [
      "client/src/App.tsx",
      "client/src/main.tsx",
      "client/src/pages",
      "client/src/components",
      "client/src/styles",
      "scripts/audit/ui-layout.ts",
      "scripts/audit/baseline.ts",
      "package.json"
    ],
    "context_budget": "focused"
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/pages",
      "client/src/components",
      "client/src/styles",
      "docs/frontend_liquid_glass_optimization_2026_06_21/source-packet.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/continuity-ledger.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/progress-log.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/agent-handoff.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/feature-oracle.json",
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-06-final-qa-and-handoff-report.md"
    ],
    "do_not_edit": [
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
      "qa",
      "handoff"
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
      },
      {
        "id": "ui-audit",
        "cwd": ".",
        "command": "AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui",
        "expected": "UI audit completes and records layout evidence.",
        "required": true
      },
      {
        "id": "baseline-audit",
        "cwd": ".",
        "command": "AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick",
        "expected": "Baseline quick audit completes and records evidence.",
        "required": true
      }
    ],
    "browser_checks": [
      "Capture /, /algorithms, /applications, /archive, /search?q=zzzz-no-hit-ui-audit, /tags/agent-systems, /categories/ai-applications, /about, /post/goal-harness-agent-phase-protocol, /login, /404, /manage, /manage/agent, and /write at 390x844, 768x1024, 1440x1000, and 1728x1117.",
      "Capture agent launcher closed and open states.",
      "Check light mode, dark mode, reduced motion, reduced transparency, keyboard focus, no horizontal overflow, header height at or below 72px, and contrast without backdrop blur."
    ],
    "regression_scope": [
      "No route changes.",
      "No API changes.",
      "No schema changes.",
      "No deployment.",
      "All prior phase evidence remains current."
    ],
    "compliance_gates": [
      "Do not read secrets.",
      "Do not deploy.",
      "Do not mutate production data.",
      "Do not change schema.",
      "Do not revert existing user changes."
    ],
    "acceptance_gates": [
      "Full command suite evidence exists.",
      "Full route screenshot matrix exists.",
      "Preference and fallback checks are recorded.",
      "Known residual risks are documented.",
      "Feature oracle FLG-F007 is updated."
    ],
    "rollback_plan": [
      "Restore only FLG-06 scoped defect fixes and harness docs from git if final validation fails."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-06-final-qa-and-handoff-report.md"
    ],
    "required_artifacts": [
      "final phase report",
      "command evidence",
      "full screenshot matrix",
      "audit evidence",
      "feature-oracle evidence",
      "continuity-ledger closure"
    ],
    "waiver_policy": "Only user-waived gates may be marked waived.",
    "next_phase_handoff": "The harness closes with final risks and follow-up targets."
  },
  "stop_conditions": [
    "A server or database change is required.",
    "A deployment is required.",
    "Full route screenshot capture cannot be completed."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: FLG-06
- GOAL_TARGET: Verify the complete sitewide Liquid Glass redesign with command gates, route screenshots, audit evidence, and restartable handoff notes.
- GOAL_PROMPT: Complete FLG-06 Final QA And Handoff by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-06-final-qa-and-handoff.md`; work on feature-oracle item FLG-F007; run full validation, capture the full route matrix, record audits, and close the harness.
- DEPENDS_ON: FLG-05
- READ_FIRST: `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`, this file
- PRIMARY_CONTEXT: app shell, pages, components, styles, audit scripts, package scripts, and prior phase reports
- LIKELY_EDIT_PATHS: pages, components, styles, harness runtime docs, and FLG-06 report files
- DO_NOT_EDIT: server files, database schema files, content markdown, deployment configuration, secret files
- EXECUTION_MODE: plan-first; validate; capture screenshots; fix blocking frontend defects only; close handoff
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`; `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui`; `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick`
- BROWSER_CHECKS: Capture the full route matrix, agent states, theme states, reduced preference states, keyboard focus, overflow, header height, and blur-disabled contrast.
- REGRESSION_SCOPE: Preserve routes, APIs, schema, deployment state, and all prior phase evidence.
- COMPLIANCE_GATES: Do not read secrets, deploy, mutate production data, change schema, or revert existing user changes.
- ROLLBACK_PLAN: Restore only FLG-06 scoped fixes and harness docs from git if validation fails.
- ACCEPTANCE_GATES: Full commands pass; screenshots exist; audits exist; residual risks are documented; FLG-F007 is updated.
- EVIDENCE_OUTPUT: `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-06-final-qa-and-handoff-report.md`
- STOP_CONDITIONS: Stop if server/database changes, deployment, or incomplete route screenshot capture blocks closure.

## Task Spec

Verify the complete redesign and leave a restartable handoff with objective evidence.

## Problem Boundary

In scope:

- Full command suite.
- Full route screenshot matrix.
- Audit evidence.
- Small frontend defect fixes discovered by final QA.
- Final handoff docs.

Out of scope:

- Deployment.
- Backend changes.
- Database changes.
- Content rewrites.

## Context Policy

Inspect prior reports first. Open code only when final QA evidence identifies a blocking frontend defect.

## Requirements

### R1 Full Command Evidence

All required commands produce pass evidence or a documented blocker.

### R2 Full Visual Evidence

Every target route and viewport has screenshot evidence, including agent open state and preference states.

### R3 Restartable Closure

The source packet, continuity ledger, progress log, and handoff describe final state and residual risk.

## Test and Regression Requirements

Execute the full command suite, audit scripts, and screenshot matrix.

## Compliance and Safety Requirements

No secrets, deployment, production data, migration, destructive command, schema change, or unrelated revert is allowed.

## Rollback and Recovery

Restore FLG-06 scoped fixes if final validation fails and document unresolved blockers.

## Execution Capture

Write `reports/flg-06-final-qa-and-handoff-report.md`, update FLG-F007 evidence, append final progress, and close the continuity ledger.

## Evaluator Protocol

Reject completion if any command, required route, viewport, preference state, or handoff artifact is missing.

## Acceptance Criteria

- FLG-F007 has evidence.
- Full command suite evidence exists.
- Full route screenshot matrix exists.
- Final handoff names residual risks.

## Risks

- Missing screenshots can hide route regressions.
- Small final fixes can drift outside frontend scope.
- Deployment may be requested later and needs a separate approval path.
