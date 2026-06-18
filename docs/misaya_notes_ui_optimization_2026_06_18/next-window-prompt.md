Use the `prd-phase-harness` skill.

Repo: `/Users/yang/projects/ai-tech-blog`
Docs path: `docs/misaya_notes_ui_optimization_2026_06_18`
Current status: post-review deploy-ready UI optimization harness. MNUI-F001 through MNUI-F006 are `passing` with evidence, and post-review risk resolution is recorded.
Target phase: release/deploy
Target phase file: `docs/misaya_notes_ui_optimization_2026_06_18/reports/post-review-risk-resolution-and-deploy-readiness.md`.

Loading order:
1. Confirm `pwd` is `/Users/yang/projects/ai-tech-blog`.
2. Read `docs/misaya_notes_ui_optimization_2026_06_18/README.md`.
3. Read `docs/misaya_notes_ui_optimization_2026_06_18/phase-manifest.md`.
4. Read `docs/misaya_notes_ui_optimization_2026_06_18/loop-state.json`, `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`, `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`, `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`, `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`, and `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`.
5. Read the final release report: `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md`.
6. Read the post-review report: `docs/misaya_notes_ui_optimization_2026_06_18/reports/post-review-risk-resolution-and-deploy-readiness.md`.

One phase and feature rule: no dependent implementation phase remains. Do not invent MNUI-06 unless the user explicitly asks for a new harness phase.

Loop cycle: observe, select, execute, verify, record, decide.

Edit boundaries: treat the downloaded design system as read-only source material. Preserve auth behavior, content boundaries, public Agent scope, and all deployment/migration/provider approval gates.

code summary writeback: if future work changes code, summarize source packet code facts, interface contracts, validation, screenshots, release decision, and remaining risks into `source-packet.md` and `continuity-ledger.md` before exit.

Validation: local release evidence currently includes `pnpm check`, `pnpm test`, `pnpm build`, `pnpm content:audit`, `pnpm content:verify`, `pnpm audit:ui`, `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick`, 32 final screenshots, post-review risk-resolution evidence, and strict harness validation. Rerun the relevant gates before any release claim.

Evidence: final evidence lives in `reports/mnui-05-release-evidence-and-design-regression-gates-report.md`, `reports/post-review-risk-resolution-and-deploy-readiness.md`, `reports/release-evidence/mnui-05-ui-layout-checks.json`, `reports/release-evidence/mnui-05-baseline-quick.json`, `reports/release-evidence/post-review-ui-layout-checks.json`, `reports/release-evidence/post-review-baseline-quick.json`, `reports/release-evidence/screenshots/`, `reports/release-evidence/post-review-screenshots/`, and `docs/product_optimization/reports/po-08-publish-freshness-latest.json`.

Stop conditions: stop and document if future work requires production mutation, schema migration, DNS/provider changes, destructive git operations, credentials not configured or approved, or screenshots/logs would expose secrets/private/admin-only data.

Deploy rule: the user explicitly requested commit, push, and deploy. Rerun release gates, run live Agent golden checks only with approved credentials, verify authenticated owner internals only if an admin session is available, deploy with Vercel production, and then verify the returned deployment URL plus `https://misaya.online` and `https://www.misaya.online`.
