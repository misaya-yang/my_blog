# Route Contract Sync Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

Route facts are spread across the React router, server rendering shell, Vercel rewrites, SEO rules, sitemap/RSS generation, baseline audit route inventory, and Agent route context. This spec ensures those facts stay synchronized as the product evolves.

## Goals

- Keep public, owner, reader, editor, and system routes consistently classified.
- Ensure owner routes are noindex and absent from public feeds/search.
- Keep Vercel rewrites compatible with app routes.
- Keep baseline route inventory current.
- Keep Agent route context aligned with public route semantics.

## Non-Goals

- No routing framework migration.
- No localized route paths.
- No new public `/agent` workspace.
- No owner route exposure in sitemap/RSS.

## Current Files

- `client/src/App.tsx`
- `server/client-render.ts`
- `server/seo.ts`
- `server/static-index.test.ts`
- `server/vercel-config.test.ts`
- `scripts/audit/baseline.ts`
- `client/src/components/agent/routeContext.ts`
- `server/routers.ts`
- `vercel.json`

## Route Kinds

Canonical route kinds:

- `home`: `/`.
- `public`: tracks, archive, search, taxonomy, about.
- `reader`: `/post/:slug`.
- `editor`: `/write`, `/write/:slug`.
- `owner`: `/manage`, `/manage/agent`.
- `system`: 404 and non-product fallback routes.

Rules:

- Owner and editor routes must be noindex.
- Public and reader routes may be indexed only when public content is shown.
- Unknown routes render 404/noindex.
- Agent route context must not treat owner/debug state as public source scope.

## Sync Contract

Adding or changing a route requires checking:

- React route in `App.tsx`.
- Server render route kind and metadata.
- Vercel rewrite compatibility.
- SEO noindex/index behavior.
- Baseline route inventory.
- Agent route context when route affects scope.
- Sitemap/RSS inclusion or exclusion.

## Tests

Focused:

```bash
corepack pnpm test -- server/client-render.test.ts server/seo.test.ts server/static-index.test.ts server/vercel-config.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm build
```

## Acceptance Checklist

- App routes, server route kinds, Vercel rewrites, and baseline inventory agree.
- Owner/editor routes are noindex and absent from public feeds.
- Unknown routes render 404/noindex.
- Agent context does not leak owner route state into public answer scope.
