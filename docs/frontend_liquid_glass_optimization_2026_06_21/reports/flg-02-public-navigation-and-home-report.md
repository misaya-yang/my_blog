# FLG-02 Public Navigation And Home Report

**Date:** 2026-06-21

**Feature:** FLG-F003

**Status:** Passing

## Summary

FLG-02 applied the compact Liquid Glass material vocabulary to public navigation, home, track, archive, search, taxonomy, about, login, and NotFound pages. The implementation keeps `liquid-materials.css` at 258 lines and places page-level polish in `visual-refresh.css`, avoiding another broad material cascade.

Two visual regressions were found and fixed during screenshot review:

- Home desktop `Start here` actions first compressed the copy, then overflowed the panel. It now uses a stable copy block with a three-segment dock below it.
- Taxonomy desktop pages had a large blank left column because the right rail pushed the note list below the whole overview. They now use a `hero / notes / side` grid so notes follow the hero while the rail stays on the right.

## Files Changed

- `client/src/components/ResearchShell.tsx`: added `liquid-nav`, `liquid-panel`, and shared `Surface` material adoption.
- `client/src/components/ArticleCard.tsx`: article cards now opt into `liquid-surface`.
- `client/src/components/SubscriptionForm.tsx`: non-embedded shell now uses `liquid-panel`.
- `client/src/pages/Home.tsx`: bento surfaces, search dock, Start here, latest note, empty states, track panels, and More notes use material classes.
- `client/src/pages/Track.tsx`: track series and article ledger use material surfaces; empty track state uses shared `EmptyState`.
- `client/src/pages/Archive.tsx`: archive rows use `archive-post-row liquid-surface`.
- `client/src/pages/Search.tsx`: search dock and result rows use material surfaces; no-hit state remains readable.
- `client/src/pages/TaxonomyPage.tsx`: taxonomy page now has `taxonomy-layout`, `taxonomy-hero`, `taxonomy-side-panel`, and `taxonomy-notes-surface`.
- `client/src/pages/About.tsx`, `client/src/pages/Login.tsx`, `client/src/pages/NotFound.tsx`: public utility pages use `liquid-panel`.
- `client/src/styles/visual-refresh.css`: added the FLG-02 page-scoped public adoption layer, container-query behavior, taxonomy grid, row containment, reduced preference safeguards, and responsive fixes.
- `docs/frontend_liquid_glass_optimization_2026_06_21/*`: updated FLG-02 evidence, oracle, progress, ledger, source packet, and handoff.

## Technique Notes

- Official frontend references were mapped to implementation choices:
  - [MDN `@supports`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40supports) for progressive feature handling inherited from the material foundation.
  - [MDN `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix) for restrained graphite/aqua/mint material blending.
  - [MDN container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) for local card and panel responsiveness.
  - [MDN `content-visibility`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility) was evaluated, then rejected for public content rows in this phase because full-page screenshots showed delayed offscreen rendering as blank article areas. `contain: paint` is used instead.
- No dependency was added.
- No route, tRPC, database, auth, analytics, SEO, or content contract changed.

## Command Evidence

```bash
python3 /Users/yang/.codex/skills/prd-phase-harness/scripts/validate_harness_prd.py docs/frontend_liquid_glass_optimization_2026_06_21 --strict --quality-score
```

Result: passed. Quality score: 100 (excellent).

```bash
pnpm check
```

Result: passed.

```bash
pnpm test
```

Result: passed. Vitest reported 40 passed test files and 254 passed tests.

```bash
pnpm build
```

Result: passed. Vite and server bundle completed.

```bash
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui
```

Result: passed. Report path: `docs/product_optimization/reports/ui-layout-checks-latest.json`.

```bash
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick
```

Result: passed. Output reported 14 route checks, 0 skipped routes, 0 known gaps, and 0 command failures.

## Browser Evidence

Screenshots and metrics captured under `.cache/flg-02-qa/`.

Matrix:

- Routes: `/`, `/algorithms`, `/applications`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/tags/agent-systems`, `/categories/ai-applications`, `/about`, `/login`, `/404`.
- Viewports: 390x844, 768x1024, 1440x1000, 1728x1117.
- Total screenshots: 40.
- Automated failures: 0.

Measured checks:

- Maximum header height: 72px.
- Maximum horizontal overflow delta: 0px.
- Minimum Liquid surfaces per sampled route: 2.
- Home mobile and desktop Start here actions fit without compression or overflow.
- Taxonomy desktop hero-to-notes gap after grid fix: 36px.
- Reduced transparency: sampled Liquid panel/header `backdrop-filter` computed to `none`.
- Keyboard focus: first Tab lands on the brand link with visible solid outline.
- Reduced motion: sampled material transition duration reduced to `1e-05s`.

## Acceptance Gates

- Public routes share material language through shared components and page-scoped classes: passed.
- Home first screen uses an asymmetric bento with clear next action: passed.
- Discovery pages have clear empty/no-hit states and no duplicate CTA intent: passed.
- Screenshots cover all required public routes and viewports: passed.
- Feature oracle FLG-F003 updated: passed.

## Handoff

FLG-03 should now focus on the reader and agent companion. Shared public components already provide material defaults, so reader work should add reader-specific opacity and readability safeguards rather than broadening the material foundation.
