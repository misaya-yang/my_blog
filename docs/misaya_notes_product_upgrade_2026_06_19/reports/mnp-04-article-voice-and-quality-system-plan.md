# MNP-04 Article Voice And Quality System Plan

**Phase:** MNP-04 Article Voice And Quality System

**Feature Oracle:** MNP-F005

**Date:** 2026-06-20

---

## Scope

Execute a bounded content-quality pass focused on public-facing summaries, reader labels, Agent prompts, and the highest-signal article intros/conclusions. Preserve slugs, formulas, code blocks, publication dates, visibility, hidden/draft status, and technical claims unless a line is only wording.

## Baseline

| Check | Result |
| --- | --- |
| `pnpm content:audit` | passed, 14 Markdown files, 9 seed posts, 0 warnings, 0 failures |
| `git status --short --branch` | clean on `main...origin/main` |

## Work Plan

| Requirement | Likely Files | Validation |
| --- | --- | --- |
| Replace generic metadata/excerpts with concrete technical summaries. | `seed-blog.mjs`, `server/publicSeedPosts.ts` | `pnpm content:audit`; seed/public article tests |
| Remove vague reader labels such as map/surface/implementation mapping where they appear as UI copy. | `client/src/i18n/post.ts`, `client/src/i18n/agent.ts`, possibly `client/src/i18n/home.ts` | focused i18n/code search; `pnpm check` |
| Rewrite a small set of intros/conclusions that repeat "看起来/真正/这里" or read like self-referential setup. | selected top-level Markdown posts | `pnpm content:audit`; browser reader smoke |
| Add a lightweight audit guard for generic seed excerpts so this phase stays enforceable. | `scripts/audit/content-quality.ts`, `scripts/audit/content-quality.test.ts` | focused Vitest for content audit |
| Write durable MNP-04 evidence and next-phase handoff. | harness runtime docs | harness validator, report, oracle update |

## Non-Goals

- No database migration or production data mutation.
- No content publishing/reindexing unless release is explicitly requested after local evidence.
- No hidden/draft publication status changes.
- No formula, code listing, benchmark, citation, slug, or date changes.
- No broad rewrite of all article bodies in one pass.

## Acceptance Evidence Target

- Content audit and focused tests prove the seed/UI copy guard.
- Browser/runtime evidence confirms at least one public reader route still renders the revised copy.
- `feature-oracle.json`, `source-packet.md`, `continuity-ledger.md`, `progress-log.md`, `agent-handoff.md`, and `next-window-prompt.md` are updated with MNP-04 evidence.
