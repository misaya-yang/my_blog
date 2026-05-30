# Phase 05 - Renderability and Performance Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use Build Web Apps frontend testing/debugging and React best practices after component-level changes.

**Goal:** Make public pages indexable and fast while keeping owner tools powerful but out of the initial reader bundle.

**Architecture:** Split public and owner route bundles, lazy-load heavy Markdown/editor dependencies, remove production-only debug/runtime weight, optimize fonts and images, and choose a renderability strategy for public content.

**Tech Stack:** Vite, React.lazy/Suspense or router-level lazy loading, Rollup manual chunks, Express endpoints, optional static pre-render, Browser verification.

---

## Task Spec

Address the key performance and renderability findings:

- public content is currently loaded only after client tRPC hydration
- owner editor dependencies are pulled into the main app path
- production HTML includes large runtime/debug weight
- images are not optimized
- decorative visual effects are expensive and lack reduced-motion fallback

## Problem Boundary

In scope:

- Route-level code splitting.
- Markdown/KaTeX/highlight lazy loading.
- Owner route bundle isolation.
- Production plugin gating.
- Font loading and self-host/subset strategy.
- Image rendering improvements.
- Public renderability strategy for home and article pages.
- HTTP 404 status correction.

Out of scope:

- SEO metadata and XML feeds if Phase 04 is not complete.
- New reader discovery routes if Phase 02 is not complete.
- Redesigning the UI beyond performance-driven changes.

## Context Policy

Before editing, inspect:

- `package.json`
- `vite.config.ts`
- `client/index.html`
- `client/src/App.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/index.css`
- `server/app.ts`
- `vercel.json`
- `api/index.ts`

Use the Phase 00 bundle report as the baseline.

## Product Requirements

### R1 Route-Level Splitting

Lazy-load:

- `Editor`
- `Manage`
- `Login`
- `PostDetail`
- optional track pages if they stay heavy

Keep the initial home route minimal.

Owner-only routes must not load editor, Markdown, KaTeX, highlight, or large Radix surfaces until needed.

### R2 Markdown Stack Splitting

Separate heavy article rendering dependencies:

- `react-markdown`
- `remark-gfm`
- `remark-math`
- `rehype-katex`
- `rehype-highlight`
- KaTeX CSS
- highlight CSS
- Tiptap/editor packages

Article pages can load Markdown renderer on demand. Editor pages can load editor tools only after owner access is confirmed.

### R3 Production Runtime Hygiene

Review `vite.config.ts` plugin list.

Requirements:

- `vitePluginManusRuntime()` must not bloat production output unless explicitly required for deployment.
- `vitePluginManusDebugCollector()` already avoids injecting debug script in production; keep this behavior.
- `jsxLocPlugin()` should be dev-only if it adds production overhead.

Acceptance:

- production `index.html` gzip target below `30 kB` unless a documented platform runtime requirement prevents it.

### R4 Font Performance

Define a font strategy:

- preload or self-host critical fonts
- use `font-display: swap`
- reduce Google Fonts families/weights if possible
- align CSS font references with loaded fonts

Target:

- no render-blocking font surprise for article text
- no references to unloaded custom fonts

### R5 Image Optimization

For cover images and Markdown images:

- add width and height when known
- add `loading="lazy"` for non-critical images
- add `decoding="async"`
- add `fetchpriority="high"` only for true first LCP image
- provide `sizes`
- support responsive `srcset` when images are locally controlled
- keep alt text meaningful

If using remote user-provided images, create a safe fallback renderer that avoids layout shift.

### R6 CSS and Visual Effects Performance

Audit:

- `backdrop-blur`
- SVG filters
- large radial gradients
- pulse animations
- sticky/fixed surfaces

Add:

- `prefers-reduced-motion`
- lower-cost mobile styles
- optional reduced backdrop blur on low-width viewports

### R7 Public Renderability

Choose one approach:

1. **Static pre-render for public routes:** generate HTML for home, track pages, and public article pages at build time.
2. **Minimal SSR for public routes:** server renders public pages and leaves owner routes as SPA.
3. **Hybrid metadata + content snapshot:** serve article title, excerpt, body excerpt, JSON-LD, and root markup in first HTML while React hydrates.

Acceptance is not tied to a specific framework, but public article first HTML must include:

- article H1
- excerpt
- published date
- author
- canonical metadata
- enough body text for indexing

### R8 HTTP 404

Unknown public routes should return HTTP 404 in production, not HTTP 200 with a client-side NotFound.

This may require:

- Vercel route adjustments
- server-side route detection
- generated static 404
- preserving SPA fallback only for known client routes

## Execution Capture

Required measurements:

- before and after build size table
- route-level chunk table
- first route JS gzip size
- production HTML gzip size
- mobile Lighthouse or equivalent performance snapshot
- browser route smoke after splitting
- unknown route HTTP status

Target budgets:

- initial public route JS gzip under `200 kB`
- production HTML gzip under `30 kB`
- CSS gzip at or below current baseline unless visual changes require documented increase
- mobile Lighthouse Performance at least `90` on local or preview where practical
- LCP under `2.5s`, CLS under `0.1`, INP under `200ms` in monitored environments

## Evaluator Protocol

Phase 05 is complete when:

- Initial public bundle no longer includes owner editor stack.
- Heavy Markdown and editor dependencies are lazy-loaded.
- Production `index.html` no longer includes unnecessary runtime/debug weight.
- Public article HTML contains indexable content before hydration.
- Unknown routes return HTTP 404.
- Image renderer reduces layout shift and improves loading behavior.
- `pnpm check`, `pnpm test`, `pnpm build` pass.

## Acceptance Criteria

- Bundle report proves a meaningful reduction from the current `375 kB` gzip main JS baseline.
- Browser smoke passes for home, article, login, editor unauthenticated state, and unknown route.
- No console errors from lazy-loading routes.
- Markdown, math, and code highlighting still render on article and editor preview pages.
- Owner tool functionality remains intact after splitting.

## Risks

- Full SSR or pre-render can be a larger architectural change than expected. If needed, split R7 into a separate implementation plan while still completing route splitting first.
- Removing platform runtime plugins may break a platform-specific workflow. Verify deployment assumptions before removal.
- Lazy-loading KaTeX CSS can cause flash or unstyled formulas. Test article pages with math-heavy seed content.
