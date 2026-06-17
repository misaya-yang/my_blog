# WPU-00 Baseline Product Audit Report

## GLOBAL_GOAL_PROGRESS

WPU-00 is complete. The harness has enough current repo evidence to start WPU-01 without repeating the broad audit.

## CURRENT_PHASE

WPU-00 - Baseline Product Audit

## STATUS

passing

## SUMMARY

WebDeb is currently a Vite/React, Express/tRPC, Drizzle, seeded Markdown, public discovery, owner writing, and Blog Agent product. The next upgrade should preserve the dark research identity and current routes while addressing reader IA, visual system drift, public Agent trust, owner writing backlog, content atlas consistency, and release evidence.

## CHANGED_FILES

Documentation-only changes:

- `docs/webdeb_product_upgrade_2026_06_16/README.md`
- `docs/webdeb_product_upgrade_2026_06_16/source-packet.md`
- `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`
- `docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json`
- `docs/webdeb_product_upgrade_2026_06_16/loop-state.json`
- `docs/webdeb_product_upgrade_2026_06_16/progress-log.md`
- `docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md`
- `docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md`
- `docs/webdeb_product_upgrade_2026_06_16/next-window-prompt.md`
- `docs/webdeb_product_upgrade_2026_06_16/phase-00-baseline-product-audit.md`
- `docs/webdeb_product_upgrade_2026_06_16/phase-01-reader-ia-and-visual-system.md`
- `docs/webdeb_product_upgrade_2026_06_16/phase-02-article-companion-and-agent-ux.md`
- `docs/webdeb_product_upgrade_2026_06_16/phase-03-writing-workbench-and-content-backlog.md`
- `docs/webdeb_product_upgrade_2026_06_16/phase-04-content-atlas-and-article-quality.md`
- `docs/webdeb_product_upgrade_2026_06_16/phase-05-release-and-evaluation-gates.md`
- `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-00-baseline-product-audit-report.md`
- `docs/webdeb_product_upgrade_2026_06_16/reports/phase-report-template.md`

Business code was not edited.

## VALIDATION_COMMANDS

- `pnpm check` - pass.
- `pnpm test` - pass, 31 files and 194 tests. Existing `OAUTH_SERVER_URL` warning appears in `server/seo.test.ts`.
- `pnpm content:audit` - pass, 13 Markdown files, 8 seed posts, 0 warnings, 0 failures.
- Local server `pnpm dev` - started at `http://localhost:3000/`. Existing OAuth URL warning appeared but public pages loaded.

## BROWSER_CHECKS

Evidence captured during planning:

- `webdeb-home-desktop.png` - home desktop viewport.
- `webdeb-home-mobile.png` - home mobile viewport.
- `webdeb-post-desktop.png` - article desktop viewport for `/post/goal-harness-agent-phase-protocol`.

Observed:

- Home has a clear dark research atlas identity, search, latest note, and two track panels.
- Desktop first screenshot briefly showed loading/empty-looking panels, which should be handled as a WPU-01 state clarity issue.
- Mobile home renders latest article earlier and proves the public content path works.
- Article page has strong paper-reader direction but too many auxiliary modules compete with the primary reading task.

## PARALLEL_REVIEW_INPUTS

Three read-only subagents contributed:

- UI and IA: article page is overloaded, mobile reading aids need parity, `visual-refresh.css` is override-heavy, home needs first-read path.
- Agent and writing: public reasoning leakage risk, taxonomy freshness gap, stale publish warning flow, private context lifecycle, unsurfaced answer modes, AgentOps radar opportunity.
- Content and engineering: duplicated seed/fallback content source, README release gate gap, substring search, in-memory search misses, SEO/audit mismatch, RSS updated date gap.

## ACCEPTANCE_GATES

- Source packet includes current system shape, evidence, risks, and assumptions: pass.
- Feature oracle uses observable product behaviors rather than generic phase-completion chores: pass.
- Manifest contains real risk and validation matrices: pass.
- Next window can start from WPU-01 without hidden chat context: pass.

## RISKS_OR_BLOCKERS

- The repo already had an unrelated user modification in `client/src/styles/visual-refresh.css`; this harness did not edit it.
- Authenticated owner screenshots were not captured in this baseline session. WPU-03 and WPU-05 must capture authenticated owner state when available or document fallback evidence.
- Full `pnpm build` should be run by WPU-01 or WPU-05 before implementation/release claims.

## NEXT_PHASE

WPU-01 - Reader IA And Visual System.

Start with feature-oracle item `WPU-F002` and phase file `docs/webdeb_product_upgrade_2026_06_16/phase-01-reader-ia-and-visual-system.md`.
