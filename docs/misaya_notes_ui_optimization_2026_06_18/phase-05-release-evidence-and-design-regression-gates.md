# Phase 05 - Release Evidence And Design Regression Gates

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance to the next phase until acceptance gates pass or blockers are documented.

**Goal:** Create a complete local release evidence packet for the UI optimization without deploying or mutating production systems.

**Architecture:** This final phase turns the previous evidence into repeatable gates: typecheck, tests, build, content checks, browser screenshots, Agent eval table, accessibility notes, rollback boundaries, and release decision.

**Tech Stack:** pnpm scripts, TypeScript, Vitest, Vite build, Playwright-style audit scripts, content audit scripts, docs reports, local browser screenshots.

---

## Machine Contract

The JSON block below is the authoritative machine-readable contract for goal-mode agents and validators. Keep it synchronized with the human-readable sections.

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "MNUI-05",
    "number": "05",
    "title": "Release Evidence And Design Regression Gates",
    "status": "ready",
    "type": "release",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/misaya_notes_ui_optimization_2026_06_18",
    "phase_file": "docs/misaya_notes_ui_optimization_2026_06_18/phase-05-release-evidence-and-design-regression-gates.md",
    "depends_on": [
      "MNUI-04"
    ],
    "unlocks": []
  },
  "goal": {
    "target": "Create a complete local release evidence packet for the UI optimization without deploying or mutating production systems.",
    "prompt": "Complete MNUI-05 Release Evidence And Design Regression Gates for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-05-release-evidence-and-design-regression-gates.md`; work on feature-oracle item MNUI-F006; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-plan.md",
    "completion_report": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md"
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
      "docs/misaya_notes_ui_optimization_2026_06_18/phase-05-release-evidence-and-design-regression-gates.md"
    ],
    "primary_context": [
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md",
      "/Users/yang/Downloads/Misaya Notes Design System/_ds_manifest.json",
      "/Users/yang/Downloads/Misaya Notes Design System/_adherence.oxlintrc.json",
      "/Users/yang/Downloads/Misaya Notes Design System/tokens/fonts.css",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/*.html",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/*",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/*",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/*",
      "/Users/yang/Downloads/Misaya Notes Design System/assets/*",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/*",
      "package.json",
      "scripts/audit/baseline.ts",
      "scripts/audit/ui-layout.ts",
      "scripts/audit/content-quality.ts",
      "scripts/audit/publish-freshness.ts",
      "client/src/App.tsx",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/agent-surfaces.css",
      "docs/deployment.md"
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
      "scripts/audit/ui-layout.ts",
      "scripts/audit/phase05-performance-boundaries.test.ts",
      "docs/deployment.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/"
    ],
    "do_not_edit": [
      "production deployment targets",
      "DNS/provider dashboards",
      "production databases",
      ".env*",
      "drizzle migrations without explicit approval",
      "package dependency list without approval"
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
      "agent",
      "ai",
      "eval",
      "security",
      "release"
    ],
    "data_mutation": false,
    "migration_required": false,
    "browser_required": true,
    "ai_eval_required": true,
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
        "id": "full-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm test",
        "expected": "Vitest completes with exit code 0 or report names known pre-existing failures with identifiers.",
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
        "id": "content-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:audit",
        "expected": "Content audit completes with zero failures.",
        "required": true
      },
      {
        "id": "publish-freshness",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:verify",
        "expected": "Publish freshness check writes JSON evidence and reports no stale public content.",
        "required": true
      },
      {
        "id": "ui-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm audit:ui",
        "expected": "UI layout audit completes with no release-blocking visual failures.",
        "required": true
      },
      {
        "id": "quick-route-baseline",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick",
        "expected": "Route baseline captures local public and guarded owner route state.",
        "required": true
      }
    ],
    "browser_checks": [
      "At 1440x900, 1280x800, 768x1024, and 390x844 capture `/`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/post/goal-harness-agent-phase-protocol`, `/login`, `/manage`, `/manage/agent`, and Blog Agent open state on a post page.",
      "Record console errors, failed network requests, horizontal overflow, clipped text, hidden focus, and mobile Agent overlap for every checked viewport.",
      "Run a four-row Agent golden table if runtime credentials are configured: article abstraction, next reading suggestion, insufficient public corpus refusal, and current-page context. If credentials are missing, record a blocker and keep release decision blocked for live Agent evidence.",
      "Compare final screenshots against downloaded `_ref/` screenshots and record intentional deviations with product rationale."
    ],
    "regression_scope": [
      "Public content boundaries, SEO routes, RSS/sitemap behavior when checked, and article rendering remain stable.",
      "Owner auth boundaries remain stable.",
      "Agent scope, source cards, quota/error states, and route guard remain stable.",
      "No migration, production publish, DNS change, or deployment occurs without explicit user approval."
    ],
    "compliance_gates": [
      "Accessibility: focus, keyboard navigation, contrast, reduced motion, mobile layout, and form labels are evidenced.",
      "Security and privacy: no secret values, private context, hidden/draft content, or admin-only data appear in public UI, screenshots, logs, or Agent responses.",
      "Font and network policy: final evidence states whether production uses local font chains only or introduces any remote font request, and release is blocked if the network decision is undocumented.",
      "Release control: deployment, production database mutation, DNS/provider changes, and destructive git operations require explicit user approval after this phase.",
      "Copyright and assets: final evidence names every image asset source and confirms no unlicensed external asset was introduced.",
      "Design coverage: final evidence includes a design-source coverage audit for manifest, adherence policy, tokens, guidelines, components, UI kit, assets, and reference screenshots."
    ],
    "acceptance_gates": [
      "Release report contains command output summaries, screenshot index, Agent eval table or blocker, accessibility checklist, privacy/content-boundary checklist, rollback notes, and a release decision.",
      "Release report includes a design-source coverage audit proving that manifest, adherence policy, tokens, guidelines, components, UI kit, assets, screenshots, and font/network policy were considered.",
      "Feature oracle MNUI-F001 through MNUI-F006 statuses are passing, blocked, or waived with evidence, never silently removed.",
      "Continuity ledger and source packet include final code facts, changed contracts, screenshots, and downstream maintenance rules.",
      "No production deploy is claimed unless the user separately approves and public target verification is added after that approval."
    ],
    "rollback_plan": [
      "If release evidence fails, keep the branch undeployed and revert only phase-scoped UI or audit changes that introduced the failure.",
      "If deployment is later approved and fails, use Vercel rollback or the prior production deployment recorded in deployment docs; do not force-push or rewrite history."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/"
    ],
    "required_artifacts": [
      "phase report",
      "progress-log entry",
      "feature-oracle evidence update",
      "continuity-ledger update",
      "source-packet code summary"
    ],
    "waiver_policy": "Only mark a gate waived when the user explicitly waives it or the report records a blocker, reason, remaining risk, and dependent-phase impact.",
    "next_phase_handoff": "Final release report, evidence index, oracle status summary, and explicit deploy/no-deploy recommendation."
  },
  "stop_conditions": [
    "Stop if full test/build evidence fails and the failure cannot be scoped to a pre-existing issue.",
    "Stop if live Agent evaluation lacks credentials.",
    "Stop if release would require deployment, migration, production data mutation, or provider dashboard changes."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: MNUI-05
- GOAL_TARGET: Create a complete local release evidence packet for the UI optimization without deploying or mutating production systems.
- GOAL_PROMPT: Complete MNUI-05 Release Evidence And Design Regression Gates for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-05-release-evidence-and-design-regression-gates.md`; work on feature-oracle item MNUI-F006; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: MNUI-04
- READ_FIRST: `docs/misaya_notes_ui_optimization_2026_06_18/README.md`, `docs/misaya_notes_ui_optimization_2026_06_18/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`, `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md`, `/Users/yang/Downloads/Misaya Notes Design System/_ds_manifest.json`, `/Users/yang/Downloads/Misaya Notes Design System/_adherence.oxlintrc.json`, `/Users/yang/Downloads/Misaya Notes Design System/tokens/fonts.css`, `/Users/yang/Downloads/Misaya Notes Design System/guidelines/*.html`, `/Users/yang/Downloads/Misaya Notes Design System/components/core/*`, `/Users/yang/Downloads/Misaya Notes Design System/components/forms/*`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/*`, `/Users/yang/Downloads/Misaya Notes Design System/assets/*`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/*`, package.json, `scripts/audit/baseline.ts`, `scripts/audit/ui-layout.ts`, `scripts/audit/content-quality.ts`, `scripts/audit/publish-freshness.ts`, `client/src/App.tsx`, `client/src/styles/visual-refresh.css`, `client/src/styles/agent-surfaces.css`, `docs/deployment.md`
- LIKELY_EDIT_PATHS: `scripts/audit/ui-layout.ts`, `scripts/audit/phase05-performance-boundaries.test.ts`, `docs/deployment.md`, `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`, `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`, `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/`
- DO_NOT_EDIT: production deployment targets, `DNS/provider dashboards`, production databases, `.env*`, drizzle migrations without explicit approval, package dependency list without approval
- EXECUTION_MODE: plan-first; implement stepwise; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: pnpm check; pnpm test; pnpm build; pnpm content:audit; pnpm content:verify; pnpm audit:ui; AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
- BROWSER_CHECKS: At 1440x900, 1280x800, 768x1024, and 390x844 capture `/`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/post/goal-harness-agent-phase-protocol`, `/login`, `/manage`, `/manage/agent`, and Blog Agent open state on a post page.; Record console errors, failed network requests, horizontal overflow, clipped text, hidden focus, and mobile Agent overlap for every checked viewport.; Run a four-row Agent golden table if runtime credentials are configured: article abstraction, next reading suggestion, insufficient public corpus refusal, and current-page context. If credentials are missing, record a blocker and keep release decision blocked for live Agent evidence.; Compare final screenshots against downloaded `_ref/` screenshots and record intentional deviations with product rationale.
- REGRESSION_SCOPE: Public content boundaries, SEO routes, RSS/sitemap behavior when checked, and article rendering remain stable.; Owner auth boundaries remain stable.; Agent scope, source cards, quota/error states, and route guard remain stable.; No migration, production publish, DNS change, or deployment occurs without explicit user approval.
- COMPLIANCE_GATES: Accessibility: focus, keyboard navigation, contrast, reduced motion, mobile layout, and form labels are evidenced.; Security and privacy: no secret values, private context, hidden/draft content, or admin-only data appear in public UI, screenshots, logs, or Agent responses.; Font and network policy: final evidence states whether production uses local font chains only or introduces any remote font request, and release is blocked if the network decision is undocumented.; Release control: deployment, production database mutation, DNS/provider changes, and destructive git operations require explicit user approval after this phase.; Copyright and assets: final evidence names every image asset source and confirms no unlicensed external asset was introduced.; Design coverage: final evidence includes a design-source coverage audit for manifest, adherence policy, tokens, guidelines, components, UI kit, assets, and reference screenshots.
- ROLLBACK_PLAN: If release evidence fails, keep the branch undeployed and revert only phase-scoped UI or audit changes that introduced the failure.; If deployment is later approved and fails, use Vercel rollback or the prior production deployment recorded in deployment docs; do not force-push or rewrite history.
- ACCEPTANCE_GATES: Release report contains command output summaries, screenshot index, Agent eval table or blocker, accessibility checklist, privacy/content-boundary checklist, rollback notes, and a release decision.; Release report includes a design-source coverage audit proving that manifest, adherence policy, tokens, guidelines, components, UI kit, assets, screenshots, and font/network policy were considered.; Feature oracle MNUI-F001 through MNUI-F006 statuses are passing, blocked, or waived with evidence, never silently removed.; Continuity ledger and source packet include final code facts, changed contracts, screenshots, and downstream maintenance rules.; No production deploy is claimed unless the user separately approves and public target verification is added after that approval.
- EVIDENCE_OUTPUT: `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md`
- STOP_CONDITIONS: Stop if full test/build evidence fails and the failure cannot be scoped to a pre-existing issue.; Stop if live Agent evaluation lacks credentials.; Stop if release would require deployment, migration, production data mutation, or provider dashboard changes.

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

Execute MNUI-05 by following this contract, updating MNUI-F006, and preserving the dependency chain from MNUI-00 through MNUI-05. Use the downloaded design system as reference material and the current repo as the implementation authority.

## Cross-Phase Continuity

- Depends on: MNUI-04
- Unlocks: none
- Feature-oracle item: MNUI-F006
- Continuity ledger: `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`
- Prior-phase evidence to inherit: the previous phase report, progress-log entry, oracle evidence, and continuity-ledger boundary notes
- Boundary this phase must preserve for later phases: A verified local release packet that can be followed by a separate deploy request without hidden context.
- Handoff this phase must produce: Final release report, evidence index, oracle status summary, and explicit deploy/no-deploy recommendation.

## Code Summary Writeback

Before claiming completion, inspect the code paths allowed by this phase and write back:

- `source-packet.md`: summarize discovered files, services, routes, schemas, tests, commands, and runtime constraints.
- `continuity-ledger.md`: record interface boundaries, dependency assumptions, changed contracts, and downstream phase impact.
- `agent-handoff.md`: state the next concrete action, active feature-oracle item, validation evidence, and blocker status.
- Phase report: link validation output and the exact code-summary update.

## Problem Boundary

In scope:

- Local release validation.
- Audit script improvements.
- Screenshot index.
- Agent golden table.
- Rollback and release decision docs.

Out of scope:

- Production deploy.
- Database migration.
- Provider dashboard work.
- DNS changes.
- Force push or history rewrite.

## Context Policy

Before editing, inspect:

- docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md
- docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md
- docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json
- docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md
- docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-04-owner-tools-and-system-states-report.md
- /Users/yang/Downloads/Misaya Notes Design System/_ds_manifest.json
- /Users/yang/Downloads/Misaya Notes Design System/_adherence.oxlintrc.json
- /Users/yang/Downloads/Misaya Notes Design System/tokens/fonts.css
- /Users/yang/Downloads/Misaya Notes Design System/guidelines/*.html
- /Users/yang/Downloads/Misaya Notes Design System/components/core/*
- /Users/yang/Downloads/Misaya Notes Design System/components/forms/*
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/*
- /Users/yang/Downloads/Misaya Notes Design System/assets/*
- /Users/yang/Downloads/Misaya Notes Design System/_ref/*
- package.json
- scripts/audit/baseline.ts
- scripts/audit/ui-layout.ts
- scripts/audit/content-quality.ts
- scripts/audit/publish-freshness.ts
- client/src/App.tsx
- client/src/styles/visual-refresh.css
- client/src/styles/agent-surfaces.css
- docs/deployment.md

Do not load files outside this list unless a blocker requires expanding context and the expansion is recorded in the phase report.

## Requirements

### R1 Complete local release evidence

Collect the command, screenshot, accessibility, Agent, privacy, and rollback evidence needed for a local release decision.

### R2 Repeatable regression gates

Update or document audit scripts so future UI work can recheck the critical public, owner, and Agent surfaces.

### R3 No unapproved production action

Keep deployment, production mutation, DNS/provider changes, and destructive git operations behind explicit approval gates.

### R4 Design-source coverage audit

The final release evidence must include a table showing how the design manifest, adherence policy, token files, guideline cards, component files, UI kit files, assets, screenshots, and font/network policy were covered or explicitly blocked.

## Test and Regression Requirements

Validation commands:

- pnpm check - TypeScript completes with exit code 0.
- pnpm test - Vitest completes with exit code 0 or report names known pre-existing failures with identifiers.
- pnpm build - Production build completes with exit code 0.
- pnpm content:audit - Content audit completes with zero failures.
- pnpm content:verify - Publish freshness check writes JSON evidence and reports no stale public content.
- pnpm audit:ui - UI layout audit completes with no release-blocking visual failures.
- AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick - Route baseline captures local public and guarded owner route state.

Regression scope:

- Public content boundaries, SEO routes, RSS/sitemap behavior when checked, and article rendering remain stable.
- Owner auth boundaries remain stable.
- Agent scope, source cards, quota/error states, and route guard remain stable.
- No migration, production publish, DNS change, or deployment occurs without explicit user approval.

Browser/runtime checks:

- At 1440x900, 1280x800, 768x1024, and 390x844 capture `/`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/post/goal-harness-agent-phase-protocol`, `/login`, `/manage`, `/manage/agent`, and Blog Agent open state on a post page.
- Record console errors, failed network requests, horizontal overflow, clipped text, hidden focus, and mobile Agent overlap for every checked viewport.
- Run a four-row Agent golden table if runtime credentials are configured: article abstraction, next reading suggestion, insufficient public corpus refusal, and current-page context. If credentials are missing, record a blocker and keep release decision blocked for live Agent evidence.
- Compare final screenshots against downloaded `_ref/` screenshots and record intentional deviations with product rationale.

## Compliance and Safety Requirements

- Accessibility: focus, keyboard navigation, contrast, reduced motion, mobile layout, and form labels are evidenced.
- Security and privacy: no secret values, private context, hidden/draft content, or admin-only data appear in public UI, screenshots, logs, or Agent responses.
- Release control: deployment, production database mutation, DNS/provider changes, and destructive git operations require explicit user approval after this phase.
- Copyright and assets: final evidence names every image asset source and confirms no unlicensed external asset was introduced.

## Rollback and Recovery

- If release evidence fails, keep the branch undeployed and revert only phase-scoped UI or audit changes that introduced the failure.
- If deployment is later approved and fails, use Vercel rollback or the prior production deployment recorded in deployment docs; do not force-push or rewrite history.

## Execution Capture

Use `docs/misaya_notes_ui_optimization_2026_06_18/reports/phase-report-template.md` when writing the phase report. The report must include command summaries, screenshot or blocker paths, compliance notes, rollback notes, oracle update, progress-log entry, and next-phase handoff.

## Evaluator Protocol

Evaluator independently reviews command summaries, screenshot index, golden Agent table, privacy gates, and rollback plan; reject if a release claim lacks evidence.

Evaluator checklist:

- Release report contains command output summaries, screenshot index, Agent eval table or blocker, accessibility checklist, privacy/content-boundary checklist, rollback notes, and a release decision.
- Feature oracle MNUI-F001 through MNUI-F006 statuses are passing, blocked, or waived with evidence, never silently removed.
- Continuity ledger and source packet include final code facts, changed contracts, screenshots, and downstream maintenance rules.
- No production deploy is claimed unless the user separately approves and public target verification is added after that approval.

## Acceptance Criteria

- Release report contains command output summaries, screenshot index, Agent eval table or blocker, accessibility checklist, privacy/content-boundary checklist, rollback notes, and a release decision.
- Feature oracle MNUI-F001 through MNUI-F006 statuses are passing, blocked, or waived with evidence, never silently removed.
- Continuity ledger and source packet include final code facts, changed contracts, screenshots, and downstream maintenance rules.
- No production deploy is claimed unless the user separately approves and public target verification is added after that approval.

## Risks

- Live Agent evidence can be blocked by credentials.
- Full test suite can surface pre-existing failures.
- Large screenshot sets can bloat the repo if not bounded to evidence folders.
