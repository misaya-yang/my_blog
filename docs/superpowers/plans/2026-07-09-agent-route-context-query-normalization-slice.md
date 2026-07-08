# Agent Route Context Query Normalization Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-reading-continuity-route-state-design.md`
Related spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Keep Agent route context aligned with the reader's current public route even when the route includes query parameters or hash anchors. This protects search, archive, taxonomy, and article deep-link contexts without changing private session state or stream contracts.

## Scope

In:

- Normalize route matching to pathname while preserving the original path in the context.
- Add tests for search query routes, archive query/hash routes, taxonomy pagination routes, and article heading links.
- Write a slice evidence report.

Out:

- No Agent UI redesign.
- No prompt copy changes.
- No API, tRPC, DB, quota, or provider changes.
- No deploy.

## Expected Files

- `client/src/components/agent/routeContext.ts`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- `docs/product_optimization/reports/agent-route-context-query-normalization-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `/search?q=agent` resolves as search context.
- `/archive?month=2026-07#top` resolves as archive context.
- `/tags/rlhf?page=2` resolves as tag context with `rlhf`.
- `/post/agent-loop#heading` resolves as post context with `agent-loop`.
- The context keeps the original full path for diagnostics and request payloads.
