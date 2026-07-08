# Owner Cockpit IA Contract Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The owner experience currently spans `/manage`, `/manage/agent`, and `/write`. Some data overlaps: content radar, Agent radar, search misses, feedback, subscriptions, evals, traces, knowledge status, and writing backlog. This spec assigns clear jobs to each owner route so future changes do not create duplicated or conflicting dashboards.

## Goals

- Make `/manage` the editorial work cockpit.
- Make `/manage/agent` the Agent quality operations cockpit.
- Make `/write` the focused article creation/revision surface.
- Keep release readiness visible without duplicating every debug detail.
- Keep raw diagnostics behind advanced sections.

## Non-Goals

- No new route unless current routes cannot support the workflow.
- No complete owner dashboard redesign.
- No public owner data exposure.
- No schema migration in the first IA pass.

## Current Files

- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/components/DashboardLayout.tsx`
- `client/src/i18n/manage.ts`
- `client/src/i18n/agentOps.ts`
- `server/engagement.router.ts`
- `server/ai/router.ts`

## Route Responsibilities

### `/manage`

Primary job: editorial and publishing operations.

Owns:

- Post list and visibility controls.
- Categories and tags.
- Reader feedback and subscriptions.
- Writing backlog.
- Content radar.
- Release readiness summary.
- Links to editor.

Should not own:

- Raw Agent trace review.
- Retrieval debug query tool.
- Full eval runner UI.

### `/manage/agent`

Primary job: Agent quality operations.

Owns:

- Knowledge index status.
- Eval run and eval summary.
- Agent question radar.
- Low-confidence/no-source/refusal runs.
- Retrieval diagnostics.
- Recent traces.
- Links to writing backlog or editor.

Should not own:

- General post list CRUD.
- Category/tag CRUD.
- Subscriber export.

### `/write`

Primary job: focused draft or article revision.

Owns:

- Markdown editing.
- Preview.
- Metadata.
- Publish/save.
- Version restore.
- Publish preflight.
- Knowledge refresh outcome.

Should not own:

- Global dashboard metrics.
- Raw Agent run debugging.

## Shared Data Rules

Some data can appear in more than one route, but with different depth:

- Agent gaps:
  - `/manage`: backlog summary and editor link.
  - `/manage/agent`: full quality/debug context.

- Release readiness:
  - `/manage`: summarized state.
  - `/manage/agent`: Agent-specific checks.

- Feedback:
  - `/manage`: full management.
  - `/manage/agent`: only when it relates to content gaps.

## UI Hierarchy

Owner screens should be dense but not decorative:

- Compact rows and tables.
- Clear status text.
- Few badges, consistent colors.
- Advanced debug sections below summary.
- No marketing-style hero.
- No nested cards.

## Implementation Slices

1. Document current duplicate data across `/manage` and `/manage/agent`.
2. Reorder panels so each route starts with its primary job.
3. Move repeated helper logic into small local helpers where safe.
4. Add copy that distinguishes summary vs debug.
5. Add browser evidence for owner routes.

## Tests

Focused:

```bash
corepack pnpm test -- server/engagement.router.test.ts server/agent.router.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

## Acceptance Checklist

- `/manage` clearly answers what to publish or fix next.
- `/manage/agent` clearly answers whether the Agent is healthy.
- `/write` stays focused on drafting and publishing.
- Debug information is available but not the first surface.
- Shared data is summarized consistently without contradictory labels.
