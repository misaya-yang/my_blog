# Phase 03 - Writing Workbench And Content Backlog

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write evidence, and do not advance to WPU-04 until author workflow and privacy gates pass.

**Goal:** Turn writing, feedback, search misses, and AgentOps radar into a durable author backlog.

**Architecture:** WPU-03 builds on the trusted Agent from WPU-02 and focuses on owner surfaces. It may touch owner UI, engagement routes, Agent run/radar routes, and persistence only with explicit migration evidence.

**Tech Stack:** React owner pages, tRPC, Drizzle, engagement routes, Agent run traces, content radar, Vitest, local browser checks.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "WPU-03",
    "number": "03",
    "title": "Writing Workbench And Content Backlog",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/webdeb_product_upgrade_2026_06_16",
    "phase_file": "docs/webdeb_product_upgrade_2026_06_16/phase-03-writing-workbench-and-content-backlog.md",
    "depends_on": ["WPU-02"],
    "unlocks": ["WPU-04"]
  },
  "goal": {
    "target": "Turn writing, feedback, search misses, and AgentOps radar into a durable author backlog.",
    "prompt": "Complete WPU-03 Writing Workbench And Content Backlog for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-03-writing-workbench-and-content-backlog.md`; work on feature-oracle item WPU-F004; preserve private reader data and hidden content boundaries; finish only after owner workflow checks, focused tests, privacy checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-03-writing-workbench-and-content-backlog-plan.md",
    "completion_report": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-03-writing-workbench-and-content-backlog-report.md"
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
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-02-article-companion-and-agent-ux-report.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-03-writing-workbench-and-content-backlog.md"
    ],
    "primary_context": [
      "client/src/pages/Editor.tsx",
      "client/src/pages/Manage.tsx",
      "client/src/pages/ManageAgent.tsx",
      "client/src/components/ArticleFeedback.tsx",
      "client/src/components/SubscriptionForm.tsx",
      "client/src/lib/knowledgeRefresh.ts",
      "client/src/i18n/editor.ts",
      "client/src/i18n/manage.ts",
      "client/src/i18n/agentOps.ts",
      "server/routers.ts",
      "server/engagement.router.ts",
      "server/searchMisses.ts",
      "server/ai/harness.ts",
      "server/ai/conversations.ts",
      "server/content-ops.router.test.ts",
      "server/engagement.router.test.ts",
      "server/agent.router.test.ts",
      "drizzle/schema.ts"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "public visual redesign files",
      "model prompt internals unrelated to question radar",
      "deployment configuration"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/pages/Editor.tsx",
      "client/src/pages/Manage.tsx",
      "client/src/pages/ManageAgent.tsx",
      "client/src/components/ArticleFeedback.tsx",
      "client/src/components/SubscriptionForm.tsx",
      "client/src/lib/knowledgeRefresh.ts",
      "client/src/i18n/editor.ts",
      "client/src/i18n/manage.ts",
      "client/src/i18n/agentOps.ts",
      "server/routers.ts",
      "server/engagement.router.ts",
      "server/searchMisses.ts",
      "server/ai/harness.ts",
      "server/ai/conversations.ts",
      "server/content-ops.router.test.ts",
      "server/engagement.router.test.ts",
      "server/agent.router.test.ts",
      "drizzle/schema.ts",
      "drizzle/*.sql",
      "docs/webdeb_product_upgrade_2026_06_16/**"
    ],
    "do_not_edit": [
      "server/ai/model.ts",
      "server/ai/knowledgeDb.ts",
      "seed-blog.mjs",
      "client/src/styles/visual-refresh.css",
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
      "database migration dry-run when migration is planned"
    ],
    "approval_required": [
      "schema migration",
      "production data mutation",
      "deployment",
      "external service changes"
    ],
    "dangerous_commands": [
      "git reset --hard",
      "rm -rf",
      "production migration",
      "force push"
    ]
  },
  "risk": {
    "tags": ["frontend", "agent", "database", "privacy", "auth"],
    "data_mutation": true,
    "migration_required": "unknown",
    "browser_required": true,
    "ai_eval_required": true,
    "external_service_required": false,
    "release_blocking": false
  },
  "validation": {
    "commands": [
      {
        "id": "owner-workflow-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm exec vitest run server/content-ops.router.test.ts server/engagement.router.test.ts server/agent.router.test.ts",
        "expected": "Owner workflow tests pass.",
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
        "id": "tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm test",
        "expected": "Full test suite passes before phase completion.",
        "required": true
      }
    ],
    "browser_checks": [
      "Open /write as authenticated owner when possible; otherwise capture unauthenticated fallback and code-level auth evidence.",
      "Open /manage as authenticated owner when possible; otherwise capture unauthenticated fallback and code-level auth evidence.",
      "Open /manage/agent as authenticated owner when possible; otherwise capture unauthenticated fallback and code-level auth evidence.",
      "Verify content radar, Agent traces, question radar, feedback, search misses, and subscriptions are presented as writing signals."
    ],
    "regression_scope": [
      "Owner auth gates remain enforced.",
      "Post save, draft, publish, version restore, and knowledge refresh warnings still work.",
      "Article feedback and subscription flows still avoid public PII exposure.",
      "Agent question radar does not expose private uploaded context."
    ],
    "compliance_gates": [
      "Backlog views do not expose email addresses, IPs, private uploaded context, or hidden content to public users.",
      "Any new persisted backlog table has admin-only access and rollback notes.",
      "Search misses must not store direct personal contact data.",
      "Stale knowledge after publish is visible and actionable to the owner."
    ],
    "acceptance_gates": [
      "Author can see a single writing backlog or signal hub that combines feedback, search misses, and Agent question radar.",
      "Idea status persists beyond localStorage or the report documents a deliberate blocker.",
      "Publish stale knowledge warning is not silently treated as full success.",
      "Owner can move from backlog signal to draft/edit action without losing context.",
      "WPU-F004 is passing with owner workflow, privacy, and test evidence."
    ],
    "rollback_plan": [
      "If no migration is used, revert WPU-03 owner UI and route changes.",
      "If a migration is used, include down/rollback notes and data cleanup in the report before acceptance."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-03-writing-workbench-and-content-backlog-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "owner screenshots or fallback evidence",
      "test output summary",
      "privacy review notes",
      "source-packet update",
      "continuity-ledger update"
    ],
    "waiver_policy": "Owner authenticated screenshot can be replaced by unauthenticated fallback only when the report includes code-level owner authorization evidence.",
    "next_phase_handoff": "WPU-04 may start when content signals and backlog state have a stable data contract."
  },
  "stop_conditions": [
    "Authenticated owner state is required and no fallback verification can prove behavior.",
    "A migration is required but rollback cannot be written.",
    "The feature requires exposing private reader data.",
    "The task expands into public community or comment product."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: WPU-03
- GOAL_TARGET: Turn writing, feedback, search misses, and AgentOps radar into a durable author backlog.
- GOAL_PROMPT: Complete WPU-03 Writing Workbench And Content Backlog for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-03-writing-workbench-and-content-backlog.md`; work on feature-oracle item WPU-F004; preserve private reader data and hidden content boundaries; finish only after owner workflow checks, focused tests, privacy checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: WPU-02
- READ_FIRST: `docs/webdeb_product_upgrade_2026_06_16/README.md`, `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/pages/Editor.tsx`, `client/src/pages/Manage.tsx`, `client/src/pages/ManageAgent.tsx`, `client/src/components/ArticleFeedback.tsx`, `client/src/components/SubscriptionForm.tsx`, `client/src/lib/knowledgeRefresh.ts`, `client/src/i18n/editor.ts`, `client/src/i18n/manage.ts`, `client/src/i18n/agentOps.ts`, `server/routers.ts`, `server/engagement.router.ts`, `server/searchMisses.ts`, `server/ai/harness.ts`, `server/ai/conversations.ts`, `server/content-ops.router.test.ts`, `server/engagement.router.test.ts`, `server/agent.router.test.ts`, `drizzle/schema.ts`
- LIKELY_EDIT_PATHS: owner pages/components/i18n, engagement routes, search misses, Agent radar/conversations, owner tests, optional Drizzle migration, docs
- DO_NOT_EDIT: `server/ai/model.ts`, `server/ai/knowledgeDb.ts`, `seed-blog.mjs`, `client/src/styles/visual-refresh.css`, `.env*`, production systems
- EXECUTION_MODE: plan-first; privacy-first; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: focused owner tests; `pnpm check`; `pnpm test`
- BROWSER_CHECKS: `/write`, `/manage`, `/manage/agent` authenticated if possible, fallback plus code-level auth evidence if not
- REGRESSION_SCOPE: owner auth; save/draft/publish/restore; feedback; subscriptions; Agent radar
- COMPLIANCE_GATES: no public PII; admin-only backlog; no private context exposure; stale knowledge warning visible
- ROLLBACK_PLAN: revert owner UI/routes or include migration rollback notes
- ACCEPTANCE_GATES: writing signal hub; durable idea status or blocker; stale publish not silent; backlog-to-draft path; WPU-F004 passing
- EVIDENCE_OUTPUT: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-03-writing-workbench-and-content-backlog-report.md`
- STOP_CONDITIONS: stop if authenticated proof, migration rollback, privacy boundary, or public-community scope blocks completion

## Task Spec

Make author operations practical. Reader feedback, search misses, Agent traces, and question radar should become a writing backlog or signal hub instead of isolated admin panels.

## Context Policy

Load the harness runtime files first, then inspect the editor, manage, AgentOps, feedback, search-miss, and admin router files named by this phase. Keep public reader UI and content rewrites out of scope unless they are needed to verify the author workflow.

## Problem Boundary

In scope:

- Owner dashboard composition.
- Writing backlog/status.
- Feedback/subscription/search-miss/Agent radar aggregation.
- Publish stale knowledge warning visibility.
- Privacy and authorization checks.

Out of scope:

- Public community/comment system.
- Email deliverability product.
- Agent model behavior.
- Content source migration.
- Deployment.

## Requirements

### R1 Signal Hub

The owner should see feedback, search misses, no-source Agent questions, and content radar as writing signals.

### R2 Durable Backlog

Idea status should persist beyond localStorage, or the phase must document why persistence is deferred.

### R3 Publish Trust

If knowledge refresh is stale after save/publish/restore, the owner must see a durable recovery path rather than a transient success impression.

### R4 Privacy Boundary

Backlog evidence must not expose private uploaded context, direct personal contact data, IPs, hidden posts, or admin-only content to public users.

## Test and Regression Requirements

Run owner workflow tests, full tests, and browser owner checks or fallback evidence.

## Compliance and Safety Requirements

Admin-only access is required for backlog and radar surfaces. Any migration requires rollback notes.

## Rollback and Recovery

Revert owner UI/routes if no migration is used. If migration is used, include SQL rollback and cleanup plan in the report.

## Execution Capture

Write `reports/wpu-03-writing-workbench-and-content-backlog-report.md` with owner screenshots, test output, privacy notes, changed files, and handoff to WPU-04.

## Evaluator Protocol

Evaluator must verify the backlog does not leak private reader data and that owner signals are actionable, not merely displayed.

## Acceptance Criteria

WPU-03 is accepted when WPU-F004 is passing with owner workflow, persistence or blocker evidence, tests, and privacy review.

## Risks

- Persisting backlog can require schema migration.
- Owner auth state may be unavailable in browser automation.
- Search misses can accidentally collect sensitive queries; keep capture minimal and admin-only.
