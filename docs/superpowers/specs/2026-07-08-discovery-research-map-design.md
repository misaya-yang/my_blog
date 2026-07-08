# Discovery And Research Map Design

Date: 2026-07-08
Status: Proposed
Parent spec: [Reading and writing loop optimization](./2026-07-08-reading-writing-loop-optimization-design.md)

## Summary

The public entry points should make the blog feel like a navigable personal AI research archive, not a set of generic article lists. The homepage, track pages, search, archive, tags, and categories should answer three reader questions quickly:

1. What is this site about?
2. Where should I start for my current level or interest?
3. What should I read next after this result?

This spec complements the visual, article, Agent, owner cockpit, and content quality specs. It focuses on discovery and information architecture.

## Goals

- Turn the homepage into a research map with clear entry routes.
- Make track pages explain the algorithm and application tracks as reading paths.
- Make search results useful even when results are weak or empty.
- Make archive, tags, and categories feel like structured retrieval surfaces rather than fallback pages.
- Keep the current route structure and public content boundaries.
- Feed search misses and repeated questions into the reader signal backlog.

## Non-Goals

- No new public user account system.
- No recommendation algorithm based on private user identity.
- No new analytics vendor.
- No public autonomous Agent workspace.
- No route migration or slug migration.
- No database schema migration in the first implementation slice.

## Current Files

Primary public routes:

- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/Search.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/pages/TaxonomyPage.tsx`
- `client/src/pages/PostDetail.tsx`

Shared public components:

- `client/src/components/ResearchShell.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/components/SubscriptionForm.tsx`
- `client/src/components/ArticleFeedback.tsx`

Discovery data and routing:

- `client/src/lib/tracks.ts`
- `client/src/i18n/home.ts`
- `client/src/i18n/discovery.ts`
- `server/discovery.ts`
- `server/discovery.router.ts`
- `server/searchMisses.ts`
- `shared/content-series.ts`
- `shared/metadata.ts`

Related existing tests:

- `client/src/pages/Home.test.ts`
- `client/src/components/ResearchShell.test.tsx`
- `client/src/lib/tracks.test.ts`
- `server/discovery.test.ts`
- `server/discovery.router.test.ts`

## Product Model

The discovery system should use five stable concepts:

```ts
type DiscoverySurface =
  | "home"
  | "track"
  | "search"
  | "archive"
  | "taxonomy"
  | "article_related";

type DiscoveryIntent =
  | "start"
  | "continue_series"
  | "compare_tracks"
  | "find_topic"
  | "recover_empty_search"
  | "deep_read";

