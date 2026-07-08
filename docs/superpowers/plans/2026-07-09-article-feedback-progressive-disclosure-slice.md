# Article Feedback Progressive Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make article feedback support reader signals without interrupting the first reading pass.

**Architecture:** Keep the existing feedback mutation and owner backlog contract. Change only the public article feedback presentation so the default state is compact, sentiment-first, and optional details are revealed only by explicit reader action.

**Tech Stack:** React, TypeScript, existing tRPC mutation, existing i18n dictionaries, scoped CSS in `visual-refresh.css`, Vitest, Playwright-backed `audit:ui`.

## Global Constraints

- No new dependency.
- No route, DB schema, auth, feedback API, subscription API, or owner backlog contract changes.
- No public leak of hidden, draft, admin-only, private, pasted, credential, or contact data.
- No deployment, force push, schema migration, destructive data operation, or credential mutation.
- No broad CSS rewrite or page rewrite in a single commit.
- Article feedback and subscription must not interrupt the first reading pass.
- Light and dark modes must remain readable.
- Do not increase broad CSS `!important` debt without a report-level waiver.

---

### Task 1: Feedback Disclosure State

**Files:**
- Modify: `client/src/components/ArticleFeedback.tsx`
- Modify: `client/src/components/ArticleFeedback.test.tsx`
- Modify: `client/src/i18n/common.ts`

**Interfaces:**
- Preserve: `ArticleFeedback({ postId, postTitle, className, embedded })`
- Add local state only: `detailsOpen: boolean`

- [x] Add `detailsOpen` state that defaults to `false`.
- [x] Keep useful / not useful buttons visible by default.
- [x] Hide textarea, nickname, and reply email fields until `detailsOpen` is true.
- [x] Keep submit available after a sentiment is selected, even when optional details are hidden.
- [x] Add a details toggle button with `aria-expanded` and `aria-controls`.
- [x] Clear `detailsOpen` on successful submission.
- [x] Update tests to assert optional fields are absent in the initial static render and that quick feedback remains possible.

### Task 2: Compact Trust Copy And Styling

**Files:**
- Modify: `client/src/components/ArticleFeedback.tsx`
- Modify: `client/src/styles/visual-refresh.css`
- Modify: `client/src/i18n/common.ts`

**Interfaces:**
- Produce scoped classes: `article-feedback-head`, `article-feedback-trust`, `article-feedback-actions`, `article-feedback-detail-toggle`, `article-feedback-details`

- [x] Replace the always-visible three-column trust strip with a compact trust disclosure.
- [x] Keep private storage, optional reply, and after-submit explanations available inside the disclosure.
- [x] Add scoped CSS for compact spacing, stable controls, and no horizontal overflow.
- [x] Keep visual styling aligned with article continuation surfaces and public tokens.
- [x] Ensure no new `!important` declarations are introduced.

### Task 3: Browser Evidence And Report

**Files:**
- Modify: `scripts/audit/ui-layout.ts`
- Create: `docs/product_optimization/reports/article-feedback-progressive-disclosure-slice-2026-07-09/summary.md`
- Generated: `docs/product_optimization/reports/article-feedback-progressive-disclosure-slice-2026-07-09/ui-layout-checks.json`
- Generated screenshots in the same report directory.

**Interfaces:**
- Consume existing `AUDIT_BASE_URL` and `--output=` behavior.
- Add article feedback checks to the existing article route probe.

- [x] Extend `audit:ui` article probe to measure the feedback panel default state.
- [x] Assert feedback textarea, nickname, and email fields are absent before explicit expansion.
- [x] Assert sentiment buttons and submit button remain visible and no horizontal overflow appears.
- [x] Run focused tests for `ArticleFeedback` and `PostDetail`.
- [x] Run `corepack pnpm test`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run local production server and `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-feedback-progressive-disclosure-slice-2026-07-09/ui-layout-checks.json`.
- [x] Capture light and dark screenshots of the article continuation feedback area.
- [x] Write the report with commands, screenshots, and remaining risk.
- [x] Run `git diff --check`, inspect diff, commit the slice.

## Self-Review

- Spec coverage: covers SPEC-READ acceptance that article feedback does not interrupt the first reading pass and SPEC-UI density/contrast constraints for touched UI. It does not change Agent behavior, feedback persistence semantics, owner cockpit review, or content quality rules.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: local state and CSS class names are defined before test/report use.
