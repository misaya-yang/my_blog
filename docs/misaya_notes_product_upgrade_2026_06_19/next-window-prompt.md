# Misaya Notes Product Upgrade Harness Next Window Prompt

Use this prompt to start a fresh Codex, Claude Code, or Agent Skills-compatible window.

```text
Use $prd-phase-harness to continue the harness at `docs/misaya_notes_product_upgrade_2026_06_19`.

Target phase: MNP-06
Target phase file: `docs/misaya_notes_product_upgrade_2026_06_19/phase-06-release-evidence-and-production-verification.md`
Target feature-oracle item: MNP-F007

Cold-start protocol:
1. Open `docs/misaya_notes_product_upgrade_2026_06_19/README.md`.
2. Open `docs/misaya_notes_product_upgrade_2026_06_19/phase-manifest.md`.
3. Open `docs/misaya_notes_product_upgrade_2026_06_19/loop-contract.json`.
4. Open `docs/misaya_notes_product_upgrade_2026_06_19/loop-state.json`.
5. Open `docs/misaya_notes_product_upgrade_2026_06_19/feature-oracle.json`.
6. Open `docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md`.
7. Open `docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md`.
8. Open `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md`.
9. Open only the target phase file and its `PRIMARY_CONTEXT` before planning.

Execution rule:
- Work on exactly one phase and one feature-oracle item.
- Follow the loop cycle: observe, select, execute, verify, record, decide.
- Stay inside the phase edit boundaries.
- Run the required validation and runtime checks.
- Summarize code facts back into the source packet and continuity ledger before handoff.
- Update the phase report, progress log, handoff file, continuity ledger, and oracle evidence before claiming completion.
- Start from the MNP-00 through MNP-05 reports and source packet. The next real work is release evidence for the MNP-05 slice, not another planning pass.
- Preserve the MNP-03 `anchorId` Agent source-card contract while editing content or UI copy.
- Preserve the MNP-04 seed/fallback parity, i18n copy guard, and localized series-label behavior while simplifying code.
- Preserve the MNP-05 boundary: server source cards persist only semantic anchors, client source cards keep legacy `heading-N` fallback, and `owner-tools.css` remains the final public theme-token authority.
- Stop and document blockers instead of guessing when credentials, production systems, destructive commands, or out-of-scope edits are required.
```
