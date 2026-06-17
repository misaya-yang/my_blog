# Phase 05 - Release And Evaluation Gates

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance beyond this phase. This is the final release gate, not a deployment approval.

**Goal:** Turn the WebDeb upgrade work into a repeatable release checklist with product, content, Agent, SEO, privacy, and browser evidence gates.

**Architecture:** WebDeb is a Vite React client plus Express/TypeScript server with Markdown seed content, AI knowledge indexing, audit scripts, and product-optimization docs. This phase validates the full product surface after WPU-01 through WPU-04 land.

**Tech Stack:** React, TypeScript, Vite, Express, Vitest, Playwright/browser smoke checks, Markdown content seeds, local AI/knowledge-index scripts, and static SEO/feed routes.

---

## Machine Contract

The JSON block below is the authoritative machine-readable contract for goal-mode agents and validators. Keep it synchronized with the human-readable sections.

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "WPU-05",
    "number": "05",
    "title": "Release And Evaluation Gates",
    "status": "ready",
    "type": "release_validation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/webdeb_product_upgrade_2026_06_16",
    "phase_file": "docs/webdeb_product_upgrade_2026_06_16/phase-05-release-and-evaluation-gates.md",
    "depends_on": [
      "WPU-04"
    ],
    "unlocks": []
  },
  "goal": {
    "target": "Turn the WebDeb upgrade work into a repeatable release checklist with product, content, Agent, SEO, privacy, and browser evidence gates.",
    "prompt": "Complete WPU-05 Release And Evaluation Gates for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-05-release-and-evaluation-gates.md`; work on feature-oracle item WPU-F006; confirm all prior phase reports, run the release validation suite, capture browser evidence for core routes, verify Agent/content/SEO gates, update the source packet and continuity ledger, and stop before deployment unless the user explicitly approves it.",
    "plan_required": true,
    "plan_output": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-05-release-and-evaluation-gates-plan.md",
    "completion_report": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-05-release-and-evaluation-gates-report.md"
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
    "agent_roles": [
      "planner",
      "generator",
      "evaluator",
      "release_manager",
      "qa_evaluator",
      "privacy_reviewer"
    ]
  },
  "context": {
    "read_first": [
      "docs/webdeb_product_upgrade_2026_06_16/README.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md",
      "docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json",
      "docs/webdeb_product_upgrade_2026_06_16/progress-log.md",
      "docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md",
      "docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md",
      "docs/webdeb_product_upgrade_2026_06_16/source-packet.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-05-release-and-evaluation-gates.md"
    ],
    "primary_context": [
      "package.json",
      "scripts/audit/baseline.ts",
      "scripts/audit/ui-layout.ts",
      "scripts/audit/publish-freshness.ts",
      "scripts/ai/reindex-knowledge.ts",
      "server/seo.ts",
      "server/ai/evals.ts",
      "server/ai/router.ts",
      "client/src/pages/ManageAgent.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/PostDetail.tsx",
      "README.md",
      "docs/deployment.md"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "production logs",
      "external analytics dashboards",
      "private draft stores",
      "unrelated repository histories"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "package.json",
      "scripts/audit/**",
      "scripts/ai/**",
      "server/seo.ts",
      "server/ai/evals.ts",
      "server/ai/router.ts",
      "client/src/pages/ManageAgent.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/PostDetail.tsx",
      "README.md",
      "docs/deployment.md",
      "docs/webdeb_product_upgrade_2026_06_16/source-packet.md",
      "docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md",
      "docs/webdeb_product_upgrade_2026_06_16/progress-log.md",
      "docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md"
    ],
    "do_not_edit": [
      ".env*",
      "production secrets",
      "deployment credentials",
      "database dumps",
      "unrelated feature branches",
      "unrelated article rewrites"
    ],
    "external_inputs": [
      "explicit user approval is required before deployment, production indexing, or external service mutation"
    ],
    "secrets_required": []
  },
  "tool_policy": {
    "allowed_tools": [
      "repo search",
      "shell validation",
      "local dev server",
      "browser screenshots",
      "non-production AI eval commands"
    ],
    "approval_required": [
      "deployment",
      "production data mutation",
      "external service changes",
      "credential access",
      "destructive commands"
    ],
    "dangerous_commands": [
      "git reset --hard",
      "rm -rf",
      "production migration",
      "netlify deploy --prod",
      "vercel --prod"
    ]
  },
  "risk": {
    "tags": [
      "release",
      "ai",
      "privacy",
      "seo",
      "content_quality"
    ],
    "data_mutation": "local_only",
    "migration_required": "false",
    "browser_required": "true",
    "ai_eval_required": "true",
    "external_service_required": "false",
    "release_blocking": "true"
  },
  "validation": {
    "commands": [
      {
        "id": "typecheck",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm check",
        "expected": "TypeScript passes without new errors",
        "required": true
      },
      {
        "id": "unit-and-integration",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm test",
        "expected": "Vitest suite passes; known environment warnings are documented",
        "required": true
      },
      {
        "id": "content-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:audit",
        "expected": "Markdown, seed, and metadata audit has zero failures",
        "required": true
      },
      {
        "id": "content-publish-freshness",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:publish",
        "expected": "Seed/fallback/series freshness passes, or documented blockers prevent release",
        "required": true
      },
      {
        "id": "production-build",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm build",
        "expected": "Client/server build succeeds",
        "required": true
      },
      {
        "id": "baseline-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick",
        "expected": "Core public routes, SEO, and smoke checks pass against local dev server",
        "required": true
      },
      {
        "id": "ui-layout-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm audit:ui",
        "expected": "Desktop/mobile layout audit has no overlap or unreadable-text regressions",
        "required": true
      }
    ],
    "browser_checks": [
      "Desktop and mobile `/` show a clear first-read path, latest article, tracks, and no loading dead-end.",
      "Desktop and mobile `/post/:slug` keep article reading primary while companion modules remain usable.",
      "`/archive`, `/search`, `/rss.xml`, `/sitemap.xml`, and `/robots.txt` return useful release-ready output.",
      "`/agent` or embedded article Agent streams without leaking raw reasoning, hidden content, private context, or stale unsupported claims.",
      "`/manage/agent` exposes evaluation, freshness, and reindex health without requiring production credentials."
    ],
    "regression_scope": [
      "WPU-01 visual system and mobile reader parity remain intact",
      "WPU-02 Agent privacy, refusal, source, and answer-mode gates remain intact",
      "WPU-03 writing backlog and author feedback capture remain intact",
      "WPU-04 content metadata, search, series, RSS, and SEO gates remain intact"
    ],
    "compliance_gates": [
      "no secret files are read or written",
      "no production data or external services are mutated",
      "no raw model reasoning is rendered, logged, or persisted for readers",
      "private reader context can be removed or scoped before release",
      "draft/hidden content is excluded from public search, feeds, sitemap, and Agent citations",
      "deployment requires explicit user approval after this phase"
    ],
    "acceptance_gates": [
      "all required validation commands pass or have named blockers",
      "browser screenshots or equivalent route evidence are linked in the phase report",
      "feature-oracle item WPU-F006 is updated with evidence",
      "source-packet records final release facts and changed commands",
      "continuity-ledger records cross-phase decisions and remaining risks",
      "progress-log and agent-handoff name whether release is ready, blocked, or partial",
      "rollback notes identify how to undo phase-scoped release gate changes"
    ],
    "rollback_plan": [
      "revert phase-scoped audit, script, docs, and UI changes",
      "restore prior package scripts if command changes break release validation",
      "remove generated local screenshots or logs that should not be committed",
      "do not deploy until all blockers are resolved and approved"
    ]
  },
  "evidence": {
    "outputs": [
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-05-release-and-evaluation-gates-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "validation command table",
      "browser route evidence",
      "Agent eval or smoke evidence",
      "content publish freshness evidence",
      "feature-oracle evidence",
      "continuity-ledger update",
      "source-packet release summary"
    ],
    "waiver_policy": "Only mark a gate waived when the user explicitly waives it or the report documents a blocker, impact, and follow-up owner.",
    "next_phase_handoff": "This is the final phase. Handoff states release readiness and the first production approval step."
  },
  "stop_conditions": [
    "a required prior phase report is missing or contradictory",
    "release validation needs credentials that are unavailable",
    "deployment or external service mutation would be required",
    "raw reasoning, hidden content exposure, or private-context retention cannot be fixed within phase scope",
    "core route browser evidence cannot be captured"
  ]
}
```

## Coding Agent Contract

- PHASE_ID: WPU-05
- GOAL_TARGET: Turn the WebDeb upgrade work into a repeatable release checklist with product, content, Agent, SEO, privacy, and browser evidence gates.
- GOAL_PROMPT: Complete WPU-05 Release And Evaluation Gates for `/Users/yang/projects/ai-tech-blog` by following this file; work on feature-oracle item WPU-F006; confirm all prior phase reports; run the release validation suite; capture browser evidence for core routes; update release facts in the source packet and continuity ledger; stop before deployment unless the user explicitly approves it.
- DEPENDS_ON: WPU-04
- READ_FIRST: `docs/webdeb_product_upgrade_2026_06_16/README.md`, `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`, `docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json`, `docs/webdeb_product_upgrade_2026_06_16/progress-log.md`, `docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md`, this file
- PRIMARY_CONTEXT: `package.json`, `scripts/audit/baseline.ts`, `scripts/audit/ui-layout.ts`, `scripts/audit/publish-freshness.ts`, `scripts/ai/reindex-knowledge.ts`, `server/seo.ts`, `server/ai/evals.ts`, `server/ai/router.ts`, `client/src/pages/ManageAgent.tsx`, `README.md`, `docs/deployment.md`
- LIKELY_EDIT_PATHS: `package.json`, `scripts/audit/**`, `scripts/ai/**`, `server/seo.ts`, `server/ai/evals.ts`, `server/ai/router.ts`, `client/src/pages/ManageAgent.tsx`, `client/src/pages/Home.tsx`, `client/src/pages/PostDetail.tsx`, `README.md`, `docs/deployment.md`, harness runtime docs
- DO_NOT_EDIT: `.env*`, production secrets, deployment credentials, database dumps, unrelated article rewrites, unrelated feature branches
- EXECUTION_MODE: plan-first; validate prior phases; implement only missing release-gate code; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm content:audit`; `pnpm content:publish`; `pnpm build`; `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick`; `pnpm audit:ui`
- BROWSER_CHECKS: `/`, `/post/:slug`, `/archive`, `/search`, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/manage/agent`, and the reader Agent entry point on desktop and mobile where applicable.
- REGRESSION_SCOPE: WPU-01 through WPU-04 phase reports, feature-oracle states, source-packet facts, and continuity-ledger boundaries remain valid.
- COMPLIANCE_GATES: No secret access, no production mutation, no raw reasoning exposure, no hidden/draft content exposure, no deployment without explicit approval.
- ROLLBACK_PLAN: Revert phase-scoped release-gate edits, restore previous package scripts, remove uncommitted local evidence files that should not ship, and leave deployment unattempted.
- ACCEPTANCE_GATES: Required commands pass or blockers are named; browser evidence exists; WPU-F006 is updated; source packet, continuity ledger, progress log, and handoff are updated.
- EVIDENCE_OUTPUT: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-05-release-and-evaluation-gates-report.md`
- STOP_CONDITIONS: Stop if a prior phase is missing, credentials are required, raw reasoning/private content exposure remains unresolved, or local browser evidence cannot be captured.

## Harness Runtime

- FEATURE_ORACLE: `docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json`
- LOOP_CONTRACT: `docs/webdeb_product_upgrade_2026_06_16/loop-contract.json`
- LOOP_STATE: `docs/webdeb_product_upgrade_2026_06_16/loop-state.json`
- PROGRESS_LOG: `docs/webdeb_product_upgrade_2026_06_16/progress-log.md`
- AGENT_HANDOFF: `docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md`
- NEXT_WINDOW_PROMPT: `docs/webdeb_product_upgrade_2026_06_16/next-window-prompt.md`
- CONTINUITY_LEDGER: `docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md`

Session boot:

1. Read the runtime artifacts above.
2. Confirm WPU-00 through WPU-04 reports exist and record any missing dependency as a blocker.
3. Run the target validation suite against the local repo and local dev server.
4. Capture browser route evidence for the core reader, archive/search, feed, SEO, and Agent management surfaces.
5. Update source-packet, continuity-ledger, progress-log, feature-oracle, and agent-handoff before exiting.

## Feature Oracle Policy

The feature oracle is the durable test list for long-running agents. Do not delete oracle cases to make completion easier. Update only `status`, `evidence`, and `notes` unless the user explicitly changes scope.

Status rules:

- `failing`: not implemented or not verified.
- `passing`: end-to-end evidence exists.
- `blocked`: a named dependency, credential, environment, or scope issue prevents completion.
- `waived`: the user explicitly waived the case and remaining risk is documented.

## Task Spec

Execute WPU-05 by making release readiness observable. The desired end state is not just "tests pass"; it is a product manager-friendly release decision:

- Readers can land, choose a first article, read without visual overload, search/archive content, and use the Agent without privacy surprises.
- Authors can trust the writing/content pipeline because content audit, publish freshness, knowledge reindex, search misses, and Agent evals are represented in release evidence.
- Maintainers can see exactly which checks must pass before publishing and which checks block release.
- Deployment is explicitly outside this phase unless separately approved.

This phase may add small missing release-gate scripts or docs, but it must not reopen UI, Agent, writing, or content implementation unless a release blocker is found.

## Problem Boundary

In scope:

- release readiness evidence for UI, Agent, writing workflow, content freshness, SEO, feeds, privacy, and build health;
- local validation scripts, local browser checks, and report updates;
- small release-gate fixes when a blocker prevents accurate validation.

Out of scope:

- production deployment without explicit approval;
- broad redesign or article rewrites;
- provider migrations, database migrations, or external dashboard changes.

## Context Policy

Load the harness runtime files first, then inspect the release, audit, SEO, Agent eval, content freshness, and route files named by this phase. Do not read secrets, production logs, external dashboards, or unrelated branches. If prior phase reports are missing, record the missing dependency before continuing.

## Requirements

- Produce a human-readable release verdict: `ready`, `partial`, or `blocked`.
- Tie every release claim to command, browser, eval, route, file, or blocker evidence.
- Confirm WPU-01 through WPU-04 acceptance gates remain valid.
- Keep deployment separate from release validation.

## Test and Regression Requirements

- Run the validation commands listed in the Machine Contract after any phase-scoped fix.
- Capture browser or route evidence for the public reader, article detail, archive/search, feed/SEO, and Agent management surfaces.
- Record known environment warnings separately from true failures.
- Treat skipped critical checks as blockers unless the user explicitly waives them.

## Compliance and Safety Requirements

- Do not read or write secret files.
- Do not mutate production data or external services.
- Do not expose raw model reasoning, hidden posts, draft content, or private reader context.
- Require explicit approval for deployment, production indexing, or persistent external changes.

## Rollback and Recovery

- Revert only phase-scoped release-gate changes if validation regresses.
- Restore previous package scripts or audit commands if new gates are unstable.
- Remove generated local screenshots or logs that should not ship.
- Leave production untouched until approval exists.

## Execution Capture

Write `reports/wpu-05-release-and-evaluation-gates-report.md` with command results, browser evidence, Agent trust evidence, content/SEO/feed evidence, privacy notes, rollback notes, and deployment approval status. Update WPU-F006, `source-packet.md`, `continuity-ledger.md`, `progress-log.md`, and `agent-handoff.md`.

## Evaluator Protocol

An evaluator should review the phase report before release approval and verify that all required commands either passed or have named blockers, all browser evidence is linked, privacy gates are explicitly checked, and deployment has not been performed without approval.

## Acceptance Criteria

- WPU-F006 is `passing`, `blocked`, or `waived` with evidence.
- Required validation and browser checks are recorded.
- Agent, content, SEO, feed, privacy, and rollback gates are represented in the report.
- The handoff states the next human action.

## Risks

- Local checks can pass while production credentials, feeds, or cached indexes differ.
- Agent evals can miss source-boundary regressions without dedicated hidden-content probes.
- Browser evidence can become stale after later CSS or layout edits.
- Treating warnings as passes can hide release blockers.

## Cross-Phase Continuity

- Depends on: WPU-04
- Unlocks: none
- Feature-oracle item: WPU-F006
- Continuity ledger: `docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md`
- Prior-phase evidence to inherit: WPU-01 visual/browser evidence, WPU-02 Agent trust evidence, WPU-03 writing backlog evidence, WPU-04 content/SEO/feed evidence.
- Boundary this phase must preserve: product improvements stay bounded to release quality; production deploys require explicit user approval.
- Handoff this phase must produce: release readiness status, unresolved blockers, rollback notes, and the first approval step for production.

## Product Requirements

### PRD WPU-05.1 - Release Dashboard of Truth

The release report must be the single place a human can answer:

- Is the reader experience ready?
- Is the Agent trustworthy enough for public use?
- Is writing/content freshness protected?
- Are SEO, RSS, sitemap, and search ready?
- Are privacy and hidden-content boundaries intact?
- What blocks deployment?

### PRD WPU-05.2 - Evidence Before Confidence

Every pass/fail claim must cite one of:

- a command with exact output summary,
- a browser screenshot or route capture,
- an Agent eval/smoke trace,
- a file-level diff summary,
- a named blocker with owner and next action.

### PRD WPU-05.3 - No Silent Waivers

Known weak spots from the baseline audit cannot be silently treated as release-ready:

- stale knowledge indexes,
- raw reasoning leakage,
- hidden/draft content exposure,
- missing feed/SEO freshness,
- missing mobile reader evidence,
- private context without deletion or scoping,
- audit commands that pass while skipping critical routes.

## Validation Protocol

Run these in order after any phase-scoped fixes:

1. `pnpm check`
2. `pnpm test`
3. `pnpm content:audit`
4. `pnpm content:publish`
5. `pnpm build`
6. Start local dev server on an available port.
7. `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick`
8. `pnpm audit:ui`
9. Browser evidence for `/`, one article detail route, `/archive`, `/search`, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/manage/agent`, and reader Agent entry.

If a command does not exist, do not replace it with optimism. Record whether the phase must add it, mark it blocked, or explicitly defer with user approval.

## Compliance and Privacy Review

Before WPU-F006 can pass, verify and record:

- Reader-facing UI does not expose model reasoning fields such as `reasoningMarkdown`.
- Agent sources never cite hidden, draft, private, or deleted article content.
- Private reader context has a visible lifecycle or is excluded from public release.
- Eval/debug endpoints do not leak secrets or private user content.
- Feed, sitemap, robots, and SEO routes exclude unpublished content.
- Release docs do not instruct maintainers to use credentials in local logs or committed files.

## Code Summary Writeback

Before claiming completion, update:

- `source-packet.md`: final release commands, browser routes, Agent/content/SEO files touched, and remaining runtime constraints.
- `continuity-ledger.md`: release decisions, blockers, approvals needed, and rollback notes.
- `progress-log.md`: final WPU-05 pass/partial/blocked entry.
- `agent-handoff.md`: whether the next human action is implementation, review, production approval, or blocker resolution.
- `feature-oracle.json`: WPU-F006 status and evidence.

## Required Report Shape

Write `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-05-release-and-evaluation-gates-report.md` with:

- release verdict: `ready`, `partial`, or `blocked`,
- command evidence table,
- browser evidence table,
- Agent trust evidence,
- content/SEO/feed evidence,
- privacy/compliance notes,
- rollback plan,
- deployment approval status,
- next action.
