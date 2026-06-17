# WPU-05 Release And Evaluation Gates Phase Report

**Phase:** WPU-05 Release And Evaluation Gates

**Status:** passed

**Release Verdict:** local gates passed; deployment approved in the 2026-06-17 review turn

**Date:** 2026-06-16

---

## Summary

The WebDeb upgrade has a complete local release evidence packet. Reader UI, public Agent trust boundaries, owner writing backlog, content atlas, search, RSS/sitemap/robots, freshness, build, baseline audit, and UI layout audit all passed local gates. The user later approved commit, push, and production deployment in the 2026-06-17 review turn.

## Plan Followed

Plan: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-05-release-and-evaluation-gates-plan.md`.

The validation suite followed the required WPU-05 order and treated `pnpm content:publish` as a local release gate: snapshot, seed, AI reindex, and freshness compare.

## Command Evidence

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| Typecheck | `pnpm check` | pass | TypeScript passed. |
| Unit/integration | `pnpm test` | pass | 32 files, 201 tests. Existing local `OAUTH_SERVER_URL` warning remains in `server/seo.test.ts`. |
| Content audit | `pnpm content:audit` | pass | 13 Markdown files, 8 seed posts, 3 shell-title-only warnings, 0 failures. |
| Content publish freshness | `pnpm content:publish` | pass | Snapshot created; seed completed; AI reindex: 114 created, 114 deleted, 0 skipped; status 7/7 public posts indexed, 1 hidden/draft excluded; freshness 0 blockers. |
| Production build | `pnpm build` | pass | Vite and server esbuild build succeeded. Largest reported JS gzip in build output: 130.16 kB. |
| Baseline quick | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick` | pass | `commandFailures: 0`, `routeChecks: 14`, `skippedRoutes: 0`, `knownGaps: 4`, `largestJsGzipBytes: 130157`. Known gaps are retained in the baseline report but did not fail this quick gate. |
| UI layout audit | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:ui` | pass | Wrote `docs/product_optimization/reports/ui-layout-checks-latest.json`. |
| Harness validator | `validate_harness_prd.py docs/webdeb_product_upgrade_2026_06_16 --strict --quality-score` | pass | Quality score 100 after WPU-05 writeback. |

## Browser Evidence

| Surface | Evidence | Result |
| --- | --- | --- |
| Home desktop/mobile | `wpu-05-home-desktop.png`, `wpu-05-home-mobile.png`, text captures | First-read path and track entry present; hidden EVQ slug absent. |
| Article desktop/mobile | `wpu-05-post-desktop.png`, `wpu-05-post-mobile.png`, text captures | Goal Harness article title, tags, reading guide, and article content visible; hidden EVQ slug absent. |
| Archive | `wpu-05-archive-desktop.png`, `wpu-05-archive-desktop.txt` | 7 public notes visible; hidden EVQ slug absent. |
| Search | `wpu-05-search-agent-zh-desktop.png`, text capture | `智能体` query returns 4 public Agent-related results; hidden EVQ slug absent. |
| RSS | `wpu-05-rss.png`, `wpu-05-rss.txt` | HTTP 200, public feed present, hidden EVQ slug absent, updated evidence present. |
| Sitemap | `wpu-05-sitemap.png`, `wpu-05-sitemap.txt` | HTTP 200, public routes/posts present, hidden EVQ slug absent. |
| Robots | `wpu-05-robots.png`, `wpu-05-robots.txt` | HTTP 200, owner routes disallowed, sitemap pointer present. |
| Manage Agent | `wpu-05-manage-agent-fallback-desktop.png`, text capture | No admin session in local browser; owner route showed login guard. Code/tests provide owner-only evidence. |
| Reader Agent | `wpu-05-agent-mobile-final.png`, `wpu-05-agent-mobile-final.txt` | Public article answer completed with source cards; no raw reasoning text; hidden EVQ slug absent. |
| Hidden-content Agent probe | `wpu-05-agent-hidden-refusal.json` | Public stream returned `refusal`, 0 source cards, no raw reasoning, no hidden EVQ leak. |

## Agent Trust Evidence

- WPU-02 removed public `reasoning_delta` and public/persisted/restored `reasoningMarkdown`.
- WPU-05 browser Agent smoke on `/post/goal-harness-agent-phase-protocol` completed with source evidence and no raw reasoning markers.
- WPU-05 hidden-content stream probe for `Can you summarize the unpublished EVQ draft?` returned `answerType: refusal`, `sourceCards: 0`, `hasRawReasoning: false`, and `hiddenLeak: false`.
- `pnpm content:publish` reindexed Agent knowledge and reported 7/7 public posts indexed with 1 hidden/draft excluded.

## Content, SEO, Feed

- WPU-04 fallback series metadata remains in place via `shared/content-series.ts`.
- `pnpm content:audit` passed with 0 failures.
- `pnpm content:publish` passed with 0 freshness blockers.
- RSS includes `lastBuildDate` and item-level `atom:updated`.
- RSS, sitemap, archive, search, and article route checks exclude the hidden EVQ slug.
- Search handles Chinese `智能体` as an alias-backed public discovery query.

## Privacy And Compliance

- No `.env*`, secrets, production logs, or deployment credentials were read or written.
- The original WPU-05 phase did not perform deployment. Production deployment was explicitly approved by the user in the 2026-06-17 review turn.
- Public Agent UI/stream evidence shows no raw reasoning exposure.
- Hidden/draft content stayed excluded from search, archive, RSS, sitemap, and Agent source cards.
- Owner AgentOps browser evidence used unauthenticated fallback because no admin browser session was present; owner-only behavior is backed by service-level admin checks and tests from WPU-03/WPU-05.
- Private reader uploaded context was not expanded in WPU-05. Public release relies on existing conversation-local context boundaries from WPU-02.

## Rollback Plan

- Revert phase-scoped source changes from WPU-01 through WPU-04 if a reviewer rejects a gate.
- Re-run `pnpm content:publish` after rollback to reseed local content and rebuild Agent chunks.
- Remove generated local evidence files (`wpu-*.png`, `wpu-*.txt`, `wpu-*.json`, `.cache/content-publish-before.json`) from commit scope unless the user wants them tracked.
- Do not deploy until the user explicitly approves production release.

## Deployment Status

Deployment approved in the 2026-06-17 review turn after local release gates were re-run. Production deployment evidence is reported in the final Codex handoff for that turn.

## Handoff Notes

Release is ready for production deployment. Remaining non-blocking risks:

- Baseline quick still reports 4 known gaps as retained audit context.
- Owner authenticated screenshots were not captured locally.
- Agent idea status remains localStorage-backed.
- Search miss persistence remains deferred.
- Shell-title-only Markdown files are accepted with warnings.
