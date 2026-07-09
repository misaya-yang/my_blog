# Taxonomy Mobile Article First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move taxonomy article results ahead of the related-tags side panel on mobile/tablet so readers reach actual articles sooner.

**Architecture:** Keep routes, API, and taxonomy data unchanged. Move the related-tags aside after the article notes surface in JSX so DOM order matches mobile reading order, preserve the desktop side rail with existing grid areas, and tighten the route audit in `scripts/audit/ui-layout.ts` so the improvement remains measurable.

**Tech Stack:** CSS grid item `order`, existing TypeScript UI audit, existing `corepack pnpm audit:ui`, existing Vite/Express dev server.

## Global Constraints

- No deployment.
- No schema migration.
- No production credential handling.
- No new dependency.
- No route, API, DB, auth, SEO, or Agent contract change.
- No new `!important`.
- No broad CSS rewrite.
- This slice implements part of Wave 1 public UI and reading calm. It does not claim the full product optimization goal is complete.

---

## File Structure

- Modify `client/src/pages/TaxonomyPage.tsx`: move the related-tags aside after the article notes surface.
- Modify `client/src/styles/visual-refresh.css`: keep taxonomy hero, notes, and side panel order explicit on screens below 1024px.
- Modify `scripts/audit/ui-layout.ts`: tighten mobile taxonomy checks to prove article rows now appear before the side panel.
- Create `docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/summary.md`: record scope, changed files, validation, and risks.

## Task 1: Reorder Taxonomy Mobile Layout

**Files:**
- Modify: `client/src/pages/TaxonomyPage.tsx`
- Modify: `client/src/styles/visual-refresh.css`

**Interfaces:**
- Consumes: existing `.taxonomy-layout`, `.taxonomy-hero`, `.taxonomy-notes-surface`, and `.taxonomy-side-panel` classes.
- Produces: mobile/tablet visual order: hero first, article notes second, related tag panel third.

- [ ] **Step 1: Move related-tags aside after article notes in JSX**

In `client/src/pages/TaxonomyPage.tsx`, move the `<Surface as="aside" className="taxonomy-side-panel" ...>` block so it renders after `<Surface className="taxonomy-notes-surface hairline-list">...</Surface>`.

Expected JSX order inside `.taxonomy-layout`:

```tsx
<section className="taxonomy-hero page-hero">...</section>
<Surface className="taxonomy-notes-surface hairline-list">...</Surface>
<Surface as="aside" className="taxonomy-side-panel" variant="floating">...</Surface>
```

- [ ] **Step 2: Add mobile/tablet order rules**

Inside the existing `@media (max-width: 1023px)` block in `client/src/styles/visual-refresh.css`, add:

```css
    .taxonomy-hero {
      order: 1;
    }

    .taxonomy-notes-surface {
      order: 2;
    }

    .taxonomy-side-panel {
      order: 3;
    }
```

- [ ] **Step 3: Run CSS ownership audit**

Run:

```bash
corepack pnpm audit:css -- --no-output
```

Expected: command exits 0. The slice must not add `!important`.

## Task 2: Tighten Taxonomy Route Audit

**Files:**
- Modify: `scripts/audit/ui-layout.ts`

**Interfaces:**
- Consumes: measurements from `inspectTaxonomy`.
- Produces: stricter mobile taxonomy checks that prove article rows come before related tags.

- [ ] **Step 1: Add `sidePanelAfterNotesOnMobile` check**

In `inspectTaxonomy`, add this check after `relatedTagsBounded`:

```ts
      sidePanelAfterNotesOnMobile:
        viewport.width >= 1024 ||
        Number(measurements.sidePanelTop ?? Infinity) >
          Number(measurements.notesTop ?? -Infinity),
```

- [ ] **Step 2: Tighten mobile first-screen thresholds**

Change the mobile taxonomy thresholds to:

```ts
      notesSurfaceVisibleSoon:
        Number(measurements.notesTop ?? Infinity) <=
        (viewport.width < 768 ? 760 : 520),
      firstRowVisibleSoon:
        Number(measurements.firstRowTop ?? Infinity) <=
        (viewport.width < 768 ? 980 : 760),
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
corepack pnpm check
```

Expected: TypeScript completes with no errors.

## Task 3: Verify Browser Audit And Write Evidence

**Files:**
- Create: `docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/summary.md`
- Create: `docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/ui-layout-checks.json`

**Interfaces:**
- Consumes: `corepack pnpm audit:ui -- --output=<path>` report JSON.
- Produces: slice summary with changed files, behavior, validation, and known risks.

- [ ] **Step 1: Run the focused browser audit**

Start local dev server if it is not already running:

```bash
corepack pnpm dev
```

In another command, run:

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/ui-layout-checks.json
```

Expected: command exits 0. The `/categories/ai-applications` mobile result must report `sidePanelAfterNotesOnMobile: true`.

- [ ] **Step 2: Run focused tests and build**

Run:

```bash
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts client/src/pages/Archive.test.ts
corepack pnpm build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Write report**

Create `summary.md` with validation results, audit measurements for `/categories/ai-applications`, and a note that this is a visible layout-order change with no route/API/data contract change.

## Task 4: Commit

**Files:**
- Stage exactly this slice's files.

**Interfaces:**
- Produces: one bounded commit.

- [ ] **Step 1: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected: only `visual-refresh.css`, `ui-layout.ts`, this plan, and this slice report files are changed.

- [ ] **Step 2: Commit**

Run:

```bash
git add client/src/styles/visual-refresh.css scripts/audit/ui-layout.ts docs/superpowers/plans/2026-07-09-taxonomy-mobile-article-first-slice.md docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/summary.md docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/ui-layout-checks.json
git commit -m "feat: prioritize taxonomy articles on mobile"
```

Expected: commit succeeds on `dev`.

## Self-Review

- Spec coverage: implements Wave 1 archive/taxonomy density requirement that mobile screens show meaningful content sooner.
- Placeholder scan: no placeholder instructions remain.
- Type consistency: audit check names are concrete and included in generated JSON.
- Scope check: no route, API, DB, auth, SEO, dependency, or deployment change.
