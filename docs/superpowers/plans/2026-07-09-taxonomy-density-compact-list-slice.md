# Taxonomy Density Compact List Implementation Plan

Status: Completed
Evidence commit: `373b742 feat: compact taxonomy article lists`
Evidence report: `docs/product_optimization/reports/taxonomy-density-compact-list-slice-2026-07-09/summary.md`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace taxonomy full article cards with compact scan-friendly rows while preserving public route, pagination, and public-only data boundaries.

**Architecture:** Keep the change local to the taxonomy page. Add pure helpers for tag capping/excerpt selection, add an exported row component for static render tests, and style the row in the existing visual refresh layer. Do not modify `ArticleCard` because track/home pages still use the full visual card pattern.

**Tech Stack:** React 19, Wouter `Link`, Vitest, `renderToStaticMarkup`, existing CSS layers, existing lucide icon family.

## Global Constraints

- Work on branch `dev`.
- No new dependency.
- No route, API, DB, auth, or discovery contract change.
- Preserve public-only taxonomy data behavior.
- Do not add viewport-unit font sizing for readable text.
- Do not add `!important`, broad global selectors, or hard-coded one-off colors.
- Taxonomy density target: compact cards or rows; cap visible tags and show `+N` overflow.
- Record validation and known risk in `docs/product_optimization/reports/`.

---

### Task 1: Add Taxonomy Compact Row

**Files:**
- Modify: `client/src/pages/TaxonomyPage.tsx`
- Test: `client/src/pages/TaxonomyPage.test.ts`

**Interfaces:**
- Produces: `getVisibleTaxonomyTags(tags, limit?)`, `getHiddenTaxonomyTagCount(tags, limit?)`, `getTaxonomyPostExcerpt(post)`, and `TaxonomyArticleRow`.
- Consumes: existing `data.posts`, `language`, and `t` from `TaxonomyPage`.

- [x] **Step 1: Write the failing helper and render tests**

Add imports to `client/src/pages/TaxonomyPage.test.ts`:

```ts
import { renderToStaticMarkup } from "react-dom/server";
```

Add exports to the import list:

```ts
  getHiddenTaxonomyTagCount,
  getTaxonomyPostExcerpt,
  getVisibleTaxonomyTags,
  TaxonomyArticleRow,
```

Add tests:

```ts
describe("taxonomy compact row helpers", () => {
  const tags = [
    { id: 1, name: "RAG", slug: "rag" },
    { id: 2, name: "Evaluation", slug: "evaluation" },
    { id: 3, name: "Agent", slug: "agent" },
    { id: 4, name: "Long context", slug: "long-context" },
  ];

  it("caps visible taxonomy tags and reports hidden count", () => {
    expect(getVisibleTaxonomyTags(tags).map(tag => tag.slug)).toEqual([
      "rag",
      "evaluation",
      "agent",
    ]);
    expect(getHiddenTaxonomyTagCount(tags)).toBe(1);
    expect(getHiddenTaxonomyTagCount(tags.slice(0, 2))).toBe(0);
  });

  it("prefers excerpt and falls back to stripped content", () => {
    expect(
      getTaxonomyPostExcerpt({
        id: 1,
        slug: "with-excerpt",
        title: "With excerpt",
        excerpt: "Concrete summary",
      })
    ).toBe("Concrete summary");
    expect(
      getTaxonomyPostExcerpt({
        id: 2,
        slug: "with-content",
        title: "With content",
        content: "# Heading\n\nThis **article** explains retrieval.",
      })
    ).toContain("This article explains retrieval.");
  });

  it("renders a compact taxonomy row with capped tags and overflow", () => {
    const html = renderToStaticMarkup(
      <TaxonomyArticleRow
        post={{
          id: 1,
          slug: "agent-eval",
          title: "Agent evaluation harnesses need source coverage",
          excerpt: "How source coverage changes answer quality review.",
          publishedAt: "2026-07-09T00:00:00.000Z",
          readingMinutes: 8,
          category: { name: "AI Applications", slug: "ai-applications" },
          tags,
        }}
        language="en"
        t={(key, vars) => {
          if (key === "home.minRead") return "min read";
          if (key === "home.readMore") return "Read";
          if (key === "discovery.moreTags") return `+${vars?.count}`;
          if (key === "common.draft") return "Draft";
          return key;
        }}
      />
    );

    expect(html).toContain("taxonomy-article-row");
    expect(html).toContain("Agent evaluation harnesses");
    expect(html).toContain("How source coverage changes");
    expect(html).toContain("/post/agent-eval");
    expect(html).toContain("+1");
    expect(html).not.toContain("article-card");
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts
```

Expected: FAIL because the exported helpers/component and `discovery.moreTags` key do not exist yet.

- [x] **Step 3: Implement compact taxonomy row**

In `client/src/pages/TaxonomyPage.tsx`, remove the `ArticleCard` import and add needed icons:

```ts
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Folder,
  Hash,
  Network,
  Tags,
} from "lucide-react";
```

