# Phase 08 - Publish Quality and Knowledge Freshness

**Goal:** Make publishing reliable across content, public discovery, RSS/sitemap, and Blog Agent knowledge.

**Architecture:** Treat publish as a product release pipeline: seed, migrate if needed, reindex, verify public routes, verify Agent sources, verify generated feeds.

**Tech Stack:** `seed-blog.mjs`, Drizzle migrations, `scripts/ai/reindex-knowledge.ts`, audit scripts, RSS/sitemap generation, tests.

---

## Coding Agent Contract

- PHASE_ID: PO-08
- GOAL_TARGET: Gate content publishing and knowledge freshness across public discovery, feeds, and Blog Agent knowledge.
- GOAL_PROMPT: Complete PO-08 Publish Quality and Knowledge Freshness for `/Users/yang/projects/ai-tech-blog` by following `docs/product_optimization/phase-08-publish-quality-freshness.md`; make publish/reindex/feed freshness repeatable, protect hidden content boundaries, and finish after full validation commands and acceptance gates pass or are explicitly blocked by environment.
- DEPENDS_ON: PO-01, PO-06
- READ_FIRST: `docs/product_optimization/README.md`, `docs/product_optimization/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `package.json`, `seed-blog.mjs`, `scripts/ai/reindex-knowledge.ts`, `scripts/audit/baseline.ts`, `server/seo.ts`, `server/discovery.ts`, `shared/metadata.ts`, `docs/deployment.md`, `docs/harness_engine/reports/`
- LIKELY_EDIT_PATHS: `package.json`, `seed-blog.mjs`, `scripts/ai/reindex-knowledge.ts`, `scripts/audit/*`, `docs/deployment.md`, release report docs
- DO_NOT_EDIT: article arguments, unrelated UI redesign, new external CMS, email delivery automation unless explicitly requested
- VALIDATION_COMMANDS: `pnpm check`; `pnpm test`; `pnpm build`; `pnpm content:publish`; `pnpm audit:baseline:quick`
- BROWSER_CHECKS: `/`, `/archive`, `/rss.xml`, `/sitemap.xml`, one public article, `/manage/agent` if available
- ACCEPTANCE_GATES: public inventory matches feeds/discovery; hidden/draft content stays hidden; Agent chunks match public inventory; repeated publish does not silently drift old dates

## Task Spec

Create a repeatable release gate that prevents stale or inconsistent public knowledge:

- content metadata is complete
- public posts appear in discovery
- hidden posts stay hidden
- RSS/sitemap/archive are fresh
- Agent knowledge chunks are fresh
- golden questions pass or failures are documented

## Problem Boundary

In scope:

- Publish commands.
- Release checklist.
- Freshness checks.
- Content metadata validation.
- Agent reindex verification.
- RSS/sitemap/archive verification.

Out of scope:

- External CMS migration.
- Automated deployment without owner control.
- Email newsletter delivery unless a provider is already connected.
- Full monitoring vendor integration.

## Context Policy

Inspect:

- `package.json`
- `seed-blog.mjs`
- `scripts/ai/reindex-knowledge.ts`
- `scripts/audit/baseline.ts`
- `server/seo.ts`
- `server/discovery.ts`
- `shared/metadata.ts`
- `docs/deployment.md`
- `docs/harness_engine/reports/`

## Product Requirements

### R1 Publish Command Contract

Clarify what `pnpm content:publish` does:

- seed public content
- preserve intended visibility
- reindex Agent knowledge
- avoid unexpected timestamp drift

If it cannot guarantee all of this yet, document the gap and add checks.

### R2 Metadata Completeness Gate

Before release, verify every public post has:

- title
- slug
- excerpt
- category
- tags
- status `published`
- visibility `public`
- stable published date
- series metadata when required

### R3 Generated Asset Freshness

Verify:

- `/rss.xml`
- `/sitemap.xml`
- `/robots.txt`
- archive route
- tag/category routes

### R4 Agent Knowledge Freshness

After reindex:

- public chunks exist for public posts
- hidden/draft chunks are absent
- chunk count is plausible
- source cards link to public post slugs
- golden questions pass or are recorded as release blockers

### R5 Release Report

Generate or write a release report with:

- git commit
- commands run
- content inventory
- feed status
- Agent golden question status
- route audit summary
- known exceptions

## Execution Capture

Required commands:

```bash
pnpm check
pnpm test
pnpm build
pnpm content:publish
pnpm audit:baseline:quick
```

With local server:

```bash
AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick
```

Agent-specific:

- run golden questions manually or through admin eval runner
- inspect `/manage/agent`

## Evaluator Protocol

Phase 08 is complete when:

- The author can publish content and know which public surfaces changed.
- Feeds and discovery routes match the post inventory.
- Agent knowledge reflects the same public inventory.
- Hidden/draft content boundaries are verified.

## Acceptance Criteria

- Release checklist is documented and repeatable.
- Publish does not silently change old article dates.
- Agent reindex status is visible or explicitly verified by command output.
- Failures are recorded as blockers, not ignored.

## Risks

- Running publish commands mutates the database.
- Generated reports can become noisy if not scoped.
- Strict gates can slow writing unless checks are fast and actionable.
