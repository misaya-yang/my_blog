# MNUI-01 Design Tokens And Shared Primitives Report

**Status:** passed

**Feature oracle item:** MNUI-F002

**Generated:** 2026-06-18

## Plan Followed

1. Loaded MNUI-01 primary context, including MNUI-00 evidence, design tokens, component references, and current shared UI wrappers.
2. Implemented token aliases and primitive styles without changing routes, dependency list, or existing component exports.
3. Expanded the edit boundary to `client/src/styles/public-components.css` only to keep base `.brand-mark` dimensions compatible with the new BrandMark size prop.
4. Ran required validation and captured browser evidence for desktop, mobile, focus, and reduced-motion states.
5. Recorded component contract matrix, font/network policy, rollback notes, and MNUI-02 handoff.

## Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/index.css` | Added Misaya design-token aliases for color, typography weights, radius, shadows, motion, layout, glass, semantic, and focus states. |
| `client/src/styles/visual-refresh.css` | Routed brand mark, nav, glass panels, glass buttons, search fields, track cards, and article tags through the shared design tokens. |
| `client/src/styles/public-components.css` | Boundary expansion: aligned base `.brand-mark` size with `--brand-mark-size`. |
| `client/src/components/ResearchShell.tsx` | Expanded `BrandMark` with additive `size` and `withWordmark` props and replaced the text glyph with the notebook glyph direction from the design system. |
| `client/src/components/ui/button.tsx` | Aligned button variants/sizes with tokenized cobalt, glass, focus, shadow, and press states; added additive `glass` variant. |
| `client/src/components/ui/card.tsx` | Aligned Card surface radius, border, shadow, title weight, and description rhythm with the glass panel system. |
| `client/src/components/ui/input.tsx` | Preserved IME behavior; added additive `icon`, `iconClassName`, and `wrapperClassName` props; aligned dark glass/focus states. |
| `client/src/components/ui/textarea.tsx` | Preserved IME behavior; aligned dark glass/focus states and composer sizing. |
| `client/src/components/ui/badge.tsx` | Added additive `accent` variant; aligned badge radius and quiet metadata states. |
| `client/src/components/ui/avatar.tsx` | Aligned Avatar border, fallback typography, and cobalt well style. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-01/*` | Post-change screenshot and metric evidence. |

## Validation Evidence

| Gate | Command Or Evidence | Result |
| --- | --- | --- |
| Typecheck | `pnpm check` | Passed with exit code 0. |
| Targeted UI tests | `pnpm exec vitest run client/src/pages/Home.test.ts client/src/components/ErrorBoundary.test.tsx client/src/components/SeriesProgress.test.ts` | Passed; 3 files and 9 tests passed. |
| Production build | `pnpm build` | Passed; Vite transformed 2304 modules and esbuild emitted `dist/index.js`. |
| UI layout audit | `pnpm audit:ui -- --output=docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-01-ui-layout-checks.json` | Passed; 6 layout checks passed. |
| Browser metrics | `reports/screenshots/mnui-01/screenshot-metrics.json` | Passed baseline checks: 6 screenshots, no horizontal overflow, no console/page errors, no sampled text overflow, reduced-motion route reported `true`. |

## Component Contract Matrix

| Design Primitive | Design Contract | Repo Mapping | Contract Decision |
| --- | --- | --- | --- |
| Button | Variants: primary, secondary, outline, ghost, glass, link, destructive. Sizes: sm, default, lg, icon. | `client/src/components/ui/button.tsx` keeps existing `default`, `secondary`, `outline`, `ghost`, `link`, `destructive` variants and adds additive `glass`; keeps existing sizes including `icon-sm` and `icon-lg`. | Public API preserved; additive `glass` variant supports design-system usage. |
| Badge | Compact square-ish state label; variants include default, secondary, outline, accent, destructive. | `client/src/components/ui/badge.tsx` keeps existing variants and adds additive `accent`. | Public API preserved; accent state now available. |
| Tag | Pill taxonomy metadata with default and primary tones. | Existing `.article-tag` and `.article-tag-primary` classes now consume `--radius-pill` and tokenized colors in `visual-refresh.css`. | Implemented as CSS role, not new exported component, to avoid API churn. |
| SignalChip | Luminous cobalt kicker with optional dot/icon; reserved for accent moments. | Existing `.signal-chip` class keeps role and now uses tokenized radius/brand values. | Implemented as CSS role; current public pages keep markup stable. |
| Card | Glass panel with modest radius, cobalt hairline, inset top highlight, low shadow, optional interactive lift. | `client/src/components/ui/card.tsx` uses `--radius-card`, `--glass-border`, `--surface-card`, and `--shadow-card`; page classes consume `--glass-bg`. | Public exports preserved; visual contract aligned. |
| Avatar | Circular initials/image identity token. | `client/src/components/ui/avatar.tsx` keeps Radix Avatar exports and aligns fallback typography/color. | Public API preserved. |
| BrandMark | Cobalt tile, notebook glyph, optional wordmark, size prop. | `ResearchShell.BrandMark` keeps `className` and adds `size`/`withWordmark`; CSS uses `--brand-mark-size`. | Public API preserved; additive props support design-system contract. |
| SectionTitle | Heading h1-h4 with cobalt left rule and caption font. | Existing `.section-title` CSS role remains stable; token changes preserve font/rule behavior. | No new component added in this phase; page-level usage remains class-based. |
| Input | Dark glass input with optional icon and visible focus glow. | `client/src/components/ui/input.tsx` keeps native input props and adds additive `icon` wrapper props; IME composition logic preserved. | Public API preserved; icon contract supported. |
| Textarea | Dark glass multi-line composer with rows support and visible focus. | `client/src/components/ui/textarea.tsx` keeps native textarea props, rows behavior, and IME composition logic. | Public API preserved. |

## Font And Network Policy

Production keeps local/system font chains only. The design package's `tokens/fonts.css` Google fallback import is treated as prototype support and was not imported into the product. This avoids new remote font requests, avoids a dependency/network policy change, and preserves the repo's existing `@font-face` local stacks for display, UI, reading, and mono roles.

## Browser Evidence

| Screenshot | Viewport | Route | Notes |
| --- | --- | --- | --- |
| `reports/screenshots/mnui-01/desktop-home.png` | 1440x900 | `/` | Header, BrandMark notebook glyph, search input, cards, and tags render without overflow. |
| `reports/screenshots/mnui-01/mobile-home.png` | 390x844 | `/` | Header and search controls retain touch-sized targets; no overflow or text clipping. |
| `reports/screenshots/mnui-01/desktop-archive.png` | 1440x900 | `/archive` | Shared tag/card styles render without overflow. |
| `reports/screenshots/mnui-01/desktop-search-zero.png` | 1440x900 | `/search?q=zzzz-no-hit-ui-audit` | Input, empty-state, and recovery actions render without overflow. |
| `reports/screenshots/mnui-01/mobile-search-zero.png` | 390x844 | `/search?q=zzzz-no-hit-ui-audit` | Mobile input and recovery actions render without overflow. |
| `reports/screenshots/mnui-01/mobile-home-reduced-motion.png` | 390x844 | `/` with reduced motion | Metrics confirm `prefers-reduced-motion: reduce` was active and content remained visible. |

## Accessibility And Compliance Notes

- Visible focus rings remain present in screenshot metrics after keyboard tabbing.
- Touch targets remain practical: header controls and inputs measure at least 44px in the captured mobile views.
- IME composition behavior for CJK input was preserved in Input and Textarea.
- No dependency was added; `lucide-react` remains the icon source.
- No secrets, auth material, private data, production data mutation, deployment, migration, or provider action was used.
- No design-system compiled bundle was executed.

## Rollback Notes

- Revert the phase-scoped CSS/component edits if visual regressions appear.
- `client/src/styles/public-components.css` was touched only for BrandMark base sizing; it can be reverted with the BrandMark component change if needed.
- Runtime/docs evidence can be regenerated by rerunning MNUI-01 after MNUI-00 remains passing.

## Handoff Decision

MNUI-01 passes. MNUI-02 is unlocked to apply the design-system reader model to Home, Archive, Search, Track, and Post surfaces. MNUI-02 should build on the new token layer, use design assets deliberately, and avoid changing the component APIs stabilized here.