type ResearchMapNode = {
  id: string;
  kind: "track" | "series" | "concept" | "article" | "gap";
  label: string;
  summary: string;
  href?: string;
  track?: "algorithms" | "applications";
  articleSlugs?: string[];
  evidence?: string[];
};
```

Rules:

- The model is conceptual first. Do not create a public API until the implementation needs one.
- Prefer deriving map nodes from `shared/content-series.ts`, public posts, tags, and categories before adding new storage.
- Hidden, draft, private, or admin-only content must never appear in public map nodes.
- Search misses can become `gap` nodes only inside owner tools, not public pages.

## Homepage Contract

The homepage should be the product map, not a marketing hero.

First viewport:

- Shows the site identity clearly: personal AI systems research archive.
- Shows the two primary tracks: AI Algorithms and AI Applications.
- Offers one search entry, not multiple competing search-like controls.
- Shows one latest or recommended note, not a dense dashboard.
- Leaves a hint of the next section below the fold on desktop and mobile.

Research map section:

- Shows the two tracks as paths with distinct promises.
- Each track includes the strongest active series and 1-2 representative posts.
- Each path has a clear next action: read track, start series, or search topic.
- Metadata is factual: post count, latest update, series count, concept tags.

Avoid:

- Equal-weight cards for every feature.
- Fake metrics or decorative AI badges.
- Large gradients, glow blocks, and generic "powerful AI" language.
- More than one primary CTA in the first viewport.

## Track Page Contract

Track pages should be guided reading maps.

Header:

- Track title and short thesis.
- 3 compact topic chips.
- Reader orientation: "Start here", "Core series", "Recent notes".

Series section:

- Group posts by public series.
- Show sequence order when `seriesOrder` exists.
- Show expected next topics from `TrackSeriesConfig.expectedNextKeys`.
- Show missing series gaps only to owner tools, not public readers.

Article list:

- Default order should prefer series coherence and freshness.
- Each article card shows track, series, publish date, and a concise promise.
- Repeated metadata should be visually quieter than title and excerpt.

Mobile:

- Track orientation must appear before long lists.
- Topic chips wrap without horizontal overflow.
- Article cards remain scan-friendly with title, excerpt, and one metadata row.

## Search Contract

Search should behave like retrieval, not just a form.

With query and results:

- Search term remains visible and editable.
- Results show title, excerpt, track, series, publish date, and matched terms.
- The first result should not be buried under a large hero.
- Result count should be present but visually secondary.
- Highlighting must work in light and dark mode with readable contrast.

With no query:

- Show latest public notes and suggested topics.
- Offer track entry points.
- Avoid an empty "search page" feel.

With zero results:

- Keep the query visible.
- Offer nearby concepts based on track topics and content-series concepts.
- Offer "ask the article assistant" only if the Agent can answer from public corpus.
- Record a sanitized search miss through existing search miss flow.
- Do not claim the topic is absent from the author's work unless verified.

Slow search:

- After a short delay, show recovery topics without shifting the layout heavily.
- Do not block the input or submit button.

## Archive And Taxonomy Contract

Archive:

- Works as a chronological research ledger.
- Groups by year/month or track where useful.
- Shows publish date, title, track, and series.
- Avoid decorative cards for every row.

Tags and categories:

- Explain the selected tag/category in one sentence when copy exists.
- Show related tracks and series.
- De-emphasize repeated tag chips inside every item.
- Include a path back to search and archive.

## Article Related Discovery

Article pages should support continuation without distracting from reading.

After or beside the article:

- Show previous and next item in the same series when available.
- Show 2-4 related posts based on series, category, and tags.
- Show prerequisites only when the relation is explicit or highly likely.
- Let Agent follow-up prompts reference the current article and nearby series.

Do not:

- Add a large recommendation carousel.
- Show unrelated "popular" items without signal.
- Push feedback/subscription above related reading unless the article is finished.

## UI Requirements

- Use semantic tokens from the UI visual contract.
- Avoid dark-only assumptions in search highlight styles.
- No page-level horizontal overflow at 390px width.
- Cards should be used for repeated items only; page sections should be full-width bands or unframed layouts.
- Buttons should use icons for search, route, archive, and next actions where meaningful.
- Text must not rely on viewport-width font scaling.
- Chinese and English labels must fit in the same containers.

## Signal Integration

Discovery should create or contribute to reader signals:

- Zero-result search.
- Repeated search term with weak result engagement.
- Track concept with no public article.
- Series gap where configured expected topics have no article.
- Article page follow-up clicks that repeatedly ask for prerequisite concepts.

First pass signal output can be aggregated in code without schema migration. The owner cockpit spec defines the normalized `ReaderSignal` shape.

Privacy rules:

- Do not store raw personal identifiers.
- Do not persist private pasted Agent context.
- Do not expose search miss lists publicly.
- Store only sanitized query text and aggregate counts where possible.

## Implementation Slices

### Slice A: Discovery Copy And Layout Audit

Deliverables:

- Inventory public discovery pages and their first viewport content.
- Identify duplicated hero/search/track controls.
- Add screenshots for desktop and mobile homepage, search, track, and archive.
- Produce a short evidence report under `docs/product_optimization/reports/`.

Checks:

```bash
corepack pnpm audit:ui
corepack pnpm check
```

### Slice B: Homepage Research Map

Deliverables:

- Reduce first viewport competition.
- Make track cards read as paths, not generic feature cards.
- Surface primary series and representative posts.
- Keep admin manage shortcut only for authenticated owner state.

Checks:

```bash
corepack pnpm test -- client/src/pages/Home.test.ts client/src/lib/tracks.test.ts
corepack pnpm check
corepack pnpm audit:ui
```

### Slice C: Track Page Reading Paths

Deliverables:

- Group public posts by series where possible.
- Add start-here and next-topic affordances.
- Keep hidden/draft boundaries unchanged.
- Add tests for series ordering and fallback article ordering.

Checks:

```bash
corepack pnpm test -- client/src/lib/tracks.test.ts server/discovery.test.ts
corepack pnpm check
```

### Slice D: Search Recovery And Archive Density

Deliverables:

- Improve zero-result recovery without large placeholder blocks.
- Fix light/dark search highlighting.
- Make archive/taxonomy rows denser and more readable.
- Ensure search miss tracking stays sanitized.

Checks:

```bash
corepack pnpm test -- server/discovery.router.test.ts
corepack pnpm check
corepack pnpm audit:ui
```

## Acceptance Checklist

- Homepage communicates the research map in the first viewport.
- Track pages make the next reading step obvious.
- Search results are readable in light and dark mode.
- Zero-result search gives useful recovery actions.
- Archive and taxonomy pages feel like retrieval surfaces, not leftovers.
- No public hidden/draft content leak.
- No page-level horizontal overflow at mobile widths.
- Search misses can feed the owner signal backlog.
- Browser evidence exists for desktop and mobile.
