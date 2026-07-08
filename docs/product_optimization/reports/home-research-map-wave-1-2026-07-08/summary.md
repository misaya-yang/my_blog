# Home Research Map Wave 1 - 2026-07-08

## Scope

Implemented the first approved code slice from Wave 1 of the product optimization review package. This slice only changes the homepage research-map experience.

## Changed Files

- `client/src/pages/Home.tsx`
- `client/src/pages/Home.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/superpowers/plans/2026-07-08-home-research-map-wave-1.md`
- `docs/product_optimization/reports/ui-layout-checks-latest.json`

## User-Visible Behavior

- Homepage intro now shows a compact notebook structure summary:
  - 2 tracks
  - 5 reading paths
  - 8 public notes
- Track panels now show concept chips derived from existing track config:
  - Algorithms: Transformer Architecture, Large Language Model, Position Encoding
  - Applications: Agent Systems, Harness Engine, RAG & Retrieval
- Application fallback path title no longer reuses the algorithm fallback.
- Mobile track panels collapse to a single column so long Chinese article titles no longer become vertical text.

## Evidence

Screenshots:

- `docs/product_optimization/reports/home-research-map-wave-1-2026-07-08/home-desktop-light.png`
- `docs/product_optimization/reports/home-research-map-wave-1-2026-07-08/home-mobile-dark.png`

Targeted browser probe:

```json
{
  "desktop": {
    "mapItems": 3,
    "topicChips": 6,
    "documentClientWidth": 1440,
    "documentScrollWidth": 1440
  },
  "mobile": {
    "mapItems": 3,
    "topicChips": 6,
    "documentClientWidth": 390,
    "documentScrollWidth": 390,
    "spreadClientWidth": 390,
    "spreadScrollWidth": 390,
    "trackColumns": ["358px", "358px"],
    "tallestTrackLink": 73.59375,
    "narrowestTrackLink": 358
  }
}
```

UI audit:

- `corepack pnpm audit:ui` passed.
- Latest metrics are stored in `docs/product_optimization/reports/ui-layout-checks-latest.json`.
- Home mobile `documentScrollWidth` equals `viewportWidth` at 390px.
- Home desktop `documentScrollWidth` equals `viewportWidth` at 1440px.

## Verification Commands

```bash
git diff --check
corepack pnpm test -- client/src/pages/Home.test.ts client/src/lib/tracks.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

Results:

- Vitest passed: 41 files, 265 tests.
- TypeScript check passed.
- Content audit passed: 9 article files, 0 warnings, 0 failures.
- Build passed.
- UI layout audit passed.

## Known Deferred Work

- Track pages still need their own reading-path pass.
- Search and archive retrieval surfaces are not changed in this slice.
- The homepage screenshots were captured from the current local development theme state; later visual QA should capture explicit light/dark route states across more pages.
