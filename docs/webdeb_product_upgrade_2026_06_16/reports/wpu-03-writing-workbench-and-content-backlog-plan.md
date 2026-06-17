# WPU-03 Writing Workbench And Content Backlog Plan

**Date:** 2026-06-16

## Objective

Turn private reader feedback, zero-result searches, and Agent question radar signals into an owner-only writing backlog with clear privacy boundaries and a path into drafting.

## Scope

- Keep public/community features out of scope.
- Use existing owner-only engagement and Agent admin routes.
- Avoid a schema migration unless strictly required.
- Improve signal aggregation, privacy redaction, owner workflow visibility, and backlog-to-draft continuity.

## Execution Steps

1. Inspect `/manage`, `/manage/agent`, `/write`, engagement radar, search misses, Agent question radar, and owner tests.
2. Add backend redaction for direct contact data in search misses and feedback-derived writing evidence.
3. Add an owner-only `writingBacklog` aggregation to `engagement.contentRadar.summary`.
4. Add a `/manage` writing backlog panel that combines feedback, search misses, and Agent question radar ideas.
5. Add `/write?idea=...&source=...` draft seeding so backlog items open a useful Markdown skeleton.
6. Add or update tests for privacy redaction and backlog aggregation.
7. Run owner workflow tests, typecheck, full tests, build, and browser fallback checks.
8. Record persistence decisions and residual gaps in the phase report and harness files.

## Acceptance Criteria

- Owner has a single writing backlog/signal hub on `/manage`.
- Backlog includes feedback, search misses, and Agent question radar candidates.
- Backlog evidence redacts direct contact data.
- Owner can open a draft from a backlog item without losing the signal title/source.
- Feedback status remains database-backed.
- Agent idea status persistence gap is explicit because no migration was approved or introduced.
- Owner route browser evidence or unauthenticated fallback plus code-level auth/test evidence is recorded.
