# MNP-04 Article Voice And Quality System Report

**Phase:** MNP-04 Article Voice And Quality System

**Status:** passed

**Date:** 2026-06-20

---

## Summary

Completed a scoped article/UI-copy voice pass for public-facing content. The slice replaces generic seed excerpts, stale reader labels, repeated abstract section headings, and several self-referential article openings with concrete technical wording. It also adds regression checks so seed excerpts, i18n labels, and fallback public seed posts do not quietly drift back.

## Plan Followed

Used `reports/mnp-04-article-voice-and-quality-system-plan.md`. The implementation stayed inside the planned content/copy/audit boundary: no slugs, formulas, code listings, publication dates, visibility, hidden/draft status, or schema contracts were changed.

## Files Changed

- `seed-blog.mjs` and `server/publicSeedPosts.ts`: rewrote public seed excerpts for LLM RL and Goal Harness, keeping fallback data in sync.
- Top-level public Markdown posts: tightened selected introductions, conclusions, and repeated headings in the Agent/RAG/IsoHC/Flow/Gated FFN articles.
- `client/src/i18n/home.ts`, `post.ts`, and `agent.ts`: replaced stale/internal reader labels and Chinese copy that exposed unnecessary English or literal translations.
- `client/src/components/ArticleCard.tsx` and `client/src/pages/Home.tsx`: localized series labels through `shared/content-series` instead of showing raw stored English series titles in Chinese UI.
- `scripts/audit/content-quality.ts` and tests: added generic public seed excerpt warnings and kept math-heavy caveat prose from false positives.
- `client/src/i18n/copyVoice.test.ts`: added a UI-copy guard for stale internal wording.
- `server/publicSeedPosts.test.ts`: added seed/fallback title and excerpt parity coverage.
- `docs/product_optimization/reports/po-08-publish-freshness-latest.json`: refreshed after content publish.
- `reports/mnp-04-runtime/zh-copy-runtime-evidence.json`: saved local production runtime evidence for updated zh copy.

## Validation Evidence

| Gate | Command or Check | Result | Notes |
| --- | --- | --- | --- |
| Whitespace | `git diff --check` | passed | No patch whitespace issues. |
| Typecheck | `pnpm check` | passed | `tsc --noEmit`. |
| Focused regression | `pnpm exec vitest run scripts/audit/content-quality.test.ts server/publicSeedPosts.test.ts client/src/i18n/copyVoice.test.ts client/src/components/agent/sourceCards.test.ts client/src/components/agent/BlogAgentRoot.test.ts shared/heading-anchors.test.ts` | passed | 6 files, 38 tests. |
| Full regression | `pnpm test` | passed | 39 files, 238 tests. Existing OAuth env warning did not fail tests. |
| Build | `pnpm build` | passed | Vite and server bundle completed. |
| Content audit | `pnpm content:audit` | passed | 14 Markdown files, 9 seed posts, 0 warnings, 0 failures. |
| Content publish | `pnpm content:publish` | passed | 8 public posts, 1 hidden/draft excluded, 142 chunks reindexed, 0 blockers. Required because local production runtime still read old DB content after code-only build. |
| Runtime smoke | Playwright against `http://localhost:4173` | passed | `reports/mnp-04-runtime/zh-copy-runtime-evidence.json` checked `/`, `/search?q=zzzz-no-hit-ui-audit`, and `/post/goal-harness-agent-phase-protocol` in zh; 3 routes checked, 0 failed. |
| Production deploy | `npx vercel --prod --yes` | passed | Deployment `dpl_Gi2DggdB3L6ovnLQhYHY7icUtQn4` reached READY and aliased to `https://misaya.online`. |
| Production smoke | `curl` plus Playwright against `https://misaya.online` | passed | `/`, `/post/goal-harness-agent-phase-protocol`, `/search?q=zzzz-no-hit-ui-audit`, and `/sitemap.xml` returned 200; `reports/mnp-04-runtime/prod-zh-copy-smoke.json` checked 3 zh routes, 0 failed. |

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNP-F005 | failing | passing | This report; content audit; focused/full tests; build; `content:publish`; runtime zh copy evidence. |

## Progress Log Update

Append a generator/evaluator entry for MNP-04 and move the active handoff to MNP-05. MNP-F006 remains failing until CSS/code simplification evidence exists.

## Screenshots, Logs, or Eval Tables

- Runtime text evidence: `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-04-runtime/zh-copy-runtime-evidence.json`
- Production runtime text evidence: `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-04-runtime/prod-zh-copy-smoke.json`
- Publish freshness report: `docs/product_optimization/reports/po-08-publish-freshness-latest.json`
- No screenshot artifact was required for this copy-focused slice; the runtime artifact records route status, required text, forbidden copy checks, and short page text samples.

## Blockers and Deviations

- Initial local production browser smoke failed because the app read old article content from the database, even though code and seed files were updated. This was fixed with the project-owned `pnpm content:publish` flow after explicit user deployment approval.
- `pnpm content:publish` uses the existing seed behavior, including cleanup of legacy `dynamic-frequency-rope` and old category leftovers. No new destructive cleanup was introduced by MNP-04.

## Handoff Notes

MNP-04 unlocks MNP-05. The next phase should focus on code simplification and CSS architecture, especially `visual-refresh.css`, `owner-tools.css`, `PostDetail.tsx`, and `BlogAgentRoot.tsx`, while preserving the MNP-02 reading contracts, the MNP-03 `anchorId` source-card contract, and the MNP-04 seed/fallback/i18n copy guards.
