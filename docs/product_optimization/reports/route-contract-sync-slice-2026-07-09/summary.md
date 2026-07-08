# Route Contract Sync Slice Report

Date: 2026-07-09
Branch: `dev`
Commit target: `feat: sync route contract`

## Outcome

- Added a shared route contract in `shared/route-contract.ts`.
- Centralized route kind classification for client route effects, server shell known-route detection, SEO route constants, and Blog Agent visibility.
- Prevented owner/editor/system routes from being represented as public Agent context.
- Hid the public Blog Agent on `/manage`, `/write`, `/login`, `/404`, and unknown system routes.
- Kept existing app routes, Vercel rewrites, sitemap/RSS behavior, DB schema, and deployment untouched.

## Changed Files

- `shared/route-contract.ts`
- `shared/route-contract.test.ts`
- `shared/site.ts`
- `client/src/App.tsx`
- `client/src/components/agent/routeContext.ts`
- `client/src/components/agent/agentCompanionRuntime.ts`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- `server/client-render.ts`
- `server/client-render.test.ts`
- `server/ai/types.ts`
- `server/ai/inputSchemas.ts`
- `docs/superpowers/plans/2026-07-09-route-contract-sync-slice.md`

## User-Visible Behavior

- Public reading pages still expose the Blog Agent.
- Owner, editor, auth, 404, and unknown routes no longer expose the public Blog Agent launcher.
- `/manage`, `/write`, `/login`, and `/404` remain known browser shell routes.
- Unknown routes remain 404/noindex in server shell rendering.

## Code Quality Notes

- Removed duplicated route classification logic from `client/src/App.tsx` and `server/client-render.ts`.
- `shared/site.ts` now uses the same public and disallowed route constants that route classification uses.
- Agent route context now has explicit `owner`, `editor`, and `system` states instead of falling back to `public`.
- No new dependency, schema change, route change, or broad rewrite.

## Verification

- `corepack pnpm test -- shared/route-contract.test.ts server/client-render.test.ts server/seo.test.ts server/static-index.test.ts server/vercel-config.test.ts client/src/components/agent/BlogAgentRoot.test.ts`
  - Passed. Vitest executed the full suite: 71 files, 413 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.
- `git diff --check`
  - Passed.

## Known Risks

- This is a route contract/code test slice, not a browser screenshot slice.
- `canShowPublicBlogAgent` intentionally hides the launcher on unknown routes. If a new public route is added later, it must be added to the shared contract and Vercel route tests together.
