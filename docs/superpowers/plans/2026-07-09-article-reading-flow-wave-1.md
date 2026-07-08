# Article Reading Flow Wave 1 Plan

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-08-article-reading-rendering-design.md`

## Scope

Implement the next article detail slice: make the reading body arrive sooner, move support actions to the right moment, and keep the completion path useful without crowding the article.

## Goals

- Remove the pre-body Agent prompt block from the article header flow.
- Keep the article entry guide to one compact primary reading claim before the body.
- Add a post-body reading handoff with next-reading links and the two existing Agent prompts.
- Use pure helper logic for completion links so ordering is deterministic and testable.
- Keep visual treatment low-glare in light and dark mode with no horizontal overflow.

## Non-Goals

- No article content rewrite.
- No markdown renderer, retrieval, Agent, auth, database, or route contract changes.
- No new dependency.
- No redesign of Search, Archive, Home, or Track pages in this slice.

## Intended Files

- `client/src/pages/PostDetail.tsx`
- `client/src/pages/PostDetail.test.ts`
- `client/src/i18n/post.ts`
- `client/src/styles/visual-refresh.css`
- `docs/product_optimization/reports/article-reading-flow-wave-1-2026-07-09/summary.md`

## Implementation Steps

1. [x] Add a pure `buildArticleCompletionLinks` helper and tests for series, post-next, track, related, and duplicate handling.
2. [x] Remove the header Agent prompt block and compute completion links from existing post context.
3. [x] Add an after-prose `article-reading-handoff` section before share/feedback.
4. [x] Add concise Chinese/English copy for the handoff labels.
5. [x] Add final-layer CSS for the handoff and remove pre-body Agent prompt re-expansion from the liquid layer.
6. [x] Capture desktop/mobile and light/dark screenshots for the article route.
7. [x] Run focused tests, type check, content audit, build, and UI audit.

## Verification Commands

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

## Risks

- Adding a completion block can duplicate footer navigation. Keep it compact and action-oriented.
- Agent prompt copy can feel promotional if placed before the article. Keep prompts after the body.
- Related links can repeat the primary next item. Deduplicate by slug in the helper.

## Result

- Shipped in commit `f10b6ce`.
- Evidence report: `docs/product_optimization/reports/article-reading-flow-wave-1-2026-07-09/summary.md`.
- Browser probes: `docs/product_optimization/reports/article-reading-flow-wave-1-2026-07-09/playwright-probes.json`.

## Verification

- `corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/i18n/copyVoice.test.ts` passed: 45 files, 276 tests.
- `corepack pnpm check` passed.
- `corepack pnpm content:audit` passed with 0 failures, 0 warnings, and 1 existing non-blocking suggestion.
- `corepack pnpm build` passed.
- `corepack pnpm audit:ui` passed.
