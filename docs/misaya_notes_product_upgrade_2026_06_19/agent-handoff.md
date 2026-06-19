# Misaya Notes Product Upgrade Harness Agent Handoff

**Created:** 2026-06-19

**Harness Folder:** `docs/misaya_notes_product_upgrade_2026_06_19`

---

## Planner Notes

- Source packet: `docs/misaya_notes_product_upgrade_2026_06_19/source-packet.md`
- Feature oracle: `docs/misaya_notes_product_upgrade_2026_06_19/feature-oracle.json`
- Continuity ledger: `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md`
- Current target phase: `MNP-05`
- Current target phase file: `docs/misaya_notes_product_upgrade_2026_06_19/phase-05-code-simplification-and-css-architecture.md`
- Current feature-oracle item: `MNP-F006`
- Baseline evidence: `reports/mnp-00-current-product-contract-and-evidence-audit-report.md`
- Latest implementation evidence: `reports/mnp-04-article-voice-and-quality-system-report.md`

## Generator Notes

- Work on one phase and one feature-oracle item at a time.
- Stay inside the phase `LIKELY_EDIT_PATHS`.
- Summarize inspected code facts into `docs/misaya_notes_product_upgrade_2026_06_19/source-packet.md`.
- Update `docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md`, `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md`, and the phase report before handoff.
- MNP-01 passed for the implemented public UI and owner fallback slice. Preserve its hierarchy decisions unless a runtime check proves a regression.
- MNP-02 passed with shared CJK/English reading-time helpers, article-aware duplicate-title stripping, rich Markdown renderer fixture coverage, h4-h6 TOC anchor parity, language-less fenced code block handling, and a light-mode reader contrast repair.
- MNP-03 passed with stable semantic source-card anchors, h1-h6 source lookup, persisted `anchorId` metadata, timeout-vs-abort diagnostics, model fallback error-code telemetry, and context/quota regression coverage.
- MNP-04 passed with concrete public seed excerpts, seed/fallback parity, stale UI-copy guards, localized series labels, selected public article wording, and content publish/reindex evidence.
- For MNP-05, focus on small tested simplifications in high-risk CSS/frontend/Agent code. Preserve MNP-02 reader-format behavior, MNP-03 `anchorId` source-card contracts, and MNP-04 seed/fallback/i18n copy guards.

## Evaluator Notes

- Read the phase report, changed files, validation output, and oracle evidence.
- Reject `passing` status when evidence is missing, superficial, or outside the target phase.
- Write findings as actionable file/line or command/check notes.
- For MNP-02 evidence, note that Chrome screenshot capture timed out; acceptance rests on tests, build, a11y snapshot, and measured DOM/CSS runtime checks.
- For MNP-03 evidence, note that Chrome screenshot capture timed out again; acceptance rests on tests, build, and saved DOM/runtime anchor evidence at `reports/mnp-03-screenshots/post-goal-harness-anchor-runtime.json`.
- For MNP-04 evidence, note that code-only browser smoke initially read stale database content; acceptance includes `pnpm content:publish` plus local production runtime evidence at `reports/mnp-04-runtime/zh-copy-runtime-evidence.json`.

## Next Handoff

- Active role: generator
- Active phase: MNP-05
- Active feature-oracle item: MNP-F006
- Required evidence before unlock: scoped simplification plan, changed-code parity tests, CSS/runtime regression checks, `pnpm check`, `pnpm test`, `pnpm build`, oracle update, progress-log entry, continuity-ledger update, and an MNP-05 phase report.
