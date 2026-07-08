# UI Visual Contract Slice 4 Evidence

Date: 2026-07-08
Branch: dev

## Scope

- Added semantic public and reader tokens in `client/src/index.css`.
- Repointed the active public theme layer in `client/src/styles/owner-tools.css` to those tokens.
- Added a final scoped public visual contract layer in `client/src/styles/visual-refresh.css`.
- Connected existing reader class hooks in `client/src/pages/PostDetail.tsx`.
- Added compact reader-entry overrides so Agent prompts do not push the article body down.

## Verification

- `git diff --check`: pass
- `corepack pnpm check`: pass
- `corepack pnpm test -- client/src/pages/Home.test.ts client/src/components/MarkdownRenderer.test.tsx client/src/components/ResearchShell.test.tsx`: pass, 41 test files and 263 tests
- `corepack pnpm content:audit`: pass, 9 article files, 0 warnings, 0 failures
- `corepack pnpm build`: pass
- `corepack pnpm audit:ui`: pass

## UI Audit Evidence

- Homepage mobile: no horizontal overflow, `bodyScrollWidth` 390, `documentScrollWidth` 390, `viewportWidth` 390.
- Homepage desktop: no horizontal overflow, `bodyScrollWidth` 1440, `documentScrollWidth` 1440, `viewportWidth` 1440.
- Article mobile: entry layer remains compact at `entryHeight` 106.09375 and `proseY` 673.421875.
- Article desktop: entry layer remains compact at `entryHeight` 106.09375 and `proseY` 536.8125.
- Agent launcher audit still passes dialog role, labelled-by, focus restore, and launcher control wiring checks.

## Review Notes

- No route, DB, auth, retrieval, model provider, deployment, or dependency changes.
- The public visual layer now has one calmer semantic token contract for light and dark modes.
- Existing component structure is preserved.
- `docs/product_optimization/reports/ui-layout-checks-latest.json` was restored because the final audit changed only `generatedAt`.
