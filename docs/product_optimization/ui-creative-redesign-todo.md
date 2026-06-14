# UI Creative Redesign Todo

## Design Read

This is a redesign-overhaul of an AI technical publication plus author workstation. The target is not a cleaner vertical blog, but a memorable research atlas and author cockpit.

## Dials

- Design variance: 8
- Motion intensity: 4
- Visual density: 7

## Signature Move

Use a research atlas as the public entry pattern and a cockpit layout as the owner pattern. The first viewport should expose navigable structure, current work, and recovery paths without forcing a linear scroll.

## Phase Todo

| Phase | Scope | Edit paths | Acceptance evidence | Status |
| --- | --- | --- | --- | --- |
| UI-01 Baseline | Current layout, tokens, screenshots, routes | `client/src/pages`, `client/src/styles` | `pnpm check`, headless screenshots, no horizontal overflow | Done |
| UI-02 Atlas Homepage | Replace vertical homepage feed with atlas stage and non-equal workbench grid | `client/src/pages/Home.tsx`, `client/src/styles/visual-refresh.css` | `/` desktop 1440x900 and mobile 390x844 show atlas, search, nodes, latest notes, no overflow | Done |
| UI-03 Paper Reader | Recompose article page as paper reader cockpit with stronger rail hierarchy | `client/src/pages/PostDetail.tsx`, article CSS | Article route screenshot, TOC readable, assistant not covering content | Done |
| UI-04 Author Cockpit | Recompose `/manage` into operations cockpit | `client/src/pages/Manage.tsx`, owner CSS | Logged-out state and admin state, mobile card fallback, filters visible | Done |
| UI-05 Agent Console | Recompose `/manage/agent` around query, trace, sources, evals, and radar | `client/src/pages/ManageAgent.tsx`, owner CSS | Left console nav and active work panel visible without vertical hunting | Done |
| UI-06 Writing IDE | Recompose `/write` as editor workspace, not stacked settings cards | `client/src/pages/Editor.tsx`, owner CSS | Editor, preview, snippets, publish state visible in IDE layout | Done |
| UI-07 QA Gates | Verify routes, responsive states, state surfaces, and copy | scripts and screenshots | `pnpm check`, `pnpm test`, `pnpm build`, `pnpm audit:ui`, screenshots | Done |

## Evidence

- Screenshots: `docs/product_optimization/reports/final-ui-qa-2026-06-14/`
- UI audit: `docs/product_optimization/reports/ui-layout-checks-latest.json`
- Commands passed: `pnpm check`, `pnpm test`, `pnpm build`, `pnpm audit:ui`

## Constraints

- Do not change API, database schema, or route semantics.
- Keep existing Radix/shadcn/lucide stack.
- No visible browser automation.
- Commit and deploy only after an explicit release request.
- Avoid generic vertical section repetition, decorative dots, fake numbers, and Inter/default AI styling.
