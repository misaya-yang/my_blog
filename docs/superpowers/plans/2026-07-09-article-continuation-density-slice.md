# Article Continuation Density Slice Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the article footer from stacked utility sections into a calm continuation surface where next reading comes first, feedback/subscription recede, and share/author tools stay secondary.

**Architecture:** Extend the existing article layout contract in `client/src/lib/articleLayout.ts`, consume it from `PostDetail.tsx` through CSS custom properties, and restyle only article-page continuation classes in `visual-refresh.css`. Keep `ArticleFeedback` and `SubscriptionForm` behavior unchanged; only their embedded article presentation is scoped through wrapper classes.

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

- Modify `client/src/lib/articleLayout.ts`: add article continuation ordering and split breakpoint contract.
- Modify `client/src/pages/PostDetail.test.ts`: test the continuation contract next to the rail/measure contract.
- Modify `client/src/pages/PostDetail.tsx`: wrap the post-body continuation area in semantic article classes and remove the separate stacked footer blocks.
- Modify `client/src/styles/visual-refresh.css`: add scoped continuation styles and keep legacy `!important` count flat.
- Create `docs/product_optimization/reports/article-continuation-density-slice-2026-07-09/summary.md`: record screenshots, probes, validations, and CSS debt.

## Task 1: Continuation Contract

**Files:**

- Modify: `client/src/lib/articleLayout.ts`
- Modify: `client/src/pages/PostDetail.test.ts`

**Interfaces:**

- Produces: `ARTICLE_READER_LAYOUT.continuation.maxMeasure`
- Produces: `ARTICLE_READER_LAYOUT.continuation.responseSplitMinViewportPx`
- Produces: `ARTICLE_READER_LAYOUT.continuation.responseOrder`
- Produces: `ARTICLE_READER_LAYOUT.continuation.secondaryOrder`
- Produces: `getArticleContinuationMode(viewportWidthPx: number): "stacked" | "split"`

- [x] **Step 1: Write the failing test**

Update the import in `client/src/pages/PostDetail.test.ts`:

```ts
import {
  ARTICLE_READER_LAYOUT,
  getArticleContinuationMode,
  getArticleRailMode,
  isArticleProseMeasureHealthy,
} from "../lib/articleLayout";
```

Add this test to the `article reader layout contract` suite:

```ts
it("keeps reader response below the continuation path and splits only when there is room", () => {
  expect(ARTICLE_READER_LAYOUT.continuation).toEqual({
    maxMeasure: 78,
    responseSplitMinViewportPx: 900,
    responseOrder: ["feedback", "subscription"],
    secondaryOrder: ["share", "author"],
  });
  expect(getArticleContinuationMode(760)).toBe("stacked");
  expect(getArticleContinuationMode(899)).toBe("stacked");
  expect(getArticleContinuationMode(900)).toBe("split");
  expect(getArticleContinuationMode(1440)).toBe("split");
});
```

- [x] **Step 2: Run the focused test to verify it fails**

Run:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts
```

Expected: FAIL because `getArticleContinuationMode` and `ARTICLE_READER_LAYOUT.continuation` do not exist yet.

- [x] **Step 3: Implement the contract**

Modify `client/src/lib/articleLayout.ts` so the exported constant includes:

```ts
  continuation: {
    maxMeasure: 78,
    responseSplitMinViewportPx: 900,
    responseOrder: ["feedback", "subscription"],
    secondaryOrder: ["share", "author"],
  },
```

Add the exported type and function:

```ts
export type ArticleContinuationMode = "stacked" | "split";

