# Track Reading Paths Wave 1 Plan

Date: 2026-07-08
Status: In progress
Spec source: `docs/superpowers/specs/2026-07-08-discovery-research-map-design.md`

## Scope

Implement the second Wave 1 Discovery slice: make track pages behave more like guided reading maps.

## Goals

- Add a compact track orientation strip: start note, reading paths, and all notes.
- Surface expected next topics from existing `TrackSeriesConfig.expectedNextKeys`.
- Keep public series filtering and hidden/draft boundaries unchanged.
- Keep edits local to track page, i18n, CSS, tests, plan, and evidence report.

## Non-Goals

- No search/archive changes in this slice.
- No data model, route, API, DB, Agent, or auth changes.
- No new dependency.
- No change to article card contract.

## Intended Files

- `client/src/pages/Track.tsx`
- `client/src/pages/Track.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/product_optimization/reports/track-reading-paths-wave-1-2026-07-08/summary.md`

## Implementation Steps

1. Add pure helpers for start slug and track path stats.
2. Add orientation links in the track header.
3. Add expected-next topic chips to series cards.
4. Add CSS in the final public visual layer.
5. Add focused tests for helper behavior.
6. Capture `/algorithms` and `/applications` screenshots at desktop/mobile.
7. Run tests, type check, build, content audit, and UI audit.

## Verification Commands

```bash
corepack pnpm test -- client/src/pages/Track.test.ts client/src/lib/tracks.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

## Risks

- Too many chips can crowd mobile. Limit visible next-topic chips to two per path.
- Track page can become decorative again. Keep orientation strip dense and functional.
- Start links must not point to hidden or planned-only articles. Use `getPublicTrackSeries` output only.
