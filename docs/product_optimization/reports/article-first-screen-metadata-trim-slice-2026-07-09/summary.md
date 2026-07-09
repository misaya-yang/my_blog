# Article First Screen Metadata Trim Slice Report

Date: 2026-07-09
Branch: `dev`
Status: Passed for this slice

## Scope

This slice improves the public article first screen. It does not complete the full product optimization goal and does not change routes, APIs, database schema, auth, SEO metadata, Markdown rendering, Agent behavior, deployment, credentials, or dependencies.

## User-Visible Changes

- Removed the pre-body author/contact utility row from the article header. Author, Scholar, email, share, and edit utilities remain available later in the continuation metadata area.
- Rendered the published date as semantic `<time dateTime=...>`.
- Replaced utility-class-only metadata and tag rows with scoped `article-reading-meta` and `article-reading-tags` styles.
- Removed the visible entry-layer kicker/title before the article body. The section keeps an accessible name through `aria-label`.
- Tightened `audit:ui` so future changes must keep article prose visible earlier and must not reintroduce pre-body author utilities.

## Browser Audit Evidence

Source: `docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/ui-layout-checks.json`, generated at `2026-07-09T12:18:40.244Z`.

| Route | Viewport | Before prose Y | After prose Y | Delta | Entry height | Pre-body utilities | Horizontal overflow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/post/goal-harness-agent-phase-protocol` | 390x844 | 639.31px | 583.13px | -56.19px | 82.75px | 0 | No |
| `/post/goal-harness-agent-phase-protocol` | 1440x1000 | 569.27px | 514.14px | -55.13px | 82.75px | 0 | No |

Baseline values come from the previous `docs/product_optimization/reports/ui-layout-checks-latest.json` before this slice. The new gate requires prose start `<= 590px` on mobile and `<= 520px` on desktop; both passed.

## Validation

- `corepack pnpm audit:css -- --no-output`: passed. CSS ownership scanned 6 files, 16056 lines; failures 0.
- `corepack pnpm check`: passed.
- `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-first-screen-metadata-trim-slice-2026-07-09/ui-layout-checks.json`: passed.
- `corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx`: passed. Vitest ran 81 files and 453 tests.
- `corepack pnpm build`: passed.

## Known Risks

- This improves first-screen reading calm but does not yet address article prose wording quality or broader layout density across every public page.
- Some legacy CSS selectors for the old entry heading remain in the stylesheet layers. They are now inert for the current article DOM; a broader CSS cleanup should be handled in a separate bounded slice.