export function getArticleContinuationMode(
  viewportWidthPx: number
): ArticleContinuationMode {
  return viewportWidthPx >=
    ARTICLE_READER_LAYOUT.continuation.responseSplitMinViewportPx
    ? "split"
    : "stacked";
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts
```

Expected: PASS.

## Task 2: Article Continuation DOM

**Files:**

- Modify: `client/src/pages/PostDetail.tsx`

**Interfaces:**

- Consumes: `ARTICLE_READER_LAYOUT.continuation`
- Produces: CSS variables `--article-continuation-max` and `--article-response-split-min`
- Produces: DOM classes `article-continuation-shell`, `article-continuation-head`, `article-adjacent-nav`, `article-related-cluster`, `article-reader-response-grid`, `article-continuation-meta`, `article-author-note`

- [x] **Step 1: Extend `articleReaderLayoutStyle`**

Add these properties to `articleReaderLayoutStyle`:

```ts
  "--article-continuation-max": `${ARTICLE_READER_LAYOUT.continuation.maxMeasure}ch`,
  "--article-response-split-min": `${ARTICLE_READER_LAYOUT.continuation.responseSplitMinViewportPx}px`,
```

- [x] **Step 2: Replace the stacked footer blocks**

In `client/src/pages/PostDetail.tsx`, replace the current `article-secondary-actions`, `Author Footer`, and final author block with one `article-continuation-shell` section:

```tsx
<section
  className="article-continuation-shell"
  aria-labelledby="article-continuation-title"
>
  <div className="article-continuation-head">
    <div>
      <p className="technical-label">{t("post.handoff.kicker")}</p>
      <h2 id="article-continuation-title">{t("post.discoveryTitle")}</h2>
    </div>
    <Button asChild variant="outline" size="sm" className="glass-button">
      <Link href={continueTrackHref}>
        {t("post.continueTrack", { track: continueTrackLabel })}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  </div>

  <div className="article-continuation-path">
    {seriesContext && (seriesContext.previous || seriesContext.next) && (
      <SeriesProgress
        variant="footer"
        className="article-series-continuation"
        label={t("post.series.continuity")}
        title={seriesContext.title}
        meta={seriesContext.positionLabel}
        links={...same links as current code...}
      />
    )}

    {!seriesContext && (postContext?.previous || postContext?.next) && (
      <div className="article-adjacent-nav">
        ...same previous/next links...
      </div>
    )}

    {postContext?.related?.length ? (
      <div className="article-related-cluster">
        ...same related links...
      </div>
    ) : null}
  </div>

  <div className="article-reader-response-grid">
    <ArticleFeedback
      postId={post.id}
      postTitle={post.title}
      className="article-feedback-panel"
      embedded
    />
    <SubscriptionForm
      surface="article"
      className="article-subscription-panel"
      embedded
    />
  </div>

  <div className="article-continuation-meta">
    <div className="article-author-note">
      ...same author name, bio, scholar, contact...
    </div>
    <div className="article-secondary-actions glass-dock liquid-surface" aria-label={t("post.share")}>
      ...same share buttons...
    </div>
  </div>
</section>
```

Keep all handlers and links unchanged.

- [x] **Step 3: Run typecheck**

Run:

```bash
corepack pnpm check
```

Expected: PASS.

## Task 3: Continuation CSS

**Files:**

- Modify: `client/src/styles/visual-refresh.css`

**Interfaces:**

- Consumes: `.article-continuation-*` classes from `PostDetail.tsx`
- Consumes: `--article-continuation-max` and existing public color tokens

- [x] **Step 1: Add scoped continuation styles**

Add scoped styles after the existing `.article-handoff-*` block in `visual-refresh.css`:

```css
.paper-reader-main .article-continuation-shell {
  display: grid;
  gap: clamp(1.1rem, 2vw, 1.55rem);
  max-width: min(100%, var(--article-continuation-max, 78ch));
  margin: clamp(2rem, 4vw, 2.8rem) auto 0;
  padding-top: 1.35rem;
  border-top: 1px solid var(--public-border);
}

.article-continuation-head,
.article-continuation-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: start;
}

.article-continuation-head .technical-label {
  display: inline-flex;
  width: auto;
  border: 0;
  background: transparent;
  color: var(--public-accent);
  padding: 0;
}

.article-continuation-head h2,
.article-author-note h3,
.article-related-cluster h3 {
  color: var(--public-text);
}

.article-continuation-path,
.article-reader-response-grid,
.article-author-note {
  min-width: 0;
}

.article-adjacent-nav {
  display: grid;
  gap: 0.55rem;
}

.article-reader-response-grid {
  display: grid;
  gap: 1rem;
  padding-top: 1.05rem;
  border-top: 1px solid var(--public-border);
}

@media (min-width: 900px) {
  .article-reader-response-grid {
    grid-template-columns: minmax(0, 1fr) minmax(17.5rem, 0.72fr);
  }
}

.article-feedback-panel,
.article-subscription-panel {
  min-width: 0;
}

.article-continuation-meta {
  padding-top: 1.05rem;
  border-top: 1px solid var(--public-border);
}

.article-author-note p {
  margin-top: 0.35rem;
  color: var(--public-muted);
}