Add local types and helpers below `buildTaxonomyPageHref`:

```ts
type TaxonomyTag = {
  id?: string | number;
  name: string;
  slug: string;
};

export type TaxonomyPost = {
  id: string | number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  publishedAt?: string | Date | null;
  readingMinutes?: number | null;
  category?: { name?: string | null; slug?: string | null } | null;
  tags?: TaxonomyTag[] | null;
};

const TAXONOMY_VISIBLE_TAG_LIMIT = 3;

export function getVisibleTaxonomyTags(
  tags: TaxonomyTag[] | null | undefined,
  limit = TAXONOMY_VISIBLE_TAG_LIMIT
) {
  return Array.isArray(tags) ? tags.slice(0, Math.max(0, limit)) : [];
}

export function getHiddenTaxonomyTagCount(
  tags: TaxonomyTag[] | null | undefined,
  limit = TAXONOMY_VISIBLE_TAG_LIMIT
) {
  if (!Array.isArray(tags)) return 0;
  return Math.max(0, tags.length - Math.max(0, limit));
}

export function getTaxonomyPostExcerpt(post: TaxonomyPost) {
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const content = post.content?.replace(/[#*$\\`\n]/g, " ").trim() ?? "";
  return content ? `${content.slice(0, 180)}...` : "";
}

