# Production Observability And Runbook Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md)

## Summary

The product now has Agent streaming, owner tools, content freshness checks, reader signals, and release gates. Failures need to be diagnosable without exposing secrets or requiring a full code reread. This spec defines lightweight observability and runbook expectations using the existing stack.

## Goals

- Make common production failures visible and actionable.
- Keep logs and reports privacy-safe.
- Tie release reports to operational follow-up.
- Give owner routes clear degraded states.
- Avoid new observability dependencies unless a future slice proves the need.

## Non-Goals

- No new SaaS observability vendor.
- No central metrics database in this spec.
- No production credential handling in docs or reports.
- No full incident management process.

## Current Evidence

- App-level error boundary exists in `client/src/components/ErrorBoundary.tsx`.
- Server startup and API wiring exist in `server/app.ts` and `server/_core/index.ts`.
- Agent error states live across `server/ai/*` and `client/src/components/agent/*`.
- Reindex status and failures are recorded through `server/ai/knowledgeDb.ts`.
- Release and audit reports live under `docs/product_optimization/reports/`.

## Operational States To Cover

| Area | Required State |
| --- | --- |
| App boot | build/start failure, missing env, unavailable DB |
| Auth | invalid admin password, expired session, logout, unauthorized owner route |
| Public content | post not found, hidden/draft protection, stale seed fallback in dev only |
| Search | zero results, repeated search miss, search API failure |
| Agent | model not configured, stream timeout, abort, quota exhausted, no sources, stale knowledge, citation gap |
| Reindex | dry-run status, success, stale, latest failure, unavailable DB |
| Owner tools | unavailable report, empty backlog, partial data, failed mutation |
| Release | skipped check, failed check, waiver, dirty worktree, unpushed commit |

## Logging Rules

- Log stable error class, route/action, request-safe identifiers, and remediation hint when available.
- Do not log secrets, raw private pasted context, direct contact data, session tokens, or full credential-bearing URLs.
- Redact user-provided long text before writing audit reports.
- Browser screenshots for reports must avoid private content unless the report is explicitly private and not committed.

## Runbook Contract

Each owner-facing operational surface should state:

- Current state.
- Why it matters.
- Next action.
- Whether the state blocks release.
- Where to find detailed evidence.

Examples:

- Agent knowledge stale: run `corepack pnpm ai:reindex` and verify public source count.
- Agent eval report missing: run `corepack pnpm ai:eval` or record release waiver.
- Publish freshness mismatch: run `corepack pnpm content:verify`; inspect stale article IDs.
- Unauthorized owner route: return to login without revealing route internals.

## Acceptance Checklist

- Agent and owner tools show degraded states instead of blank panels.
- Release reports distinguish failure, warning, skipped, and waived checks.
- Logs and committed reports do not contain secrets or private text.
- Runbook text is actionable and tied to existing commands.
- Error boundaries preserve navigation back to public routes.

## Validation

```bash
corepack pnpm test -- client/src/components/ErrorBoundary.test.tsx server/auth.logout.test.ts server/agent.router.test.ts scripts/release/check.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```
