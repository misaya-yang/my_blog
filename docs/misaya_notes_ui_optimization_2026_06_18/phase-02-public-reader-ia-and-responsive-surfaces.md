# Phase 02 - Public Reader IA And Responsive Surfaces

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance to the next phase until acceptance gates pass or blockers are documented.

**Goal:** Apply the design-system reader model to Home, Archive, Search, Track, and Post surfaces with responsive evidence.

**Architecture:** This phase uses the stable tokens from MNUI-01 to shape page-specific IA: two-track discovery, newest-note entry, compact note scan, chronological archive, article entry layer, sticky TOC, and mobile reading flow.

**Tech Stack:** React page components, Wouter routes, tRPC public articles, Tailwind classes, i18n dictionaries, MarkdownRenderer, Playwright-style audit scripts.

---

## Machine Contract

The JSON block below is the authoritative machine-readable contract for goal-mode agents and validators. Keep it synchronized with the human-readable sections.

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "MNUI-02",
    "number": "02",
    "title": "Public Reader IA And Responsive Surfaces",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/misaya_notes_ui_optimization_2026_06_18",
    "phase_file": "docs/misaya_notes_ui_optimization_2026_06_18/phase-02-public-reader-ia-and-responsive-surfaces.md",
    "depends_on": [
      "MNUI-01"
    ],
    "unlocks": [
      "MNUI-03"
    ]
  },
  "goal": {
    "target": "Apply the design-system reader model to Home, Archive, Search, Track, and Post surfaces with responsive evidence.",
    "prompt": "Complete MNUI-02 Public Reader IA And Responsive Surfaces for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-02-public-reader-ia-and-responsive-surfaces.md`; work on feature-oracle item MNUI-F003; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-plan.md",
    "completion_report": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md"
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
      "docs/misaya_notes_ui_optimization_2026_06_18/phase-02-public-reader-ia-and-responsive-surfaces.md"
    ],
    "primary_context": [
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/README.md",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/index.html",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/shell.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/data.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/icons.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/screens.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/post.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/brand-imagery.html",
      "/Users/yang/Downloads/Misaya Notes Design System/assets/research-orbit-hero.jpg",
      "/Users/yang/Downloads/Misaya Notes Design System/assets/article-thumbs/*.jpg",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/home-desktop.png",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/home-mobile.png",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/archive-desktop.png",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/search-desktop.png",
      "/Users/yang/Downloads/Misaya Notes Design System/_ref/post-desktop.png",
      "client/src/pages/Home.tsx",
      "client/src/pages/Track.tsx",
      "client/src/pages/Archive.tsx",
      "client/src/pages/Search.tsx",
      "client/src/pages/PostDetail.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/MarkdownRenderer.tsx",
      "client/src/components/SeriesProgress.tsx",
      "client/src/i18n/home.ts",
      "client/src/i18n/post.ts",
      "client/src/i18n/nav.ts",
      "client/src/lib/tracks.ts"
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
      "client/src/pages/Home.tsx",
      "client/src/pages/Track.tsx",
      "client/src/pages/Archive.tsx",
      "client/src/pages/Search.tsx",
      "client/src/pages/PostDetail.tsx",
      "client/src/components/ArticleCard.tsx",
      "client/src/components/MarkdownRenderer.tsx",
      "client/src/components/SeriesProgress.tsx",
      "client/src/styles/visual-refresh.css",
      "client/src/styles/public-components.css",
      "client/src/i18n/home.ts",
      "client/src/i18n/post.ts",
      "client/src/i18n/nav.ts",
      "client/src/lib/tracks.ts",
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-02/"
    ],
    "do_not_edit": [
      "server/**",
      "drizzle/**",
      "seed-blog.mjs",
      "auth/session code",
      "Agent backend behavior",
      "package dependency list without approval",
      ".env*"
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
      "browser"
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
        "id": "reader-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm exec vitest run client/src/pages/Home.test.ts client/src/pages/searchRecovery.test.ts client/src/lib/tracks.test.ts client/src/components/SeriesProgress.test.ts",
        "expected": "Reader IA tests complete with exit code 0.",
        "required": true
      },
      {
        "id": "content-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:audit",
        "expected": "Content audit reports zero failures.",
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
        "expected": "Public route baseline completes and stores current route evidence.",
        "required": true
      }
    ],
    "browser_checks": [
      "At 1440x900 capture `/` and verify two-track research notebook hero, search dock, start-here actions, latest note, and two-column note scan remain visible without overlap.",
      "At 390x844 capture `/` and verify the hero, search dock, track portals, latest note, and note rows stack without horizontal overflow.",
      "At 1440x900 capture `/archive` and verify month grouping, tag pills, reading metadata, and row density match the design-system archive reference.",
      "At 1440x900 capture `/search?q=zzzz-no-hit-ui-audit` and verify empty-state recovery, input styling, and no-hit copy are clear.",
      "At 1440x900 and 390x844 capture `/post/goal-harness-agent-phase-protocol`; verify article entry layer, serif reading rhythm, code blocks, tables, sticky TOC or mobile fallback, related notes, and share/feedback surfaces."
    ],
    "regression_scope": [
      "Public URLs and SEO metadata remain stable.",
      "Hidden, draft, admin-only, and unpublished notes remain excluded from public routes.",
      "Bilingual titles and mixed zh/en content do not clip in hero, cards, rows, and article headings.",
      "Existing content freshness behavior remains unchanged."
    ],
    "compliance_gates": [
      "Accessibility: keyboard path through nav, search, article links, TOC, feedback, and footer is visible.",
      "Privacy: public pages do not expose private uploaded Agent context or owner-only metadata.",
      "Content boundary: public article lists use only public article data.",
      "Brand: no emoji, no second competing accent hue, no marketing-style hero card split detached from the notebook identity."
    ],
    "acceptance_gates": [
      "Home supports a first-time reader choosing newest note, Applications path, or Algorithms path within the first viewport.",
      "Reader surfaces account for UI kit shell facts: sticky header, backdrop, footer, language toggle, sample corpus metadata, lucide icon set, hero imagery, and article thumbnail usage.",
      "Archive and Search provide compact scan and recovery states with no visual drift from shared primitives.",
      "Article page preserves reading-first hierarchy, entry facts, code/table readability, related navigation, and mobile no-overflow behavior.",
      "Screenshot evidence exists for all required public routes and viewports or blocker notes name the missing state."
    ],
    "rollback_plan": [
      "Revert page and CSS files touched by this phase if public routing, build, article rendering, or mobile screenshots regress.",
      "If a public IA change needs content-model changes, stop and record a blocker instead of altering schemas or seed data in this phase."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-02/"
    ],
    "required_artifacts": [
      "phase report",
      "progress-log entry",
      "feature-oracle evidence update",
      "continuity-ledger update",
      "source-packet code summary"
    ],
    "waiver_policy": "Only mark a gate waived when the user explicitly waives it or the report records a blocker, reason, remaining risk, and dependent-phase impact.",
    "next_phase_handoff": "Reader route screenshots, public-content boundary facts, and route-context implications for the Blog Agent phase."
  },
  "stop_conditions": [
    "Stop if a desired reader behavior requires schema changes.",
    "Stop if public/private content filtering is ambiguous.",
    "Stop if long article rendering fails because of existing content defects outside page code."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: MNUI-02
- GOAL_TARGET: Apply the design-system reader model to Home, Archive, Search, Track, and Post surfaces with responsive evidence.
- GOAL_PROMPT: Complete MNUI-02 Public Reader IA And Responsive Surfaces for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-02-public-reader-ia-and-responsive-surfaces.md`; work on feature-oracle item MNUI-F003; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: MNUI-01
- READ_FIRST: `docs/misaya_notes_ui_optimization_2026_06_18/README.md`, `docs/misaya_notes_ui_optimization_2026_06_18/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/README.md`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/index.html`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/shell.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/data.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/icons.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/screens.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/post.jsx`, `/Users/yang/Downloads/Misaya Notes Design System/guidelines/brand-imagery.html`, `/Users/yang/Downloads/Misaya Notes Design System/assets/research-orbit-hero.jpg`, `/Users/yang/Downloads/Misaya Notes Design System/assets/article-thumbs/*.jpg`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/home-desktop.png`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/home-mobile.png`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/archive-desktop.png`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/search-desktop.png`, `/Users/yang/Downloads/Misaya Notes Design System/_ref/post-desktop.png`, `client/src/pages/Home.tsx`, `client/src/pages/Track.tsx`, `client/src/pages/Archive.tsx`, `client/src/pages/Search.tsx`, `client/src/pages/PostDetail.tsx`, `client/src/components/ArticleCard.tsx`, `client/src/components/MarkdownRenderer.tsx`, `client/src/components/SeriesProgress.tsx`, `client/src/i18n/home.ts`, `client/src/i18n/post.ts`, `client/src/i18n/nav.ts`, `client/src/lib/tracks.ts`
- LIKELY_EDIT_PATHS: `client/src/pages/Home.tsx`, `client/src/pages/Track.tsx`, `client/src/pages/Archive.tsx`, `client/src/pages/Search.tsx`, `client/src/pages/PostDetail.tsx`, `client/src/components/ArticleCard.tsx`, `client/src/components/MarkdownRenderer.tsx`, `client/src/components/SeriesProgress.tsx`, `client/src/styles/visual-refresh.css`, `client/src/styles/public-components.css`, `client/src/i18n/home.ts`, `client/src/i18n/post.ts`, `client/src/i18n/nav.ts`, `client/src/lib/tracks.ts`, `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`, `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`, `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-02/`
- DO_NOT_EDIT: `server/**`, `drizzle/**`, seed-blog.mjs, `auth/session code`, Agent backend behavior, package dependency list without approval, `.env*`
- EXECUTION_MODE: plan-first; implement stepwise; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: pnpm check; pnpm exec vitest run client/src/pages/Home.test.ts client/src/pages/searchRecovery.test.ts client/src/lib/tracks.test.ts client/src/components/SeriesProgress.test.ts; pnpm content:audit; pnpm build; AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
- BROWSER_CHECKS: At 1440x900 capture `/` and verify two-track research notebook hero, search dock, start-here actions, latest note, and two-column note scan remain visible without overlap.; At 390x844 capture `/` and verify the hero, search dock, track portals, latest note, and note rows stack without horizontal overflow.; At 1440x900 capture `/archive` and verify month grouping, tag pills, reading metadata, and row density match the design-system archive reference.; At 1440x900 capture `/search?q=zzzz-no-hit-ui-audit` and verify empty-state recovery, input styling, and no-hit copy are clear.; At 1440x900 and 390x844 capture `/post/goal-harness-agent-phase-protocol`; verify article entry layer, serif reading rhythm, code blocks, tables, sticky TOC or mobile fallback, related notes, and share/feedback surfaces.
- REGRESSION_SCOPE: Public URLs and SEO metadata remain stable.; Hidden, draft, admin-only, and unpublished notes remain excluded from public routes.; Bilingual titles and mixed zh/en content do not clip in hero, cards, rows, and article headings.; Existing content freshness behavior remains unchanged.
- COMPLIANCE_GATES: Accessibility: keyboard path through nav, search, article links, TOC, feedback, and footer is visible.; Privacy: public pages do not expose private uploaded Agent context or owner-only metadata.; Content boundary: public article lists use only public article data.; Brand: no emoji, no second competing accent hue, no marketing-style hero card split detached from the notebook identity.
- ROLLBACK_PLAN: Revert page and CSS files touched by this phase if public routing, build, article rendering, or mobile screenshots regress.; If a public IA change needs content-model changes, stop and record a blocker instead of altering schemas or seed data in this phase.
- ACCEPTANCE_GATES: Home supports a first-time reader choosing newest note, Applications path, or Algorithms path within the first viewport.; Reader surfaces account for UI kit shell facts: sticky header, backdrop, footer, language toggle, sample corpus metadata, lucide icon set, hero imagery, and article thumbnail usage.; Archive and Search provide compact scan and recovery states with no visual drift from shared primitives.; Article page preserves reading-first hierarchy, entry facts, code/table readability, related navigation, and mobile no-overflow behavior.; Screenshot evidence exists for all required public routes and viewports or blocker notes name the missing state.
- EVIDENCE_OUTPUT: `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-public-reader-ia-and-responsive-surfaces-report.md`
- STOP_CONDITIONS: Stop if a desired reader behavior requires schema changes.; Stop if public/private content filtering is ambiguous.; Stop if long article rendering fails because of existing content defects outside page code.

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

Execute MNUI-02 by following this contract, updating MNUI-F003, and preserving the dependency chain from MNUI-00 through MNUI-05. Use the downloaded design system as reference material and the current repo as the implementation authority.

## Cross-Phase Continuity

- Depends on: MNUI-01
- Unlocks: MNUI-03
- Feature-oracle item: MNUI-F003
- Continuity ledger: `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`
- Prior-phase evidence to inherit: the previous phase report, progress-log entry, oracle evidence, and continuity-ledger boundary notes
- Boundary this phase must preserve for later phases: Public reader behavior and visual states that MNUI-03 Agent companion must attach to without obscuring content.
- Handoff this phase must produce: Reader route screenshots, public-content boundary facts, and route-context implications for the Blog Agent phase.

## Code Summary Writeback

Before claiming completion, inspect the code paths allowed by this phase and write back:

- `source-packet.md`: summarize discovered files, services, routes, schemas, tests, commands, and runtime constraints.
- `continuity-ledger.md`: record interface boundaries, dependency assumptions, changed contracts, and downstream phase impact.
- `agent-handoff.md`: state the next concrete action, active feature-oracle item, validation evidence, and blocker status.
- Phase report: link validation output and the exact code-summary update.

## Problem Boundary

In scope:

- Public reader route IA.
- Responsive layout and styling.
- Bilingual copy fit.
- Reader route screenshots and regression checks.

Out of scope:

- Agent backend.
- Owner dashboards.
- Content authoring flow.
- Database schema changes.
- Production deploy.

## Context Policy

Before editing, inspect:

- docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md
- docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md
- docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/README.md
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/index.html
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/shell.jsx
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/data.jsx
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/icons.jsx
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/screens.jsx
- /Users/yang/Downloads/Misaya Notes Design System/ui_kits/misaya-notes/post.jsx
- /Users/yang/Downloads/Misaya Notes Design System/guidelines/brand-imagery.html
- /Users/yang/Downloads/Misaya Notes Design System/assets/research-orbit-hero.jpg
- /Users/yang/Downloads/Misaya Notes Design System/assets/article-thumbs/*.jpg
- /Users/yang/Downloads/Misaya Notes Design System/_ref/home-desktop.png
- /Users/yang/Downloads/Misaya Notes Design System/_ref/home-mobile.png
- /Users/yang/Downloads/Misaya Notes Design System/_ref/archive-desktop.png
- /Users/yang/Downloads/Misaya Notes Design System/_ref/search-desktop.png
- /Users/yang/Downloads/Misaya Notes Design System/_ref/post-desktop.png
- client/src/pages/Home.tsx
- client/src/pages/Track.tsx
- client/src/pages/Archive.tsx
- client/src/pages/Search.tsx
- client/src/pages/PostDetail.tsx
- client/src/components/ArticleCard.tsx
- client/src/components/MarkdownRenderer.tsx
- client/src/components/SeriesProgress.tsx
- client/src/i18n/home.ts
- client/src/i18n/post.ts
- client/src/i18n/nav.ts
- client/src/lib/tracks.ts

Do not load files outside this list unless a blocker requires expanding context and the expansion is recorded in the phase report.

## Requirements

### R1 Two-track home entry

Home must make newest note, Algorithms path, and Applications path visible and actionable without marketing-page copy.

### R4 Shell and asset coherence

Public reader routes must preserve sticky header, backdrop, footer, language toggle, icon usage, hero imagery, article thumbnails, and sample-corpus metadata behavior implied by the UI kit.

### R2 Dense but calm scan surfaces

Archive, Search, Track, and More notes lists must support fast scanning with metadata, tags, and stable row/card dimensions.

### R3 Reading-first article page

Post detail must privilege article content with entry facts, readable serif prose, code/table treatment, and non-overlapping side navigation or mobile fallback.

## Test and Regression Requirements

Validation commands:

- pnpm check - TypeScript completes with exit code 0.
- pnpm exec vitest run client/src/pages/Home.test.ts client/src/pages/searchRecovery.test.ts client/src/lib/tracks.test.ts client/src/components/SeriesProgress.test.ts - Reader IA tests complete with exit code 0.
- pnpm content:audit - Content audit reports zero failures.
- pnpm build - Production build completes with exit code 0.
- AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick - Public route baseline completes and stores current route evidence.

Regression scope:

- Public URLs and SEO metadata remain stable.
- Hidden, draft, admin-only, and unpublished notes remain excluded from public routes.
- Bilingual titles and mixed zh/en content do not clip in hero, cards, rows, and article headings.
- Existing content freshness behavior remains unchanged.

Browser/runtime checks:

- At 1440x900 capture `/` and verify two-track research notebook hero, search dock, start-here actions, latest note, and two-column note scan remain visible without overlap.
- At 390x844 capture `/` and verify the hero, search dock, track portals, latest note, and note rows stack without horizontal overflow.
- At 1440x900 capture `/archive` and verify month grouping, tag pills, reading metadata, and row density match the design-system archive reference.
- At 1440x900 capture `/search?q=zzzz-no-hit-ui-audit` and verify empty-state recovery, input styling, and no-hit copy are clear.
- At 1440x900 and 390x844 capture `/post/goal-harness-agent-phase-protocol`; verify article entry layer, serif reading rhythm, code blocks, tables, sticky TOC or mobile fallback, related notes, and share/feedback surfaces.

## Compliance and Safety Requirements

- Accessibility: keyboard path through nav, search, article links, TOC, feedback, and footer is visible.
- Privacy: public pages do not expose private uploaded Agent context or owner-only metadata.
- Content boundary: public article lists use only public article data.
- Brand: no emoji, no second competing accent hue, no marketing-style hero card split detached from the notebook identity.

## Rollback and Recovery

- Revert page and CSS files touched by this phase if public routing, build, article rendering, or mobile screenshots regress.
- If a public IA change needs content-model changes, stop and record a blocker instead of altering schemas or seed data in this phase.

## Execution Capture

Use `docs/misaya_notes_ui_optimization_2026_06_18/reports/phase-report-template.md` when writing the phase report. The report must include command summaries, screenshot or blocker paths, compliance notes, rollback notes, oracle update, progress-log entry, and next-phase handoff.

## Evaluator Protocol

Evaluator replays route screenshots, checks mobile overflow, inspects public data boundaries, and rejects if hero/card/article text overlaps or if hidden content appears.

Evaluator checklist:

- Home supports a first-time reader choosing newest note, Applications path, or Algorithms path within the first viewport.
- Archive and Search provide compact scan and recovery states with no visual drift from shared primitives.
- Article page preserves reading-first hierarchy, entry facts, code/table readability, related navigation, and mobile no-overflow behavior.
- Screenshot evidence exists for all required public routes and viewports or blocker notes name the missing state.

## Acceptance Criteria

- Home supports a first-time reader choosing newest note, Applications path, or Algorithms path within the first viewport.
- Archive and Search provide compact scan and recovery states with no visual drift from shared primitives.
- Article page preserves reading-first hierarchy, entry facts, code/table readability, related navigation, and mobile no-overflow behavior.
- Screenshot evidence exists for all required public routes and viewports or blocker notes name the missing state.

## Risks

- Long Chinese/English titles can break compact cards.
- Sticky TOC can collide with the Agent launcher on smaller screens.
- Search no-hit state can look like an error if recovery copy is weak.
