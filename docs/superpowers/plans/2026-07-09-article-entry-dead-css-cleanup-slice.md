# Article Entry Dead CSS Cleanup Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove inert CSS selectors for the old article entry heading after `PostDetail.tsx` stopped rendering `article-entry-heading` and `article-entry-kicker`.

**Primary Spec:** `docs/superpowers/specs/2026-07-09-css-ownership-style-debt-budget-design.md`

**Scope:** CSS/code-quality cleanup only. No visual redesign, route/API/schema/auth/Agent/content/dependency/deploy change.

## Evidence Before Editing

- `rg -n "article-entry-heading|article-entry-kicker" client/src/pages client/src/components client/src/styles` shows the remaining references are all style selectors.
- `PostDetail.tsx` now labels the entry section with `aria-label={t("post.entry.title")}` and no longer renders the old visible heading/kicker DOM.

## Tasks

- [x] Remove `.article-entry-heading` and `.article-entry-heading h2` blocks from public/article style layers.
- [x] Remove `.article-entry-kicker` from combined color selector groups where it is now dead.
- [x] Preserve selectors for `.article-series-label`, `.article-secondary-label`, `.article-entry-item dt`, `.article-entry-details`, `.article-agent-prompts`, and `.series-progress-compact`.
- [x] Run `corepack pnpm audit:css -- --no-output`.
- [x] Run `corepack pnpm check`.
- [x] Run `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-entry-dead-css-cleanup-slice-2026-07-09/ui-layout-checks.json`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write `docs/product_optimization/reports/article-entry-dead-css-cleanup-slice-2026-07-09/summary.md`.
- [x] Commit with `refactor: remove dead article entry css`.

## Acceptance

- No references to `article-entry-heading` or `article-entry-kicker` remain under `client/src/pages`, `client/src/components`, or `client/src/styles`.
- CSS ownership audit passes and style debt counts do not increase.
- Article UI layout audit remains green.
- The slice report records changed files, validation, and remaining risk.
