# Phase 03 - Reader Discovery And Agent

> Enter plan-first mode before editing. Execute this phase only, write durable evidence, and unlock FLG-04 only after acceptance gates pass.

**Goal:** Apply layered material surfaces to the article reader, discovery cards, TOC/actions, and agent companion while preserving high-contrast reading.

**Architecture:** This phase uses the FLG-01 utility layer and FLG-02 shared component changes without altering route, agent API, or markdown contracts.

**Tech Stack:** React reader page, MarkdownRenderer, BlogAgentRoot, agent CSS, existing test suite.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "FLG-03",
    "number": "03",
    "title": "Reader Discovery And Agent",
    "status": "planned",
    "type": "implementation",
    "repo_path": ".",
    "docs_path": "docs/frontend_liquid_glass_optimization_2026_06_21",
    "phase_file": "docs/frontend_liquid_glass_optimization_2026_06_21/phase-03-reader-discovery-and-agent.md",
    "depends_on": [
      "FLG-02"
    ],
    "unlocks": [
      "FLG-04"
    ]
  },
  "goal": {
    "target": "Apply layered material surfaces to the article reader, discovery cards, TOC/actions, and agent companion while preserving high-contrast reading.",
    "prompt": "Complete FLG-03 Reader Discovery And Agent by following docs/frontend_liquid_glass_optimization_2026_06_21/phase-03-reader-discovery-and-agent.md; work on FLG-F004; apply the material system to reader rails, actions, summary panels, discovery cards, and agent companion; keep prose, code, formulas, tables, and source cards readable; finish after command gates, reader screenshots, agent-open screenshots, and report updates.",
    "plan_required": true,
    "plan_output": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-03-reader-discovery-and-agent-plan.md",
    "completion_report": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-03-reader-discovery-and-agent-report.md"
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
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-03-reader-discovery-and-agent.md"
    ],
    "primary_context": [
      "client/src/pages/PostDetail.tsx",
      "client/src/components/MarkdownRenderer.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/agent/BlogAgentRoot.tsx",
      "client/src/components/agent/types.ts",
      "client/src/styles/agent-surfaces.css",
      "client/src/styles/public-components.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/liquid-materials.css",
      "client/src/i18n/agent.ts",
      "client/src/i18n/post.ts"
    ],
    "context_budget": "focused"
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/pages/PostDetail.tsx",
      "client/src/components/MarkdownRenderer.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/agent/BlogAgentRoot.tsx",
      "client/src/styles/agent-surfaces.css",
      "client/src/styles/public-components.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/liquid-materials.css",
      "client/src/i18n/agent.ts",
      "client/src/i18n/post.ts",
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-03-reader-discovery-and-agent-report.md"
    ],
    "do_not_edit": [
      "agent server routes",
      "database schema files",
      "owner editor pages",
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
      "agent API change",
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
      "reader",
      "agent"
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
      "Capture /post/goal-harness-agent-phase-protocol at 390x844, 768x1024, 1440x1000, and 1728x1117.",
      "Capture agent launcher closed and open states on / and /post/goal-harness-agent-phase-protocol.",
      "Check markdown prose, code blocks, formulas, tables, TOC/action rail, summary panels, and source cards for readable contrast."
    ],
    "regression_scope": [
      "No agent API contract change.",
      "No content markdown rewrite.",
      "No owner tool redesign in this phase."
    ],
    "compliance_gates": [
      "Do not read secrets.",
      "Do not deploy.",
      "Do not mutate production data.",
      "Do not alter agent server contracts without approval.",
      "Do not revert existing user changes."
    ],
    "acceptance_gates": [
      "Reader rails and action surfaces use the material system.",
      "Prose, code, formulas, tables, and source cards remain high contrast.",
      "Agent launcher resembles a compact layered pill and panel surfaces remain readable.",
      "Reader and agent screenshots exist.",
      "Feature oracle FLG-F004 is updated."
    ],
    "rollback_plan": [
      "Restore FLG-03 scoped reader, agent, CSS, i18n, and harness docs from git if validation fails."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-03-reader-discovery-and-agent-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "command evidence",
      "reader screenshots",
      "agent-open screenshots",
      "feature-oracle evidence",
      "continuity-ledger update"
    ],
    "waiver_policy": "Only user-waived gates may be marked waived.",
    "next_phase_handoff": "FLG-04 receives reader and agent compatibility notes before owner/editor work."
  },
  "stop_conditions": [
    "An agent API change is required.",
    "Markdown content rewrite is required.",
    "Reader fallback contrast is unreadable."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: FLG-03
- GOAL_TARGET: Apply layered material surfaces to the article reader, discovery cards, TOC/actions, and agent companion while preserving high-contrast reading.
- GOAL_PROMPT: Complete FLG-03 Reader Discovery And Agent by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-03-reader-discovery-and-agent.md`; work on feature-oracle item FLG-F004; preserve reader and agent contracts; write command and screenshot evidence before unlocking FLG-04.
- DEPENDS_ON: FLG-02
- READ_FIRST: `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `PostDetail.tsx`, `MarkdownRenderer.tsx`, `ArticleCard.tsx`, `BlogAgentRoot.tsx`, `agent-surfaces.css`, public CSS, material utilities, agent/post i18n files
- LIKELY_EDIT_PATHS: reader page, markdown renderer, article cards, agent shell, agent CSS, public CSS, material utilities, i18n files, and FLG-03 report files
- DO_NOT_EDIT: agent server routes, database schema files, owner editor pages, content markdown, deployment configuration, secret files
- EXECUTION_MODE: plan-first; implement reader and agent surfaces; validate; capture screenshots; hand off
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`
- BROWSER_CHECKS: Capture article and agent-open states across required viewports and inspect prose, code, formulas, tables, TOC/actions, and source cards.
- REGRESSION_SCOPE: Preserve agent API contracts, content markdown, and owner workflow behavior.
- COMPLIANCE_GATES: Do not read secrets, deploy, mutate production data, alter agent server contracts without approval, or revert existing user changes.
- ROLLBACK_PLAN: Restore FLG-03 scoped reader, agent, CSS, i18n, and harness docs from git if validation fails.
- ACCEPTANCE_GATES: Reader and agent surfaces use material language; dense content remains readable; screenshots exist; FLG-F004 is updated.
- EVIDENCE_OUTPUT: `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-03-reader-discovery-and-agent-report.md`
- STOP_CONDITIONS: Stop if agent API changes, content rewrites, or unreadable fallback contrast are required.

## Task Spec

Make the reader and agent feel layered and Apple-grade while keeping comprehension and source readability dominant.

## Problem Boundary

In scope:

- Article reader rails, TOC, summary, actions, and discovery cards.
- Agent launcher, panel, messages, and source-card shell.
- Reader and agent responsive behavior.

Out of scope:

- Agent backend behavior.
- Content markdown rewrites.
- Owner dashboards and editor.
- Route contract changes.

## Context Policy

Inspect reader and agent files listed above. Inspect tests only when a component change requires test evidence.

## Requirements

### R1 Reader Clarity

Long-form prose, code, formulas, and tables stay more opaque than decorative surfaces.

### R2 Agent Layering

The launcher becomes a compact pill and the panel feels layered without lowering message readability.

### R3 Discovery Continuity

ArticleCard and related discovery surfaces stay consistent with FLG-02 public pages.

## Test and Regression Requirements

Execute command gates and capture reader plus agent-open screenshots.

## Compliance and Safety Requirements

No secrets, deployment, production data, migration, destructive command, agent API change, or unrelated revert is allowed.

## Rollback and Recovery

Restore FLG-03 scoped edits if validation or screenshots fail.

## Execution Capture

Write `reports/flg-03-reader-discovery-and-agent-report.md`, update FLG-F004 evidence, append progress, and update the next handoff.

## Evaluator Protocol

Reject completion if reading surfaces become translucent in a way that hurts contrast or if source cards are hard to scan.

## Acceptance Criteria

- FLG-F004 has evidence.
- Reader and agent screenshots exist for required viewports.
- Commands pass or blockers are documented.
- Reader and agent contracts are preserved.

## Risks

- Glass effects can reduce article readability.
- Agent shell decoration can obscure source evidence.
- Shared discovery components can regress public pages.
