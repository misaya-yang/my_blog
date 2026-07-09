# Route Contract Sync Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-route-contract-sync-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Make browser routes, server shell classification, SEO known-route handling, and Blog Agent route context use one shared route contract so owner/editor/system routes cannot accidentally be treated as public Agent scope.

## Scope

In:

- Add a shared route contract helper.
- Replace duplicated route-kind checks in `client/src/App.tsx`, `server/client-render.ts`, and Agent route context helpers.
- Hide the public Blog Agent on non-public/system routes, including `/404` and unknown paths.
- Extend Agent route context types and input validation with `owner`, `editor`, and `system`.
- Add focused tests and a report.

Out:

- No route additions or removals.
- No sitemap/RSS content changes beyond consuming existing public route constants.
- No Vercel rewrite changes.
- No deployment, DB migration, or dependency changes.

## Tasks

- [x] Add `shared/route-contract.ts` with canonical route constants and classification helpers.
- [x] Reuse the helper in `shared/site.ts`, `client/src/App.tsx`, and `server/client-render.ts`.
- [x] Reuse the helper in Agent route context and hidden-route logic.
- [x] Update route/SEO/Agent tests.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: sync route contract`.

## Verification Commands

```bash
corepack pnpm test -- shared/route-contract.test.ts server/client-render.test.ts server/seo.test.ts server/static-index.test.ts server/vercel-config.test.ts client/src/components/agent/BlogAgentRoot.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- The client still renders the same route tree. This slice only centralizes classification and tightens Agent visibility.
- The new Agent route types are additive validation values; public Agent bootstrap remains disabled on owner/editor/system routes.
