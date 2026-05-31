# Phase 03 - Visual Shell and Reading Calm

**Goal:** Reduce the remaining "AI template" feel while preserving the dark technical research identity.

**Architecture:** Centralize visual hierarchy in tokens and shared shell components. Keep decorative systems as accents, not default surfaces.

**Tech Stack:** React, Tailwind CSS v4, shadcn/Radix primitives, lucide-react, Browser verification.

---

## Coding Agent Contract

- PHASE_ID: PO-03
- GOAL_TARGET: Reduce template-like visual noise while preserving dark technical identity.
- GOAL_PROMPT: Complete PO-03 Visual Shell and Reading Calm for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-03-visual-shell-reading-calm.md`; adjust shared visual shell and accessibility carefully, avoid unrelated product changes, and finish after validation commands, browser screenshots, and acceptance gates pass.
- DEPENDS_ON: PO-00 baseline completed or explicitly waived
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `client/index.html`, `client/src/index.css`, `client/src/components/ResearchShell.tsx`, `client/src/components/ArticleCard.tsx`, `client/src/components/SubscriptionForm.tsx`, `client/src/pages/Home.tsx`, `client/src/pages/Track.tsx`, `client/src/pages/PostDetail.tsx`, `docs/harness_engine/phase-03-visual-identity-reading.md`
- LIKELY_EDIT_PATHS: `client/index.html`, `client/src/index.css`, `client/src/components/ResearchShell.tsx`, `client/src/components/SubscriptionForm.tsx`, small related public page style hooks
- DO_NOT_EDIT: Agent backend, content metadata, article arguments, large route information architecture from PO-02 unless coordinated
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`
- BROWSER_CHECKS: `/`, `/algorithms`, `/applications`, one article, `/login`; viewports `390x844`, `768x1024`, `1280x800`, `1440x900`; check reduced motion, focus, overflow
- ACCEPTANCE_GATES: primary content visually outranks decoration; surface levels are consistent; mobile zoom/accessibility is not worse; no text clipping at `390px`

## Task Spec

Refine global UI and reading shell:

- fewer repeated stars/grids/glass/glows
- clearer surface hierarchy
- calmer page backgrounds
- stronger editorial typography
- better mobile and keyboard accessibility

This phase should make the site feel authored, specific, and readable.

## Problem Boundary

In scope:

- `SpaceBackdrop`
- `SiteHeader`
- `BrandMark`
- glass/surface/chip styles
- global focus and reduced-motion styles
- home/track/article visual shell alignment
- subscription form accessibility polish if touched

Out of scope:

- New routes.
- Series data modeling.
- Agent backend changes.
- Editor/Manage redesign except if global shell changes break them.

## Context Policy

Inspect:

- `client/index.html`
- `client/src/index.css`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/components/SubscriptionForm.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/PostDetail.tsx`
- `docs/harness_engine/phase-03-visual-identity-reading.md`

## Product Requirements

### R1 Visual Direction

Adopt:

> Dark research archive with restrained technical instrumentation.

Keep:

- dark public default
- blue/cyan signal color
- technical atmosphere
- compact scholarly feel

Reduce:

- repeated star fields
- large planet horizon dominance
- glass on every container
- glowing surfaces on every card
- abstract visual blocks that compete with article text

### R2 Surface Hierarchy

Define distinct levels:

- page background
- primary content surface
- secondary panel
- inline chip/badge
- interactive button

Each level should have a clearly different visual weight.

### R3 Typography and Reading Baseline

Ensure:

- loaded fonts match CSS tokens
- no viewport-scaled font sizes
- letter spacing remains `0` except controlled mono labels
- Chinese/English line breaks are tested
- article title sizes do not overflow mobile

### R4 Accessibility Basics

Improve:

- visible focus styles
- icon-only accessible names
- form labels, names, autocomplete where applicable
- `aria-live` for subscription/feedback status
- `prefers-reduced-motion` for decorative animations

### R5 Mobile Zoom

Review `client/index.html` viewport settings. Avoid blocking user zoom unless there is a strong reason.

## Execution Capture

Required browser checks:

- `/` desktop and mobile
- `/algorithms`
- `/applications`
- one article desktop and mobile
- `/login`

Capture:

- before/after screenshots
- console errors
- horizontal overflow
- visible focus on at least one link/button/form control
- reduced-motion note

## Evaluator Protocol

Phase 03 is complete when:

- The site still feels technical but less like a generic AI SaaS/glass template.
- Reading pages are visually calmer.
- Mobile zoom and accessibility basics are not worse.
- No route has obvious text clipping at `390px`.

## Acceptance Criteria

- Primary content is visually louder than decoration.
- Surface levels are consistent across home, tracks, and articles.
- Subscription and major forms have accessible labels/status.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.

## Risks

- Removing too much atmosphere can make the site generic.
- Changing global tokens can affect owner tools.
- Article formulas/code/tables can regress if visual widths are changed without testing.
