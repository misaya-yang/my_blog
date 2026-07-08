# Search Archive Retrieval Wave 1 Plan

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-08-discovery-research-map-design.md`

## Scope

Implement the next Wave 1 Discovery slice: make search and archive work as retrieval surfaces, not passive result dumps.

## Goals

- Replace dark-only search highlights with theme-safe semantic highlighting.
- Give empty `/search` a compact start panel with nearby topics and reading paths.
- Keep zero-result recovery focused on nearby topics, archive, and the reading assistant.
- Add an archive summary strip so readers can understand total notes and month coverage before scanning rows.
- Keep all search/archive API contracts, routing, auth, database schema, and retrieval behavior unchanged.

## Non-Goals

- No server ranking changes.
- No Agent prompt or retrieval quality changes.
- No new dependency.
- No new route or DB migration.
- No broad redesign outside Search, Archive, i18n, CSS, tests, and evidence report.

## Intended Files

- `client/src/pages/Search.tsx`
- `client/src/pages/Search.test.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/pages/Archive.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/product_optimization/reports/search-archive-retrieval-wave-1-2026-07-09/summary.md`

## Implementation Steps

1. [x] Add pure search highlight tokenization and test it.
2. [x] Add a no-query search start panel using existing recovery topics and track/archive links.
3. [x] Move search row colors to semantic classes and prevent long excerpts from causing overflow.
4. [x] Add pure archive summary calculation and test it.
5. [x] Add a compact archive summary strip before the timeline.
6. [x] Add final-layer public CSS for search start, highlights, result rows, archive summary, and mobile reflow.
7. [x] Capture search and archive screenshots in light/dark and desktop/mobile.
8. [x] Run focused tests, type check, content audit, build, and UI audit.

## Verification Commands

```bash
corepack pnpm test -- client/src/pages/Search.test.tsx client/src/pages/Archive.test.ts client/src/pages/searchRecovery.test.ts server/discovery.router.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

## Risks

- Search start content can become another hero. Keep it inside the results surface and action-oriented.
- Highlight color can become glare in light mode. Use muted inline background and semantic text tokens.
- Archive rows can crowd on mobile. Keep dates, title, and metadata stacked with no horizontal scroll.

## Result

- Shipped in commit `f1eb4c3`.
- Evidence report: `docs/product_optimization/reports/search-archive-retrieval-wave-1-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/pages/Search.test.tsx client/src/pages/Archive.test.ts client/src/pages/searchRecovery.test.ts server/discovery.router.test.ts client/src/i18n/copyVoice.test.ts` passed: 44 files, 272 tests.
- `corepack pnpm check` passed.
- `corepack pnpm content:audit` passed with 0 warnings and 0 failures.
- `corepack pnpm build` passed.
- `corepack pnpm audit:ui` passed.
- `git diff --check` passed.
