# Feedback Reader Signal Bridge Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface article feedback opportunities as normalized `article_feedback` reader signals in the existing owner-only content radar summary.

**Architecture:** Reuse `buildArticleFeedbackSignal` from `server/readerSignals.ts` inside `server/engagement.router.ts`. Keep the existing writing backlog unchanged, concatenate feedback and search-miss signals, sort them with the existing builder sort path, and keep all output owner-only behind the current admin guard.

**Tech Stack:** TypeScript, tRPC router, Vitest, no new dependency.

## Global Constraints

- No schema migration or durable status mutation.
- No UI layout change.
- No private feedback contact data in signal IDs, excerpts, URLs, reports, or tests.
- Keep existing `search_miss` reader signal behavior compatible.
- Preserve owner-only access through the existing content radar admin guard.

---

## Task 1: Router Signal Bridge

**Files:**
- Modify: `server/engagement.router.ts`
- Modify: `server/engagement.router.test.ts`

**Interfaces:**
- Consumes: `buildArticleFeedbackSignal(input)` and `buildSearchMissSignals(inputs)` from `server/readerSignals.ts`.
- Produces: `summary.readerSignals.items` containing both `search_miss` and `article_feedback` signals.

- [x] Import `buildArticleFeedbackSignal`.
- [x] Convert each `feedbackOpportunities` entry into one `article_feedback` signal with `articleSlug`, `feedbackType: "not_useful"` when `notUseful > 0` else `"feedback"`, `count: total`, redacted excerpt from sample messages or post title, and first/last seen dates from `latestAt`.
- [x] Combine feedback signals with existing search miss signals and sort by severity/count/recency using existing signal ordering behavior.
- [x] Keep `readerSignals.total` equal to combined item count.
- [x] Update router tests to assert owner-only summary includes redacted `article_feedback` signals and does not leak raw feedback contact data.

## Task 2: Evidence And Commit

**Files:**
- Create: `docs/product_optimization/reports/feedback-reader-signal-bridge-slice-2026-07-09/summary.md`
- Modify: `docs/superpowers/plans/2026-07-09-feedback-reader-signal-bridge-slice.md`

- [x] Run `corepack pnpm test -- server/engagement.router.test.ts server/readerSignals.test.ts`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Run a secret/contact scan over touched files without scanning `.env*`.
- [x] Write report with changed files, privacy boundary, verification commands, and residual risks.
- [x] Commit with `feat: bridge feedback reader signals`.

## Self-Review

- Spec coverage: implements the owner summary side of feedback-to-reader-signal normalization while leaving durable lifecycle storage and UI work out of scope.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: consumes the builder names introduced in the previous slice.
