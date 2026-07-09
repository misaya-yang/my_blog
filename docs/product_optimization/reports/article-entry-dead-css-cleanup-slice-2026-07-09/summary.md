# Article Entry Dead CSS Cleanup Slice Report

Date: 2026-07-09
Branch: `dev`
Status: Passed

## Scope

This slice removes inert CSS left behind after the article entry heading/kicker DOM was removed. It is a code-quality slice only: no route, API, schema, auth, Agent, content, dependency, deployment, or visible UI contract changed.

## Changed Files

- `client/src/styles/public-components.css`
- `client/src/styles/owner-tools.css`
- `client/src/styles/visual-refresh.css`
- `docs/superpowers/plans/2026-07-09-article-entry-dead-css-cleanup-slice.md`
- `docs/product_optimization/reports/article-entry-dead-css-cleanup-slice-2026-07-09/ui-layout-checks.json`

## Code Quality Notes

- Removed 52 lines of dead article-entry heading/kicker CSS.
- Verified no references remain for `article-entry-heading` or `article-entry-kicker` under `client/src/pages`, `client/src/components`, or `client/src/styles`.
- Preserved live article entry, series, detail, prompt, and compact progress selectors.
- CSS ownership debt improved: `!important` count decreased from 1559 to 1556; scanned CSS lines decreased from 16056 to 16004.

## Browser Audit Evidence

Source: `docs/product_optimization/reports/article-entry-dead-css-cleanup-slice-2026-07-09/ui-layout-checks.json`, generated at `2026-07-09T12:25:52.981Z`.

| Route | Viewport | Prose Y | Entry height | Pre-body utilities | Horizontal overflow |
| --- | ---: | ---: | ---: | ---: | --- |
| `/post/goal-harness-agent-phase-protocol` | 390x844 | 583.13px | 82.75px | 0 | No |
| `/post/goal-harness-agent-phase-protocol` | 1440x1000 | 514.14px | 82.75px | 0 | No |

## Validation

- `rg -n "article-entry-heading|article-entry-kicker" client/src/pages client/src/components client/src/styles || true`: no matches.
- `corepack pnpm audit:css -- --no-output`: passed. CSS ownership failures 0.
- `corepack pnpm check`: passed.
- `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-entry-dead-css-cleanup-slice-2026-07-09/ui-layout-checks.json`: passed.
- `corepack pnpm build`: passed.

## Known Risks

- This does not address broader CSS duplication across the public style layers. It only removes selectors proven dead by current JSX usage.
