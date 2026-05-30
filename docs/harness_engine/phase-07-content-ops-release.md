# Phase 07 - Content Ops and Release Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:verification-before-completion` before final handoff and run the full release checklist.

**Goal:** Give the owner a durable publishing workflow and a release process that catches regressions before production.

**Architecture:** Expand owner tooling around content operations, version recovery, taxonomy management, analytics, and CI/release gates. Keep the public site simple while making the backstage reliable.

**Tech Stack:** React, tRPC, Drizzle/Postgres, Vitest, GitHub Actions or equivalent CI, Vercel preview, optional analytics provider.

---

## Task Spec

Close the operational gaps:

- category and tag management UI
- tag update API
- version history view and restore
- featured/pinned/series management
- content status tracking
- analytics and search insight
- CI and preview release gates
- production-safe error handling

## Problem Boundary

In scope:

- Owner-only content ops inside `/manage` or dedicated owner routes.
- Database additions for series, featured status, and operational metadata if needed.
- CI workflow and release verification.
- Analytics events and Core Web Vitals capture.
- Production error UI hardening.

Out of scope:

- Multi-author roles.
- Paid memberships.
- Complex CMS replacement.
- Full observability platform migration.

## Context Policy

Before editing, inspect:

- `todo.md`
- `docs/deployment.md`
- `package.json`
- `vercel.json`
- `.github/workflows` if present
- `server/routers.ts`
- `server/db.ts`
- `drizzle/schema.ts`
- `client/src/pages/Manage.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/components/ErrorBoundary.tsx`
- `client/src/lib/analytics.ts`
- `client/src/i18n/manage.ts`
- `client/src/i18n/editor.ts`

Preserve the owner-only posture. Do not create public admin affordances.

## Product Requirements

### R1 Taxonomy Management

Owner can:

- create category
- edit category name, slug, description
- delete category with safe reassignment or block if posts exist
- create tag
- edit tag name and slug
- delete tag with clear impact preview

Current gap:

- `tags.update` returns `NOT_IMPLEMENTED`.

Acceptance:

- tag update works end-to-end
- slug uniqueness is validated
- destructive actions require confirmation

### R2 Version History and Restore

Owner can:

- view versions for a post
- compare current content with a previous version
- restore a version
- see created time and title for each version

Current gap:

- server has `saveVersion` and `getVersions`
- UI does not expose a complete restore workflow

### R3 Series, Featured, and Pinned Content

Add a lightweight way to curate:

- featured articles for home
- pinned article per track
- series name/order for multi-part research writing

Minimum model:

- optional `seriesSlug`
- optional `seriesTitle`
- optional `seriesOrder`
- optional `featuredRank`

Do not overbuild a CMS. The owner should be able to create coherent reading paths.

### R4 Content Status Dashboard

Manage page should show:

- drafts
- published public posts
- published owner-only previews
- hidden posts
- posts missing excerpt
- posts missing category
- posts with no tags
- posts missing SEO fields after Phase 04
- posts updated recently

### R5 Analytics and Insights

Capture:

- SPA route pageviews
- article views without double-counting excessive refreshes where practical
- search queries with no results
- feedback submissions from Phase 06
- Core Web Vitals
- client errors

Owner dashboard can start with:

- top posts
- recent searches
- popular tags
- zero-result searches
- recent feedback

### R6 CI and Release Gates

Add a CI workflow that runs:

- install with pnpm
- `pnpm check`
- `pnpm test`
- `pnpm build`
- Phase 00 audit smoke where possible

Preview deployment gate should include:

- route smoke for home, article, login, unknown route
- bundle budget check
- accessibility smoke

### R7 Production Error Safety

Update ErrorBoundary:

- do not show stack trace in production
- show a friendly recovery message
- log client error through analytics/error endpoint if configured
- keep stack trace in development for debugging

### R8 Documentation

Update:

- `README.md`: local setup, env vars, commands, content workflow
- `docs/deployment.md`: deployment, migration, rollback, verification checklist
- `docs/harness_engine/README.md`: mark completed phases and latest audit command

## Execution Capture

Required tests:

- tag update success
- category delete blocked or safe-reassigned when posts exist
- version restore updates content and saves current version before restore if chosen
- featured/pinned ordering deterministic
- manage dashboard counts respect visibility/status
- non-admin cannot access ops procedures
- ErrorBoundary hides stack in production mode

Required release checks:

- CI workflow passes on branch
- local `pnpm check`, `pnpm test`, `pnpm build` pass
- route smoke passes
- bundle budget report generated
- deployment doc updated

## Evaluator Protocol

Phase 07 is complete when:

- Owner can manage taxonomy without database scripts.
- Owner can restore prior article content from UI.
- Owner can curate featured/series paths.
- Release gates run automatically or are documented as a required command.
- Production error UI no longer leaks stack traces.
- README and deployment docs are useful for a fresh contributor or future Codex thread.

## Acceptance Criteria

- `/manage` has clear sections or tabs for posts, taxonomy, feedback/insights, and content health.
- Version restore is reversible or requires confirmation explaining impact.
- CI blocks a failing typecheck, failing tests, or failing build.
- Deployment guide includes rollback and migration steps.
- Analytics additions are environment-gated and do not crash without credentials.

## Risks

- Adding too many CMS features can distract from writing. Prioritize taxonomy, version restore, and content health before analytics polish.
- Analytics can become privacy-sensitive. Store only what the owner needs.
- CI with browser checks can be flaky. Keep deterministic unit checks mandatory and browser checks scoped.