.article-author-actions,
.article-secondary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
```

Use the actual final CSS to avoid duplicate rules if equivalent selectors already exist.

- [x] **Step 2: Keep mobile stacked**

Add or update the existing `@media (max-width: 760px)` article block:

```css
.article-continuation-head,
.article-continuation-meta,
.article-reader-response-grid {
  grid-template-columns: 1fr;
}

.article-secondary-actions.liquid-surface {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

- [x] **Step 3: Verify CSS debt count**

Run:

```bash
node -e "const fs=require('fs'); const p='client/src/styles/visual-refresh.css'; const s=fs.readFileSync(p,'utf8'); console.log((s.match(/!important/g)||[]).length)"
```

Expected: the count remains `199`.

## Task 4: Browser Evidence And Report

**Files:**

- Create: `docs/product_optimization/reports/article-continuation-density-slice-2026-07-09/summary.md`
- Create evidence files under the same directory.

**Interfaces:**

- Consumes: local dev server at `http://localhost:3000`
- Produces: viewport screenshots and probe JSON for article continuation layout.

- [x] **Step 1: Start local server**

Run:

```bash
corepack pnpm dev
```

Expected: server listens on `http://localhost:3000`.

- [x] **Step 2: Capture browser probes**

Use Playwright on `/post/goal-harness-agent-phase-protocol` at `1440x900`, `1024x900`, and `390x844` in light/dark. Probe:

```ts
const metrics = await page.evaluate(() => {
  const shell = document.querySelector(".article-continuation-shell");
  const handoff = document.querySelector(".article-reading-handoff");
  const response = document.querySelector(".article-reader-response-grid");
  const meta = document.querySelector(".article-continuation-meta");
  const share = document.querySelector(".article-secondary-actions");
  const root = document.documentElement;
  const rect = (element: Element | null) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
  };
  return {
    horizontalOverflow: root.scrollWidth > root.clientWidth,
    shellRect: rect(shell),
    handoffRect: rect(handoff),
    responseColumns: response
      ? window.getComputedStyle(response).gridTemplateColumns
      : null,
    responseRect: rect(response),
    metaRect: rect(meta),
    shareRect: rect(share),
  };
});
```

Expected:

- No horizontal overflow.
- `shellRect.y` is below `handoffRect.y`.
- At `1440`, response grid has two columns.
- At `390`, response grid has one column and share buttons do not overflow.

- [x] **Step 3: Run UI audit**

Run:

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-continuation-density-slice-2026-07-09/ui-layout-checks.json
```

Expected: PASS.

- [x] **Step 4: Write report**

Create `summary.md` with exact scope, screenshots, probe summary, CSS debt, verification commands, and residual risks.

## Task 5: Final Verification And Commit

**Files:**

- All modified and created files from Tasks 1-4.

**Interfaces:**

- Produces: one commit for this slice on `dev`

- [x] **Step 1: Run focused tests**

Run:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/ArticleFeedback.test.tsx client/src/components/SeriesProgress.test.tsx
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

- [x] **Step 4: Run whitespace and secret scan**

Run:

```bash
git diff --check
rg -n "password|token|secret|api[_-]?key|credential|123456|ADMIN_PASSWORD" client/src/lib/articleLayout.ts client/src/pages/PostDetail.tsx client/src/pages/PostDetail.test.ts client/src/styles/visual-refresh.css docs/superpowers/plans/2026-07-09-article-continuation-density-slice.md docs/product_optimization/reports/article-continuation-density-slice-2026-07-09
```

Expected: whitespace check passes; sensitive scan returns no actual credentials. Mentions of "credential" inside the plan constraints are acceptable.

Configure `ADMIN_PASSWORD` only in the ignored `.env.local` file for local development or in the deployment environment. Never include its value in committed commands, plans, or reports.

- [x] **Step 5: Commit**

Run:

```bash
git add client/src/lib/articleLayout.ts client/src/pages/PostDetail.tsx client/src/pages/PostDetail.test.ts client/src/styles/visual-refresh.css docs/superpowers/plans/2026-07-09-article-continuation-density-slice.md docs/product_optimization/reports/article-continuation-density-slice-2026-07-09
git commit -m "feat: streamline article continuation"
```

Expected: commit succeeds.

## Self-Review

- Spec coverage: covers `SPEC-READ` requirements that related content appears as continuation and feedback/subscription do not interrupt the first reading pass; covers UI evidence and CSS debt reporting.
- Placeholder scan: no placeholder work remains.
- Type consistency: `ARTICLE_READER_LAYOUT.continuation` and `getArticleContinuationMode` are defined before use.
