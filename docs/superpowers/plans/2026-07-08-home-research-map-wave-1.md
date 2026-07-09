# Home Research Map Wave 1 Plan

Date: 2026-07-08
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-08-product-optimization-spec-review-package.md`

## Scope

Implement the first code slice after spec approval. This slice belongs to Wave 1: Public Visual Contract, focused only on the homepage research map.

## Goals

- Make the homepage read as a navigable personal AI research archive in the first viewport.
- Add factual map metadata derived from public posts and public series.
- Make both tracks show concept cues, not just title/excerpt/card chrome.
- Preserve the single search entry and existing routes.
- Keep the implementation additive and local to homepage/i18n/styles/tests.

## Non-Goals

- No Track/Search/Archive implementation in this slice.
- No API, DB, auth, Agent, or publish-flow changes.
- No new dependency.
- No large CSS rewrite.
- No hidden/draft/admin content exposure.

## Intended Files

- `client/src/pages/Home.tsx`
- `client/src/pages/Home.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/product_optimization/reports/home-research-map-wave-1-2026-07-08/summary.md`

## Implementation Steps

1. Add a pure homepage helper for research-map summary counts.
2. Add a compact map summary in the intro rail using public note count, reading path count, and track count.
3. Add topic chips to each track panel using existing `trackConfigs` focus/chip keys.
4. Tighten CSS for the new map summary and topic chip rows in light/dark modes.
5. Extend `Home.test.ts` for map summary counts and topic key selection.
6. Run focused tests, type check, build, content audit, and UI audit.
7. Write a short evidence report and commit the slice.

## Verification Commands

```bash
corepack pnpm test -- client/src/pages/Home.test.ts client/src/lib/tracks.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

## Risks

- Homepage first viewport can become crowded. Keep the map summary compact.
- Chinese labels can overflow. Use wrapping chips and `min-width: 0`.
- CSS final layer can be overridden. Put new rules in the public convergence layer of `visual-refresh.css`.
