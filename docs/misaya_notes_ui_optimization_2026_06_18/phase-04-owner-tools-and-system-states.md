# Phase 04 - Owner Tools And System States

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance to the next phase until acceptance gates pass or blockers are documented.

**Goal:** Bring owner-only manage, write, login, and Agent Ops states into the same design language while preserving auth and content boundaries.

**Architecture:** This phase applies the foundation and public-reader visual system to operational surfaces: authenticated dashboards, unauthenticated guard screens, editor states, manage tables, and Agent Ops diagnostics.

**Tech Stack:** React owner pages, auth hook, tRPC admin procedures, Tailwind CSS, shadcn primitives, owner-tools CSS, i18n dictionaries, Vitest tests.

---

## Machine Contract

The JSON block below is the authoritative machine-readable contract for goal-mode agents and validators. Keep it synchronized with the human-readable sections.

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "MNUI-04",
    "number": "04",
    "title": "Owner Tools And System States",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/misaya_notes_ui_optimization_2026_06_18",
    "phase_file": "docs/misaya_notes_ui_optimization_2026_06_18/phase-04-owner-tools-and-system-states.md",
    "depends_on": [
      "MNUI-03"
    ],
    "unlocks": [
      "MNUI-05"
    ]
  },
  "goal": {
    "target": "Bring owner-only manage, write, login, and Agent Ops states into the same design language while preserving auth and content boundaries.",
    "prompt": "Complete MNUI-04 Owner Tools And System States for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-04-owner-tools-and-system-states.md`; work on feature-oracle item MNUI-F005; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-plan.md",
    "completion_report": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md"
  },
  "runtime": {
    "feature_oracle": "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
    "loop_contract": "docs/misaya_notes_ui_optimization_2026_06_18/loop-contract.json",
    "loop_state": "docs/misaya_notes_ui_optimization_2026_06_18/loop-state.json",
    "progress_log": "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
    "handoff": "docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md",
    "continuity_ledger": "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
    "next_window_prompt": "docs/misaya_notes_ui_optimization_2026_06_18/next-window-prompt.md",
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
      "docs/misaya_notes_ui_optimization_2026_06_18/README.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/phase-manifest.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/loop-contract.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/loop-state.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/next-window-prompt.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/phase-04-owner-tools-and-system-states.md"
    ],
    "primary_context": [
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/manage-desktop.png",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/core.card.html",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/forms.card.html",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Badge.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Button.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/Input.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/Textarea.jsx",
      "client/src/pages/Manage.tsx",
      "client/src/pages/Editor.tsx",
      "client/src/pages/ManageAgent.tsx",
      "client/src/pages/Login.tsx",
      "client/src/components/DashboardLayout.tsx",
      "client/src/components/DashboardLayoutSkeleton.tsx",
      "client/src/styles/owner-tools.css",
      "client/src/i18n/manage.ts",
      "client/src/i18n/editor.ts",
      "client/src/i18n/login.ts",
      "client/src/i18n/agentOps.ts",
      "client/src/_core/hooks/useAuth.ts",
      "server/blogAdminProcedure.ts",
      "server/routers.ts"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "external dashboards",
      "production environments",
      "credential-bearing files",
      "modules outside this phase boundary"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/pages/Manage.tsx",
      "client/src/pages/Editor.tsx",
      "client/src/pages/ManageAgent.tsx",
      "client/src/pages/Login.tsx",
      "client/src/components/DashboardLayout.tsx",
      "client/src/components/DashboardLayoutSkeleton.tsx",
      "client/src/styles/owner-tools.css",
      "client/src/i18n/manage.ts",
      "client/src/i18n/editor.ts",
      "client/src/i18n/login.ts",
      "client/src/i18n/agentOps.ts",
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-04/"
    ],
    "do_not_edit": [
      "auth/session server semantics unless a security blocker is recorded",
      "drizzle/**",
      "seed-blog.mjs",
      "public article content",
      "payment/provider dashboards",
      ".env*",
      "deployment configuration"
    ],
    "external_inputs": [
      "/Users/yang/Downloads/Misaya Notes Design System",
      "local browser screenshots from the developer machine",
      "local dev server at http://localhost:3000 when started by the phase runner"
    ],
    "secrets_required": []
  },
  "tool_policy": {
    "allowed_tools": [
      "repo search with rg",
      "shell validation commands",
      "local dev server",
      "Playwright or browser screenshot capture",
      "image inspection for downloaded references"
    ],
    "approval_required": [
      "production deployment",
      "production database mutation",
      "schema migration",
      "DNS/provider dashboard change",
      "new dependency installation",
      "destructive git operation"
    ],
    "dangerous_commands": [
      "git reset --hard",
      "rm -rf",
      "drizzle-kit push against production",
      "DROP or TRUNCATE SQL",
      "vercel deploy --prod without approval"
    ]
  },
  "risk": {
    "tags": [
      "ui",
      "frontend",
      "browser",
      "auth",
      "security"
    ],
    "data_mutation": false,
    "migration_required": false,
    "browser_required": true,
    "ai_eval_required": false,
    "external_service_required": false,
    "release_blocking": true
  },
  "validation": {
    "commands": [
      {
        "id": "typecheck",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm check",
        "expected": "TypeScript completes with exit code 0.",
        "required": true
      },
      {
        "id": "owner-related-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm exec vitest run client/src/components/ErrorBoundary.test.tsx scripts/audit/publish-freshness.test.ts shared/content-ops.test.ts",
        "expected": "Owner-adjacent tests complete with exit code 0.",
        "required": true
      },
      {
        "id": "build",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm build",
        "expected": "Production build completes with exit code 0.",
        "required": true
      },
      {
        "id": "quick-route-baseline",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick",
        "expected": "Owner-route guard and public-route baseline evidence is recorded.",
        "required": true
      }
    ],
    "browser_checks": [
      "At 1440x900 capture `/manage`, `/write`, `/manage/agent`, and `/login`; if authenticated state is unavailable, capture the unauthenticated guard and record missing auth as a blocker for authenticated layout evidence.",
      "At 390x844 capture `/login`, `/manage`, and `/manage/agent` guard or authenticated state and verify panels, buttons, tables, and forms do not overflow.",
      "Exercise keyboard focus through login actions, dashboard nav, table controls, editor title/content fields, save actions, and Agent Ops filters when those controls are visible.",
      "Verify public Blog Agent stays hidden on owner and login routes while owner Agent Ops diagnostics remain separated from public companion UI."
    ],
    "regression_scope": [
      "Auth and permission boundaries remain unchanged.",
      "Owner-only routes do not become discoverable through public navigation for non-admin users.",
      "Editor, Manage, and Agent Ops data mutation controls keep existing confirmation, disabled, loading, and error behavior.",
      "Public reader design remains stable after owner CSS updates."
    ],
    "compliance_gates": [
      "Auth: unauthenticated users see guard states and cannot access owner tools.",
      "Security: no secret, token, session identifier, draft content, or admin metadata appears in public screenshots or reports.",
      "Data mutation: do not publish, delete, seed, migrate, or alter persistent content during this phase unless the user separately approves that action.",
      "Accessibility: owner forms, tables, dialogs, and error states remain keyboard reachable and screen-reader labelled."
    ],
    "acceptance_gates": [
      "Owner and login surfaces use the Misaya Notes calm dark system without confusing them with public reader cards.",
      "Loading, empty, error, disabled, unauthenticated, and authenticated states each have visual treatment and evidence or blocker notes.",
      "Owner buttons, badges, inputs, textareas, table controls, and guard-card actions map back to core/forms component states from the design package.",
      "Auth guards and public Agent hiding behavior are preserved.",
      "Report contains desktop and mobile screenshots for available owner states plus exact commands run."
    ],
    "rollback_plan": [
      "Revert owner page, owner CSS, and i18n files touched by this phase if auth guard, build, or public route screenshots regress.",
      "If a visual fix requires server-side permission changes, stop and document a security follow-up instead of widening the phase."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-04/"
    ],
    "required_artifacts": [
      "phase report",
      "progress-log entry",
      "feature-oracle evidence update",
      "continuity-ledger update",
      "source-packet code summary"
    ],
    "waiver_policy": "Only mark a gate waived when the user explicitly waives it or the report records a blocker, reason, remaining risk, and dependent-phase impact.",
    "next_phase_handoff": "Owner state evidence, auth boundary summary, data-mutation notes, and remaining release blockers for MNUI-05."
  },
  "stop_conditions": [
    "Stop if authenticated owner evidence requires credentials not present locally.",
    "Stop if UI changes would alter permission semantics.",
    "Stop if data mutation is needed to reach a state and no user approval exists."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: MNUI-04
- GOAL_TARGET: Bring owner-only manage, write, login, and Agent Ops states into the same design language while preserving auth and content boundaries.
- GOAL_PROMPT: Complete MNUI-04 Owner Tools And System States for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-04-owner-tools-and-system-states.md`; work on feature-oracle item MNUI-F005; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: MNUI-03
- READ_FIRST: `docs/misaya_notes_ui_optimization_2026_06_18/README.md`, `docs/misaya_notes_ui_optimization_2026_06_18/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/manage-desktop.png`, `/Users/yang/Downloads/Misaya Notes Design System/components/core/core.card.html`, `/Users/yang/Downloads/Misaya Notes Design System/components/forms/forms.card.html`, `/Users/yang/Downloads/Misaya Notes Design System/components/core/Badge.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/components/core/Button.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/components/forms/Input.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/components/forms/Textarea.jsx`, `client/src/pages/Manage.tsx`, `client/src/pages/Editor.tsx`, `client/src/pages/ManageAgent.tsx`, `client/src/pages/Login.tsx`, `client/src/components/DashboardLayout.tsx`, `client/src/components/DashboardLayoutSkeleton.tsx`, `client/src/styles/owner-tools.css`, `client/src/i18n/manage.ts`, `client/src/i18n/editor.ts`, `client/src/i18n/login.ts`, `client/src/i18n/agentOps.ts`, `client/src/_core/hooks/useAuth.ts`, `server/blogAdminProcedure.ts`, `server/routers.ts`
- LIKELY_EDIT_PATHS: `client/src/pages/Manage.tsx`, `client/src/pages/Editor.tsx`, `client/src/pages/ManageAgent.tsx`, `client/src/pages/Login.tsx`, `client/src/components/DashboardLayout.tsx`, `client/src/components/DashboardLayoutSkeleton.tsx`, `client/src/styles/owner-tools.css`, `client/src/i18n/manage.ts`, `client/src/i18n/editor.ts`, `client/src/i18n/login.ts`, `client/src/i18n/agentOps.ts`, `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`, `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`, `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-04/`
- DO_NOT_EDIT: `auth/session server semantics unless a security blocker is recorded`, `drizzle/**`, seed-blog.mjs, public article content, `payment/provider dashboards`, `.env*`, deployment configuration
- EXECUTION_MODE: plan-first; implement stepwise; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: pnpm check; pnpm exec vitest run client/src/components/ErrorBoundary.test.tsx scripts/audit/publish-freshness.test.ts shared/content-ops.test.ts; pnpm build; AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
- BROWSER_CHECKS: At 1440x900 capture `/manage`, `/write`, `/manage/agent`, and `/login`; if authenticated state is unavailable, capture the unauthenticated guard and record missing auth as a blocker for authenticated layout evidence.; At 390x844 capture `/login`, `/manage`, and `/manage/agent` guard or authenticated state and verify panels, buttons, tables, and forms do not overflow.; Exercise keyboard focus through login actions, dashboard nav, table controls, editor title/content fields, save actions, and Agent Ops filters when those controls are visible.; Verify public Blog Agent stays hidden on owner and login routes while owner Agent Ops diagnostics remain separated from public companion UI.
- REGRESSION_SCOPE: Auth and permission boundaries remain unchanged.; Owner-only routes do not become discoverable through public navigation for non-admin users.; Editor, Manage, and Agent Ops data mutation controls keep existing confirmation, disabled, loading, and error behavior.; Public reader design remains stable after owner CSS updates.
- COMPLIANCE_GATES: Auth: unauthenticated users see guard states and cannot access owner tools.; Security: no secret, token, session identifier, draft content, or admin metadata appears in public screenshots or reports.; Data mutation: do not publish, delete, seed, migrate, or alter persistent content during this phase unless the user separately approves that action.; Accessibility: owner forms, tables, dialogs, and error states remain keyboard reachable and screen-reader labelled.
- ROLLBACK_PLAN: Revert owner page, owner CSS, and i18n files touched by this phase if auth guard, build, or public route screenshots regress.; If a visual fix requires server-side permission changes, stop and document a security follow-up instead of widening the phase.
- ACCEPTANCE_GATES: Owner and login surfaces use the Misaya Notes calm dark system without confusing them with public reader cards.; Loading, empty, error, disabled, unauthenticated, and authenticated states each have visual treatment and evidence or blocker notes.; Owner buttons, badges, inputs, textareas, table controls, and guard-card actions map back to core/forms component states from the design package.; Auth guards and public Agent hiding behavior are preserved.; Report contains desktop and mobile screenshots for available owner states plus exact commands run.
- EVIDENCE_OUTPUT: `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md`
- STOP_CONDITIONS: Stop if authenticated owner evidence requires credentials not present locally.; Stop if UI changes would alter permission semantics.; Stop if data mutation is needed to reach a state and no user approval exists.

## Harness Runtime

- FEATURE_ORACLE: `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`
- LOOP_CONTRACT: `docs/misaya_notes_ui_optimization_2026_06_18/loop-contract.json`
- LOOP_STATE: `docs/misaya_notes_ui_optimization_2026_06_18/loop-state.json`
- PROGRESS_LOG: `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`
- AGENT_HANDOFF: `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`
- NEXT_WINDOW_PROMPT: `docs/misaya_notes_ui_optimization_2026_06_18/next-window-prompt.md`
- CONTINUITY_LEDGER: `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`

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

Execute MNUI-04 by following this contract, updating MNUI-F005, and preserving the dependency chain from MNUI-00 through MNUI-05. Use the downloaded design system as reference material and the current repo as the implementation authority.

## Cross-Phase Continuity

- Depends on: MNUI-03
- Unlocks: MNUI-05
- Feature-oracle item: MNUI-F005
- Continuity ledger: `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`
- Prior-phase evidence to inherit: the previous phase report, progress-log entry, oracle evidence, and continuity-ledger boundary notes
- Boundary this phase must preserve for later phases: Owner UI polish that does not weaken auth boundaries and leaves release gates ready for MNUI-05.
- Handoff this phase must produce: Owner state evidence, auth boundary summary, data-mutation notes, and remaining release blockers for MNUI-05.

## Code Summary Writeback

Before claiming completion, inspect the code paths allowed by this phase and write back:

- `source-packet.md`: summarize discovered files, services, routes, schemas, tests, commands, and runtime constraints.
- `continuity-ledger.md`: record interface boundaries, dependency assumptions, changed contracts, and downstream phase impact.
- `agent-handoff.md`: state the next concrete action, active feature-oracle item, validation evidence, and blocker status.
- Phase report: link validation output and the exact code-summary update.

## Problem Boundary

In scope:

- Owner/admin page styling.
- Operational state layout.
- Auth guard visual treatment.
- Owner route screenshots.

Out of scope:

- Publishing content.
- Deleting content.
- Database migrations.
- Credential setup.
- Deployments.

## Context Policy

Before editing, inspect:

- docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md
- docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md
- docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md
- /Users/yang/Downloads/Misaya Notes Design System/_ref/manage-desktop.png
- /Users/yang/Downloads/Misaya Notes Design System/components/core/core.card.html
- /Users/yang/Downloads/Misaya Notes Design System/components/forms/forms.card.html
- /Users/yang/Downloads/Misaya Notes Design System/components/core/Badge.jsx
- /Users/yang/Downloads/Misaya Notes Design System/components/core/Button.jsx
- /Users/yang/Downloads/Misaya Notes Design System/components/forms/Input.jsx
- /Users/yang/Downloads/Misaya Notes Design System/components/forms/Textarea.jsx
- client/src/pages/Manage.tsx
- client/src/pages/Editor.tsx
- client/src/pages/ManageAgent.tsx
- client/src/pages/Login.tsx
- client/src/components/DashboardLayout.tsx
- client/src/components/DashboardLayoutSkeleton.tsx
- client/src/styles/owner-tools.css
- client/src/i18n/manage.ts
- client/src/i18n/editor.ts
- client/src/i18n/login.ts
- client/src/i18n/agentOps.ts
- client/src/_core/hooks/useAuth.ts
- server/blogAdminProcedure.ts
- server/routers.ts

Do not load files outside this list unless a blocker requires expanding context and the expansion is recorded in the phase report.

## Requirements

### R1 Owner visual cohesion

Manage, write, login, and Agent Ops surfaces must use the same token language while staying denser and operational.

### R2 State completeness

Loading, empty, error, disabled, guard, and authenticated states must have stable layout and accessible controls.

### R4 Operational primitive mapping

Owner tables, guard cards, editor forms, Agent Ops controls, and login actions must map back to the design-system Button, Badge, Input, Textarea, and Card state examples without weakening operational density.

### R3 Auth boundary preservation

Owner UI polish must preserve route guards, public Agent hiding, and admin-only content boundaries.

## Test and Regression Requirements

Validation commands:

- pnpm check - TypeScript completes with exit code 0.
- pnpm exec vitest run client/src/components/ErrorBoundary.test.tsx scripts/audit/publish-freshness.test.ts shared/content-ops.test.ts - Owner-adjacent tests complete with exit code 0.
- pnpm build - Production build completes with exit code 0.
- AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick - Owner-route guard and public-route baseline evidence is recorded.

Regression scope:

- Auth and permission boundaries remain unchanged.
- Owner-only routes do not become discoverable through public navigation for non-admin users.
- Editor, Manage, and Agent Ops data mutation controls keep existing confirmation, disabled, loading, and error behavior.
- Public reader design remains stable after owner CSS updates.

Browser/runtime checks:

- At 1440x900 capture `/manage`, `/write`, `/manage/agent`, and `/login`; if authenticated state is unavailable, capture the unauthenticated guard and record missing auth as a blocker for authenticated layout evidence.
- At 390x844 capture `/login`, `/manage`, and `/manage/agent` guard or authenticated state and verify panels, buttons, tables, and forms do not overflow.
- Exercise keyboard focus through login actions, dashboard nav, table controls, editor title/content fields, save actions, and Agent Ops filters when those controls are visible.
- Verify public Blog Agent stays hidden on owner and login routes while owner Agent Ops diagnostics remain separated from public companion UI.

## Compliance and Safety Requirements

- Auth: unauthenticated users see guard states and cannot access owner tools.
- Security: no secret, token, session identifier, draft content, or admin metadata appears in public screenshots or reports.
- Data mutation: do not publish, delete, seed, migrate, or alter persistent content during this phase unless the user separately approves that action.
- Accessibility: owner forms, tables, dialogs, and error states remain keyboard reachable and screen-reader labelled.

## Rollback and Recovery

- Revert owner page, owner CSS, and i18n files touched by this phase if auth guard, build, or public route screenshots regress.
- If a visual fix requires server-side permission changes, stop and document a security follow-up instead of widening the phase.

## Execution Capture

Use `docs/misaya_notes_ui_optimization_2026_06_18/reports/phase-report-template.md` when writing the phase report. The report must include command summaries, screenshot or blocker paths, compliance notes, rollback notes, oracle update, progress-log entry, and next-phase handoff.

## Evaluator Protocol

Evaluator checks auth states, public/private separation, owner screenshots, and data-mutation logs; reject if any screenshot exposes sensitive values or if public Agent appears on owner routes.

Evaluator checklist:

- Owner and login surfaces use the Misaya Notes calm dark system without confusing them with public reader cards.
- Loading, empty, error, disabled, unauthenticated, and authenticated states each have visual treatment and evidence or blocker notes.
- Auth guards and public Agent hiding behavior are preserved.
- Report contains desktop and mobile screenshots for available owner states plus exact commands run.

## Acceptance Criteria

- Owner and login surfaces use the Misaya Notes calm dark system without confusing them with public reader cards.
- Loading, empty, error, disabled, unauthenticated, and authenticated states each have visual treatment and evidence or blocker notes.
- Auth guards and public Agent hiding behavior are preserved.
- Report contains desktop and mobile screenshots for available owner states plus exact commands run.

## Risks

- Authenticated screenshots may be unavailable.
- Owner CSS can accidentally bleed into public reader surfaces.
- Operational controls can look disabled if contrast is too muted.
