# Phase 03 - Blog Agent And Trust Surface

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance to the next phase until acceptance gates pass or blockers are documented.

**Goal:** Make the Blog Agent feel like a grounded article companion with clear source boundaries, mobile ergonomics, and evidence-backed answer states.

**Architecture:** This phase attaches the Agent trust surface to the public reader UI built in MNUI-02: launcher, panel, answer modes, source cards, quota/history/context controls, and route-aware prompts.

**Tech Stack:** React Agent component, tRPC agent router, streaming client, route context, lucide icons, Streamdown/Markdown rendering, Vitest tests with mocked Agent behavior.

---

## Machine Contract

The JSON block below is the authoritative machine-readable contract for goal-mode agents and validators. Keep it synchronized with the human-readable sections.

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "MNUI-03",
    "number": "03",
    "title": "Blog Agent And Trust Surface",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/misaya_notes_ui_optimization_2026_06_18",
    "phase_file": "docs/misaya_notes_ui_optimization_2026_06_18/phase-03-blog-agent-and-trust-surface.md",
    "depends_on": [
      "MNUI-02"
    ],
    "unlocks": [
      "MNUI-04"
    ]
  },
  "goal": {
    "target": "Make the Blog Agent feel like a grounded article companion with clear source boundaries, mobile ergonomics, and evidence-backed answer states.",
    "prompt": "Complete MNUI-03 Blog Agent And Trust Surface for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-03-blog-agent-and-trust-surface.md`; work on feature-oracle item MNUI-F004; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-plan.md",
    "completion_report": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md"
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
      "docs/misaya_notes_ui_optimization_2026_06_18/phase-03-blog-agent-and-trust-surface.md"
    ],
    "primary_context": [
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/agent.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/data.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/icons.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/Textarea.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/BrandMark.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Tag.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/01-kit-agent.png",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/02-kit-agent.png",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/agent-mobile.png",
      "client/src/components/agent/BlogAgentRoot.tsx",
      "client/src/components/agent/AgentMarkdown.tsx",
      "client/src/components/agent/routeContext.ts",
      "client/src/components/agent/streamClient.ts",
      "client/src/components/agent/messageState.ts",
      "client/src/components/agent/types.ts",
      "client/src/styles/agent-surfaces.css",
      "client/src/i18n/agent.ts",
      "server/ai/harness.ts",
      "server/ai/contextSources.ts",
      "server/ai/streamRoute.ts",
      "server/agent.router.test.ts",
      "client/src/components/agent/BlogAgentRoot.test.ts",
      "client/src/components/agent/sourceCards.test.ts"
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
      "client/src/components/agent/BlogAgentRoot.tsx",
      "client/src/components/agent/AgentMarkdown.tsx",
      "client/src/components/agent/routeContext.ts",
      "client/src/components/agent/messageState.ts",
      "client/src/components/agent/types.ts",
      "client/src/styles/agent-surfaces.css",
      "client/src/i18n/agent.ts",
      "client/src/components/agent/BlogAgentRoot.test.ts",
      "client/src/components/agent/sourceCards.test.ts",
      "server/agent.router.test.ts",
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-03/"
    ],
    "do_not_edit": [
      "server/ai/model.ts provider configuration",
      "knowledge database schema",
      "drizzle/**",
      "payment or auth provider settings",
      ".env*",
      "production data",
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
      "agent",
      "ai",
      "eval",
      "security"
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
        "id": "agent-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts",
        "expected": "Agent and source-card tests complete with exit code 0.",
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
        "expected": "Public route baseline completes with Agent launcher present on public routes and hidden on owner/login routes.",
        "required": true
      }
    ],
    "browser_checks": [
      "At 1440x900 open `/post/goal-harness-agent-phase-protocol`, open Blog Agent, submit a public-corpus question when local Agent runtime is configured, and capture answer, source cards, composer, trace or status states.",
      "At 390x844 open Blog Agent on a post page and verify launcher, panel height, composer, keyboard focus, close behavior, and source cards do not obscure reading content irrecoverably.",
      "At `/`, `/archive`, and `/search` verify suggested prompts are route-aware and the Agent panel labels its scope as public notes.",
      "At `/manage`, `/write`, and `/login` verify the public Blog Agent is hidden according to route guard."
    ],
    "regression_scope": [
      "Streaming, abort, history, quota, private context attachment, and conversation identity reset behavior keep existing tests passing.",
      "Agent answers do not expose raw model reasoning or hidden draft/admin content.",
      "Source cards remain linked to public notes and retain title, snippet or metadata clarity.",
      "The launcher does not block primary navigation, article feedback, or mobile scroll recovery."
    ],
    "compliance_gates": [
      "Privacy: private uploaded or pasted context stays conversation-local and is not shown in public source cards.",
      "Security: no secret values, raw credentials, auth headers, or provider errors appear in UI, screenshots, or reports.",
      "Content boundary: Agent scope remains public published notes unless authenticated owner-only behavior is separately assigned.",
      "Abuse and rate limits: quota state, disabled composer, and error messages remain visible and non-leaky.",
      "Accessibility: launcher and panel trap/restore focus correctly, close button is keyboard reachable, and mobile composer remains operable."
    ],
    "acceptance_gates": [
      "Blog Agent launcher and panel match the calm glass surface design, with grounded public-note copy and source-first answer layout.",
      "Golden questions cover abstraction, next reading, insufficient-corpus refusal, and current-page context, each with trace or source-card evidence.",
      "Agent source-card behavior accounts for UI kit sample data, public note titles, thumbnail/source icon use, and lucide-style icon weight.",
      "Agent is hidden on owner/login routes and visible on public reader routes with no mobile overlap failures.",
      "Report contains screenshot evidence plus test output for Agent UI and source-card behavior."
    ],
    "rollback_plan": [
      "Revert Agent UI and tests touched by this phase if streaming, conversation state, or route guard behavior regresses.",
      "If trusted source-boundary behavior requires backend changes outside listed files, stop and record the needed expansion before editing."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-03/"
    ],
    "required_artifacts": [
      "phase report",
      "progress-log entry",
      "feature-oracle evidence update",
      "continuity-ledger update",
      "source-packet code summary"
    ],
    "waiver_policy": "Only mark a gate waived when the user explicitly waives it or the report records a blocker, reason, remaining risk, and dependent-phase impact.",
    "next_phase_handoff": "Agent trust-surface screenshots, golden question table, source-boundary notes, and any owner-tool needs for MNUI-04."
  },
  "stop_conditions": [
    "Stop if live Agent execution requires missing provider credentials.",
    "Stop if a source-boundary issue appears in backend retrieval outside this phase boundary.",
    "Stop if public screenshots would include private user context."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: MNUI-03
- GOAL_TARGET: Make the Blog Agent feel like a grounded article companion with clear source boundaries, mobile ergonomics, and evidence-backed answer states.
- GOAL_PROMPT: Complete MNUI-03 Blog Agent And Trust Surface for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-03-blog-agent-and-trust-surface.md`; work on feature-oracle item MNUI-F004; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: MNUI-02
- READ_FIRST: `docs/misaya_notes_ui_optimization_2026_06_18/README.md`, `docs/misaya_notes_ui_optimization_2026_06_18/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/agent.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/data.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/icons.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/components/forms/Textarea.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/components/core/BrandMark.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/components/core/Tag.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/01-kit-agent.png`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/02-kit-agent.png`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/agent-mobile.png`, `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/components/agent/AgentMarkdown.tsx`, `client/src/components/agent/routeContext.ts`, `client/src/components/agent/streamClient.ts`, `client/src/components/agent/messageState.ts`, `client/src/components/agent/types.ts`, `client/src/styles/agent-surfaces.css`, `client/src/i18n/agent.ts`, `server/ai/harness.ts`, `server/ai/contextSources.ts`, `server/ai/streamRoute.ts`, `server/agent.router.test.ts`, `client/src/components/agent/BlogAgentRoot.test.ts`, `client/src/components/agent/sourceCards.test.ts`
- LIKELY_EDIT_PATHS: `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/components/agent/AgentMarkdown.tsx`, `client/src/components/agent/routeContext.ts`, `client/src/components/agent/messageState.ts`, `client/src/components/agent/types.ts`, `client/src/styles/agent-surfaces.css`, `client/src/i18n/agent.ts`, `client/src/components/agent/BlogAgentRoot.test.ts`, `client/src/components/agent/sourceCards.test.ts`, `server/agent.router.test.ts`, `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`, `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`, `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-03/`
- DO_NOT_EDIT: `server/ai/model.ts provider configuration`, knowledge database schema, `drizzle/**`, payment or auth provider settings, `.env*`, production data, deployment configuration
- EXECUTION_MODE: plan-first; implement stepwise; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: pnpm check; pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts; pnpm build; AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
- BROWSER_CHECKS: At 1440x900 open `/post/goal-harness-agent-phase-protocol`, open Blog Agent, submit a public-corpus question when local Agent runtime is configured, and capture answer, source cards, composer, trace or status states.; At 390x844 open Blog Agent on a post page and verify launcher, panel height, composer, keyboard focus, close behavior, and source cards do not obscure reading content irrecoverably.; At `/`, `/archive`, and `/search` verify suggested prompts are route-aware and the Agent panel labels its scope as public notes.; At `/manage`, `/write`, and `/login` verify the public Blog Agent is hidden according to route guard.
- REGRESSION_SCOPE: Streaming, abort, history, quota, private context attachment, and conversation identity reset behavior keep existing tests passing.; Agent answers do not expose raw model reasoning or hidden draft/admin content.; Source cards remain linked to public notes and retain title, snippet or metadata clarity.; The launcher does not block primary navigation, article feedback, or mobile scroll recovery.
- COMPLIANCE_GATES: Privacy: private uploaded or pasted context stays conversation-local and is not shown in public source cards.; Security: no secret values, raw credentials, auth headers, or provider errors appear in UI, screenshots, or reports.; Content boundary: Agent scope remains public published notes unless authenticated owner-only behavior is separately assigned.; Abuse and rate limits: quota state, disabled composer, and error messages remain visible and non-leaky.; Accessibility: launcher and panel trap/restore focus correctly, close button is keyboard reachable, and mobile composer remains operable.
- ROLLBACK_PLAN: Revert Agent UI and tests touched by this phase if streaming, conversation state, or route guard behavior regresses.; If trusted source-boundary behavior requires backend changes outside listed files, stop and record the needed expansion before editing.
- ACCEPTANCE_GATES: Blog Agent launcher and panel match the calm glass surface design, with grounded public-note copy and source-first answer layout.; Golden questions cover abstraction, next reading, insufficient-corpus refusal, and current-page context, each with trace or source-card evidence.; Agent source-card behavior accounts for UI kit sample data, public note titles, thumbnail/source icon use, and lucide-style icon weight.; Agent is hidden on owner/login routes and visible on public reader routes with no mobile overlap failures.; Report contains screenshot evidence plus test output for Agent UI and source-card behavior.
- EVIDENCE_OUTPUT: `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-blog-agent-and-trust-surface-report.md`
- STOP_CONDITIONS: Stop if live Agent execution requires missing provider credentials.; Stop if a source-boundary issue appears in backend retrieval outside this phase boundary.; Stop if public screenshots would include private user context.

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

Execute MNUI-03 by following this contract, updating MNUI-F004, and preserving the dependency chain from MNUI-00 through MNUI-05. Use the downloaded design system as reference material and the current repo as the implementation authority.

## Cross-Phase Continuity

- Depends on: MNUI-02
- Unlocks: MNUI-04
- Feature-oracle item: MNUI-F004
- Continuity ledger: `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`
- Prior-phase evidence to inherit: the previous phase report, progress-log entry, oracle evidence, and continuity-ledger boundary notes
- Boundary this phase must preserve for later phases: A source-backed public companion that MNUI-04 owner tools can manage without exposing private or draft content.
- Handoff this phase must produce: Agent trust-surface screenshots, golden question table, source-boundary notes, and any owner-tool needs for MNUI-04.

## Code Summary Writeback

Before claiming completion, inspect the code paths allowed by this phase and write back:

- `source-packet.md`: summarize discovered files, services, routes, schemas, tests, commands, and runtime constraints.
- `continuity-ledger.md`: record interface boundaries, dependency assumptions, changed contracts, and downstream phase impact.
- `agent-handoff.md`: state the next concrete action, active feature-oracle item, validation evidence, and blocker status.
- Phase report: link validation output and the exact code-summary update.

## Problem Boundary

In scope:

- Blog Agent public UI.
- Source-card presentation.
- Route-aware prompt copy.
- Agent UI tests and golden question evidence.

Out of scope:

- New model provider work.
- Knowledge ingestion redesign.
- Database schema changes.
- Public standalone Agent workspace.
- Autonomous browsing.

## Context Policy

Before editing, inspect:

- docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md
- docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md
- docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/agent.jsx
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/data.jsx
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/icons.jsx
- /Users/yang/Downloads/Misaya Notes Design System/components/forms/Textarea.jsx
- /Users/yang/Downloads/Misaya Notes Design System/components/core/BrandMark.jsx
- /Users/yang/Downloads/Misaya Notes Design System/components/core/Tag.jsx
- /Users/yang/Downloads/Misaya Notes Design System/_ref/01-kit-agent.png
- /Users/yang/Downloads/Misaya Notes Design System/_ref/02-kit-agent.png
- /Users/yang/Downloads/Misaya Notes Design System/_ref/agent-mobile.png
- client/src/components/agent/BlogAgentRoot.tsx
- client/src/components/agent/AgentMarkdown.tsx
- client/src/components/agent/routeContext.ts
- client/src/components/agent/streamClient.ts
- client/src/components/agent/messageState.ts
- client/src/components/agent/types.ts
- client/src/styles/agent-surfaces.css
- client/src/i18n/agent.ts
- server/ai/harness.ts
- server/ai/contextSources.ts
- server/ai/streamRoute.ts
- server/agent.router.test.ts
- client/src/components/agent/BlogAgentRoot.test.ts
- client/src/components/agent/sourceCards.test.ts

Do not load files outside this list unless a blocker requires expanding context and the expansion is recorded in the phase report.

## Requirements

### R1 Grounded companion surface

Agent UI must state its public-notes scope, cite source cards, and admit insufficent corpus coverage without theatrical copy.

### R2 Route-aware prompts

Suggested prompts and welcome copy must reflect Home, Track, Search, Archive, and Post contexts without implying unsupported features.

### R3 Mobile trust ergonomics

Mobile Agent panel must preserve close, composer, source visibility, and reading recovery at 390x844.

### R4 Source-card visual contract

Agent source cards must preserve public note titles, source/icon affordance, compact metadata, and visible source grouping based on the UI kit sample corpus and existing production source-card tests.

## Test and Regression Requirements

Validation commands:

- pnpm check - TypeScript completes with exit code 0.
- pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts - Agent and source-card tests complete with exit code 0.
- pnpm build - Production build completes with exit code 0.
- AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick - Public route baseline completes with Agent launcher present on public routes and hidden on owner/login routes.

Regression scope:

- Streaming, abort, history, quota, private context attachment, and conversation identity reset behavior keep existing tests passing.
- Agent answers do not expose raw model reasoning or hidden draft/admin content.
- Source cards remain linked to public notes and retain title, snippet or metadata clarity.
- The launcher does not block primary navigation, article feedback, or mobile scroll recovery.

Browser/runtime checks:

- At 1440x900 open `/post/goal-harness-agent-phase-protocol`, open Blog Agent, submit a public-corpus question when local Agent runtime is configured, and capture answer, source cards, composer, trace or status states.
- At 390x844 open Blog Agent on a post page and verify launcher, panel height, composer, keyboard focus, close behavior, and source cards do not obscure reading content irrecoverably.
- At `/`, `/archive`, and `/search` verify suggested prompts are route-aware and the Agent panel labels its scope as public notes.
- At `/manage`, `/write`, and `/login` verify the public Blog Agent is hidden according to route guard.

## Compliance and Safety Requirements

- Privacy: private uploaded or pasted context stays conversation-local and is not shown in public source cards.
- Security: no secret values, raw credentials, auth headers, or provider errors appear in UI, screenshots, or reports.
- Content boundary: Agent scope remains public published notes unless authenticated owner-only behavior is separately assigned.
- Abuse and rate limits: quota state, disabled composer, and error messages remain visible and non-leaky.
- Accessibility: launcher and panel trap/restore focus correctly, close button is keyboard reachable, and mobile composer remains operable.

## Rollback and Recovery

- Revert Agent UI and tests touched by this phase if streaming, conversation state, or route guard behavior regresses.
- If trusted source-boundary behavior requires backend changes outside listed files, stop and record the needed expansion before editing.

## Execution Capture

Use `docs/misaya_notes_ui_optimization_2026_06_18/reports/phase-report-template.md` when writing the phase report. The report must include command summaries, screenshot or blocker paths, compliance notes, rollback notes, oracle update, progress-log entry, and next-phase handoff.

## Evaluator Protocol

Evaluator reviews Agent screenshots, source-card evidence, route guards, privacy gates, golden question results, and streaming tests; reject completion if any answer lacks source or boundary evidence.

Evaluator checklist:

- Blog Agent launcher and panel match the calm glass surface design, with grounded public-note copy and source-first answer layout.
- Golden questions cover abstraction, next reading, insufficent-corpus refusal, and current-page context, each with trace or source-card evidence.
- Agent is hidden on owner/login routes and visible on public reader routes with no mobile overlap failures.
- Report contains screenshot evidence plus test output for Agent UI and source-card behavior.

## Acceptance Criteria

- Blog Agent launcher and panel match the calm glass surface design, with grounded public-note copy and source-first answer layout.
- Golden questions cover abstraction, next reading, insufficent-corpus refusal, and current-page context, each with trace or source-card evidence.
- Agent is hidden on owner/login routes and visible on public reader routes with no mobile overlap failures.
- Report contains screenshot evidence plus test output for Agent UI and source-card behavior.

## Risks

- Live LLM credentials may be absent; tests must still cover mocked behavior.
- Mobile panel can conflict with article feedback or sticky controls.
- Trust copy can overpromise corpus coverage if not checked against actual retrieval.
