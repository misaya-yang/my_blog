# Seed Copy Voice Guard Slice

Date: 2026-07-09

## Scope

This slice strengthens article quality gates for seed titles and excerpts. It does not rewrite article technical substance, change routes, mutate the database, refresh deployed content, or reindex Agent knowledge.

## Changes

- Added non-blocking `suggestion` findings for generic public seed titles:
  - `seed.generic_title_voice`
- Added non-blocking `suggestion` findings for generic public seed excerpts:
  - `seed.generic_excerpt_voice_suggestion`
- Covered Chinese template phrases such as `一文看懂`, `全面解析`, `终极指南`, `范式变革`, and `革命性`.
- Covered English AI-marketing phrases such as `ultimate guide`, `deep dive`, `game-changing`, `revolutionary`, `paradigm shift`, `significantly improves`, and `dramatically improves`.
- Kept hidden/draft seed metadata out of public voice suggestions.
- Preserved existing warning-level `seed.generic_excerpt_voice` behavior and existing `issues` / `findings` report compatibility.

## Evidence

Content audit output:

- `content-quality-report.json`

Current corpus:

- Article files: `9`
- Seed posts: `9`
- Suggestions: `0`
- Warnings: `0`
- Failures: `0`

## Verification

- `corepack pnpm test -- scripts/audit/content-quality.test.ts client/src/i18n/copyVoice.test.ts`
  - Passed. Vitest ran 64 files and 369 tests.
- `corepack pnpm content:audit -- --output=docs/product_optimization/reports/seed-copy-voice-guard-slice-2026-07-09/content-quality-report.json`
  - Passed with 0 suggestions, 0 warnings, 0 failures.
- `corepack pnpm test`
  - Passed. Vitest ran 64 files and 369 tests.
- `corepack pnpm check`
  - Passed.
- `corepack pnpm build`
  - Passed.

## Remaining Risk

- This is still deterministic pattern matching. It will catch high-confidence generic phrasing, not every awkward sentence.
- No article body rewrite was done in this slice because the current corpus is already clean under the existing and new audit rules.
