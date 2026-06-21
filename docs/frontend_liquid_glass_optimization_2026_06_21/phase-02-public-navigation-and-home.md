# Phase 02 - Public Navigation And Home

> Enter plan-first mode before editing. Execute this phase only, write durable evidence, and unlock FLG-03 only after acceptance gates pass.

**Goal:** Apply the material system to public navigation, home, and public discovery shells across desktop and mobile.

**Architecture:** This phase uses the FLG-01 utility layer through shared public components and page-scoped classes.

**Tech Stack:** React pages, Wouter routes, Tailwind v4 CSS imports, existing shared components.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "FLG-02",
    "number": "02",
    "title": "Public Navigation And Home",
    "status": "planned",
    "type": "implementation",
    "repo_path": ".",
    "docs_path": "docs/frontend_liquid_glass_optimization_2026_06_21",
    "phase_file": "docs/frontend_liquid_glass_optimization_2026_06_21/phase-02-public-navigation-and-home.md",
    "depends_on": [
      "FLG-01"
    ],
    "unlocks": [
      "FLG-03"
    ]
  },
  "goal": {
    "target": "Apply the material system to public navigation, home, and public discovery shells across desktop and mobile.",
    "prompt": "Complete FLG-02 Public Navigation And Home by following docs/frontend_liquid_glass_optimization_2026_06_21/phase-02-public-navigation-and-home.md; work on FLG-F003; apply the compact material system to public navigation, home, tracks, archive, search, taxonomy, about, login, and NotFound; finish after command gates, screenshots, and report updates.",
    "plan_required": true,
    "plan_output": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-02-public-navigation-and-home-plan.md",
    "completion_report": "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-02-public-navigation-and-home-report.md"
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
      "docs/frontend_liquid_glass_optimization_2026_06_21/phase-02-public-navigation-and-home.md"
    ],
    "primary_context": [
      "client/src/components/ResearchShell.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/SeriesProgress.tsx",
      "client/src/components/SubscriptionForm.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/Track.tsx",
      "client/src/pages/Archive.tsx",
      "client/src/pages/Search.tsx",
      "client/src/pages/TaxonomyPage.tsx",
      "client/src/pages/About.tsx",
      "client/src/pages/Login.tsx",
      "client/src/pages/NotFound.tsx",
      "client/src/styles/public-components.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/liquid-materials.css"
    ],
    "context_budget": "focused"
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/components/ResearchShell.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/SeriesProgress.tsx",
      "client/src/components/SubscriptionForm.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/Track.tsx",
      "client/src/pages/Archive.tsx",
      "client/src/pages/Search.tsx",
      "client/src/pages/TaxonomyPage.tsx",
      "client/src/pages/About.tsx",
      "client/src/pages/Login.tsx",
      "client/src/pages/NotFound.tsx",
      "client/src/styles/public-components.css",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/liquid-materials.css",
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-02-public-navigation-and-home-report.md"
    ],
    "do_not_edit": [
      "server files",
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
      "public-pages",
      "responsive"
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
      }
    ],
    "browser_checks": [
      "Capture /, /algorithms, /applications, /archive, /search?q=zzzz-no-hit-ui-audit, /tags/agent-systems, /categories/ai-applications, /about, /login, and /404 at 390x844, 768x1024, 1440x1000, and 1728x1117.",
      "Check header height at or below 72px.",
      "Check mobile Start here actions are not compressed.",
      "Check empty, loading, and error states on search and archive surfaces."
    ],
    "regression_scope": [
      "No backend contracts change.",
      "No owner tool redesign in this phase.",
      "Article reader changes stay outside this phase unless a shared component requires compatibility."
    ],
    "compliance_gates": [
      "Do not read secrets.",
      "Do not deploy.",
      "Do not mutate production data.",
      "Do not revert existing user changes."
    ],
    "acceptance_gates": [
      "Public routes share material language through shared components and page-scoped classes.",
      "Home first screen uses an asymmetric bento layout with clear next action.",
      "Discovery pages have clear empty, loading, and error states.",
      "Screenshots cover all public routes and viewports.",
      "Feature oracle FLG-F003 is updated."
    ],
    "rollback_plan": [
      "Restore FLG-02 scoped components, pages, CSS, and harness docs from git if validation fails."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-02-public-navigation-and-home-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "command evidence",
      "public route screenshots",
      "feature-oracle evidence",
      "continuity-ledger update"
    ],
    "waiver_policy": "Only user-waived gates may be marked waived.",
    "next_phase_handoff": "FLG-03 receives public shared component changes and reader compatibility notes."
  },
  "stop_conditions": [
    "A route contract change is required.",
    "A new dependency is required.",
    "Public screenshots show unreadable contrast after supported fallback states."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: FLG-02
- GOAL_TARGET: Apply the material system to public navigation, home, and public discovery shells across desktop and mobile.
- GOAL_PROMPT: Complete FLG-02 Public Navigation And Home by following `docs/frontend_liquid_glass_optimization_2026_06_21/phase-02-public-navigation-and-home.md`; work on feature-oracle item FLG-F003; preserve contracts; write command and screenshot evidence before unlocking FLG-03.
- DEPENDS_ON: FLG-01
- READ_FIRST: `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`, `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`, this file
- PRIMARY_CONTEXT: public components, public pages, public CSS, and compact material utilities named in the machine contract
- LIKELY_EDIT_PATHS: public components, public pages, public CSS, compact material utilities, and FLG-02 report files
- DO_NOT_EDIT: server files, database schema files, owner editor pages, content markdown, deployment configuration, secret files
- EXECUTION_MODE: plan-first; implement public pages; validate; capture screenshots; hand off
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`; `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui`
- BROWSER_CHECKS: Capture the public route matrix at all required viewports and inspect header height, mobile action layout, empty states, loading states, and error states.
- REGRESSION_SCOPE: Preserve backend contracts, owner workflows, and reader behavior outside shared compatibility.
- COMPLIANCE_GATES: Do not read secrets, deploy, mutate production data, or revert existing user changes.
- ROLLBACK_PLAN: Restore FLG-02 scoped components, pages, CSS, and harness docs from git if validation fails.
- ACCEPTANCE_GATES: Public routes share material language; home bento works; discovery states are clear; screenshots exist; FLG-F003 is updated.
- EVIDENCE_OUTPUT: `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-02-public-navigation-and-home-report.md`
- STOP_CONDITIONS: Stop if a route contract, new package, or unreadable fallback is required.

## Task Spec

Redesign the public navigation, home, and discovery surfaces using the compact material foundation from FLG-01.

## Problem Boundary

In scope:

- Header and public shell.
- Home hero/bento and start actions.
- Track, archive, search, taxonomy, about, login, and NotFound pages.
- Public empty, loading, and error states.

Out of scope:

- Article reader.
- Agent companion internals.
- Owner tools.
- Backend contracts.

## Context Policy

Load public component and page files named above. Inspect shared styles before adding selectors.

## Requirements

### R1 Public Coherence

All public routes share one material vocabulary and avoid duplicate CTA intent.

### R2 Home First Screen

The first viewport is an asymmetric bento with narrative/search, track panels, and a latest-note action.

### R3 Responsive States

Mobile layouts stack predictably and text does not overflow controls.

## Test and Regression Requirements

Execute command gates and capture the public route screenshot matrix.

## Compliance and Safety Requirements

No secrets, deployment, production data, migration, destructive command, or unrelated revert is allowed.

## Rollback and Recovery

Restore FLG-02 scoped edits if validation or screenshots fail.

## Execution Capture

Write `reports/flg-02-public-navigation-and-home-report.md`, update FLG-F003 evidence, append progress, and update the next handoff.

## Evaluator Protocol

Reject completion if any public route lacks screenshot evidence or if the home/start actions remain compressed.

## Acceptance Criteria

- FLG-F003 has evidence.
- Public route screenshots exist for all required viewports.
- Header, cards, controls, and empty states use the shared material system.
- Commands pass or blockers are documented.

## Risks

- Over-polishing public pages can reduce research-site clarity.
- Shared components can affect reader pages.
- Mobile CTA compression can return if dimensions are not stable.
