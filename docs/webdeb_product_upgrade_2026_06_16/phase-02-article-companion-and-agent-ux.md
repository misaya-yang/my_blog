# Phase 02 - Article Companion And Agent UX

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write evidence, and do not advance to WPU-03 until Agent trust gates pass.

**Goal:** Harden public Agent trust boundaries and productize article/track companion UX.

**Architecture:** WPU-02 uses the reader surface from WPU-01 and modifies the public Blog Agent, stream behavior, source-card rendering, route context, and owner AgentOps only when needed to prove trust. It must not broaden the Agent into a public standalone workspace.

**Tech Stack:** React Agent UI, tRPC, SSE stream route, Agent harness service, OpenAI-compatible model adapter, knowledge chunks, Vitest.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "WPU-02",
    "number": "02",
    "title": "Article Companion And Agent UX",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/webdeb_product_upgrade_2026_06_16",
    "phase_file": "docs/webdeb_product_upgrade_2026_06_16/phase-02-article-companion-and-agent-ux.md",
    "depends_on": ["WPU-01"],
    "unlocks": ["WPU-03"]
  },
  "goal": {
    "target": "Harden public Agent trust boundaries and productize article/track companion UX.",
    "prompt": "Complete WPU-02 Article Companion And Agent UX for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-02-article-companion-and-agent-ux.md`; work on feature-oracle item WPU-F003; public readers must never see raw model reasoning, hidden/admin/draft content, or unsupported technical claims; finish only after focused Agent tests, browser companion checks, privacy checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-02-article-companion-and-agent-ux-plan.md",
    "completion_report": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-02-article-companion-and-agent-ux-report.md"
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
      "docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md",
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-01-reader-ia-and-visual-system-report.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-02-article-companion-and-agent-ux.md"
    ],
    "primary_context": [
      "client/src/components/agent/BlogAgentRoot.tsx",
      "client/src/components/agent/AgentMarkdown.tsx",
      "client/src/components/agent/messageState.ts",
      "client/src/components/agent/routeContext.ts",
      "client/src/components/agent/sourceCards.test.ts",
      "client/src/components/agent/streamClient.ts",
      "client/src/components/agent/BlogAgentRoot.test.ts",
      "client/src/pages/PostDetail.tsx",
      "client/src/pages/Track.tsx",
      "client/src/i18n/agent.ts",
      "server/ai/router.ts",
      "server/ai/harness.ts",
      "server/ai/model.ts",
      "server/ai/knowledge.ts",
      "server/ai/knowledgeDb.ts",
      "server/ai/contextSources.ts",
      "server/ai/inputSchemas.ts",
      "server/ai/streamRoute.ts",
      "server/ai/harness.test.ts",
      "server/ai/model.test.ts",
      "server/agent.router.test.ts"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "database migrations",
      "email/subscription workflows",
      "unrelated owner manage screens"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/components/agent/**",
      "client/src/pages/PostDetail.tsx",
      "client/src/pages/Track.tsx",
      "client/src/i18n/agent.ts",
      "server/ai/**",
      "server/agent.router.test.ts",
      "docs/webdeb_product_upgrade_2026_06_16/**"
    ],
    "do_not_edit": [
      "drizzle/**",
      "seed-blog.mjs",
      "server/publicSeedPosts.ts",
      "client/src/pages/Editor.tsx",
      "client/src/pages/Manage.tsx",
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
      "local server"
    ],
    "approval_required": [
      "new database migration",
      "production data mutation",
      "deployment",
      "external model/provider changes"
    ],
    "dangerous_commands": [
      "git reset --hard",
      "rm -rf",
      "production migration",
      "force push"
    ]
  },
  "risk": {
    "tags": ["ai", "agent", "llm", "eval", "privacy", "security", "frontend"],
    "data_mutation": true,
    "migration_required": false,
    "browser_required": true,
    "ai_eval_required": true,
    "external_service_required": false,
    "release_blocking": true
  },
  "validation": {
    "commands": [
      {
        "id": "agent-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts",
        "expected": "Focused Agent tests pass.",
        "required": true
      },
      {
        "id": "typecheck",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm check",
        "expected": "TypeScript check passes.",
        "required": true
      },
      {
        "id": "build",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm build",
        "expected": "Production build succeeds.",
        "required": true
      }
    ],
    "browser_checks": [
      "Open /post/goal-harness-agent-phase-protocol and verify companion prompt entry.",
      "Open Agent panel on desktop and mobile.",
      "Ask a current-article question and verify source cards render.",
      "Ask about hidden/draft/admin-only content and verify refusal or public-source limit copy.",
      "Verify raw reasoning is not visible in message body, trace details, source cards, or history."
    ],
    "regression_scope": [
      "Launcher remains hidden on /write, /manage, /manage/agent, and /login.",
      "Quota blocked state keeps user draft recoverable.",
      "Cancel and timeout states restore draft.",
      "Text and Markdown file attach limits still apply.",
      "Source cards still link to public articles."
    ],
    "compliance_gates": [
      "No raw model reasoning is public-facing.",
      "No hidden/admin/draft content can appear in source cards or answers.",
      "Private uploaded context remains conversation-local.",
      "Public answers state source insufficiency instead of filling gaps with outside knowledge.",
      "Agent UI remains keyboard accessible on mobile and desktop."
    ],
    "acceptance_gates": [
      "Public Agent output does not persist or render raw reasoning in public UI.",
      "Technical claims require source-card grounding.",
      "Hidden/draft/admin-only prompts are refused or bounded to public source limits.",
      "Article and track companion prompts are context-specific and useful.",
      "answerMode dead capability is either surfaced with UI states or removed from public path.",
      "WPU-F003 is passing with tests, browser evidence, and trace/source-card evidence."
    ],
    "rollback_plan": [
      "Revert Agent UI/service changes if trust tests fail.",
      "Keep report evidence documenting the failing trust boundary."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-02-article-companion-and-agent-ux-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "focused test output",
      "browser screenshots or snapshots",
      "Agent prompt/answer evidence",
      "source-packet update",
      "continuity-ledger update"
    ],
    "waiver_policy": "Agent trust, hidden-content, and raw-reasoning gates cannot be waived for release without explicit user acceptance of public risk.",
    "next_phase_handoff": "WPU-03 may start when the author workbench can safely rely on Agent traces and reader signals."
  },
  "stop_conditions": [
    "A new database schema is required.",
    "A model provider credential or dashboard action is required.",
    "Raw reasoning cannot be removed without breaking stream behavior.",
    "Public hidden-content refusal fails and cannot be fixed within phase paths."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: WPU-02
- GOAL_TARGET: Harden public Agent trust boundaries and productize article/track companion UX.
- GOAL_PROMPT: Complete WPU-02 Article Companion And Agent UX for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-02-article-companion-and-agent-ux.md`; work on feature-oracle item WPU-F003; public readers must never see raw model reasoning, hidden/admin/draft content, or unsupported technical claims; finish only after focused Agent tests, browser companion checks, privacy checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: WPU-01
- READ_FIRST: `docs/webdeb_product_upgrade_2026_06_16/README.md`, `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/components/agent/AgentMarkdown.tsx`, `client/src/components/agent/messageState.ts`, `client/src/components/agent/routeContext.ts`, `client/src/components/agent/sourceCards.test.ts`, `client/src/components/agent/streamClient.ts`, `client/src/components/agent/BlogAgentRoot.test.ts`, `client/src/pages/PostDetail.tsx`, `client/src/pages/Track.tsx`, `client/src/i18n/agent.ts`, `server/ai/router.ts`, `server/ai/harness.ts`, `server/ai/model.ts`, `server/ai/knowledge.ts`, `server/ai/knowledgeDb.ts`, `server/ai/contextSources.ts`, `server/ai/inputSchemas.ts`, `server/ai/streamRoute.ts`, `server/ai/harness.test.ts`, `server/ai/model.test.ts`, `server/agent.router.test.ts`
- LIKELY_EDIT_PATHS: `client/src/components/agent/**`, `client/src/pages/PostDetail.tsx`, `client/src/pages/Track.tsx`, `client/src/i18n/agent.ts`, `server/ai/**`, `server/agent.router.test.ts`, `docs/webdeb_product_upgrade_2026_06_16/**`
- DO_NOT_EDIT: `drizzle/**`, `seed-blog.mjs`, `server/publicSeedPosts.ts`, `client/src/pages/Editor.tsx`, `client/src/pages/Manage.tsx`, `.env*`, production systems
- EXECUTION_MODE: plan-first; implement trust gates first; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: `pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts`; `pnpm check`; `pnpm build`
- BROWSER_CHECKS: article companion desktop/mobile; grounded public answer; hidden-content refusal; raw reasoning not visible
- REGRESSION_SCOPE: launcher route hiding; quota; cancel; timeout; context attach; source-card links
- COMPLIANCE_GATES: no raw reasoning; no hidden content; private context stays local; source-insufficient answers stay honest
- ROLLBACK_PLAN: revert Agent UI/service changes if trust tests fail
- ACCEPTANCE_GATES: no public raw reasoning; claims grounded; hidden prompts refused; context-specific companion prompts; answerMode resolved; WPU-F003 passing
- EVIDENCE_OUTPUT: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-02-article-companion-and-agent-ux-report.md`
- STOP_CONDITIONS: stop if schema migration, provider credential, raw reasoning removal blocker, or hidden-content refusal blocker appears

## Task Spec

Make the existing Blog Agent a trustworthy article and track companion. The work should focus on the public reader experience, not on creating a new standalone Agent product.

## Context Policy

Load the harness runtime files first, then inspect only the Agent UI, stream client, route context, AI router, model, harness, and knowledge files named by this phase. Do not expand into unrelated provider migrations or autonomous browsing.

## Problem Boundary

In scope:

- Public Agent UI state machine.
- Stream handling for visible answer, trace entries, source cards, and history.
- Raw reasoning removal or admin-only quarantine.
- Article/track route companion prompts.
- Hidden-content refusal and public-source limits.
- Focused Agent tests and browser evidence.

Out of scope:

- New public `/agent` route.
- PDF ingestion.
- Autonomous browsing.
- Author impersonation.
- pgvector migration.
- Deployment.

## Requirements

### R1 Public Reasoning Boundary

Public readers must not see raw model reasoning in message body, trace detail, history, source cards, or persisted public-facing state.

### R2 Source Grounding

Every technical answer must either cite source cards or explicitly say the public sources are insufficient.

### R3 Hidden Content Boundary

Questions about hidden, admin-only, draft, private, or unpublished content must refuse or explain the public-source boundary.

### R4 Companion Productization

Article and track prompts should map to actual reader tasks: explain core claim, build reading path, compare concepts, find relevant public post.

### R5 State Coverage

Loading, streaming, cancel, timeout, quota, history switching, private context attach, and mobile focus must remain covered.

## Test and Regression Requirements

Run focused Agent tests and browser checks. Add or update tests when raw reasoning, refusal, source-card, or answer-mode behavior changes.

## Compliance and Safety Requirements

No raw reasoning public exposure. No hidden content leakage. No private context promotion into public knowledge.

## Rollback and Recovery

Revert Agent UI/service changes if trust boundaries fail. Keep the report and blocker evidence.

## Execution Capture

Write `reports/wpu-02-article-companion-and-agent-ux-report.md` with tests, browser evidence, changed files, source-card examples, refusal examples, and residual risk.

## Evaluator Protocol

Evaluator must inspect visible UI and persisted conversation/history behavior. Reject if raw reasoning appears anywhere public-facing.

## Acceptance Criteria

WPU-02 is accepted when WPU-F003 is passing and Agent trust gates are backed by tests and browser/runtime evidence.

## Risks

- Removing reasoning from public UI may affect trace debugging.
- Stream behavior can regress if answer and hidden source marker parsing are coupled.
- Source insufficiency copy can become too apologetic or vague; keep it concrete.
