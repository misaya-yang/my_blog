# Flow Matching Boundary Heading Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Flow Matching article's limitation section explicit to readers and to the deterministic content rubric.

**Primary Spec:** `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`

**Scope:** One article heading and evidence report. No code, UI, route, schema, auth, Agent, dependency, deployment, or reindex change.

## Evidence Before Editing

- `flow_matching_generative_transport.md` has a section titled `## 10. 不要把它神化`.
- The section already contains limitation content about discretization error, path sensitivity, conditional coupling, guidance uncertainty, and non-exclusivity.
- The deterministic rubric reports limitation as missing because the heading does not clearly signal a limitation or boundary.

## Tasks

- [x] Rename `## 10. 不要把它神化` to a clearer boundary heading.
- [x] Run `corepack pnpm content:audit -- --output=docs/product_optimization/reports/flow-matching-boundary-heading-slice-2026-07-09/content-quality-report.json`.
- [x] Run `corepack pnpm test -- scripts/audit/content-quality.test.ts`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write `docs/product_optimization/reports/flow-matching-boundary-heading-slice-2026-07-09/summary.md`.
- [x] Commit with `docs: clarify flow matching limitations`.

## Acceptance

- Flow Matching limitation rubric becomes present.
- Content audit reports 0 suggestions, 0 warnings, 0 failures.
- Rubric missing dimensions drop to 0 for the current article corpus.
