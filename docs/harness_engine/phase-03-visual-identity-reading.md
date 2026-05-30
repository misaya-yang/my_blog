# Phase 03 - Visual Identity and Reading Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use `frontend-craft` and Build Web Apps frontend testing/debugging for rendered verification.

**Goal:** Shift the site from repeated "deep-space AI console" toward a calmer personal research notebook while preserving technical personality.

**Architecture:** Centralize visual tokens and reduce decorative defaults. Treat public reading, reader navigation, and owner tools as related but distinct surfaces. Verify changes in desktop and mobile browser screenshots.

**Tech Stack:** React, Tailwind CSS v4, shadcn/Radix primitives, lucide-react, Browser verification.

---

## Task Spec

Improve UI design, typography, layout, responsive behavior, and accessibility so the blog feels authored, specific, and less AI-generated.

The goal is not to remove all dark technical styling. The goal is to use it with restraint:

- fewer generic glows
- fewer repeated abstract waves
- stronger editorial typography
- more content-led hierarchy
- quieter article reading
- better mobile navigation and tool states

## Problem Boundary

In scope:

- Global tokens and font stack.
- Header, backdrop, brand mark, and reusable visual components.
- Home, Track, PostDetail, Login, Manage, Editor, NotFound.
- Article prose, code, formula, blockquote, table, TOC, share controls.
- Responsive checks for `390px`, `768px`, `1280px`, and wide desktop.
- Accessibility labels and focus states.

Out of scope:

- New reader routes. Those belong to Phase 02.
- SEO metadata. That belongs to Phase 04.
- Bundle splitting. That belongs to Phase 05.

## Context Policy

Before editing, inspect:

- `docs/superpowers/specs/2026-05-24-personal-research-blog-design.md`
- `client/index.html`
- `client/src/index.css`
- `client/src/App.tsx`
- `client/src/contexts/ThemeContext.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/pages/NotFound.tsx`
- `client/src/i18n/home.ts`
- `client/src/i18n/nav.ts`

Preserve Chinese/English support.

## Product Requirements

### R1 Visual Direction

Adopt this direction:

**Dark research archive with restrained technical instrumentation.**

Keep:

- dark mode as the public default
- blue/cyan as signal color
- technical diagrams where they support content
- compact scholarly feel

Reduce:

- repeated star fields
- large planet horizon decoration
- glowing glass on every container
- generic gradient avatar
- abstract wave SVG on every article card
- generic AI slogans

### R2 Typography System

Define explicit font roles:

- sans: UI chrome and navigation
- serif: article titles and editorial headings
- mono: code, formula-adjacent labels, technical metadata
- Chinese fallback: load or reference fonts consistently

Fix current mismatch:

- `client/index.html` loads `Inter`, `JetBrains Mono`, and `Noto Serif SC`
- `.article-prose` references `Noto Sans SC`, which is not loaded

Acceptance:

- no viewport-scaled font sizes
- letter spacing remains `0`
- article line length is comfortable on desktop
- mobile article headings do not overflow

### R3 Global Shell

Update:

- `SpaceBackdrop`
- `BrandMark`
- `SiteHeader`
- `ResearchWaveVisual`
- `.space-page`
- `.glass-panel`
- `.signal-chip`

Rules:

- background should support reading, not compete with content
- repeated panels should have clear hierarchy: primary surfaces, secondary surfaces, inline chips
- cards keep radius at 8px or less unless local primitives require otherwise
- mobile nav must have a menu/drawer when desktop links are hidden

### R4 Home Page

Home should feel like a personal research index.

Replace generic chip copy:

- avoid `Explore Frontiers`, `Understand Intelligence`, `Drive Innovation`
- use concrete focus such as `RoPE`, `Long Context`, `Agent Evaluation`, `Context Engineering`

Restructure:

- author identity becomes more authentic and less badge-like
- stats are secondary or removed unless nonzero and useful
- latest articles become a ledger/list with strong titles and metadata
- track cards should not look like SaaS feature cards

### R5 Track Pages

Track pages should not duplicate the home hero formula.

Each track should emphasize:

- topic map
- active series
- article list
- key questions or research lenses

Avoid repeating:

- same signal chip structure
- same card anatomy
- same abstract wave visual

### R6 Article Reading

Post detail should be optimized for long technical reading.

Requirements:

- quieter header area
- article title and metadata above decoration
- share tools as secondary controls
- sticky desktop TOC as margin note
- mobile TOC access through a compact control
- code copy button has `aria-label` and keyboard-visible focus
- formulas and code blocks have stable overflow behavior
- blockquotes and theorem-like sections are visually distinct but not loud

### R7 Owner Tools

Owner tools should feel utilitarian and consistent:

- Editor toolbar groups related controls and handles horizontal overflow.
- Editor preview and final article typography should be closer.
- Manage table supports horizontal scroll or density-aware card fallback.
- Login becomes a simple identity entry, not a marketing panel.
- NotFound uses the research visual system and returns useful navigation.

### R8 Reduced Motion and A11y

Add support for:

- `prefers-reduced-motion`
- focus-visible styles for icon buttons
- accessible labels for icon-only controls
- decorative SVGs marked `aria-hidden` unless they add meaning
- no stack trace display in production error UI

## Execution Capture

Required browser checks:

- `/` desktop and mobile
- `/algorithms` desktop
- `/applications` desktop
- one `/post/:slug` desktop and mobile
- `/login` desktop and mobile
- `/manage` if authenticated or with unauthenticated state
- `/write` if authenticated or with unauthenticated state
- `/404`

For each checked route, capture:

- screenshot
- console error summary
- horizontal overflow status
- first viewport hierarchy note
- visible focus check for at least one control

## Evaluator Protocol

Phase 03 is complete when:

- The site reads as a personal research notebook rather than generic AI SaaS.
- Mobile nav exposes primary navigation.
- Article reading page is calmer than the current glass-card article layout.
- Typography tokens and loaded fonts are consistent.
- Code copy buttons and icon-only controls have accessible names.
- Reduced-motion styles exist for decorative animations.
- No obvious text clipping or overlap at `390px`, `768px`, `1280px`.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.

## Acceptance Criteria

- A screenshot comparison of before/after for home and article pages shows reduced decorative density.
- Header links are reachable on mobile.
- 404 page matches the public visual system.
- Article body line width, line height, code blocks, formulas, and tables remain readable.
- Manage and Editor remain usable, not just visually restyled.

## Risks

- Overcorrecting can remove the site's distinctive technical identity. Preserve dark research atmosphere, but reduce repetition.
- A full redesign can become too broad. Work surface-by-surface and verify after each route.
- Font changes can alter Chinese rendering significantly. Test both `zh` and `en`.
