# Phase 01 - Design Tokens And Shared Primitives

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write the required evidence, and do not advance to the next phase until acceptance gates pass or blockers are documented.

**Goal:** Align global tokens and shared UI primitives with the downloaded Misaya Notes design system without adding dependencies or changing public contracts.

**Architecture:** This phase narrows visual drift at the foundation layer before page-specific work: CSS tokens, ResearchShell chrome, shadcn-compatible primitives, and shared card/button/input behavior.

**Tech Stack:** Tailwind v4 CSS tokens, shadcn/Radix UI wrappers, lucide-react icons, React components, Vitest, Vite build.

---

## Machine Contract

The JSON block below is the authoritative machine-readable contract for goal-mode agents and validators. Keep it synchronized with the human-readable sections.

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "MNUI-01",
    "number": "01",
    "title": "Design Tokens And Shared Primitives",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/misaya_notes_ui_optimization_2026_06_18",
    "phase_file": "docs/misaya_notes_ui_optimization_2026_06_18/phase-01-design-tokens-and-shared-primitives.md",
    "depends_on": [
      "MNUI-00"
    ],
    "unlocks": [
      "MNUI-02"
    ]
  },
  "goal": {
    "target": "Align global tokens and shared UI primitives with the downloaded Misaya Notes design system without adding dependencies or changing public contracts.",
    "prompt": "Complete MNUI-01 Design Tokens And Shared Primitives for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-01-design-tokens-and-shared-primitives.md`; work on feature-oracle item MNUI-F002; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-plan.md",
    "completion_report": "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md"
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
      "docs/misaya_notes_ui_optimization_2026_06_18/phase-01-design-tokens-and-shared-primitives.md"
    ],
    "primary_context": [
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-baseline-design-audit-report.md",
      "/Users/yang/Downloads/Misaya Notes Design System/_ds_manifest.json",
      "/Users/yang/Downloads/Misaya Notes Design System/_adherence.oxlintrc.json",
      "/Users/yang/Downloads/Misaya Notes Design System/styles.css",
      "/Users/yang/Downloads/Misaya Notes Design System/tokens/fonts.css",
      "/Users/yang/Downloads/Misaya Notes Design System/tokens/colors.css",
      "/Users/yang/Downloads/Misaya Notes Design System/tokens/typography.css",
      "/Users/yang/Downloads/Misaya Notes Design System/tokens/spacing.css",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Button.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Card.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Badge.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Tag.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/SignalChip.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/Avatar.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/BrandMark.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/SectionTitle.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/*.d.ts",
      "/Users/yang/Downloads/Misaya Notes Design System/components/core/core.card.html",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/Input.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/Textarea.jsx",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/*.d.ts",
      "/Users/yang/Downloads/Misaya Notes Design System/components/forms/forms.card.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/colors-neutrals.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/colors-accent.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/colors-lines.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/colors-semantic.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/type-display.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/type-reading.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/type-ui-mono.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/type-scale.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/spacing-scale.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/spacing-radii.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/spacing-elevation.html",
      "/Users/yang/Downloads/Misaya Notes Design System/guidelines/brand-mark.html",
      "client/src/index.css",
      "client/src/styles/visual-refresh.css",
      "client/src/components/ResearchShell.tsx",
      "client/src/components/ui/button.tsx",
      "client/src/components/ui/card.tsx",
      "client/src/components/ui/input.tsx",
      "client/src/components/ui/textarea.tsx",
      "client/src/components/ui/badge.tsx",
      "client/src/components/ui/avatar.tsx"
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
      "client/src/index.css",
      "client/src/styles/visual-refresh.css",
      "client/src/components/ResearchShell.tsx",
      "client/src/components/ui/button.tsx",
      "client/src/components/ui/card.tsx",
      "client/src/components/ui/input.tsx",
      "client/src/components/ui/textarea.tsx",
      "client/src/components/ui/badge.tsx",
      "client/src/components/ui/avatar.tsx",
      "docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md"
    ],
    "do_not_edit": [
      "server/**",
      "drizzle/**",
      "seed-blog.mjs",
      "public content markdown",
      "package.json dependency list without user approval",
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
        "id": "targeted-ui-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm exec vitest run client/src/pages/Home.test.ts client/src/components/ErrorBoundary.test.tsx client/src/components/SeriesProgress.test.ts",
        "expected": "Targeted UI tests complete with exit code 0.",
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
        "id": "ui-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm audit:ui",
        "expected": "Layout audit completes with no new token/component regressions or records specific failures.",
        "required": true
      }
    ],
    "browser_checks": [
      "At 1440x900 and 390x844 compare `/` against `_ref/home-desktop.png` and `_ref/home-mobile.png` for token drift, card borders, header height, focus ring, and type scale.",
      "At 1440x900 inspect `/archive` and `/search?q=zzzz-no-hit-ui-audit` for button, input, tag, and empty-state consistency.",
      "Keyboard-tab through header links, search input, language toggle, login button, and Blog Agent launcher; focus ring must remain visible and cobalt.",
      "Toggle `prefers-reduced-motion` in browser emulation and confirm reveal animations resolve without hidden content."
    ],
    "regression_scope": [
      "Route slugs, public navigation labels, i18n keys, and component prop contracts remain unchanged.",
      "No new dependency is added; lucide-react remains the icon source.",
      "Light theme variables continue to exist even though dark research identity is canonical."
    ],
    "compliance_gates": [
      "Accessibility: visible focus, readable contrast, 44px practical hit targets for touch controls, and no motion-only state communication.",
      "Brand: single cobalt accent, no emoji, no decorative gradient-orb motif, no filled/duotone icon set.",
      "Font policy: decide and document whether production keeps local font chains only or allows remote Google fallback requests from the design package.",
      "Security: no secrets or auth material in screenshots, logs, or reports.",
      "Copyright: imported design assets must remain from the downloaded design system or existing repo assets with source recorded."
    ],
    "acceptance_gates": [
      "Global CSS exposes the design-system color, type, radius, shadow, motion, and layout tokens with no placeholder values.",
      "Shared primitives render Button variants, Button sizes, Badge variants, Tag tones, SignalChip dot/icon states, Card interactive/non-interactive states, Avatar initials/image state, BrandMark tile/wordmark state, SectionTitle heading levels, Input icon/focus state, and Textarea focus/rows state consistently with design refs.",
      "Report includes a component contract matrix comparing design package props to current shadcn-compatible repo primitives and names preserved public contracts.",
      "Report records the production font/network decision and any divergence from `tokens/fonts.css`.",
      "Header, brand mark, glass surfaces, focus ring, and reduced-motion behavior match documented design-system rules.",
      "Report includes before/after screenshot paths or precise blocker notes for desktop and mobile public surfaces."
    ],
    "rollback_plan": [
      "Revert the phase-scoped CSS/component files if typecheck, build, or core route screenshots regress.",
      "If token alignment breaks owner tools, keep the token patch behind existing class scopes and record the split in the continuity ledger."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md",
      "docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-01/"
    ],
    "required_artifacts": [
      "phase report",
      "progress-log entry",
      "feature-oracle evidence update",
      "continuity-ledger update",
      "source-packet code summary"
    ],
    "waiver_policy": "Only mark a gate waived when the user explicitly waives it or the report records a blocker, reason, remaining risk, and dependent-phase impact.",
    "next_phase_handoff": "Token decisions, primitive changes, browser evidence, and unresolved page-level visual debt recorded for MNUI-02."
  },
  "stop_conditions": [
    "Stop if a required primitive change would break a public component API.",
    "Stop if dependency addition appears necessary.",
    "Stop if existing user edits in token files conflict with the phase goal."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: MNUI-01
- GOAL_TARGET: Align global tokens and shared UI primitives with the downloaded Misaya Notes design system without adding dependencies or changing public contracts.
- GOAL_PROMPT: Complete MNUI-01 Design Tokens And Shared Primitives for `/Users/yang/projects/ai-tech-blog` by following `docs/misaya_notes_ui_optimization_2026_06_18/phase-01-design-tokens-and-shared-primitives.md`; work on feature-oracle item MNUI-F002; preserve dependency continuity; write code facts back to `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`; stay inside the named edit boundaries; finish only after validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: MNUI-00
- READ_FIRST: `docs/misaya_notes_ui_optimization_2026_06_18/README.md`, `docs/misaya_notes_ui_optimization_2026_06_18/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-baseline-design-audit-report.md`, `/Users/yang/Downloads/Misaya Notes Design System/_ds_manifest.json`, `/Users/yang/Downloads/Misaya Notes Design System/_adherence.oxlintrc.json`, `/Users/yang/Downloads/Misaya Notes Design System/styles.css`, `/Users/yang/Downloads/Misaya Notes Design System/tokens/fonts.css`, `/Users/yang/Downloads/Misaya Notes Design System/tokens/colors.css`, `/Users/yang/Downloads/Misaya Notes Design System/tokens/typography.css`, `/Users/yang/Downloads/Misaya Notes Design System/tokens/spacing.css`, `/Users/yang/Downloads/Misaya Notes Design System/components/core/*`, `/Users/yang/Downloads/Misaya Notes Design System/components/forms/*`, `/Users/yang/Downloads/Misaya Notes Design System/guidelines/colors-*.html`, `/Users/yang/Downloads/Misaya Notes Design System/guidelines/type-*.html`, `/Users/yang/Downloads/Misaya Notes Design System/guidelines/spacing-*.html`, `/Users/yang/Downloads/Misaya Notes Design System/guidelines/brand-mark.html`, `client/src/index.css`, `client/src/styles/visual-refresh.css`, `client/src/components/ResearchShell.tsx`, `client/src/components/ui/button.tsx`, `client/src/components/ui/card.tsx`, `client/src/components/ui/input.tsx`, `client/src/components/ui/textarea.tsx`, `client/src/components/ui/badge.tsx`, `client/src/components/ui/avatar.tsx`
- LIKELY_EDIT_PATHS: `client/src/index.css`, `client/src/styles/visual-refresh.css`, `client/src/components/ResearchShell.tsx`, `client/src/components/ui/button.tsx`, `client/src/components/ui/card.tsx`, `client/src/components/ui/input.tsx`, `client/src/components/ui/textarea.tsx`, `client/src/components/ui/badge.tsx`, `client/src/components/ui/avatar.tsx`, `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`, `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`, `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`, `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`, `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md`
- DO_NOT_EDIT: `server/**`, `drizzle/**`, seed-blog.mjs, public content markdown, package.json dependency list without user approval, `.env*`, deployment configuration
- EXECUTION_MODE: plan-first; implement stepwise; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: pnpm check; pnpm exec vitest run client/src/pages/Home.test.ts client/src/components/ErrorBoundary.test.tsx client/src/components/SeriesProgress.test.ts; pnpm build; pnpm audit:ui
- BROWSER_CHECKS: At 1440x900 and 390x844 compare `/` against `_ref/home-desktop.png` and `_ref/home-mobile.png` for token drift, card borders, header height, focus ring, and type scale.; At 1440x900 inspect `/archive` and `/search?q=zzzz-no-hit-ui-audit` for button, input, tag, and empty-state consistency.; Keyboard-tab through header links, search input, language toggle, login button, and Blog Agent launcher; focus ring must remain visible and cobalt.; Toggle `prefers-reduced-motion` in browser emulation and confirm reveal animations resolve without hidden content.
- REGRESSION_SCOPE: Route slugs, public navigation labels, i18n keys, and component prop contracts remain unchanged.; No new dependency is added; lucide-react remains the icon source.; Light theme variables continue to exist even though dark research identity is canonical.
- COMPLIANCE_GATES: Accessibility: visible focus, readable contrast, 44px practical hit targets for touch controls, and no motion-only state communication.; Brand: single cobalt accent, no emoji, no decorative gradient-orb motif, no filled/duotone icon set.; Font policy: decide and document whether production keeps local font chains only or allows remote Google fallback requests from the design package.; Security: no secrets or auth material in screenshots, logs, or reports.; Copyright: imported design assets must remain from the downloaded design system or existing repo assets with source recorded.
- ROLLBACK_PLAN: Revert the phase-scoped CSS/component files if typecheck, build, or core route screenshots regress.; If token alignment breaks owner tools, keep the token patch behind existing class scopes and record the split in the continuity ledger.
- ACCEPTANCE_GATES: Global CSS exposes the design-system color, type, radius, shadow, motion, and layout tokens with no placeholder values.; Shared primitives render Button variants, Button sizes, Badge variants, Tag tones, SignalChip dot/icon states, Card interactive/non-interactive states, Avatar initials/image state, BrandMark tile/wordmark state, SectionTitle heading levels, Input icon/focus state, and Textarea focus/rows state consistently with design refs.; Report includes a component contract matrix comparing design package props to current shadcn-compatible repo primitives and names preserved public contracts.; Report records the production font/network decision and any divergence from `tokens/fonts.css`.; Header, brand mark, glass surfaces, focus ring, and reduced-motion behavior match documented design-system rules.; Report includes before/after screenshot paths or precise blocker notes for desktop and mobile public surfaces.
- EVIDENCE_OUTPUT: `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-design-tokens-and-shared-primitives-report.md`
- STOP_CONDITIONS: Stop if a required primitive change would break a public component API.; Stop if dependency addition appears necessary.; Stop if existing user edits in token files conflict with the phase goal.

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

Execute MNUI-01 by following this contract, updating MNUI-F002, and preserving the dependency chain from MNUI-00 through MNUI-05. Use the downloaded design system as reference material and the current repo as the implementation authority.

## Cross-Phase Continuity

- Depends on: MNUI-00
- Unlocks: MNUI-02
- Feature-oracle item: MNUI-F002
- Continuity ledger: `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`
- Prior-phase evidence to inherit: the previous phase report, progress-log entry, oracle evidence, and continuity-ledger boundary notes
- Boundary this phase must preserve for later phases: A stable token and primitive layer for later public page, Agent, and owner-tool phases.
- Handoff this phase must produce: Token decisions, primitive changes, browser evidence, and unresolved page-level visual debt recorded for MNUI-02.

## Code Summary Writeback

Before claiming completion, inspect the code paths allowed by this phase and write back:

- `source-packet.md`: summarize discovered files, services, routes, schemas, tests, commands, and runtime constraints.
- `continuity-ledger.md`: record interface boundaries, dependency assumptions, changed contracts, and downstream phase impact.
- `agent-handoff.md`: state the next concrete action, active feature-oracle item, validation evidence, and blocker status.
- Phase report: link validation output and the exact code-summary update.

## Problem Boundary

In scope:

- Global CSS tokens.
- Shared UI primitive styles.
- Header/brand mark foundation.
- Design-system documentation writeback.

Out of scope:

- Home layout rewrite.
- Article IA rewrite.
- Agent behavior changes.
- Owner workflow changes.
- New package installation.

## Context Policy

Before editing, inspect:

- docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md
- docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md
- docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-baseline-design-audit-report.md
- /Users/yang/Downloads/Misaya Notes Design System/_ds_manifest.json
- /Users/yang/Downloads/Misaya Notes Design System/_adherence.oxlintrc.json
- /Users/yang/Downloads/Misaya Notes Design System/styles.css
- /Users/yang/Downloads/Misaya Notes Design System/tokens/fonts.css
- /Users/yang/Downloads/Misaya Notes Design System/tokens/colors.css
- /Users/yang/Downloads/Misaya Notes Design System/tokens/typography.css
- /Users/yang/Downloads/Misaya Notes Design System/tokens/spacing.css
- /Users/yang/Downloads/Misaya Notes Design System/components/core/*
- /Users/yang/Downloads/Misaya Notes Design System/components/forms/*
- /Users/yang/Downloads/Misaya Notes Design System/guidelines/colors-*.html
- /Users/yang/Downloads/Misaya Notes Design System/guidelines/type-*.html
- /Users/yang/Downloads/Misaya Notes Design System/guidelines/spacing-*.html
- /Users/yang/Downloads/Misaya Notes Design System/guidelines/brand-mark.html
- client/src/index.css
- client/src/styles/visual-refresh.css
- client/src/components/ResearchShell.tsx
- client/src/components/ui/button.tsx
- client/src/components/ui/card.tsx
- client/src/components/ui/input.tsx
- client/src/components/ui/textarea.tsx
- client/src/components/ui/badge.tsx
- client/src/components/ui/avatar.tsx

Do not load files outside this list unless a blocker requires expanding context and the expansion is recorded in the phase report.

## Requirements

### R1 Token source of truth

Map downloaded font, color, typography, spacing, radius, shadow, motion, page backdrop, glass, focus, and layout tokens into the existing CSS token structure without replacing the framework stack.

### R2 Primitive consistency

Bring Button, Card, Badge, Tag, SignalChip, Avatar, BrandMark, SectionTitle, Input, and Textarea states into the calm dark cobalt system while preserving current repo component APIs.

### R4 Font and network policy

Compare the design package's `tokens/fonts.css` remote Google fallback import against the repo's local font-face chain, then document whether production keeps local fonts only or permits remote font requests.

### R3 Accessibility foundation

Preserve visible keyboard focus, reduced-motion fallback, contrast, and stable hit targets across shared primitives.

## Test and Regression Requirements

Validation commands:

- pnpm check - TypeScript completes with exit code 0.
- pnpm exec vitest run client/src/pages/Home.test.ts client/src/components/ErrorBoundary.test.tsx client/src/components/SeriesProgress.test.ts - Targeted UI tests complete with exit code 0.
- pnpm build - Production build completes with exit code 0.
- pnpm audit:ui - Layout audit completes with no new token/component regressions or records specific failures.

Regression scope:

- Route slugs, public navigation labels, i18n keys, and component prop contracts remain unchanged.
- No new dependency is added; lucide-react remains the icon source.
- Light theme variables continue to exist even though dark research identity is canonical.

Browser/runtime checks:

- At 1440x900 and 390x844 compare `/` against `_ref/home-desktop.png` and `_ref/home-mobile.png` for token drift, card borders, header height, focus ring, and type scale.
- At 1440x900 inspect `/archive` and `/search?q=zzzz-no-hit-ui-audit` for button, input, tag, and empty-state consistency.
- Keyboard-tab through header links, search input, language toggle, login button, and Blog Agent launcher; focus ring must remain visible and cobalt.
- Toggle `prefers-reduced-motion` in browser emulation and confirm reveal animations resolve without hidden content.

## Compliance and Safety Requirements

- Accessibility: visible focus, readable contrast, 44px practical hit targets for touch controls, and no motion-only state communication.
- Brand: single cobalt accent, no emoji, no decorative gradient-orb motif, no filled/duotone icon set.
- Security: no secrets or auth material in screenshots, logs, or reports.
- Copyright: imported design assets must remain from the downloaded design system or existing repo assets with source recorded.

## Rollback and Recovery

- Revert the phase-scoped CSS/component files if typecheck, build, or core route screenshots regress.
- If token alignment breaks owner tools, keep the token patch behind existing class scopes and record the split in the continuity ledger.

## Execution Capture

Use `docs/misaya_notes_ui_optimization_2026_06_18/reports/phase-report-template.md` when writing the phase report. The report must include command summaries, screenshot or blocker paths, compliance notes, rollback notes, oracle update, progress-log entry, and next-phase handoff.

## Evaluator Protocol

Evaluator checks generated diff for API changes, compares screenshots against design refs, verifies no dependency addition, and reruns token-related browser checks at desktop plus mobile.

Evaluator checklist:

- Global CSS exposes the design-system color, type, radius, shadow, motion, and layout tokens with no placeholder values.
- Shared primitives render primary, secondary, outline, ghost, destructive, input, textarea, badge, card, and avatar states consistently with design refs.
- Header, brand mark, glass surfaces, focus ring, and reduced-motion behavior match documented design-system rules.
- Report includes before/after screenshot paths or precise blocker notes for desktop and mobile public surfaces.

## Acceptance Criteria

- Global CSS exposes the design-system color, type, radius, shadow, motion, and layout tokens with no placeholder values.
- Shared primitives render primary, secondary, outline, ghost, destructive, input, textarea, badge, card, and avatar states consistently with design refs.
- Header, brand mark, glass surfaces, focus ring, and reduced-motion behavior match documented design-system rules.
- Report includes before/after screenshot paths or precise blocker notes for desktop and mobile public surfaces.

## Risks

- Token changes can cascade across owner tools.
- Dark cobalt surfaces can lose contrast if opacity values drift.
- Shared component changes can alter Radix/shadcn behavior if props are changed.
