# Manage Reader Signal Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show normalized reader signals inside `/manage` Content Radar so the owner can see feedback and search-miss signal kinds, severity, count, and safe excerpts without opening raw data first.

**Architecture:** Keep data contract unchanged and consume `radar.readerSignals.items` already returned by `engagement.contentRadar.summary()`. Add a tiny client helper for labels/ordering-safe display and render a compact ledger in the existing Content Radar panel right column below subscription summary.

**Tech Stack:** React, TypeScript, Vitest, existing Manage page and i18n, no new dependency.

## Global Constraints

- No backend route, DB schema, auth, or durable status mutation changes.
- No private feedback contact data, subscriber emails, Agent private context, credentials, or raw private payloads in UI, reports, or tests.
- Keep reader signal UI compact and owner-tool appropriate; no landing-page styling or new decorative card stack.
- Keep `/manage` existing feedback opportunities, subscription summary, and writing backlog behavior unchanged.

---

## Task 1: Display Helper

**Files:**
- Create: `client/src/pages/manageReaderSignals.ts`
- Create: `client/src/pages/manageReaderSignals.test.ts`

**Interfaces:**
- Produces:
  - `type ManageReaderSignal`
  - `getReaderSignalKindLabel(kind, t): string`
  - `getReaderSignalSeverityLabel(severity, t): string`

- [x] Add `ManageReaderSignal` with `id`, `kind`, `severity`, `status`, optional `articleSlug`, `query`, `excerpt`, `count`, `sourceRef`, and timestamps.
- [x] Add kind labels for `search_miss`, `article_feedback`, `agent_question`, `agent_low_confidence`, `agent_refusal`, `content_audit`, and `publish_freshness`.
- [x] Add severity labels for `high`, `medium`, and `low`.
- [x] Add tests that unknown future kinds and severities fall back to the raw value.

## Task 2: Manage Content Radar Ledger

**Files:**
- Modify: `client/src/pages/Manage.tsx`
- Modify: `client/src/i18n/manage.ts`

**Interfaces:**
- Consumes: `radar.readerSignals.items?: ManageReaderSignal[]`.
- Produces: compact owner-only signal ledger in `ContentRadarPanel`.

- [x] Add `readerSignals?: { total?: number; items?: ManageReaderSignal[] }` to `EngagementRadarSummary`.
- [x] Import display helpers in `Manage.tsx`.
- [x] Render top 5 reader signals below subscription summary with kind, severity, count, article/query/source reference, and bounded excerpt.
- [x] Add empty copy for no normalized signals.
- [x] Add i18n keys for ledger title, description, count, source labels, and severity/kind labels.

## Task 3: Evidence And Commit

**Files:**
- Create: `docs/product_optimization/reports/manage-reader-signal-ledger-slice-2026-07-09/summary.md`
- Modify: `docs/superpowers/plans/2026-07-09-manage-reader-signal-ledger-slice.md`

- [x] Run `corepack pnpm test -- client/src/pages/manageReaderSignals.test.ts server/engagement.router.test.ts`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Run a secret/contact scan over touched files without scanning `.env*`.
- [x] Write report with changed files, privacy boundary, verification commands, and residual risks.
- [x] Commit with `feat: show reader signals in manage`.

## Self-Review

- Spec coverage: makes normalized reader signals visible in owner tools while preserving existing read-model semantics.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: helper types match the server `ReaderSignal` shape currently consumed through tRPC.
