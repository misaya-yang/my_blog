# Track Reading Paths Wave 1 - 2026-07-08

## Scope

Implemented the second approved Wave 1 Discovery slice. This slice makes `/algorithms` and `/applications` behave more like guided reading maps while preserving existing public route and data contracts.

## Changed Files

- `client/src/pages/Track.tsx`
- `client/src/pages/Track.test.ts`
- `client/src/i18n/home.ts`
- `client/src/styles/visual-refresh.css`
- `docs/superpowers/plans/2026-07-08-track-reading-paths-wave-1.md`
- `docs/product_optimization/reports/ui-layout-checks-latest.json`

## User-Visible Behavior

- Track headers now include a compact orientation strip:
  - Start here
  - Core paths
  - Recent notes
- Each orientation item links to the first public path article, the reading path section, or the full note index.
- Reading path cards now show `Next planned` topic chips from existing `expectedNextKeys`.
- Mobile track pages keep the orientation strip single-column and avoid horizontal overflow.

## Evidence

Screenshots:

- `docs/product_optimization/reports/track-reading-paths-wave-1-2026-07-08/algorithms-desktop-light.png`
- `docs/product_optimization/reports/track-reading-paths-wave-1-2026-07-08/algorithms-mobile-dark.png`
- `docs/product_optimization/reports/track-reading-paths-wave-1-2026-07-08/applications-desktop-light.png`
- `docs/product_optimization/reports/track-reading-paths-wave-1-2026-07-08/applications-mobile-dark.png`

Targeted browser probe:

```json
[
  {
    "route": "/algorithms",
    "orientationItems": 3,
    "seriesCards": 4,
    "plannedGroups": 4,
    "plannedChips": 8,
    "documentClientWidth": 1440,
    "documentScrollWidth": 1440,
    "orientationWidth": 928,
    "viewportWidth": 1440
  },
  {
    "route": "/algorithms",
    "orientationItems": 3,
    "seriesCards": 4,
    "plannedGroups": 4,
    "plannedChips": 8,
    "documentClientWidth": 390,
    "documentScrollWidth": 390,
    "orientationWidth": 342,
    "viewportWidth": 390
  },
  {
    "route": "/applications",
    "orientationItems": 3,
    "seriesCards": 1,
    "plannedGroups": 1,
    "plannedChips": 2,
    "documentClientWidth": 1440,
    "documentScrollWidth": 1440,
    "orientationWidth": 928,
    "viewportWidth": 1440
  },
  {
    "route": "/applications",
    "orientationItems": 3,
    "seriesCards": 1,
    "plannedGroups": 1,
    "plannedChips": 2,
    "documentClientWidth": 390,
    "documentScrollWidth": 390,
    "orientationWidth": 342,
    "viewportWidth": 390
  }
]
```

UI audit:

- `corepack pnpm audit:ui` passed.
- Latest metrics are stored in `docs/product_optimization/reports/ui-layout-checks-latest.json`.

## Verification Commands

```bash
git diff --check
corepack pnpm test -- client/src/pages/Track.test.ts client/src/lib/tracks.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

Results:

- Vitest passed: 42 files, 267 tests.
- TypeScript check passed.
- Content audit passed: 9 article files, 0 warnings, 0 failures.
- Build passed.
- UI layout audit passed.

## Known Deferred Work

- Search recovery and archive density remain in later Discovery slices.
- Owner-only gap visibility for planned series topics is not exposed in this public slice.
