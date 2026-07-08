# Article Rail Reading Measure Slice Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the article reading page keep the prose column dominant by showing the right TOC rail only when the viewport is wide enough for a healthy 66-78ch reading measure.

**Architecture:** Add a tiny article layout contract in `client/src/lib/articleLayout.ts`, consume it from `PostDetail.tsx` as CSS custom properties, and adjust `visual-refresh.css` breakpoints so medium desktop uses the inline collapsed TOC while wide desktop uses the right rail. Keep the change scoped to the public article page and produce browser evidence under `docs/product_optimization/reports/`.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS v4 import layers, Vitest, Playwright via local scripts, existing `pnpm` scripts.

## Global Constraints

- No public leak of hidden, draft, admin-only, private, pasted, credential, or contact data.
- No production credentials in docs, tests, commits, logs, screenshots, or URLs.
- No deployment, force push, schema migration, destructive data operation, or credential mutation without explicit owner approval.
- No new dependency unless the slice report explains why the existing stack is insufficient.
- No broad CSS rewrite or page rewrite in a single commit.
- No visual-only change without browser evidence for the affected route.
- No overall goal completion after a single slice.
- Do not increase `!important`, viewport font sizing, broad selectors, or hard-coded color debt without reporting it.

---

## File Structure

- Create `client/src/lib/articleLayout.ts`: single source for the article prose measure and rail breakpoint contract.
- Modify `client/src/pages/PostDetail.tsx`: attach layout CSS custom properties and stable data attributes to the article cockpit; add a class to the cover frame for centered measure control.
- Modify `client/src/pages/PostDetail.test.ts`: test the rail mode breakpoint and prose measure contract alongside existing completion link tests.
- Modify `client/src/styles/visual-refresh.css`: convert article layout from `lg` rail behavior to inline TOC until `1360px`, center the readable measure, and keep existing `!important` count flat by editing existing override blocks rather than adding new debt.
- Create `docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/summary.md`: summarize code, verification, CSS debt, and browser evidence.

## Task 1: Article Layout Contract

**Files:**
- Create: `client/src/lib/articleLayout.ts`
- Modify: `client/src/pages/PostDetail.test.ts`

**Interfaces:**
- Produces: `ARTICLE_READER_LAYOUT.proseMeasure.min | target | max`, `ARTICLE_READER_LAYOUT.tocRailMinViewportPx`, `ARTICLE_READER_LAYOUT.tocRailWidthRem`
- Produces: `getArticleRailMode(viewportWidthPx: number): "inline-toc" | "toc-rail"`
- Produces: `isArticleProseMeasureHealthy(measureCh: number): boolean`

- [x] **Step 1: Write the failing test**

Add this import to `client/src/pages/PostDetail.test.ts`:

```ts
import {
  ARTICLE_READER_LAYOUT,
  getArticleRailMode,
  isArticleProseMeasureHealthy,
} from "../lib/articleLayout";
```

Add these tests after the existing `article completion links` suite:

```ts
describe("article reader layout contract", () => {
  it("keeps the TOC inline until the prose can hold a healthy measure", () => {
    expect(getArticleRailMode(1024)).toBe("inline-toc");
    expect(getArticleRailMode(1279)).toBe("inline-toc");
    expect(getArticleRailMode(1359)).toBe("inline-toc");
    expect(getArticleRailMode(1360)).toBe("toc-rail");
    expect(getArticleRailMode(1440)).toBe("toc-rail");
  });

  it("documents the target article prose measure", () => {
    expect(ARTICLE_READER_LAYOUT.proseMeasure).toEqual({
      min: 66,
      target: 74,
      max: 78,
    });
    expect(isArticleProseMeasureHealthy(65)).toBe(false);
    expect(isArticleProseMeasureHealthy(66)).toBe(true);
    expect(isArticleProseMeasureHealthy(74)).toBe(true);
    expect(isArticleProseMeasureHealthy(78)).toBe(true);
    expect(isArticleProseMeasureHealthy(79)).toBe(false);
  });
});
```

- [x] **Step 2: Run the focused test to verify it fails**

Run:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts
```

Expected: FAIL because `client/src/lib/articleLayout.ts` does not exist.

- [x] **Step 3: Implement the layout contract**

Create `client/src/lib/articleLayout.ts`:

```ts
export const ARTICLE_READER_LAYOUT = {
  proseMeasure: {
    min: 66,
    target: 74,
    max: 78,
  },
  tocRailMinViewportPx: 1360,
  tocRailWidthRem: 15.5,
} as const;

export type ArticleRailMode = "inline-toc" | "toc-rail";

