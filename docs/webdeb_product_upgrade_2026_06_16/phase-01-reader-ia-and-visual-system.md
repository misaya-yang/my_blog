# Phase 01 - Reader IA And Visual System

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance to WPU-02 until acceptance gates pass or blockers are documented.

**Goal:** Make home and article reading IA clearer while consolidating visual system risk.

**Architecture:** WPU-01 edits public reader surfaces and visual CSS. It inherits WPU-00 baseline screenshots and creates the public surface that Agent UX must integrate with in WPU-02.

**Tech Stack:** React, wouter, Tailwind v4, Radix/shadcn-style components, lucide icons, CSS in `client/src/styles`, Vite browser checks.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "WPU-01",
    "number": "01",
    "title": "Reader IA And Visual System",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/webdeb_product_upgrade_2026_06_16",
    "phase_file": "docs/webdeb_product_upgrade_2026_06_16/phase-01-reader-ia-and-visual-system.md",
    "depends_on": ["WPU-00"],
    "unlocks": ["WPU-02"]
  },
  "goal": {
    "target": "Make home and article reading IA clearer while consolidating visual system risk.",
    "prompt": "Complete WPU-01 Reader IA And Visual System for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-01-reader-ia-and-visual-system.md`; work on feature-oracle item WPU-F002; preserve current routes, public content boundaries, dark research identity, and existing user changes; finish only after validation, browser screenshots, accessibility checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-01-reader-ia-and-visual-system-plan.md",
    "completion_report": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-01-reader-ia-and-visual-system-report.md"
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
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-00-baseline-product-audit-report.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-01-reader-ia-and-visual-system.md"
    ],
    "primary_context": [
      "client/src/pages/Home.tsx",
      "client/src/pages/PostDetail.tsx",
      "client/src/pages/Track.tsx",
      "client/src/pages/Search.tsx",
      "client/src/components/ResearchShell.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/SeriesProgress.tsx",
      "client/src/components/MarkdownRenderer.tsx",
      "client/src/i18n/home.ts",
      "client/src/i18n/post.ts",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/public-components.css",
      "client/src/index.css",
      "scripts/audit/ui-layout.ts"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "server/ai implementation details",
      "database migration files",
      "deployment configuration"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "client/src/pages/Home.tsx",
      "client/src/pages/PostDetail.tsx",
      "client/src/pages/Track.tsx",
      "client/src/pages/Search.tsx",
      "client/src/components/ResearchShell.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/SeriesProgress.tsx",
      "client/src/i18n/home.ts",
      "client/src/i18n/post.ts",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/public-components.css",
      "scripts/audit/ui-layout.ts",
      "docs/webdeb_product_upgrade_2026_06_16/**"
    ],
    "do_not_edit": [
      "server/ai/**",
      "drizzle/**",
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
      "Playwright MCP"
    ],
    "approval_required": [
      "deployment",
      "production data mutation",
      "schema migration",
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
    "tags": ["ui", "frontend", "a11y", "release"],
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
        "expected": "Vitest suite passes with documented known warnings only.",
        "required": true
      },
      {
        "id": "build",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm build",
        "expected": "Production build succeeds.",
        "required": true
      },
      {
        "id": "ui-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm audit:ui",
        "expected": "UI layout checks pass or blockers are recorded.",
        "required": true
      }
    ],
    "browser_checks": [
      "Capture / at 1440x900 and 390x844.",
      "Capture /algorithms at 1280x800 and 390x844.",
      "Capture /applications at 1280x800 and 390x844.",
      "Capture /search?q=zzzz-no-hit-ui-audit at 390x844.",
      "Capture /post/goal-harness-agent-phase-protocol at 1440x900 and 390x844.",
      "Verify no horizontal overflow at 390, 768, 1280, and 1440 widths."
    ],
    "regression_scope": [
      "Existing routes still load.",
      "Search form still navigates.",
      "Article markdown, code, formulas, tables, tags, series, and TOC remain readable.",
      "Blog Agent launcher remains visible on public routes and hidden on write/manage/login routes."
    ],
    "compliance_gates": [
      "Keyboard focus states visible for nav, search, article actions, and mobile menus.",
      "Reduced-motion behavior is preserved for existing motion.",
      "Button labels do not wrap awkwardly at desktop.",
      "No hidden/admin/draft content is introduced into public UI.",
      "No raw model reasoning is added to UI."
    ],
    "acceptance_gates": [
      "Home has a clear first-read or start-here path.",
      "Home loading, empty, and error states are visually distinct from real content.",
      "Article page defaults to title, core claim or reading brief, compact TOC or series affordance, and assistant entry without auxiliary overload.",
      "Mobile reader keeps key navigation aids through accessible collapsed or sheet patterns, not direct removal.",
      "Visual CSS ownership is clearer, with duplicate overrides reduced or documented.",
      "WPU-F002 is passing with screenshot and command evidence."
    ],
    "rollback_plan": [
      "Revert WPU-01 changed UI files from git if validation fails.",
      "Keep docs/report changes that describe the blocker."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-01-reader-ia-and-visual-system-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "desktop and mobile screenshots",
      "validation command output summary",
      "source-packet update",
      "continuity-ledger update"
    ],
    "waiver_policy": "Only mark browser or a11y gates waived with explicit user waiver and residual risk.",
    "next_phase_handoff": "WPU-02 may start when public reader surfaces and assistant entry assumptions are stable."
  },
  "stop_conditions": [
    "A route slug or SEO migration is required.",
    "The phase requires server/ai changes.",
    "The phase requires replacing the visual identity instead of preserving it.",
    "Existing user CSS changes cannot be separated from planned edits."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: WPU-01
- GOAL_TARGET: Make home and article reading IA clearer while consolidating visual system risk.
- GOAL_PROMPT: Complete WPU-01 Reader IA And Visual System for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-01-reader-ia-and-visual-system.md`; work on feature-oracle item WPU-F002; preserve current routes, public content boundaries, dark research identity, and existing user changes; finish only after validation, browser screenshots, accessibility checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: WPU-00
- READ_FIRST: `docs/webdeb_product_upgrade_2026_06_16/README.md`, `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/src/pages/Home.tsx`, `client/src/pages/PostDetail.tsx`, `client/src/pages/Track.tsx`, `client/src/pages/Search.tsx`, `client/src/components/ResearchShell.tsx`, `client/src/components/ArticleCard.tsx`, `client/src/components/SeriesProgress.tsx`, `client/src/components/MarkdownRenderer.tsx`, `client/src/i18n/home.ts`, `client/src/i18n/post.ts`, `client/src/styles/visual-refresh.css`, `client/src/styles/public-components.css`, `client/src/index.css`, `scripts/audit/ui-layout.ts`
- LIKELY_EDIT_PATHS: `client/src/pages/Home.tsx`, `client/src/pages/PostDetail.tsx`, `client/src/pages/Track.tsx`, `client/src/pages/Search.tsx`, `client/src/components/ResearchShell.tsx`, `client/src/components/ArticleCard.tsx`, `client/src/components/SeriesProgress.tsx`, `client/src/i18n/home.ts`, `client/src/i18n/post.ts`, `client/src/styles/visual-refresh.css`, `client/src/styles/public-components.css`, `scripts/audit/ui-layout.ts`, `docs/webdeb_product_upgrade_2026_06_16/**`
- DO_NOT_EDIT: `server/ai/**`, `drizzle/**`, `seed-blog.mjs`, `package.json`, `.env*`, production systems
- EXECUTION_MODE: plan-first; preserve user CSS diff; implement stepwise; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`; `pnpm audit:ui`
- BROWSER_CHECKS: `/`, `/algorithms`, `/applications`, `/search?q=zzzz-no-hit-ui-audit`, `/post/goal-harness-agent-phase-protocol` at named desktop/mobile viewports
- REGRESSION_SCOPE: routes load; search navigates; markdown/code/formulas/tables remain readable; Agent launcher visibility rules remain
- COMPLIANCE_GATES: keyboard focus; reduced motion; readable contrast; no hidden content; no raw reasoning
- ROLLBACK_PLAN: revert WPU-01 UI files from git and keep blocker report
- ACCEPTANCE_GATES: first-read path visible; loading/empty/error distinct; article auxiliary modules reduced; mobile reader parity; visual CSS ownership improved; WPU-F002 passing
- EVIDENCE_OUTPUT: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-01-reader-ia-and-visual-system-report.md`
- STOP_CONDITIONS: stop if route migration, server/ai changes, visual reset, or conflicting user CSS edits are required

## Task Spec

Make the public reading product easier to understand. The first screen should tell readers where to start, how to search, and what track to enter. Article pages should prioritize reading while keeping the companion and series affordances available.

## Context Policy

Load the harness runtime files first, then inspect the named reader shell, home, article, track, and CSS files. Avoid unrelated owner, backend, or Agent internals unless a reader-facing regression points directly to them.

## Problem Boundary

In scope:

- Home IA and first-read path.
- Article reading brief, TOC/series placement, mobile parity.
- Search zero-result visual hierarchy when tied to reader recovery.
- Visual token and CSS ownership cleanup for public surfaces.
- UI layout audit expansion when needed.

Out of scope:

- Agent model or retrieval behavior.
- Content source or seed migration.
- New routes or route slug changes.
- Deployment.

## Requirements

### R1 Home First-Read Path

Home must present a clear start path for new readers and keep latest note, search, and the two tracks in a visible hierarchy.

### R2 Article Reading Calm

Article pages must avoid auxiliary overload before the reader reaches the body. Default visible modules should be reduced to reading brief, series/TOC affordance, and assistant entry.

### R3 Mobile Reader Parity

Mobile must not simply hide key reading aids. Use accessible collapsed sections, sticky mini nav, or sheet patterns with clear labels and focus behavior.

### R4 Visual System Consolidation

Reduce duplicate overrides in `visual-refresh.css` or document remaining ownership boundaries. Preserve current user changes.

### R5 State Clarity

Loading, empty, and error states must not look like broken content or unavailable posts.

## Test and Regression Requirements

Run all `VALIDATION_COMMANDS`. Capture required browser evidence. Update `scripts/audit/ui-layout.ts` when a layout invariant becomes release-relevant.

## Compliance and Safety Requirements

No hidden content exposure, no raw reasoning exposure, no route migration, no deployment.

## Rollback and Recovery

Use git to inspect changes. Revert only WPU-01 changes if validation fails. Do not revert unrelated user edits.

## Execution Capture

Write the report at `reports/wpu-01-reader-ia-and-visual-system-report.md` with screenshots, command summaries, changed files, residual risks, and next handoff to WPU-02.

## Evaluator Protocol

The evaluator should inspect desktop and mobile screenshots before approving. Reject if the UI still reads as a generic AI dashboard, if article reading remains delayed by auxiliary modules, or if mobile loses core navigation aids.

## Acceptance Criteria

WPU-01 is accepted when WPU-F002 is passing with command, screenshot, accessibility, and source-packet evidence.

## Risks

- Overcorrecting could erase the distinct dark research identity.
- CSS cleanup can accidentally override unrelated user edits.
- Compact article IA can hide useful context if mobile fallback is not explicit.
