# Agent Route Context Query Normalization Slice

Date: 2026-07-09
Status: Passed
Spec: `docs/superpowers/specs/2026-07-09-reading-continuity-route-state-design.md`
Related spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Plan: `docs/superpowers/plans/2026-07-09-agent-route-context-query-normalization-slice.md`

## Summary

Implemented a focused Agent route-continuity fix. `buildRouteContext` now matches routes using the pathname while preserving the original full path in the returned context. This prevents search, archive, taxonomy pagination, and article heading routes from falling through to generic public context when query strings or hash anchors are present.

## Changed Files

- `client/src/components/agent/routeContext.ts`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- `docs/superpowers/plans/2026-07-09-agent-route-context-query-normalization-slice.md`

## User-Visible Behavior

- Agent scope remains search-specific on `/search?q=agent`.
- Agent scope remains archive-specific on archive URLs with query/hash state.
- Agent scope remains taxonomy-specific on paginated tag/category routes.
- Agent scope remains article-specific on heading deep links.
- Diagnostic/request context still includes the original full route path.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts
```

Result: passed. Vitest executed the full configured suite: 49 test files, 304 tests passed.

```bash
corepack pnpm check
```

Result: passed.

```bash
corepack pnpm build
```

Result: passed.

```bash
git diff --check
```

Result: passed.

## Known Risks

- This slice does not change prompt text or retrieval rules; it only prevents route matching from losing specificity.
- Browser route-change evidence was not captured because the behavior is a deterministic route parser covered by unit tests.
