# Phase 00 - Baseline Audit Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` before implementing this phase task-by-task.

**Goal:** Build a repeatable local audit harness that captures route health, metadata, bundle size, accessibility, browser console health, and responsive screenshots before product changes continue.

**Architecture:** Add lightweight scripts and documented commands around the existing Vite/Express app. Keep the harness independent from product code where possible, and write reports to a predictable local output path that can be ignored or reviewed.

**Tech Stack:** Node scripts, pnpm scripts, Vite dev server, Vitest, Browser or Playwright, Lighthouse-compatible output where available.

---

## Task Spec

Create a deterministic audit baseline for the current blog.

The harness must answer these questions for every public route:

- Does the route return the expected HTTP status?
- Does the first meaningful screen render without a framework overlay?
- Does the route have a unique title, description, canonical URL, and share metadata?
- Does the app produce console errors or failed network requests?
- Does the route overflow horizontally at mobile width?
- How large are the production JS, CSS, and HTML assets?
- Do critical controls have accessible names?

Initial route inventory:

- `/`
- `/algorithms`
- `/applications`
- `/login`
- `/404`
- `/not-a-real-route`
- one public seeded article, expected `/post/isohc-fixed-vector-isometric-residual-mixing`
- one public application article, expected `/post/agent-harness-engine-evaluating-tool-using-agents`
- `/robots.txt`
- `/sitemap.xml`
- `/rss.xml`

## Problem Boundary

In scope:

- Audit scripts, test commands, route inventory, and documentation.
- CI-ready commands that can run locally without secrets when possible.
- Browser smoke checks for desktop and `390x844` mobile.
- Bundle report extraction from `pnpm build`.

Out of scope:

- Fixing SEO metadata, SSR, content routes, or visual design.
- Changing database schema or content model.
- Adding hosted monitoring vendors.

## Context Policy

Before implementation, inspect:

- `package.json`
- `vite.config.ts`
- `vercel.json`
- `client/index.html`
- `client/src/App.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/ErrorBoundary.tsx`
- `client/src/lib/analytics.ts`
- `server/app.ts`
- `api/index.ts`
- `seed-blog.mjs`
- `docs/deployment.md`

Do not assume a local database is available. The harness should report missing content data as an environment condition, not as a script crash.

## Product Requirements

### R1 Route Inventory

Provide a route list file or script-owned constant that records:

- route path
- expected audience: public, owner, utility, generated asset
- expected HTTP status in production
- expected first meaningful content
- whether the route requires a seeded database

### R2 Metadata Snapshot

For each HTML route, capture:

- `<title>`
- meta description
- canonical link
- Open Graph title, description, image, type, URL
- Twitter card fields
- JSON-LD script presence and type
- HTML `lang`

The first baseline will expose gaps; failing metadata checks should be allowed to report `missing` until Phase 04 makes them required.

### R3 Browser Smoke

For `/`, `/algorithms`, `/applications`, `/login`, and one article route:

- load desktop viewport
- load mobile `390x844`
- assert not blank
- assert no framework error overlay
- assert no horizontal overflow on mobile
- collect console errors and warnings

### R4 Bundle Budget Snapshot

Parse production build output and record:

- `dist/public/index.html` raw and gzip size
- largest JS chunks raw and gzip size
- CSS raw and gzip size
- warning lines from Vite/Rollup

Current known baseline from this audit:

- `index.html`: about `367.76 kB` raw, `105.54 kB` gzip.
- main CSS: about `180.88 kB` raw, `33.12 kB` gzip.
- main JS: about `1,270.45 kB` raw, `375.45 kB` gzip.

### R5 Accessibility Smoke

Add lightweight checks for:

- icon-only buttons with no accessible label
- focusable controls missing visible focus
- duplicate or missing main landmark
- route-level heading presence
- reduced-motion support presence

### R6 Report Output

Produce a markdown or JSON report with:

- timestamp
- git commit
- command versions
- route results
- metadata table
- bundle table
- known blockers

Reports may be written under `docs/harness_engine/reports/` if the team wants committed snapshots, or under a temporary ignored path if they are noisy.

## Execution Capture

Required traces:

- `pnpm check` result
- `pnpm test` result
- `pnpm build` result and parsed bundle sizes
- route status table
- desktop and mobile smoke result table
- console error summary

## Evaluator Protocol

Phase 00 is complete when:

- A single documented command runs the full local audit or clearly composes the audit subcommands.
- `pnpm check`, `pnpm test`, and `pnpm build` remain green.
- The audit report explicitly marks current SEO/RSS/sitemap gaps as baseline failures or warnings.
- The harness can run without a local database and still produce useful route-level output.
- The README documents how future phases should compare their changes against the baseline.

## Acceptance Criteria

- `package.json` contains audit scripts with stable names.
- The route inventory includes all listed initial routes.
- The audit does not require admin credentials for public route checks.
- Missing `robots.txt`, `sitemap.xml`, and `rss.xml` are captured as expected current gaps.
- Bundle sizes are captured after production build.
- Mobile overflow is checked at `390x844`.

## Risks

- Running `pnpm build` writes `dist/`. The harness should make this explicit and avoid committing build output.
- Local DB absence can make public article routes unavailable. The harness should distinguish "route code broken" from "seed data missing".
- Browser automation availability may vary. Browser plugin should be preferred; Playwright fallback must be documented.
