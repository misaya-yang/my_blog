# PO-08 Publish Quality and Knowledge Freshness Report

## GLOBAL_GOAL_PROGRESS

PO-00 through PO-08 are complete. Product Optimization roadmap is complete.

## CURRENT_PHASE

PO-08 - Publish Quality and Knowledge Freshness

## STATUS

complete

## CHANGED_FILES

- `package.json`
- `seed-blog.mjs`
- `scripts/audit/baseline.ts`
- `scripts/audit/publish-freshness.ts`
- `server/db.ts`
- `docs/deployment.md`
- `docs/harness_engine/reports/latest-baseline.json`
- `docs/product_optimization/reports/po-08-publish-quality-freshness-report.md`
- `docs/product_optimization/reports/po-08-publish-freshness-latest.json`
- `docs/product_optimization/reports/po-08-browser-checks.json`
- `docs/product_optimization/reports/po-08-browser-snapshots/*`
- `docs/product_optimization/reports/po-08-screenshots/*`

## VALIDATION_COMMANDS

- `pnpm check` - pass
- `pnpm test` - pass, 24 files / 126 tests. Existing `OAUTH_SERVER_URL` warning appears in `server/seo.test.ts`.
- `pnpm build` - pass. Existing large chunk-size warning remains; largest JS gzip in baseline is 423113 bytes.
- `pnpm content:publish` - pass. Snapshot, seed, reindex, and publish freshness gate completed with 4 public posts, 57 chunks, and 0 blockers.
- `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick` - pass. 14 route checks, 0 skipped routes, 5 known gaps.

## BROWSER_CHECKS

Evidence:

- `docs/product_optimization/reports/po-08-browser-checks.json`
- `docs/product_optimization/reports/po-08-browser-snapshots/home.txt`
- `docs/product_optimization/reports/po-08-browser-snapshots/archive.txt`
- `docs/product_optimization/reports/po-08-browser-snapshots/rss.xml.txt`
- `docs/product_optimization/reports/po-08-browser-snapshots/sitemap.xml.txt`
- `docs/product_optimization/reports/po-08-browser-snapshots/public-article.txt`
- `docs/product_optimization/reports/po-08-browser-snapshots/manage-agent-index-status.txt`
- `docs/product_optimization/reports/po-08-screenshots/home.png`
- `docs/product_optimization/reports/po-08-screenshots/archive.png`
- `docs/product_optimization/reports/po-08-screenshots/rss.xml.png`
- `docs/product_optimization/reports/po-08-screenshots/sitemap.xml.png`
- `docs/product_optimization/reports/po-08-screenshots/public-article.png`
- `docs/product_optimization/reports/po-08-screenshots/manage-agent-index-status.png`

Routes and checks:

- `/` public inventory: pass. Home shows the public Agent Loop, Evidence Packet, and IsoHC inventory while EVQ-Cosh stays hidden.
- `/archive` public inventory: pass. Archive shows public posts and does not expose the hidden EVQ-Cosh draft.
- `/rss.xml`: pass. Feed includes 4 public post slugs and excludes the hidden draft slug.
- `/sitemap.xml`: pass. Sitemap includes public posts plus archive/category/tag routes and excludes the hidden draft slug.
- `/post/agent-loop-observable-tool-using-agents`: pass. Public article renders title and series context without hidden draft leakage.
- `/manage/agent`: pass. Index status shows 4/4 public coverage, 57 chunks, and hidden/draft exclusion.

All browser checks were run with the Codex in-app Browser only.

## ACCEPTANCE_GATES

- Public inventory matches feeds/discovery: pass. Publish freshness report and browser checks agree on 4 public posts across discovery, archive, RSS, and sitemap.
- Hidden/draft content stays hidden: pass. `evq-cosh-frequency-allocation` remains draft/hidden and is absent from public discovery, RSS, sitemap, and Agent chunks.
- Agent chunks match public inventory: pass. Reindex status shows 4/4 public posts indexed, 57 chunks, no stale/extra slugs, and 1 hidden/draft excluded.
- Repeated publish does not silently drift old dates: pass. `pnpm content:publish` compares a before snapshot against the post-publish inventory; latest report has no `publishedAt` or unchanged-material `updatedAt` drift.

## NOTES

- `pnpm content:publish` now snapshots dates, runs seed, rebuilds Agent knowledge, and writes `docs/product_optimization/reports/po-08-publish-freshness-latest.json`.
- `seed-blog.mjs` now avoids no-op post updates on conflict, so the `posts_touch_updated_at` trigger does not refresh article dates unless material post fields change.
- `server/db.ts` now loads taxonomy sequentially. This avoids Supabase pooler/statement-timeout instability observed during RSS and browser checks.

## RISKS_OR_BLOCKERS

- No blocker.
- The known bundle-size warning remains outside PO-08.
- Baseline still reports 5 known gaps; they are existing audit warnings and did not block this phase.

## NEXT_PHASE

None. Product Optimization roadmap PO-00 through PO-08 is complete.
