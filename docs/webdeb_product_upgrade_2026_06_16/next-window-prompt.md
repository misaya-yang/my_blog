# WebDeb Product Upgrade PRD Harness Next Window Prompt

Use this prompt to start a fresh Codex, Claude Code, or Agent Skills-compatible window.

```text
Use $prd-phase-harness to continue the harness at `docs/webdeb_product_upgrade_2026_06_16`.

Target phase: WPU-05
Target phase file: `docs/webdeb_product_upgrade_2026_06_16/phase-05-release-and-evaluation-gates.md`
Target feature-oracle item: WPU-F006

Cold-start protocol:
1. Open `docs/webdeb_product_upgrade_2026_06_16/README.md`.
2. Open `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`.
3. Open `docs/webdeb_product_upgrade_2026_06_16/loop-contract.json`.
4. Open `docs/webdeb_product_upgrade_2026_06_16/loop-state.json`.
5. Open `docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json`.
6. Open `docs/webdeb_product_upgrade_2026_06_16/progress-log.md`.
7. Open `docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md`.
8. Open `docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md`.
9. Open only the target phase file and its `PRIMARY_CONTEXT` before planning.

Execution rule:
- The harness is verified through WPU-05; work on exactly this one phase and one feature-oracle item only if a reviewer asks for follow-up.
- Follow the loop cycle: observe, select, execute, verify, record, decide.
- Start by reading `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-05-release-and-evaluation-gates-report.md`.
- Preserve the WPU-01 public reader contract: home first-read path and mobile article reading brief/TOC parity.
- Preserve the WPU-02 public Agent trust contract: no public raw reasoning, source-card-backed public answers, active answerMode, and hidden-content refusal.
- Preserve the WPU-03 owner workflow contract: `/manage` writing backlog, contact-data redaction in backlog evidence, and `/write?idea=...&source=...` draft seeding.
- Preserve the WPU-04 content atlas contract: fallback series metadata from `shared/content-series.ts`, alias-aware search, RSS updated evidence, shell-title-only audit warnings, freshness with hidden-content exclusion.
- Preserve the WPU-05 non-deployment status unless the user explicitly approves deployment.
- Stay inside the phase edit boundaries in `phase-05-release-and-evaluation-gates.md`.
- Run required validation and browser checks again if any code or release-gate behavior changes.
- Summarize code facts back into the source packet and continuity ledger before handoff.
- Update the phase report, progress log, handoff file, continuity ledger, and oracle evidence before claiming any follow-up completion.
- Stop and document blockers instead of guessing when credentials, production systems, destructive commands, deployment approval, or out-of-scope edits are required.
```
