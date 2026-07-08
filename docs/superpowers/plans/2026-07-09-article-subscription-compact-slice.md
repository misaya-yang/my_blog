# Article Subscription Compact Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the article-end subscription panel compact and visually consistent with the newly compact feedback panel.

**Architecture:** Preserve the existing `SubscriptionForm` public props and `engagement.subscribe` mutation. Add local disclosure state so the default article-end panel asks only for email, while optional topic and language preferences are available on demand. Style through scoped `subscription-*` classes and public light/dark tokens instead of hardcoded dark Tailwind colors.

**Tech Stack:** React, TypeScript, existing tRPC mutation, existing i18n dictionaries, scoped CSS in `visual-refresh.css`, Vitest static markup tests, Playwright-backed `audit:ui`.

## Global Constraints

- No new dependency.
- No route, DB schema, auth, subscription API, feedback API, or owner backlog contract changes.
- No public leak of hidden, draft, admin-only, private, pasted, credential, or contact data.
- No deployment, force push, schema migration, destructive data operation, or credential mutation.
- No broad CSS rewrite or page rewrite in a single commit.
- Article feedback and subscription must not interrupt the first reading pass.
- Light and dark modes must remain readable.
- Do not increase broad CSS `!important` debt without a report-level waiver.

---

### Task 1: Subscription Disclosure State And Static Test

**Files:**
- Modify: `client/src/components/SubscriptionForm.tsx`
- Create: `client/src/components/SubscriptionForm.test.tsx`
- Modify: `client/src/i18n/common.ts`

**Interfaces:**
- Preserve: `SubscriptionForm({ className, embedded, surface })`
- Add local state only: `detailsOpen: boolean`

- [x] Add `detailsOpen` state defaulting to `false`.
- [x] Keep email input, submit button, RSS link, title, and status text visible by default.
- [x] Hide optional topics input and email language segmented control until `detailsOpen` is true.
- [x] Add a details toggle button with `aria-expanded` and `aria-controls`.
- [x] Clear `detailsOpen` on successful submission.
- [x] Add i18n keys:
  - `engagement.subscribe.detailsToggle`
  - `engagement.subscribe.detailsHide`
- [x] Shorten article subscription description to:
  - EN: `Leave an email for future notes. Topics and language are optional.`
  - ZH: `留下邮箱即可；主题和语言偏好可选。`
- [x] Add a static markup test that renders `SubscriptionForm surface="article"` and asserts:
  - email placeholder appears
  - submit button appears
  - RSS link appears
  - details toggle appears with `aria-expanded="false"`
  - optional topics placeholder is absent
  - language label is absent

### Task 2: Scoped Visual Styling

**Files:**
- Modify: `client/src/components/SubscriptionForm.tsx`
- Modify: `client/src/styles/visual-refresh.css`

**Interfaces:**
- Produce scoped classes:
  - `subscription-surface`
  - `subscription-head`
  - `subscription-rss-link`
  - `subscription-core`
  - `subscription-field`
  - `subscription-details-toggle`
  - `subscription-details`
  - `subscription-language-control`
  - `subscription-language-option`
  - `subscription-success`
  - `subscription-error`

- [x] Replace hardcoded subscription text and input colors with scoped CSS token styling.
- [x] Make the language segmented control quiet: no gray block fill in the default article-end state because it is hidden until expanded.
- [x] Keep the expanded language control readable in light and dark modes.
- [x] Keep all subscription controls within their parent width with `min-width: 0` and no horizontal overflow.
- [x] Ensure no new `!important` declarations are introduced.

### Task 3: Audit, Evidence, And Commit

**Files:**
- Modify: `scripts/audit/ui-layout.ts`
- Create: `docs/product_optimization/reports/article-subscription-compact-slice-2026-07-09/summary.md`
- Generated: `docs/product_optimization/reports/article-subscription-compact-slice-2026-07-09/ui-layout-checks.json`
- Generated screenshots in the same report directory.

**Interfaces:**
- Consume existing `AUDIT_BASE_URL` and `--output=` behavior.
- Add subscription checks to the existing article route probe.

- [x] Extend `audit:ui` article probe to measure `.article-subscription-panel`.
- [x] Assert subscription has no horizontal overflow.
- [x] Assert optional topics and language control are absent before explicit expansion.
- [x] Assert email input, details toggle, submit button, and RSS link remain visible.
- [x] Assert article subscription default panel is compact enough for reading continuation:
  - mobile height <= `340px`
  - desktop height <= `300px`
- [x] Run `corepack pnpm test -- client/src/components/SubscriptionForm.test.tsx client/src/pages/PostDetail.test.ts`.
- [x] Run `corepack pnpm test`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run local production server and `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/article-subscription-compact-slice-2026-07-09/ui-layout-checks.json`.
- [x] Capture light and dark screenshots of the article continuation feedback/subscription area on desktop and mobile.
- [x] Write the report with commands, screenshots, audit metrics, and remaining risk.
- [x] Run `git diff --check`, inspect diff, run a secret scan over touched files, and commit the slice.

## Self-Review

- Spec coverage: covers the concrete visual regression from the prior feedback slice report and keeps article-end subscription from interrupting the reading pass.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: class names, i18n keys, and local state are defined before being referenced in tests and audit checks.
