# Article First Screen Metadata Trim Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make article pages reach readable prose sooner by removing pre-body author/contact utilities and keeping first-screen metadata compact and reading-oriented.

**Architecture:** Keep the article route, content, Markdown renderer, feedback, subscription, and bottom author/share utilities unchanged. Modify only the pre-body header in `PostDetail.tsx`, add scoped article-header CSS in `visual-refresh.css`, and tighten `audit:ui` to prove prose starts earlier without horizontal overflow.

**Tech Stack:** React 19, existing Wouter links, existing lucide icons, existing CSS layers, existing Playwright-backed `audit:ui`, Vitest.

## Global Constraints

- No deployment.
- No schema migration.
- No production credential handling.
- No new dependency.
- No route, API, DB, auth, SEO, Markdown, or Agent contract change.
- No broad CSS rewrite.
- No new `!important`.
- This slice implements part of Wave 1 public article reading calm. It does not claim the full product optimization goal is complete.

---

## File Structure

- Modify `client/src/pages/PostDetail.tsx`: remove the author/contact utility row before metadata; render published date as `<time>`; add `article-reading-meta` and `article-reading-tags` classes; remove the visible entry-layer kicker/title while preserving an accessible section label.
- Modify `client/src/styles/visual-refresh.css`: add scoped compact article header metadata/tag rules.
- Modify `scripts/audit/ui-layout.ts`: tighten post prose start thresholds and record whether pre-body author utilities still exist.
- Create `docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/summary.md`: record behavior, validation, and metrics.

## Task 1: Simplify Article Header

**Files:**
- Modify: `client/src/pages/PostDetail.tsx`

**Interfaces:**
- Consumes: existing `post`, `language`, `t`, `readingTime`, `postCategory`, and `visibleHeaderTags`.
- Produces: same article page with a smaller pre-body header; author/contact utilities remain available later in `article-continuation-meta`.

- [x] **Step 1: Remove unused pre-body author utility row**

Delete the first flex row in `.article-reading-header` that contains:

```tsx
<User className="h-4 w-4 text-sky-200" />
{t("post.authorName")}
{t("nav.scholar")}
{t("nav.email")}
```

Also remove `User` from the `lucide-react` import list if it is no longer used.

- [x] **Step 2: Render compact semantic metadata**

Replace the metadata wrapper class:

```tsx
<div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
```

with:

```tsx
<div className="article-reading-meta">
```

Change the published date from `<span>` to:

```tsx
<time
  dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}
  className="flex items-center gap-1.5"
>
```

Keep the existing localized date text inside the time element.

- [x] **Step 3: Add a scoped tag row class**

Replace:

```tsx
<div className="mb-6 flex flex-wrap gap-2">
```

with:

```tsx
<div className="article-reading-tags">
```

- [x] **Step 4: Remove visible entry-layer heading**

Replace the entry section heading linkage with an accessible label:

```tsx
<section className="article-entry-layer glass-dock liquid-panel" aria-label={t("post.entry.title")}>
```

Remove the visible `article-entry-heading` block because the first-screen article already has a primary title and the entry-layer kicker was consuming vertical reading space.

## Task 2: Add Scoped Header CSS

**Files:**
- Modify: `client/src/styles/visual-refresh.css`

**Interfaces:**
- Consumes: `.paper-reader-main .article-reading-meta` and `.paper-reader-main .article-reading-tags`.
- Produces: compact readable spacing in both themes without new globals.

- [x] **Step 1: Add compact metadata/tag rules**

Near existing `.paper-reader-main .article-page-title` and `.paper-reader-main .article-reading-header` rules, add:

```css
  .paper-reader-main .article-reading-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem 0.95rem;
    margin-bottom: 0.85rem;
    color: var(--text-muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .paper-reader-main .article-reading-meta > * {
    min-width: 0;
  }

  .paper-reader-main .article-reading-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 0.95rem;
  }
```

- [x] **Step 2: Add mobile tightening**

Inside the existing article mobile area for `@media (max-width: 760px)`, add:

```css
    .paper-reader-main .article-reading-meta {
      gap: 0.38rem 0.7rem;
      margin-bottom: 0.65rem;
      font-size: 0.8rem;
    }

    .paper-reader-main .article-reading-tags {
      margin-bottom: 0.7rem;
    }
```

- [x] **Step 3: Run CSS ownership audit**

Run:

```bash
corepack pnpm audit:css -- --no-output
```

Expected: exits 0; `!important` count does not increase.

## Task 3: Tighten Article UI Audit

**Files:**
- Modify: `scripts/audit/ui-layout.ts`

**Interfaces:**
- Consumes: existing `inspectPost` route check.
- Produces: stricter first-screen article evidence.

- [x] **Step 1: Record pre-body utility presence**

In `inspectPost`, add a direct residue check for the previous Scholar link and pre-body buttons:

```ts
      preBodyAuthorUtilityCount: document.querySelectorAll(
        '.article-reading-header a[href*="scholar.google"], .article-reading-header button'
      ).length,
```

This should stay `0`.

- [x] **Step 2: Tighten prose start checks**

Change `proseStartsSoon` thresholds to:

```ts
      proseStartsSoon:
        viewport.width < 768
          ? Number(measurements.proseY ?? Infinity) <= 590
          : Number(measurements.proseY ?? Infinity) <= 520,
```

- [x] **Step 3: Add the no pre-body author utility check**

Add:

```ts
      noPreBodyAuthorUtilities:
        Number(measurements.preBodyAuthorUtilityCount) === 0,
```

- [x] **Step 4: Run typecheck**

Run:

```bash
corepack pnpm check
```

Expected: TypeScript completes with no errors.

## Task 4: Verify And Report

**Files:**
- Create: `docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/summary.md`
- Create: `docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/ui-layout-checks.json`

**Interfaces:**
- Consumes: `audit:ui` JSON and validation commands.
- Produces: report evidence for the slice.

- [x] **Step 1: Run browser audit**

Start dev server if needed:

```bash
corepack pnpm dev
```

Run:

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/ui-layout-checks.json
```

Expected: command exits 0 and post route checks include `noPreBodyAuthorUtilities: true`.

- [x] **Step 2: Run focused tests, build, and diff check**

Run:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx
corepack pnpm build
git diff --check
```

Expected: all commands exit 0.

- [x] **Step 3: Write report**

Create the report with changed files, user-visible behavior, validation results, prose Y measurements, and known risks.

## Task 5: Commit

**Files:**
- Stage exactly this slice's files.

**Interfaces:**
- Produces: one bounded commit.

- [x] **Step 1: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected: only `PostDetail.tsx`, `visual-refresh.css`, `ui-layout.ts`, this plan, and this slice report files are changed.

- [x] **Step 2: Commit**

Run:

```bash
git add client/src/pages/PostDetail.tsx client/src/styles/visual-refresh.css scripts/audit/ui-layout.ts docs/superpowers/plans/2026-07-09-article-first-screen-metadata-trim-slice.md docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/summary.md docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/ui-layout-checks.json
git commit -m "feat: trim article first-screen metadata"
```

Expected: commit succeeds on `dev`.

## Self-Review

- Spec coverage: article first-screen hierarchy, mobile reading calm, feedback/subscription still after body.
- Placeholder scan: no placeholder instructions remain.
- Type consistency: audit metric name `preBodyAuthorUtilityCount` is used only inside `inspectPost`.
- Scope check: no route, API, DB, auth, SEO, Markdown, Agent, dependency, deploy, or schema change.
