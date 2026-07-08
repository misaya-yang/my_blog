# Agent Ops Overview Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice adds a default `/manage/agent` overview tab so the owner sees Agent quality risk before raw index, retrieval, eval, trace, or idea tooling.

No backend route, tRPC method, database schema, Agent stream, retrieval, quota, auth, provider, reindex, or CSS ownership contract changed.

## Changed Files

- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/manage-agent/AgentQualityOverview.tsx`
- `client/src/pages/manage-agent/AgentQualityOverview.test.tsx`
- `client/src/i18n/agentOps.ts`
- `docs/superpowers/plans/2026-07-09-agent-ops-overview-slice.md`
- `docs/product_optimization/reports/agent-ops-overview-slice-2026-07-09/*`

## User-Visible Behavior

- `/manage/agent` now opens on `Overview` by default.
- The overview summarizes knowledge freshness, no-source runs, failed runs, and public search misses.
- The action queue prioritizes stale index/errors, no-source runs, failed runs, and search misses.
- Loading state is explicit and does not claim all-clear while owner signals are still loading.
- Existing Index, Retrieval Debugger, Local Eval Runner, Recent Traces, and Content Radar tabs remain available.

## Privacy Boundary

- The overview uses only owner-only existing data.
- It renders counts, public slugs, scopes, run IDs, public search queries, and suggested prompts already returned by owner endpoints.
- It does not render private pasted context, feedback bodies, contact details, hidden/draft content, credentials, or raw trace bodies.

## Verification

Focused tests:

```bash
corepack pnpm test -- client/src/pages/manage-agent/AgentQualityOverview.test.tsx client/src/pages/ManageAgent.test.tsx
```

Passed. Vitest ran 66 files and 378 tests.

Typecheck:

```bash
corepack pnpm check
```

Passed.

Production build:

```bash
corepack pnpm build
```

Passed.

Browser evidence:

- `manage-agent-overview-desktop.png`
- `manage-agent-overview-mobile.png`
- `browser-probes.json`

Probe results:

- Desktop and mobile reached `/manage/agent`.
- Active tab was `Overview`.
- Overview copy and action queue were present.
- Admin auth was not blocked.
- No page-level horizontal overflow was detected.
- Loading state was present and all-clear was absent while owner signals were still loading.

## Code Review Notes

- This is a client-only composition slice over existing owner queries.
- The first implementation briefly showed all-clear while data was loading; screenshot review caught it and the component now has an explicit loading branch with test coverage.
- No new dependency was added.

## Remaining Risk

- The browser session showed owner signal queries still loading after the evidence wait window. This appears to be local data/backend latency, not a UI regression; the overview now handles that state honestly.
- A future server slice should expose a single quality-summary endpoint so the overview does not need to wait on three independent queries.
