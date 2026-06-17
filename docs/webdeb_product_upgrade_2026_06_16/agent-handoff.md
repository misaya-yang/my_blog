# WebDeb Product Upgrade PRD Harness Agent Handoff

**Created:** 2026-06-16

**Harness Folder:** `docs/webdeb_product_upgrade_2026_06_16`

---

## Planner Notes

- WPU-00 baseline is complete and recorded in `reports/wpu-00-baseline-product-audit-report.md`.
- Source packet: `source-packet.md`.
- Feature oracle: `feature-oracle.json`.
- Continuity ledger: `continuity-ledger.md`.
- Next target phase: complete.
- Next target phase file: none.
- Next feature-oracle item: complete.

## Generator Notes

- Work on one phase and one feature-oracle item at a time.
- WPU-01 passed. Preserve the new `StartHerePath` and final mobile reader parity override in `client/src/styles/visual-refresh.css`.
- WPU-02 passed. Preserve the public Agent trust contract: no public `reasoning_delta`, no public/persisted/restored `reasoningMarkdown`, active `answerMode`, source-card-backed answers, and hidden-content prompts bounded to public-source limits.
- WPU-03 passed. Preserve `/manage` as the owner writing-signal hub, contact-data redaction in backlog evidence, and `/write?idea=...&source=...` draft seeding.
- WPU-04 passed. Preserve fallback series metadata from `shared/content-series.ts`, alias-aware public search, RSS updated evidence, and content audit title strategy.
- WPU-05 passed. Release is ready, and deployment was explicitly approved in the 2026-06-17 review turn.
- Preserve route slugs, public content boundaries, dark research identity, and the article companion entry surface.
- Do not expose raw reasoning, hidden/admin/draft content, private context, or source-less technical claims in public Agent UI.
- Summarize inspected code facts into `source-packet.md`.
- Update `progress-log.md`, `continuity-ledger.md`, and the phase report before handoff.

## Evaluator Notes

- Review screenshots, browser snapshots, changed files, validation output, and oracle evidence.
- WPU-01 evidence is in `reports/wpu-01-reader-ia-and-visual-system-report.md` plus `wpu-01-*.png`.
- WPU-02 evidence is in `reports/wpu-02-article-companion-and-agent-ux-report.md` plus `wpu-02-*.png`.
- WPU-03 evidence is in `reports/wpu-03-writing-workbench-and-content-backlog-report.md` plus `wpu-03-*.png`.
- WPU-04 evidence is in `reports/wpu-04-content-atlas-and-article-quality-report.md` plus `wpu-04-*.png`, `wpu-04-*.txt`, and `docs/product_optimization/reports/po-08-publish-freshness-latest.json`.
- WPU-05 evidence is in `reports/wpu-05-release-and-evaluation-gates-report.md` plus `wpu-05-*.png`, `wpu-05-*.txt`, `wpu-05-agent-hidden-refusal.json`, and refreshed product optimization reports.
- Reject production approval if generated evidence files are not curated, if the target deployment environment has different credentials/index state, or if a reviewer requires authenticated owner screenshots.
- Reject WPU-05 if route/feed/Agent/content checks are skipped but reported as passing.

## Next Handoff

- Active role: generator
- Active phase: complete
- Active feature-oracle item: complete
- Required next action: monitor the production deployment recorded in the final 2026-06-17 review handoff.