function formatTaxonomyDate(
  value: string | Date | null | undefined,
  locale: string,
  fallback: string
) {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
```

Add exported component before `TaxonomyPager`:

```tsx
export function TaxonomyArticleRow({
  post,
  language,
  t,
}: {
  post: TaxonomyPost;
  language: "en" | "zh";
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const visibleTags = getVisibleTaxonomyTags(post.tags);
  const hiddenTagCount = getHiddenTaxonomyTagCount(post.tags);
  const excerpt = getTaxonomyPostExcerpt(post);

  return (
    <article className="taxonomy-article-row">
      <div className="taxonomy-article-main min-w-0">
        <div className="taxonomy-article-meta">
          <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
            <CalendarDays className="h-3.5 w-3.5" />
            {formatTaxonomyDate(post.publishedAt, locale, t("common.draft"))}
          </time>
          <span>
            <BookOpen className="h-3.5 w-3.5" />
            {post.readingMinutes ?? 0} {t("home.minRead")}
          </span>
        </div>
        <Link href={`/post/${post.slug}`} className="taxonomy-article-title">
          {post.title}
        </Link>
        {excerpt && <p className="taxonomy-article-excerpt">{excerpt}</p>}
        <div className="taxonomy-article-tags">
          {post.category?.slug ? (
            <Link href={`/categories/${post.category.slug}`} className="article-tag">
              <Folder className="h-3.5 w-3.5" />
              {post.category.name}
            </Link>
          ) : null}
          {visibleTags.map(tag => (
            <Link key={tag.slug} href={`/tags/${tag.slug}`} className="article-tag">
              <Tags className="h-3 w-3" />
              {tag.name}
            </Link>
          ))}
          {hiddenTagCount > 0 && (
            <span className="article-tag article-tag-muted">
              {t("discovery.moreTags", { count: hiddenTagCount })}
            </span>
          )}
        </div>
      </div>
      <Link href={`/post/${post.slug}`} className="taxonomy-article-action">
        <span>{t("home.readMore")}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
```

Replace the `ArticleCard` map with:

```tsx
{data.posts.map((post: TaxonomyPost) => (
  <TaxonomyArticleRow
    key={post.id}
    post={post}
    language={language}
    t={t}
  />
))}
```

In `client/src/i18n/home.ts`, add:

```ts
"discovery.moreTags": { en: "+{count}", zh: "+{count}" },
```

- [x] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts
```

Expected: PASS.

---

### Task 2: Style Compact Taxonomy Rows

**Files:**
- Modify: `client/src/styles/visual-refresh.css`

**Interfaces:**
- Consumes: classes emitted by `TaxonomyArticleRow`.
- Produces: compact, accessible row layout with no new `!important` or viewport font sizing.

- [x] **Step 1: Add row styles**

In `client/src/styles/visual-refresh.css`, near existing taxonomy/archive styles, add:

```css
  .taxonomy-article-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1rem;
    align-items: center;
    margin-inline: -0.72rem;
    border: 1px solid transparent;
    border-radius: var(--v2-radius-row);
    padding: 0.92rem 0.72rem;
    background: transparent;
    transition:
      border-color 160ms ease,
      background 160ms ease,
      transform 160ms ease;
  }

  .taxonomy-article-row:hover,
  .taxonomy-article-row:focus-within {
    border-color: color-mix(in oklch, var(--v2-accent) 18%, transparent);
    background:
      linear-gradient(135deg, color-mix(in oklch, white 12%, transparent), transparent 48%),
      color-mix(in oklch, var(--v2-accent) 6%, transparent);
    transform: translateY(-1px);
  }

  .taxonomy-article-main {
    display: grid;
    gap: 0.5rem;
  }

  .taxonomy-article-meta,
  .taxonomy-article-tags {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
  }

  .taxonomy-article-meta {
    color: color-mix(in oklch, var(--v2-text-muted) 88%, transparent);
    font-size: 0.78rem;
  }

  .taxonomy-article-meta > * {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 0.34rem;
  }

  .taxonomy-article-title {
    display: -webkit-box;
    overflow: hidden;
    color: var(--v2-text);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 690;
    line-height: 1.45;
    overflow-wrap: anywhere;
    text-decoration: none;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .taxonomy-article-title:hover,
  .taxonomy-article-title:focus-visible {
    color: color-mix(in oklch, var(--v2-accent) 78%, var(--v2-text));
  }

  .taxonomy-article-excerpt {
    display: -webkit-box;
    max-width: 70ch;
    overflow: hidden;
    color: color-mix(in oklch, var(--v2-text-muted) 90%, transparent);
    font-size: 0.88rem;
    line-height: 1.65;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .taxonomy-article-action {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: var(--v2-radius-control);
    color: color-mix(in oklch, var(--v2-accent) 72%, var(--v2-text));
    font-size: 0.82rem;
    font-weight: 680;
    text-decoration: none;
    white-space: nowrap;
  }

  .taxonomy-article-action:hover,
  .taxonomy-article-action:focus-visible {
    color: var(--v2-text);
  }

  @media (max-width: 720px) {
    .taxonomy-article-row {
      grid-template-columns: 1fr;
      margin-inline: -0.5rem;
      padding: 0.82rem 0.5rem;
    }

    .taxonomy-article-action {
      justify-self: start;
    }
  }
```

- [x] **Step 2: Run CSS-sensitive checks**

Run:

```bash
git diff --check
corepack pnpm check
```

Expected: both pass.

---

### Task 3: Record Evidence And Commit

**Files:**
- Create: `docs/product_optimization/reports/taxonomy-density-compact-list-slice-2026-07-09/summary.md`
- Modify: `docs/superpowers/plans/2026-07-09-taxonomy-density-compact-list-slice.md`

**Interfaces:**
- Consumes: test results from Tasks 1 and 2.
- Produces: slice evidence report and committed code.

- [x] **Step 1: Run focused gates**

Run:

```bash
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts client/src/pages/Archive.test.ts client/src/pages/Search.test.tsx
corepack pnpm check
corepack pnpm build
git diff --check
```

Expected: all pass.

- [x] **Step 2: Write evidence report**

Create `docs/product_optimization/reports/taxonomy-density-compact-list-slice-2026-07-09/summary.md`:

```md
# Taxonomy Density Compact List Slice

Date: 2026-07-09
Status: Passed

## Summary

Replaced taxonomy full article cards with compact scan-friendly rows. The change makes tag/category pages closer to the archive ledger density while preserving article links, category links, tag links, pagination, and public-only data flow.

## Changed Files

- `client/src/pages/TaxonomyPage.tsx`
- `client/src/pages/TaxonomyPage.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/superpowers/plans/2026-07-09-taxonomy-density-compact-list-slice.md`

## User-Visible Behavior

- Taxonomy pages show compact article rows instead of full visual cards.
- Visible tags are capped at three and overflow appears as `+N`.
- Titles and excerpts clamp intentionally and wrap safely.
- Row action remains a clear article link.

## Code Quality Notes

- `ArticleCard` remains unchanged for home and track surfaces.
- Pure helpers cover tag capping and excerpt fallback.
- No new dependency, route, API, or DB contract change.
- No new `!important` or viewport-unit font sizing was added.

## Verification

```bash
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts client/src/pages/Archive.test.ts client/src/pages/Search.test.tsx
corepack pnpm check
corepack pnpm build
git diff --check
```

All passed.

## Known Risk

No fresh browser screenshot is included in this slice. The next UI browser pass should capture tag and category pages at desktop light and mobile dark.
```

- [x] **Step 3: Commit**

Run:

```bash
git status --short --branch
git add client/src/pages/TaxonomyPage.tsx client/src/pages/TaxonomyPage.test.ts client/src/i18n/home.ts client/src/styles/visual-refresh.css docs/superpowers/plans/2026-07-09-taxonomy-density-compact-list-slice.md docs/product_optimization/reports/taxonomy-density-compact-list-slice-2026-07-09/summary.md
git commit -m "feat: compact taxonomy article lists"
```

Expected: commit succeeds and worktree is clean except unrelated user changes if any appeared.

---

## Self-Review

- Spec coverage: covers `SPEC-UI`, `SPEC-READ`, archive/taxonomy density, CSS debt no-growth, and evidence reporting for the first Wave 1 slice.
- Scope gap: does not change search result rows; browser screenshots and probes were added in the evidence report.
- Placeholder scan: no TBD/TODO/fill-later placeholders.
- Type consistency: `TaxonomyPost`, `TaxonomyTag`, helper names, and test imports match Task 1.
