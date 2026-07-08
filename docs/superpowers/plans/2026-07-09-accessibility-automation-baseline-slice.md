# Accessibility Automation Baseline Slice

Status: In Progress
Spec source: `docs/superpowers/specs/2026-07-09-accessibility-automation-matrix-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Extend the existing Playwright-backed `audit:ui` gate with first-pass accessibility automation for route landmarks, headings, icon-only button labels, `time[dateTime]`, reduced-motion CSS, and 320px reflow.

## Scope

In:

- Add route-level accessibility checks to `scripts/audit/ui-layout.ts`.
- Cover home, article, search zero-state, manage, and manage-agent routes.
- Keep checks DOM-based and dependency-free.
- Generate refreshed UI audit JSON evidence.
- Add a slice report.

Out:

- No axe/pa11y dependency.
- No claim of full WCAG certification.
- No UI component redesign in this slice.
- No deploy.

## Tasks

- [x] Add accessibility route inspection to `audit:ui`.
- [x] Check main landmark, primary heading, focusable controls, icon-only button names, `time` dateTime, reduced-motion CSS, and no 320px overflow.
- [x] Run focused tests for touched UI components.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=...` against a local server.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: add accessibility ui audit baseline`.

## Verification Commands

```bash
corepack pnpm check
corepack pnpm build
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/ResearchShell.test.tsx
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/accessibility-automation-baseline-slice-2026-07-09/ui-layout-checks.json
git diff --check
```

## Risk Notes

- These checks intentionally avoid brittle full accessibility scoring. They are baseline guardrails, not certification.
- Owner routes can render unauthenticated states locally; this still validates page-level landmarks and button labeling.
