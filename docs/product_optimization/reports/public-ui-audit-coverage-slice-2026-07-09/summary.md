# Public UI Audit Coverage Slice

Date: 2026-07-09
Status: Passed
Branch: dev
Specs:

- `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`
- `docs/superpowers/specs/2026-07-08-ui-visual-contract-design.md`
- `docs/superpowers/specs/2026-07-09-archive-taxonomy-density-filtering-design.md`
- `docs/superpowers/specs/2026-07-09-test-matrix-ownership-design.md`

## Summary

Extended `audit:ui` so archive and taxonomy discovery routes are checked by default for horizontal overflow, first-screen density, readable row height, readable title line-height, and bounded taxonomy side tags.

## Changed Files

- `scripts/audit/ui-layout.ts`
- `docs/superpowers/plans/2026-07-09-public-ui-audit-coverage-slice.md`
- `docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/summary.md`
- `docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/ui-layout-checks.json`

## User-Visible Behavior

No runtime UI behavior changed. This slice adds automated evidence coverage so later public UI edits must keep archive and taxonomy pages readable and free of horizontal overflow.

## Evidence

`docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/ui-layout-checks.json`

New route coverage:

- `/archive`, mobile 390x844 and desktop 1440x1000.
- `/categories/ai-applications`, mobile 390x844 and desktop 1440x1000.

Observed route measurements from the passing audit:

- Archive mobile: first row top `719.34`, first row height `240.72`, title line-height `28px`, no horizontal overflow.
- Archive desktop: first row top `549.13`, first row height `90.75`, title line-height `28px`, no horizontal overflow.
- Taxonomy mobile: notes top `1114.58`, first row top `1309.97`, first row height `259.53`, side tag count `11`, title line-height `23.2px`, no horizontal overflow.
- Taxonomy desktop: notes top `407.48`, first row top `560.47`, first row height `170.23`, side tag count `11`, title line-height `23.2px`, no horizontal overflow.

## Validation

```bash
corepack pnpm check
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/public-ui-audit-coverage-slice-2026-07-09/ui-layout-checks.json
corepack pnpm test -- client/src/pages/Archive.test.ts client/src/pages/TaxonomyPage.test.ts
corepack pnpm build
git diff --check
```

Result: passed.

Vitest note: the focused command runs the repo Vitest suite under the current project config; 81 files and 453 tests passed.

## Code Quality Notes

- No new dependency.
- No runtime UI, route, tRPC, DB schema, auth, SEO, or Agent contract change.
- Added route inspectors follow the existing `UiLayoutReport` shape.
- The first attempted thresholds were too strict for current real layout. Final gates use measured, still-constraining bounds: archive mobile row height up to `260px`, taxonomy title line-height at least `22px`, and taxonomy side tags up to `12`.

## Known Risks

- The audit uses `/categories/ai-applications` as the taxonomy fixture. If seeded taxonomy slugs change later, this route must be updated with the route contract.
- This slice does not redesign archive or taxonomy visuals; it prevents regressions and records objective metrics for future Wave 1 UI work.
