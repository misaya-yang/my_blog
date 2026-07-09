# Content Rubric Boundary Heading Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deterministic content rubric recognize existing boundary/limitation sections titled `Failure Boundaries` so articles with explicit caveats are not reported as missing limitation coverage.

**Primary Spec:** `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`

**Scope:** Content-audit accuracy only. No article rewrite, route/API/schema/auth/UI/Agent/dependency/deploy change.

## Evidence Before Editing

- Current `gated_ffn_blog.md` contains `## 12. Failure Boundaries` and explicit caveats.
- Current audit still reports `gated_ffn_blog.md` limitation as missing because `scripts/audit/content-quality.ts` only matches the singular English phrase `failure mode`.

## Tasks

- [x] Extend the limitation rubric pattern to recognize `failure boundary`, `failure boundaries`, and `failure modes`.
- [x] Add a focused test proving `Failure Boundaries` satisfies the limitation dimension.
- [x] Run `corepack pnpm test -- scripts/audit/content-quality.test.ts`.
- [x] Run `corepack pnpm content:audit -- --output=docs/product_optimization/reports/content-rubric-boundary-heading-slice-2026-07-09/content-quality-report.json`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write `docs/product_optimization/reports/content-rubric-boundary-heading-slice-2026-07-09/summary.md`.
- [x] Commit with `test: recognize failure boundaries in content rubric`.

## Acceptance

- The new test fails before the pattern change and passes after it.
- `gated_ffn_blog.md` no longer appears as missing the limitation dimension.
- Content audit still has 0 suggestions, 0 warnings, and 0 failures.
