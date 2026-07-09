# Public UI Audit Coverage Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Wave 1 UI audit coverage so archive and taxonomy discovery routes are automatically checked for scanability, no horizontal overflow, and first-screen density before future visual changes.

**Architecture:** Keep this as a release-gate script slice, not a runtime UI rewrite. Add two route inspectors to `scripts/audit/ui-layout.ts`, reuse the existing Playwright-like helper types, and write a slice report with the commands actually run.

**Tech Stack:** TypeScript, Playwright loaded through `createRequire`, existing `corepack pnpm audit:ui`, existing Vite/Express dev server.

## Global Constraints

- No deployment.
- No schema migration.
- No production credential handling.
- No new dependency.
- No broad CSS rewrite.
- Preserve public routes, tRPC contracts, DB schema, auth, and SEO contracts.
- This slice implements evidence coverage for `SPEC-UI`, `SPEC-READ`, `SPEC-GATES`, and `SPEC-SYSTEM`; it does not claim the whole product optimization program is complete.

---

## File Structure

- Modify `scripts/audit/ui-layout.ts`: add archive and taxonomy inspections to the existing audit report.
- Create `docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/summary.md`: record scope, changed files, validation, and remaining risk.

## Task 1: Add Archive And Taxonomy UI Inspectors

**Files:**
- Modify: `scripts/audit/ui-layout.ts`

**Interfaces:**
- Consumes: existing `newMeasuredPage(browser, viewport)`, `gotoAndWait(page, url, selector)`, `Viewport`, `BrowserLike`, and `PageLike`.
- Produces: `inspectArchive(browser: BrowserLike, viewport: Viewport)` and `inspectTaxonomy(browser: BrowserLike, viewport: Viewport)` returning the same `{ route, viewport, measurements, checks }` shape already used by `UiLayoutReport`.

- [ ] **Step 1: Add audit calls in `main()`**

Insert these calls after the existing search zero-state inspection so archive and taxonomy are part of the default `audit:ui` gate:

```ts
      await inspectArchive(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      }),
      await inspectArchive(browser, {
        name: "desktop",
        width: 1440,
        height: 1000,
      }),
      await inspectTaxonomy(browser, {
        name: "mobile",
        width: 390,
        height: 844,
      }),
      await inspectTaxonomy(browser, {
        name: "desktop",
        width: 1440,
        height: 1000,
      }),
```

- [ ] **Step 2: Add `inspectArchive`**

Place this function near `inspectSearchZero` so public discovery route checks stay grouped:

```ts
async function inspectArchive(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(page, `${baseUrl}/archive`, ".archive-post-row");

  const measurements = await page.evaluate(() => {
    const hero = document.querySelector(".page-hero");
    const summary = document.querySelector(".archive-summary-strip");
    const timeline = document.querySelector(".archive-timeline");
    const firstRow = document.querySelector(".archive-post-row");
    const firstTitle = document.querySelector(".archive-post-title");
    return {
      heroHeight: rectHeight(hero),
      summaryTop: rectTop(summary),
      timelineTop: rectTop(timeline),
      firstRowTop: rectTop(firstRow),
      firstRowHeight: rectHeight(firstRow),
      firstTitleLineHeight: computedLineHeight(firstTitle),
      rowCount: document.querySelectorAll(".archive-post-row").length,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function rectTop(element: Element | null) {
      return element?.getBoundingClientRect().top ?? null;
    }

    function rectHeight(element: Element | null) {
      return element?.getBoundingClientRect().height ?? null;
    }

    function computedLineHeight(element: Element | null) {
      if (!element) return null;
      return window.getComputedStyle(element).lineHeight;
    }
  });

  await page.close();

  return {
    route: "/archive",
    viewport,
    measurements,
    checks: {
      noHorizontalOverflow:
        Number(measurements.bodyScrollWidth) <=
          Number(measurements.viewportWidth) &&
        Number(measurements.documentScrollWidth) <=
          Number(measurements.viewportWidth),
      archiveRowsPresent: Number(measurements.rowCount) > 0,
      summaryVisibleSoon:
        Number(measurements.summaryTop ?? Infinity) <=
        (viewport.width < 768 ? viewport.height + 80 : 520),
      firstRowVisibleSoon:
        Number(measurements.firstRowTop ?? Infinity) <=
        (viewport.width < 768 ? 1200 : 760),
      rowDensityReadable:
        Number(measurements.firstRowHeight ?? 0) >= 56 &&
        Number(measurements.firstRowHeight ?? Infinity) <=
          (viewport.width < 768 ? 260 : 150),
      titleLineHeightReadable:
        parseFloat(String(measurements.firstTitleLineHeight ?? "0")) >= 22,
    },
  };
}
```

- [ ] **Step 3: Add `inspectTaxonomy`**

Place this function after `inspectArchive`:

