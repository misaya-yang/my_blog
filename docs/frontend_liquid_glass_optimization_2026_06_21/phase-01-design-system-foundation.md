# Phase 01 - Design System Foundation

> Enter plan-first mode before editing. Execute this phase only, write durable evidence, and unlock FLG-02 only after acceptance gates pass.

**Goal:** Replace broad material overrides with a compact, reusable Liquid Glass foundation and accessible fallbacks.

**Architecture:** This phase corrects the material layer without applying every page redesign. Page adoption happens in later phases.

**Tech Stack:** Vite, React 19, Tailwind v4 CSS imports, existing lucide-react and framer-motion dependencies.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "FLG-01",
    "number": "01",
    "title": "Design System Foundation",
    "status": "planned",
    "type": "implementation",
    "repo_path": ".",
    "docs_path": "docs/frontend_liquid_glass_optimization_2026_06_21",
    "phase_file": "docs/frontend_liquid_glass_optimization_2026_06_21/phase-01-design-system-foundation.md",
    "depends_on": [
      "FLG-00"
    ],
    "unlocks": [
      "FLG-02"
    ]
  },
  "goal": {
    "target": "Replace broad material overrides with a compact, reusable Liquid Glass foundation and accessible fallbacks.",
    "prompt": "Complete FLG-01 Design System Foundation by following docs/frontend_liquid_glass_optimization_2026_06_21/phase-01-design-system-foundation.md; work on FLG-F002; replace the broad liquid-materials.css behavior with compact utilities; preserve contracts; finish after pnpm check, pnpm test, pnpm build, browser smoke evidence, and report updates.",
    "plan_required": true,
    "plan_output": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-01-design-system-foundation-plan.md",
    "completion_report": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-01-design-system-foundation-report.md"
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
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-01-design-system-foundation.md"
    ],
    "primary_context": [
      "client/src/main.tsx",
      "client/src/index.css",
      "client/src/styles/liquid-materials.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/owner-tools.css",
      "package.json"
    ],
    "context_budget": "focused"
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/styles/liquid-materials.css",
      "client/src/index.css",
      "client/src/main.tsx",
      "docs/frontend_liquid_glass_optimization_2026_06_21/source-packet.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/continuity-ledger.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/progress-log.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/agent-handoff.md",
      "docs/frontend_liquid_glass_optimization_2026_06_21/feature-oracle.json",
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-01-design-system-foundation-report.md"
    ],
    "do_not_edit": [
      "client/src/App.tsx route definitions",
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
      "design-system",
      "accessibility"
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
        "id": "harness-validator",
        "cwd": ".",
        "command": "python3 /Users/yang/.codex/skills/prd-phase-harness/scripts/validate_harness_prd.py docs/frontend_liquid_glass_optimization_2026_06_21 --strict --quality-score",
        "expected": "Harness validation passes with a usable or excellent score.",
        "required": true
      },
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
      "Capture / and /post/goal-harness-agent-phase-protocol at 390x844 and 1440x1000 after the foundation change.",
      "Check that blur-disabled fallback keeps header, panel, and button text readable.",
      "Check reduced motion and reduced transparency states on the same routes."
    ],
    "regression_scope": [
      "No route changes.",
      "No new package.",
      "No server or database change.",
      "Existing dirty-tree changes stay intact."
    ],
    "compliance_gates": [
      "Do not read secrets.",
      "Do not deploy.",
      "Do not mutate production data.",
      "Do not revert existing user changes."
    ],
    "acceptance_gates": [
      "liquid-materials.css becomes a compact utility foundation instead of a page-specific override file.",
      "Reduced transparency and unsupported backdrop-filter fallbacks are present.",
      "Reduced motion handling is present for material transitions.",
      "Command evidence and screenshot evidence are recorded.",
      "Feature oracle FLG-F002 is updated."
    ],
    "rollback_plan": [
      "Restore FLG-01 scoped CSS and harness docs from git if validation fails."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-01-design-system-foundation-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "command evidence",
      "screenshot evidence",
      "feature-oracle evidence",
      "continuity-ledger update"
    ],
    "waiver_policy": "Only user-waived gates may be marked waived.",
    "next_phase_handoff": "FLG-02 receives the compact utility class list and page adoption boundaries."
  },
  "stop_conditions": [
    "A new dependency is required.",
    "Route or API changes are required.",
    "The compact utility layer cannot pass build validation."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: FLG-01
- GOAL_TARGET: Replace broad material overrides with a compact, reusable Liquid Glass foundation and accessible fallbacks.
- GOAL_PROMPT: Complete FLG-01 Design System Foundation by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-01-design-system-foundation.md`; work on feature-oracle item FLG-F002; preserve public contracts; write command and browser evidence before unlocking FLG-02.
- DEPENDS_ON: FLG-00
- READ_FIRST: `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/main.tsx`, `client/src/index.css`, `client/src/styles/liquid-materials.css`, `client/src/styles/visual-refresh.css`, `client/src/styles/owner-tools.css`, `package.json`
- LIKELY_EDIT_PATHS: `client/src/styles/liquid-materials.css`, `client/src/index.css`, `client/src/main.tsx`, harness reports and runtime docs
- DO_NOT_EDIT: route definitions, server files, schema files, content markdown, deployment configuration, secret files
- EXECUTION_MODE: plan-first; implement foundation; validate; capture browser evidence; hand off
- VALIDATION_COMMANDS: harness validator; `pnpm check`; `pnpm test`; `pnpm build`
- BROWSER_CHECKS: Capture `/` and `/post/goal-harness-agent-phase-protocol` at mobile and desktop sizes with default, reduced motion, and reduced transparency modes.
- REGRESSION_SCOPE: Preserve routes, packages, backend contracts, and dirty-tree changes.
- COMPLIANCE_GATES: Do not read secrets, deploy, mutate production data, or revert existing user changes.
- ROLLBACK_PLAN: Restore FLG-01 scoped CSS and harness docs from git if validation fails.
- ACCEPTANCE_GATES: Compact utility foundation exists; fallbacks exist; commands pass; screenshots are recorded; FLG-F002 is updated.
- EVIDENCE_OUTPUT: `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-01-design-system-foundation-report.md`
- STOP_CONDITIONS: Stop if a new dependency, route change, API change, or invalid build is required.

## Task Spec

Correct the design system base by shrinking the material layer into reusable classes and fallbacks. Do not redesign all pages in this phase.

## Problem Boundary

In scope:

- Material tokens and utility classes.
- Backdrop-filter support fallback.
- Reduced transparency fallback.
- Reduced motion fallback.
- Import continuity.

Out of scope:

- Per-page redesign.
- Route changes.
- Server or database changes.
- New packages.

## Context Policy

Read the FLG-00 report and only the style entrypoints named in `PRIMARY_CONTEXT`. Inspect a component only if a class name must be verified before removing a selector.

## Requirements

### R1 Compact Material API

Provide a small class vocabulary such as `liquid-surface`, `liquid-panel`, `liquid-control`, `liquid-nav`, `liquid-readable`, and `liquid-opaque`.

### R2 Accessible Fallbacks

Every translucent class has solid background behavior under unsupported blur and reduced transparency.

### R3 Motion Restraint

Material hover/focus motion respects reduced motion.

## Test and Regression Requirements

Execute harness validation, typecheck, unit tests, production build, and targeted screenshots.

## Compliance and Safety Requirements

No secrets, deployment, production data, migration, destructive command, or unrelated revert is allowed.

## Rollback and Recovery

If validation fails, restore only FLG-01 scoped CSS/docs from git and document the failure.

## Execution Capture

Write `reports/flg-01-design-system-foundation-report.md`, update FLG-F002 evidence, append progress, and update the next handoff.

## Evaluator Protocol

Reject completion if `liquid-materials.css` remains a broad page-specific override layer or if reduced transparency fallback is absent.

## Acceptance Criteria

- FLG-F002 has evidence.
- The material layer is compact and documented.
- Commands pass or blockers are documented.
- Browser evidence exists for mobile and desktop.

## Risks

- A global cascade can recreate the disliked color outcome.
- Transparency without fallback can damage readability.
- Motion without reduction support can harm accessibility.
