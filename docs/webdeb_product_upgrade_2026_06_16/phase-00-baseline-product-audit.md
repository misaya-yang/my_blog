# Phase 00 - Baseline Product Audit

> For agentic workers: this phase is already completed during harness creation. Re-run only if the codebase has materially changed or WPU-01 evidence is stale.

**Goal:** Record current product, UI, Agent, writing, content, and release baseline evidence.

**Architecture:** This phase establishes the source facts and unlocks reader IA work. It does not change business code.

**Tech Stack:** Vite, React, TypeScript, Tailwind v4, Radix/shadcn-style local components, wouter, Express, tRPC, Drizzle, PostgreSQL, Vitest, seeded Markdown content, OpenAI-compatible Agent adapter.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "WPU-00",
    "number": "00",
    "title": "Baseline Product Audit",
    "status": "passed",
    "type": "baseline",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/webdeb_product_upgrade_2026_06_16",
    "phase_file": "docs/webdeb_product_upgrade_2026_06_16/phase-00-baseline-product-audit.md",
    "depends_on": [],
    "unlocks": ["WPU-01"]
  },
  "goal": {
    "target": "Record current product, UI, Agent, writing, content, and release baseline evidence.",
    "prompt": "Complete WPU-00 Baseline Product Audit for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-00-baseline-product-audit.md`; update WPU-F001; do not edit business code; finish only after validation evidence, screenshot evidence, source packet writeback, continuity ledger update, and report evidence are recorded.",
    "plan_required": true,
    "plan_output": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-00-baseline-product-audit-plan.md",
    "completion_report": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-00-baseline-product-audit-report.md"
  },
  "runtime": {
    "feature_oracle": "docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json",
    "loop_contract": "docs/webdeb_product_upgrade_2026_06_16/loop-contract.json",
    "loop_state": "docs/webdeb_product_upgrade_2026_06_16/loop-state.json",
    "progress_log": "docs/webdeb_product_upgrade_2026_06_16/progress-log.md",
    "handoff": "docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md",
    "continuity_ledger": "docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md",
    "next_window_prompt": "docs/webdeb_product_upgrade_2026_06_16/next-window-prompt.md",
    "session_boot": {
      "read_progress": true,
      "run_baseline_check": true,
      "update_progress_before_exit": true
    },
    "agent_roles": ["planner", "generator", "evaluator"]
  },
  "context": {
    "read_first": [
      "docs/webdeb_product_upgrade_2026_06_16/README.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md",
      "docs/webdeb_product_upgrade_2026_06_16/source-packet.md",
      "docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json",
      "docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-00-baseline-product-audit.md"
    ],
    "primary_context": [
      "package.json",
      "client/src/App.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/PostDetail.tsx",
      "client/src/components/agent/BlogAgentRoot.tsx",
      "server/ai/router.ts",
      "server/ai/harness.ts",
      "server/ai/model.ts",
      "server/routers.ts",
      "seed-blog.mjs",
      "docs/product_optimization/README.md",
      "docs/agent_prd/README.md"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "external dashboards",
      "production environments",
      "unrelated repos"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "docs/webdeb_product_upgrade_2026_06_16/**"
    ],
    "do_not_edit": [
      "client/src/**",
      "server/**",
      "shared/**",
      "seed-blog.mjs",
      "package.json",
      ".env*",
      "production systems"
    ],
    "external_inputs": [],
    "secrets_required": []
  },
  "tool_policy": {
    "allowed_tools": [
      "repo search",
      "shell validation",
      "browser screenshot",
      "subagent read-only review"
    ],
    "approval_required": [
      "production data mutation",
      "deployment",
      "external service changes",
      "destructive commands"
    ],
    "dangerous_commands": [
      "git reset --hard",
      "rm -rf",
      "production migration",
      "force push"
    ]
  },
  "risk": {
    "tags": ["baseline", "ui", "agent", "release"],
    "data_mutation": false,
    "migration_required": false,
    "browser_required": true,
    "ai_eval_required": false,
    "external_service_required": false,
    "release_blocking": false
  },
  "validation": {
    "commands": [
      {
        "id": "typecheck",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm check",
        "expected": "TypeScript check passes.",
        "required": true
      },
      {
        "id": "tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm test",
        "expected": "Vitest suite passes or existing warnings are documented.",
        "required": true
      },
      {
        "id": "content-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:audit",
        "expected": "Content audit reports zero failures or documents blockers.",
        "required": true
      }
    ],
    "browser_checks": [
      "Capture / at 1440x900.",
      "Capture / at 390x844.",
      "Capture /post/goal-harness-agent-phase-protocol at 1440x900."
    ],
    "regression_scope": [
      "No business code changes.",
      "Existing user changes are not reverted."
    ],
    "compliance_gates": [
      "Do not read or write secrets.",
      "Do not mutate production data.",
      "Do not deploy."
    ],
    "acceptance_gates": [
      "WPU-00 report exists.",
      "WPU-F001 is passing with evidence.",
      "source-packet.md names current system shape and risks.",
      "continuity-ledger.md names next implementation boundary."
    ],
    "rollback_plan": [
      "Remove docs/webdeb_product_upgrade_2026_06_16 if the harness is rejected before implementation begins."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-00-baseline-product-audit-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "command output summary",
      "screenshot evidence",
      "source packet",
      "continuity ledger"
    ],
    "waiver_policy": "Only mark a validation waived when the user explicitly waives it and the report records remaining risk.",
    "next_phase_handoff": "WPU-01 is unlocked when the baseline report and oracle evidence exist."
  },
  "stop_conditions": [
    "Validation cannot run and no blocker can be documented.",
    "A requested evidence source requires credentials or production access.",
    "The task expands into business-code implementation."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: WPU-00
- GOAL_TARGET: Record current product, UI, Agent, writing, content, and release baseline evidence.
- GOAL_PROMPT: Complete WPU-00 Baseline Product Audit for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-00-baseline-product-audit.md`; work on feature-oracle item WPU-F001; do not edit business code; finish only after validation evidence, screenshot evidence, source packet writeback, continuity ledger update, and report evidence are recorded.
- DEPENDS_ON: none
- READ_FIRST: `docs/webdeb_product_upgrade_2026_06_16/README.md`, `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `package.json`, `client/src/App.tsx`, `client/src/pages/Home.tsx`, `client/src/pages/PostDetail.tsx`, `client/src/components/agent/BlogAgentRoot.tsx`, `server/ai/router.ts`, `server/ai/harness.ts`, `server/ai/model.ts`, `server/routers.ts`, `seed-blog.mjs`, `docs/product_optimization/README.md`, `docs/agent_prd/README.md`
- LIKELY_EDIT_PATHS: `docs/webdeb_product_upgrade_2026_06_16/**`
- DO_NOT_EDIT: `client/src/**`, `server/**`, `shared/**`, `seed-blog.mjs`, `package.json`, `.env*`, production systems
- EXECUTION_MODE: plan-first; verify; record; hand off
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm content:audit`
- BROWSER_CHECKS: `/` at 1440x900 and 390x844; `/post/goal-harness-agent-phase-protocol` at 1440x900
- REGRESSION_SCOPE: no business code changes; no user changes reverted
- COMPLIANCE_GATES: no secrets; no production data mutation; no deployment
- ROLLBACK_PLAN: remove `docs/webdeb_product_upgrade_2026_06_16` before implementation if the harness is rejected
- ACCEPTANCE_GATES: report exists; WPU-F001 passing; source packet updated; continuity ledger updated
- EVIDENCE_OUTPUT: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-00-baseline-product-audit-report.md`
- STOP_CONDITIONS: stop if evidence needs credentials, production access, destructive commands, or business-code edits

## Task Spec

Capture the current baseline and unlock WPU-01. This has been completed in the report.

## Context Policy

Load the harness runtime files first, then inspect only the repository files named in the Machine Contract unless the baseline evidence is missing or contradictory. Treat Product Design audit notes, multi-agent findings, validation logs, and screenshots as the authoritative WPU-00 context.

## Problem Boundary

In scope: documentation, source facts, test evidence, screenshot evidence, and next-phase handoff.

Out of scope: UI implementation, Agent implementation, content source migration, release, and deployment.

## Requirements

### R1 Validation Evidence

Record typecheck, tests, and content audit outcomes.

### R2 Product Evidence

Record public home and article screenshots and summarize observable product issues.

### R3 Handoff Evidence

Update source packet, continuity ledger, oracle, progress log, and handoff.

## Test and Regression Requirements

Run the commands named in `VALIDATION_COMMANDS` or document blockers.

## Compliance and Safety Requirements

Do not read secrets, mutate production data, or deploy.

## Rollback and Recovery

Delete the new harness folder before implementation if the user rejects the roadmap.

## Execution Capture

Report: `reports/wpu-00-baseline-product-audit-report.md`.

## Evaluator Protocol

Confirm the report cites command evidence, screenshot evidence, source packet writeback, and WPU-F001 status.

## Acceptance Criteria

WPU-00 is accepted when WPU-F001 is passing and WPU-01 has a clear next-window prompt.

## Risks

Baseline can go stale after code changes. If implementation is delayed, re-run WPU-00 command and screenshot checks before WPU-01.
