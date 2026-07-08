# Seed Copy Voice Guard Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent article titles and seed excerpts from drifting into generic AI-marketing or template-blog phrasing.

**Architecture:** Extend the existing deterministic `content-quality` audit instead of adding a new tool. Keep existing failures/warnings compatible, add non-blocking `suggestion` findings for title/excerpt voice issues, and prove the current corpus remains clean. No article technical arguments are rewritten in this slice.

**Tech Stack:** TypeScript audit script, Vitest, existing `pnpm content:audit`, repo-local Markdown/seed metadata.

## Global Constraints

- No new dependency.
- No route, DB schema, auth, subscription API, feedback API, or owner backlog contract changes.
- No public leak of hidden, draft, admin-only, private, pasted, credential, or contact data.
- No deployment, force push, schema migration, destructive data operation, or credential mutation.
- Do not rewrite article technical substance in this slice.
- Article voice checks must remain deterministic, local, and non-blocking unless they detect existing structural failures.
- Existing `content:audit` consumers must keep receiving `issues` and `findings`.

---

### Task 1: Seed Title And Excerpt Voice Rules

**Files:**
- Modify: `scripts/audit/content-quality.ts`
- Modify: `scripts/audit/content-quality.test.ts`

**Interfaces:**
- Preserve: `runContentQualityAudit(projectRoot?: string): Promise<ContentQualityReport>`
- Preserve: `ContentQualityIssue` shape.
- Produce new suggestion codes:
  - `seed.generic_title_voice`
  - `seed.generic_excerpt_voice_suggestion`

- [x] Add deterministic title voice patterns for:
  - `一文看懂`
  - `一文读懂`
  - `一文搞懂`
  - `全面解析`
  - `全面梳理`
  - `终极指南`
  - `范式变革`
  - `革命性`
  - `ultimate guide`
  - `complete guide`
  - `comprehensive guide`
  - `deep dive`
  - `game-changing`
  - `revolutionary`
  - `paradigm shift`
- [x] Add deterministic excerpt voice suggestion patterns for:
  - `一文看懂`
  - `全面解析`
  - `终极指南`
  - `范式变革`
  - `革命性`
  - `deep dive`
  - `game-changing`
  - `revolutionary`
  - `paradigm shift`
  - `significantly improves`
  - `dramatically improves`
- [x] Apply these only to public published seed posts.
- [x] Keep the existing warning-level `seed.generic_excerpt_voice` checks unchanged for current consumers.
- [x] Add one test where a public title and excerpt produce the new suggestion codes.
- [x] Add one test where a hidden draft title and excerpt with the same phrases do not produce public voice suggestions.

### Task 2: Current Corpus Evidence

**Files:**
- Create: `docs/product_optimization/reports/seed-copy-voice-guard-slice-2026-07-09/content-quality-report.json`
- Create: `docs/product_optimization/reports/seed-copy-voice-guard-slice-2026-07-09/summary.md`

**Interfaces:**
- Use existing `corepack pnpm content:audit -- --output=<path>` behavior.

- [x] Run `corepack pnpm test -- scripts/audit/content-quality.test.ts client/src/i18n/copyVoice.test.ts`.
- [x] Run `corepack pnpm content:audit -- --output=docs/product_optimization/reports/seed-copy-voice-guard-slice-2026-07-09/content-quality-report.json`.
- [x] Run `corepack pnpm test`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Confirm current corpus remains at `0` suggestions, `0` warnings, and `0` failures.
- [x] Write the report with rule scope, command evidence, and remaining risk.
- [x] Run `git diff --check`, inspect diff, run a secret scan over touched files, and commit the slice.

## Self-Review

- Spec coverage: covers the article quality objective by preventing high-confidence generic title/excerpt voice drift without rewriting technical substance.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: new finding codes are plain `ContentQualityIssue.code` strings and do not require type changes.
