# Phase 05 - Motion Performance Accessibility

> Enter plan-first mode before editing. Execute this phase only, write durable evidence, and unlock FLG-06 only after acceptance gates pass.

**Goal:** Add progressive motion, rendering, container, and transparency behavior that respects accessibility and performance constraints.

**Architecture:** This phase enhances the completed visual system with feature detection and fallbacks.

**Tech Stack:** CSS feature queries, media queries, React shell, Playwright screenshots, existing audit scripts.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "FLG-05",
    "number": "05",
    "title": "Motion Performance Accessibility",
    "status": "planned",
    "type": "implementation",
    "repo_path": ".",
    "docs_path": "docs/frontend_liquid_glass_optimization_2026_06_21",
    "phase_file": "docs/frontend_liquid_glass_optimization_2026_06_21/phase-05-motion-performance-accessibility.md",
    "depends_on": [
      "FLG-04"
    ],
    "unlocks": [
      "FLG-06"
    ]
  },
  "goal": {
    "target": "Add progressive motion, rendering, container, and transparency behavior that respects accessibility and performance constraints.",
    "prompt": "Complete FLG-05 Motion Performance Accessibility by following docs/frontend_liquid_glass_optimization_2026_06_21/phase-05-motion-performance-accessibility.md; work on FLG-F006; add feature-detected route, scroll, container, rendering, focus, reduced motion, and reduced transparency behavior; finish after command gates, preference-state screenshots, audit evidence, and report updates.",
    "plan_required": true,
    "plan_output": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-05-motion-performance-accessibility-plan.md",
    "completion_report": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-05-motion-performance-accessibility-report.md"
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
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-05-motion-performance-accessibility.md"
    ],
    "primary_context": [
      "client/src/App.tsx",
      "client/src/main.tsx",
      "client/src/index.css",
      "client/src/styles/liquid-materials.css",
      "client/src/styles/public-components.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/agent-surfaces.css",
      "client/src/styles/owner-tools.css",
      "scripts/audit/ui-layout.ts",
      "scripts/audit/baseline.ts"
    ],
    "context_budget": "focused"
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/App.tsx",
      "client/src/main.tsx",
      "client/src/index.css",
      "client/src/styles/liquid-materials.css",
      "client/src/styles/public-components.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/agent-surfaces.css",
      "client/src/styles/owner-tools.css",
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-05-motion-performance-accessibility-report.md"
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
      "accessibility",
      "performance"
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
        "id": "baseline-audit",
        "cwd": ".",
        "command": "AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick",
        "expected": "Baseline audit completes and records quick evidence.",
        "required": true
      }
    ],
    "browser_checks": [
      "Capture /, /post/goal-harness-agent-phase-protocol, /archive, /manage, and /write in default, reduced motion, and reduced transparency states.",
      "Check no horizontal overflow at 390x844.",
      "Check focus outlines on navigation, buttons, forms, editor controls, and agent controls.",
      "Check contrast with backdrop-filter disabled."
    ],
    "regression_scope": [
      "No route changes.",
      "No dependency additions.",
      "No backend contract change.",
      "No public or owner page loses readable fallback behavior."
    ],
    "compliance_gates": [
      "Do not read secrets.",
      "Do not deploy.",
      "Do not mutate production data.",
      "Do not add unsupported required browser behavior without fallback.",
      "Do not revert existing user changes."
    ],
    "acceptance_gates": [
      "Reduced motion disables nonessential movement.",
      "Reduced transparency and unsupported blur produce solid readable surfaces.",
      "Container behavior avoids text overflow and layout shift.",
      "Long lists or article sections use rendering optimizations only where safe.",
      "Feature oracle FLG-F006 is updated."
    ],
    "rollback_plan": [
      "Restore FLG-05 scoped app, CSS, and harness docs from git if validation fails."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-05-motion-performance-accessibility-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "command evidence",
      "preference-state screenshots",
      "audit evidence",
      "feature-oracle evidence",
      "continuity-ledger update"
    ],
    "waiver_policy": "Only user-waived gates may be marked waived.",
    "next_phase_handoff": "FLG-06 receives full-site QA matrix, preference coverage, and remaining risks."
  },
  "stop_conditions": [
    "A required effect lacks a usable fallback.",
    "Motion cannot be disabled under reduced motion preference.",
    "Transparency cannot be reduced while preserving readability."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: FLG-05
- GOAL_TARGET: Add progressive motion, rendering, container, and transparency behavior that respects accessibility and performance constraints.
- GOAL_PROMPT: Complete FLG-05 Motion Performance Accessibility by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-05-motion-performance-accessibility.md`; work on feature-oracle item FLG-F006; preserve contracts; write command, audit, and preference screenshot evidence before unlocking FLG-06.
- DEPENDS_ON: FLG-04
- READ_FIRST: `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`, this file
- PRIMARY_CONTEXT: app shell, CSS entrypoints, material utilities, audit scripts, and route surfaces named in the machine contract
- LIKELY_EDIT_PATHS: app shell, CSS entrypoints, material utilities, and FLG-05 report files
- DO_NOT_EDIT: server files, database schema files, content markdown, deployment configuration, secret files
- EXECUTION_MODE: plan-first; add progressive effects; validate; capture preference-state evidence; hand off
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`; `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick`
- BROWSER_CHECKS: Capture key routes in default, reduced motion, reduced transparency, and blur-disabled states.
- REGRESSION_SCOPE: Preserve routes, dependencies, backend contracts, and readable fallback behavior.
- COMPLIANCE_GATES: Do not read secrets, deploy, mutate production data, add required unsupported browser behavior without fallback, or revert existing user changes.
- ROLLBACK_PLAN: Restore FLG-05 scoped app, CSS, and harness docs from git if validation fails.
- ACCEPTANCE_GATES: Reduced preferences work; fallbacks are readable; no overflow; focus is visible; FLG-F006 is updated.
- EVIDENCE_OUTPUT: `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-05-motion-performance-accessibility-report.md`
- STOP_CONDITIONS: Stop if an effect lacks fallback, motion cannot be reduced, or transparency cannot be reduced.

## Task Spec

Add final interaction polish using progressive platform features and accessibility-first fallbacks.

## Problem Boundary

In scope:

- Route transition polish with feature detection.
- Scroll progress or scroll-linked emphasis with fallback.
- Container-aware component behavior.
- Reduced motion, reduced transparency, focus, overflow, and contrast states.
- Safe rendering optimizations for long surfaces.

Out of scope:

- New animation library.
- Route changes.
- Backend changes.
- Deployment.

## Context Policy

Read source-backed technique notes in `source-packet.md` before adding effects. Inspect audit scripts only to understand current evidence collection.

## Requirements

### R1 Progressive Effects

Effects are layered behind feature detection and do not become required for comprehension.

### R2 Accessibility Preferences

Reduced motion and reduced transparency states are visibly supported.

### R3 Performance Care

Long pages and lists avoid unnecessary rendering work without hiding accessible content.

## Test and Regression Requirements

Execute command gates, baseline audit, and preference-state screenshots.

## Compliance and Safety Requirements

No secrets, deployment, production data, migration, destructive command, unsupported required browser behavior, or unrelated revert is allowed.

## Rollback and Recovery

Restore FLG-05 scoped edits if validation, audit, or preference checks fail.

## Execution Capture

Write `reports/flg-05-motion-performance-accessibility-report.md`, update FLG-F006 evidence, append progress, and update the next handoff.

## Evaluator Protocol

Reject completion if any visual effect has no fallback or if reduced preference states remain decorative only.

## Acceptance Criteria

- FLG-F006 has evidence.
- Preference-state screenshots exist.
- No horizontal overflow is recorded.
- Commands and audit pass or blockers are documented.

## Risks

- Motion polish can become distracting.
- Transparency can lower contrast.
- Rendering optimizations can hide content if applied carelessly.
