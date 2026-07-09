# Taxonomy Mobile Article First Slice

Date: 2026-07-09
Status: Passed
Branch: dev
Specs:

- `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
- `docs/superpowers/specs/2026-07-08-ui-visual-contract-design.md`
- `docs/superpowers/specs/2026-07-09-archive-taxonomy-density-filtering-design.md`
- `docs/superpowers/specs/2026-07-09-design-system-component-contract-design.md`

## Summary

Moved taxonomy article results ahead of the related-tags side panel on mobile/tablet. This keeps the taxonomy page focused on actual readable article rows first while preserving the desktop side-panel layout.

## Changed Files

- `client/src/styles/visual-refresh.css`
- `client/src/pages/TaxonomyPage.tsx`
- `scripts/audit/ui-layout.ts`
- `docs/superpowers/plans/2026-07-09-taxonomy-mobile-article-first-slice.md`
- `docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/summary.md`
- `docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/ui-layout-checks.json`

## User-Visible Behavior

- On mobile and tablet taxonomy routes, the order is now hero, article list, related tags.
- DOM order now matches the mobile reading order: hero, article list, related tags.
- On desktop taxonomy routes, the related-tags side panel remains sticky on the right.
- No route, API, DB, auth, SEO, or Agent behavior changed.

## Evidence

Audit output:

- `docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/ui-layout-checks.json`

Measured improvement for `/categories/ai-applications` at 390x844:

- Before this slice: article list top `1114.58`, first article row top `1309.97`, related-tags panel top `381.25`.
- After this slice: article list top `381.25`, first article row top `576.64`, related-tags panel top `1682.17`.
- New audit check `sidePanelAfterNotesOnMobile` passed.
- No horizontal overflow: `bodyScrollWidth=390`, `documentScrollWidth=390`, `viewportWidth=390`.

Desktop guard stayed stable:

- `/categories/ai-applications` at 1440x1000 kept side panel top `128`, article list top `407.48`, and no horizontal overflow.

## Validation

```bash
corepack pnpm audit:css -- --no-output
corepack pnpm check
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/taxonomy-mobile-article-first-slice-2026-07-09/ui-layout-checks.json
corepack pnpm test -- client/src/pages/TaxonomyPage.test.ts client/src/pages/Archive.test.ts
corepack pnpm build
git diff --check
```

Result: passed.

Vitest note: the focused command runs the repo Vitest suite under the current project config; 81 files and 453 tests passed.

## Code Quality Notes

- No new dependency.
- No new `!important`.
- Moved the related-tags aside after the article list in JSX so keyboard and reading order follow the mobile visual order.
- Kept desktop placement through existing taxonomy grid areas and a small mobile/tablet order rule in the final public visual layer.
- Tightened `audit:ui` so mobile taxonomy articles must stay ahead of the related-tags panel.

## Known Risks

- The side panel is still long after the article list. A future slice can collapse related tags if owner review wants an even denser taxonomy page.
