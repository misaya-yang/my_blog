# Reader Signal Builders Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the read-model `ReaderSignalKind` builder contract so all seven signal kinds have deterministic IDs, explicit severity, owner-safe excerpts, and tests.

**Architecture:** Keep this additive and storage-free. Extend `server/readerSignals.ts` with focused input types and pure builders, reuse the existing redaction/sort helpers, and keep UI/router integration out of this slice except for existing imports that already consume search-miss signals.

**Tech Stack:** TypeScript, Vitest, existing `server/readerSignals.ts`, no new dependency.

## Global Constraints

- No schema migration.
- No durable status mutation endpoint.
- No new dependency.
- Do not include private Agent context, direct contact data, subscriber emails, hidden/draft content, credentials, or raw private feedback bodies in signal excerpts, IDs, URLs, reports, or tests.
- Keep `agent_radar` accepted only as a legacy source alias and normalize new signals to `agent_question`.
- Add `in_revision` to lifecycle status without pretending local UI state is durable.
- Stable IDs must be deterministic and redacted before key generation for user-supplied text.

---

## Task 1: Signal Types And Normalization Helpers

**Files:**
- Modify: `server/readerSignals.ts`
- Modify: `server/readerSignals.test.ts`

**Interfaces:**
- Produces:
  - `normalizeSignalSource(source?: string | null): ReaderSignalKind | null`
  - `normalizeSignalText(value: string): string`
  - `ReaderSignalStatus` includes `"in_revision"`

- [x] Add `"in_revision"` to `ReaderSignalStatus`.
- [x] Add `normalizeSignalSource` so `"agent_radar"` returns `"agent_question"` and known `ReaderSignalKind` values return themselves.
- [x] Add `normalizeSignalText` that redacts direct contact data, collapses whitespace, trims, lowercases with `toLocaleLowerCase("en-US")`, and slices to 180 chars.
- [x] Test that `agent_radar` normalizes to `agent_question`, unknown sources return null, and emails/IP-like strings are redacted before stable-key generation.

## Task 2: Agent Signal Builders

**Files:**
- Modify: `server/readerSignals.ts`
- Modify: `server/readerSignals.test.ts`

**Interfaces:**
- Produces:
  - `buildAgentQuestionSignal(input: AgentSignalInput): ReaderSignal`
  - `buildAgentLowConfidenceSignal(input: AgentSignalInput): ReaderSignal`
  - `buildAgentRefusalSignal(input: AgentSignalInput & { refusalReason?: string | null }): ReaderSignal`
  - `buildAgentSignals(inputs: AgentSignalBuilderInput[]): ReaderSignal[]`

- [x] Add an `AgentSignalInput` with `question`, optional `scopeType`, `scopeValue`, `runId`, `count`, `firstSeenAt`, and `lastSeenAt`.
- [x] Implement agent question IDs as `agent_question:<scope>:<normalized_question>`, with low severity unless `count >= 3`, then medium.
- [x] Implement low-confidence IDs as `agent_low_confidence:<scope>:<normalized_question_or_run>`, with high severity for `count >= 2`, otherwise medium.
- [x] Implement refusal IDs as `agent_refusal:<scope>:<normalized_reason_or_question>`, with medium severity by default.
- [x] Ensure excerpts use redacted, bounded text and never include pasted context.
- [x] Test repeated zero-source/low-confidence severity, refusal grouping, and contact redaction.

## Task 3: Feedback And Publish Freshness Builders

**Files:**
- Modify: `server/readerSignals.ts`
- Modify: `server/readerSignals.test.ts`

**Interfaces:**
- Produces:
  - `buildArticleFeedbackSignal(input: ArticleFeedbackSignalInput): ReaderSignal`
  - `buildPublishFreshnessSignal(input: PublishFreshnessSignalInput): ReaderSignal`

- [x] Add article feedback IDs as `article_feedback:<article_slug_or_global>:<feedback_type>`.
- [x] Map repeated not-useful feedback (`count >= 2`) to high severity; otherwise medium for `not_useful` and low for other feedback.
- [x] Redact excerpt text and do not store contact values.
- [x] Add publish freshness IDs as `publish_freshness:<check_code>:<article_or_global>`.
- [x] Map hidden/draft exposure and missing public route inclusion to high severity; report unavailable to medium; all else low.
- [x] Test feedback redaction/severity and publish freshness high/medium mapping.

## Task 4: Evidence, Verification, And Commit

**Files:**
- Create: `docs/product_optimization/reports/reader-signal-builders-slice-2026-07-09/summary.md`
- Modify: `docs/superpowers/plans/2026-07-09-reader-signal-builders-slice.md`

- [x] Run `corepack pnpm test -- server/readerSignals.test.ts server/engagement.router.test.ts`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Run a secret/contact scan over touched files without scanning `.env*`.
- [x] Write report with changed files, privacy boundary, verification commands, and residual risks.
- [x] Commit with `feat: add reader signal builders`.

## Self-Review

- Spec coverage: covers the seven-kind read-model builder requirement, stable grouping keys, severity rules, source alias compatibility, `in_revision` lifecycle, and privacy redaction. Durable status storage and owner UI surfacing remain out of scope by design.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: all produced function names are defined in tasks and live in `server/readerSignals.ts`.