export function getArticleRailMode(viewportWidthPx: number): ArticleRailMode {
  return viewportWidthPx >= ARTICLE_READER_LAYOUT.tocRailMinViewportPx
    ? "toc-rail"
    : "inline-toc";
}

export function isArticleProseMeasureHealthy(measureCh: number) {
  const { min, max } = ARTICLE_READER_LAYOUT.proseMeasure;
  return measureCh >= min && measureCh <= max;
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts
```

Expected: PASS.

## Task 2: Article DOM Hooks

**Files:**
- Modify: `client/src/pages/PostDetail.tsx`

**Interfaces:**
- Consumes: `ARTICLE_READER_LAYOUT` from `client/src/lib/articleLayout.ts`
- Produces: `articleReaderLayoutStyle` CSS custom properties on `.paper-reader-cockpit`

- [x] **Step 1: Add the imports**

Modify the imports in `client/src/pages/PostDetail.tsx`:

```ts
import { ARTICLE_READER_LAYOUT } from "@/lib/articleLayout";
import { lazy, Suspense, useEffect, useState, useCallback, type CSSProperties } from "react";
```

- [x] **Step 2: Add CSS custom property object**

Add this constant after `articleAgentPromptKeys`:

```ts
const articleReaderLayoutStyle = {
  "--article-prose-min": `${ARTICLE_READER_LAYOUT.proseMeasure.min}ch`,
  "--article-prose-target": `${ARTICLE_READER_LAYOUT.proseMeasure.target}ch`,
  "--article-prose-max": `${ARTICLE_READER_LAYOUT.proseMeasure.max}ch`,
  "--article-toc-rail-width": `${ARTICLE_READER_LAYOUT.tocRailWidthRem}rem`,
} as CSSProperties;
```

- [x] **Step 3: Attach the layout style and data attributes**

Change the cockpit wrapper to:

```tsx
<div
  className="paper-reader-cockpit"
  data-toc-rail-min-width={ARTICLE_READER_LAYOUT.tocRailMinViewportPx}
  style={articleReaderLayoutStyle}
>
```

Change the cover wrapper to:

```tsx
<div className="article-cover-frame mb-10 overflow-hidden rounded-lg">
```

- [x] **Step 4: Run TypeScript check for this file path**

Run:

```bash
corepack pnpm check
```

Expected: PASS or unrelated pre-existing failures only. If there is a failure caused by the custom properties, fix the `CSSProperties` cast.

## Task 3: CSS Rail And Measure Behavior

**Files:**
- Modify: `client/src/styles/visual-refresh.css`

**Interfaces:**
- Consumes: `--article-prose-target`, `--article-prose-max`, and `--article-toc-rail-width` set by `PostDetail.tsx`
- Produces: inline TOC mode below `1360px`; right rail mode at `1360px+`

- [x] **Step 1: Edit the existing article override block**

In `client/src/styles/visual-refresh.css`, modify the existing last-mile article overrides so they express this behavior:

```css
.paper-reader-cockpit .paper-toc-rail {
  display: none;
}

.paper-reader-main :where(
  .article-reading-header,
  .article-cover-frame,
  .mobile-toc-shell,
  .article-reading-handoff,
  .article-secondary-actions
) {
  max-width: min(100%, var(--article-prose-max, 78ch));
  margin-right: auto;
  margin-left: auto;
}

.paper-reader-main .article-prose {
  max-width: min(100%, var(--article-prose-target, 74ch));
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: 1024px) {
  .paper-reader-cockpit {
    grid-template-columns: minmax(0, 1fr) !important;
  }

  .paper-reader-main .mobile-toc-shell {
    display: block;
  }
}

@media (min-width: 1360px) {
  .paper-reader-cockpit {
    grid-template-columns:
      minmax(0, min(100%, var(--article-prose-max, 78ch)))
      minmax(14rem, var(--article-toc-rail-width, 15.5rem)) !important;
    justify-content: center;
  }

  .paper-reader-cockpit .paper-toc-rail {
    display: block;
  }
}
```

Also change the existing `@media (min-width: 1600px)` article cockpit override to the same two-column template rather than reintroducing a wider main column.

- [x] **Step 2: Check CSS debt count before and after**

Run:

```bash
node -e "const fs=require('fs'); const p='client/src/styles/visual-refresh.css'; const s=fs.readFileSync(p,'utf8'); console.log((s.match(/!important/g)||[]).length)"
```

Expected: count does not increase from the pre-change value for this file.

- [x] **Step 3: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no whitespace errors.

## Task 4: Browser Evidence And Report

**Files:**
- Create: `docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/summary.md`
- Create evidence files under the same directory.

**Interfaces:**
- Consumes: local dev server at `http://localhost:3000`
- Produces: screenshots and JSON probes documenting no horizontal overflow, rail mode, inline TOC visibility, computed font, line height, and prose width.

- [x] **Step 1: Start local server**

Run:

```bash
corepack pnpm dev
```

Expected: server listens on `http://localhost:3000`.

- [x] **Step 2: Capture browser probes**

Use Playwright to visit `/post/goal-harness-agent-phase-protocol` at `1024x900`, `1360x900`, `1440x900`, and `390x844` in light and dark where practical. Capture:

```ts
const metrics = await page.evaluate(() => {
  const prose = document.querySelector(".article-prose") as HTMLElement | null;
  const cockpit = document.querySelector(".paper-reader-cockpit") as HTMLElement | null;
  const rail = document.querySelector(".paper-toc-rail") as HTMLElement | null;
  const mobileToc = document.querySelector(".mobile-toc-shell") as HTMLElement | null;
  const style = prose ? window.getComputedStyle(prose) : null;
  return {
    viewportWidth: window.innerWidth,
    bodyScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.documentElement.clientWidth,
    railDisplay: rail ? window.getComputedStyle(rail).display : null,
    mobileTocDisplay: mobileToc ? window.getComputedStyle(mobileToc).display : null,
    cockpitColumns: cockpit ? window.getComputedStyle(cockpit).gridTemplateColumns : null,
    proseWidth: prose?.getBoundingClientRect().width ?? null,
    proseFontFamily: style?.fontFamily ?? null,
    proseFontSize: style?.fontSize ?? null,
    proseLineHeight: style?.lineHeight ?? null,
  };
});
```

Expected:
- `1024x900`: `railDisplay` is `none`, `mobileTocDisplay` is not `none`, no horizontal overflow.
- `1360x900` and `1440x900`: `railDisplay` is not `none`, no horizontal overflow.
- `390x844`: no horizontal overflow, inline TOC remains reachable, body text remains readable.

- [x] **Step 3: Run project UI audit**

Run:

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/ui-layout-checks.json
```

Expected: script completes and writes JSON.

- [x] **Step 4: Write report**

Create `docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/summary.md` with:

```markdown
# Article Rail Reading Measure Slice

Date: 2026-07-09
Branch: dev

## Scope

- [filled with implemented changes]

## Evidence

- [filled with screenshots and probe JSON paths]

## CSS Debt

- `!important` count in `client/src/styles/visual-refresh.css`: [before] -> [after]
- New dependencies: none
- New broad selectors: [state]
- Viewport font sizing: no new readable-text viewport font sizing

## Verification

- [filled with exact commands and pass/fail]

## Residual Risk

- [filled with any remaining article-page risk]
```

## Task 5: Final Verification And Commit

**Files:**
- All modified and created files from Tasks 1-4.

**Interfaces:**
- Produces: a single commit for this slice on `dev`

- [x] **Step 1: Run focused tests**

Run:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx client/src/components/SeriesProgress.test.tsx client/src/components/ArticleFeedback.test.tsx
```

Expected: PASS.

- [x] **Step 2: Run typecheck**

Run:

```bash
corepack pnpm check
```

Expected: PASS.

- [x] **Step 3: Run production build**

Run:

```bash
corepack pnpm build
```

Expected: PASS.

- [x] **Step 4: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no whitespace errors.

- [x] **Step 5: Review diff**

Run:

```bash
git diff -- client/src/lib/articleLayout.ts client/src/pages/PostDetail.tsx client/src/pages/PostDetail.test.ts client/src/styles/visual-refresh.css docs/superpowers/plans/2026-07-09-article-rail-reading-measure-slice.md docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09/summary.md
```

Expected: diff is scoped to this slice and contains no credentials.

- [x] **Step 6: Commit**

Run:

```bash
git add client/src/lib/articleLayout.ts client/src/pages/PostDetail.tsx client/src/pages/PostDetail.test.ts client/src/styles/visual-refresh.css docs/superpowers/plans/2026-07-09-article-rail-reading-measure-slice.md docs/product_optimization/reports/article-rail-reading-measure-slice-2026-07-09
git commit -m "feat: constrain article rail measure"
```

Expected: commit succeeds.

## Self-Review

- Spec coverage: covers `SPEC-READ` rail/prose measure, mobile order preservation, visual evidence, and CSS debt reporting for this slice.
- Placeholder scan: no `TBD`, `TODO`, or unspecified test steps remain.
- Type consistency: `ARTICLE_READER_LAYOUT`, `getArticleRailMode`, and `isArticleProseMeasureHealthy` are defined in Task 1 and consumed in later tasks.
