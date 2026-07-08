# Data Model And Content Operations Contract Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md)

## Summary

The optimization program touches articles, discovery, Agent knowledge, reader signals, feedback, and owner workflows. This spec defines the data and content-ops contract so UI and product improvements do not accidentally require unreviewed schema changes or break content freshness.

## Goals

- Preserve existing API, route, and database contracts by default.
- Make schema migrations an explicit stop condition.
- Keep content publication, version restore, and Agent knowledge refresh aligned.
- Define durable versus derived reader-signal data.
- Keep seed content, public posts, and owner drafts separated.

## Non-Goals

- No schema migration in this spec.
- No pgvector or new search backend.
- No new CMS.
- No automatic article prose generation.

## Current Evidence

- Post/category/tag mutations live in `server/routers.ts`.
- Post versions and restore flows are available through the posts router.
- Knowledge refresh is triggered after post create/update/delete/restore.
- Reader signal builders live in `server/readerSignals.ts`.
- Search miss recording lives in `server/searchMisses.ts`.
- Content seed and article corpus live through `seed-blog.mjs` and public seed helpers.
- Content freshness checks live in `scripts/audit/publish-freshness.ts`.

## Data Contract

### Public Content

- Public posts are published and public.
- Draft, hidden, and admin posts may appear only in admin-authenticated flows.
- Seed fallback is allowed for local/dev validation but cannot override production visibility.
- Article metadata should remain structured enough for archive, search, taxonomy, RSS, sitemap, Agent sources, and related content.

### Owner Content Operations

- Create, update, delete, save version, and restore version should return knowledge refresh status where relevant.
- Publish preflight can block on structural/publication failures; subjective style warnings are advisory until precision is reviewed.
- Editor safe scaffolds can include headings and source context, but not final prose or private reader bodies.
- Version restore should not silently create stale Agent knowledge.

### Reader Signals

- Durable signals should have kind, status, severity, public context, redacted evidence, grouping key, suggested action, and created/updated timestamps where storage exists.
- Derived/local signals must be labeled as read-model signals and not pretend to be persisted state.
- Canonical signal source values are `feedback`, `search_miss`, `agent_question`, `content_audit`, and `publish_freshness`.
- `agent_radar` is a legacy alias only; new code should normalize to `agent_question`.

### Migration Discipline

- Any DB schema change requires a separate owner-approved plan.
- Migration plans must state data backfill, rollback, test fixtures, local verification, and production risk.
- No slice may combine schema migration with broad UI redesign.

## Acceptance Checklist

- Code slices touching content ops list whether they change API shape, route shape, or DB schema.
- Publish/create/update/delete/restore flows surface knowledge refresh state.
- Reader signal tests cover stable IDs, grouping, redaction, severity, status, and suggested action.
- Search, archive, taxonomy, Agent, RSS, sitemap, and static index visibility remain aligned.
- No schema migration is introduced without explicit approval.

## Validation

```bash
corepack pnpm test -- server/posts.test.ts server/readerSignals.test.ts server/engagement.router.test.ts scripts/audit/publish-freshness.test.ts
corepack pnpm content:verify
corepack pnpm check
corepack pnpm build
git diff --check
```