```ts
async function inspectTaxonomy(browser: BrowserLike, viewport: Viewport) {
  const page = await newMeasuredPage(browser, viewport);
  await gotoAndWait(
    page,
    `${baseUrl}/categories/ai-applications`,
    ".taxonomy-article-row"
  );

  const measurements = await page.evaluate(() => {
    const hero = document.querySelector(".taxonomy-hero");
    const sidePanel = document.querySelector(".taxonomy-side-panel");
    const notesSurface = document.querySelector(".taxonomy-notes-surface");
    const firstRow = document.querySelector(".taxonomy-article-row");
    const firstTitle = document.querySelector(".taxonomy-article-title");
    return {
      heroHeight: rectHeight(hero),
      sidePanelTop: rectTop(sidePanel),
      sidePanelHeight: rectHeight(sidePanel),
      notesTop: rectTop(notesSurface),
      firstRowTop: rectTop(firstRow),
      firstRowHeight: rectHeight(firstRow),
      firstTitleLineHeight: computedLineHeight(firstTitle),
      rowCount: document.querySelectorAll(".taxonomy-article-row").length,
      sideTagCount: sidePanel?.querySelectorAll(".article-tag").length ?? 0,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };

    function rectTop(element: Element | null) {
      return element?.getBoundingClientRect().top ?? null;
    }

    function rectHeight(element: Element | null) {
      return element?.getBoundingClientRect().height ?? null;
    }

    function computedLineHeight(element: Element | null) {
      if (!element) return null;
      return window.getComputedStyle(element).lineHeight;
    }
  });

  await page.close();

  return {
    route: "/categories/ai-applications",
    viewport,
    measurements,
    checks: {
      noHorizontalOverflow:
        Number(measurements.bodyScrollWidth) <=
          Number(measurements.viewportWidth) &&
        Number(measurements.documentScrollWidth) <=
          Number(measurements.viewportWidth),
      taxonomyRowsPresent: Number(measurements.rowCount) > 0,
      relatedTagsBounded: Number(measurements.sideTagCount) <= 12,
      notesSurfaceVisibleSoon:
        Number(measurements.notesTop ?? Infinity) <=
        (viewport.width < 768 ? 1250 : 520),
      firstRowVisibleSoon:
        Number(measurements.firstRowTop ?? Infinity) <=
        (viewport.width < 768 ? 1500 : 760),
      rowDensityReadable:
        Number(measurements.firstRowHeight ?? 0) >= 88 &&
        Number(measurements.firstRowHeight ?? Infinity) <=
          (viewport.width < 768 ? 260 : 190),
      titleLineHeightReadable:
        parseFloat(String(measurements.firstTitleLineHeight ?? "0")) >= 22,
    },
  };
}
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
corepack pnpm check
```

Expected: TypeScript completes with no errors.

## Task 2: Verify Browser Audit And Write Evidence

**Files:**
- Modify: `docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/summary.md`

**Interfaces:**
- Consumes: `corepack pnpm audit:ui -- --output=<path>` report JSON.
- Produces: slice summary with changed files, behavior, validation, and known risks.

- [ ] **Step 1: Run the focused audit**

Start local dev server if it is not already running:

```bash
corepack pnpm dev
```

In another command, run:

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/ui-layout-checks.json
```

Expected: command exits 0 and writes a report whose `results` include `/archive` and `/categories/ai-applications` for mobile and desktop.

- [ ] **Step 2: Write the report**

Create `docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/summary.md` with:

```md
# Public UI Audit Coverage Slice

Date: 2026-07-09
Status: Passed
Branch: dev

## Summary

Extended `audit:ui` so archive and taxonomy discovery routes are checked by default for horizontal overflow, first-screen density, readable row height, readable title line-height, and bounded taxonomy side tags.

## Changed Files

- `scripts/audit/ui-layout.ts`
- `docs/superpowers/plans/2026-07-09-public-ui-audit-coverage-slice.md`
- `docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/summary.md`
- `docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/ui-layout-checks.json`

## User-Visible Behavior

No runtime UI behavior changed. This slice adds automated evidence coverage so later public UI edits must keep archive and taxonomy pages readable and free of horizontal overflow.

## Validation

- `corepack pnpm check`
- `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/ui-layout-checks.json`
- `git diff --check`

## Known Risks

- The audit uses `/categories/ai-applications` as the taxonomy fixture. If seeded taxonomy slugs change later, the audit route must be updated with the route contract.
- This slice does not redesign archive or taxonomy visuals; it prevents regressions and records objective metrics for future Wave 1 UI work.
```

- [ ] **Step 3: Run diff checks**

Run:

```bash
git diff --check
```

Expected: no output and exit 0.

## Task 3: Commit

**Files:**
- Stage exactly the files changed by this slice.

**Interfaces:**
- Produces: one bounded commit.

- [ ] **Step 1: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the audit script, plan, and report files are changed.

- [ ] **Step 2: Commit**

Run:

```bash
git add scripts/audit/ui-layout.ts docs/superpowers/plans/2026-07-09-public-ui-audit-coverage-slice.md docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/summary.md docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/ui-layout-checks.json
git commit -m "test: expand public ui audit coverage"
```

Expected: commit succeeds on `dev`.

## Self-Review

- Spec coverage: covers Wave 0 plan requirement and Wave 1 evidence coverage for archive and taxonomy routes.
- Placeholder scan: no placeholder instructions remain.
- Type consistency: new inspectors return the same shape as existing inspectors and consume existing helper types.
- Scope check: no runtime UI, API, DB, auth, SEO, dependency, or deployment change.
