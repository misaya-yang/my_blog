# Misaya Notes Product Upgrade Harness Phase Manifest

This is the compact index for coding agents. Prefer this file plus the target phase file over loading the whole folder.

## Grep Usage

Find a phase:

```bash
rg -n "PHASE_ID: MNP-XX" docs/misaya_notes_product_upgrade_2026_06_19
```

Find all goal prompts:

```bash
rg -n "GOAL_PROMPT:" docs/misaya_notes_product_upgrade_2026_06_19
```

Find validation commands:

```bash
rg -n "VALIDATION_COMMANDS:" docs/misaya_notes_product_upgrade_2026_06_19
```

Find acceptance gates:

```bash
rg -n "ACCEPTANCE_GATES:" docs/misaya_notes_product_upgrade_2026_06_19
```

## Phase Index

| PHASE_ID | File | Depends On | Goal Target | Main Validation | Evidence Output |
| --- | --- | --- | --- | --- | --- |
| MNP-00 | `phase-00-current-product-contract-and-evidence-audit.md` | none | Establish baseline code, validation, and boundary evidence for Misaya Notes Product Upgrade Harness. | code inspection plus available test discovery | `reports/mnp-00-current-product-contract-and-evidence-audit-report.md` |
| MNP-01 | `phase-01-ui-anti-slop-visual-system.md` | MNP-00 | Calm the public reader and owner tools by reducing glow/glass/grid/chip density while preserving dark/light behavior. | `pnpm check`, `pnpm test`, `pnpm build`, browser screenshots | `reports/mnp-01-ui-anti-slop-visual-system-report.md` |
| MNP-02 | `phase-02-reading-experience-and-format-rendering.md` | MNP-01 | Strengthen article entry, reading-time consistency, and Markdown/KaTeX/code/table rendering regressions. | focused Vitest, `pnpm check`, `pnpm build`, fixture screenshots | `reports/mnp-02-reading-experience-and-format-rendering-report.md` |
| MNP-03 | `phase-03-blog-agent-product-reliability.md` | MNP-02 | Make Agent citations, source anchors, failure recovery, quota/context feedback, and owner evals trustworthy. | Agent unit tests, server AI tests, browser Agent smoke | `reports/mnp-03-blog-agent-product-reliability-report.md` |
| MNP-04 | `phase-04-article-voice-and-quality-system.md` | MNP-03 | Rewrite summaries, UI labels, intros, and conclusions toward concrete technical prose. | `pnpm content:audit`, content tests, reader screenshots | `reports/mnp-04-article-voice-and-quality-system-report.md` |
| MNP-05 | `phase-05-code-simplification-and-css-architecture.md` | MNP-04 | Consolidate theme tokens, remove contradictory CSS overrides, and extract tested pure logic. | focused unit tests, `pnpm check`, `pnpm test`, `pnpm build` | `reports/mnp-05-code-simplification-and-css-architecture-report.md` |
| MNP-06 | `phase-06-release-evidence-and-production-verification.md` | MNP-05 | Prove the selected implementation phases are clean, published, and reachable in production with rollback notes. | full checks plus production smoke | `reports/mnp-06-release-evidence-and-production-verification-report.md` |

## Phase Report Index

| PHASE_ID | Required Report |
| --- | --- |
| MNP-00 | `reports/mnp-00-current-product-contract-and-evidence-audit-report.md` |
| MNP-01 | `reports/mnp-01-ui-anti-slop-visual-system-report.md` |
| MNP-02 | `reports/mnp-02-reading-experience-and-format-rendering-report.md` |
| MNP-03 | `reports/mnp-03-blog-agent-product-reliability-report.md` |
| MNP-04 | `reports/mnp-04-article-voice-and-quality-system-report.md` |
| MNP-05 | `reports/mnp-05-code-simplification-and-css-architecture-report.md` |
| MNP-06 | `reports/mnp-06-release-evidence-and-production-verification-report.md` |

## Dependency Flow

```text
MNP-00 Current Product Contract And Evidence Audit
  -> MNP-01 UI Anti Slop Visual System
  -> MNP-02 Reading Experience And Format Rendering
  -> MNP-03 Blog Agent Product Reliability
  -> MNP-04 Article Voice And Quality System
  -> MNP-05 Code Simplification And CSS Architecture
  -> MNP-06 Release Evidence And Production Verification
```

## Validation Matrix

| PHASE_ID | Mutates Data | Needs Browser/UI | Needs Agent/LLM Eval | Needs Migration | Needs External Service | Release Blocking |
| --- | --- | --- | --- | --- | --- | --- |
| MNP-00 | no | no | no | no | no | yes for planning correctness |
| MNP-01 | no | yes | no | no | no | yes |
| MNP-02 | no | yes | no | no | no | yes |
| MNP-03 | no | yes | yes | no | possible model fallback only | yes |
| MNP-04 | possible seed/content publish only after approval | yes | no | no | no | yes |
| MNP-05 | no | possible regression screenshots | no | no | no | yes |
| MNP-06 | possible content publish and deployment | yes | possible | no by default | yes | yes |

## Risk Matrix

| PHASE_ID | Primary Risk | Stop Condition |
| --- | --- | --- |
| MNP-00 | planning evidence overclaims implementation status | stop if the harness cannot distinguish planned vs shipped work |
| MNP-01 | visual regressions in theme, contrast, typography, or mobile density | stop if screenshots show unreadable text, clipped controls, or owner dark-lock failure |
| MNP-02 | renderer or reading-entry changes break existing articles | stop if fixture screenshots or content tests fail |
| MNP-03 | Agent answers lose source trust or expose hidden content | stop if citation anchors, hidden-content guards, or failure recovery cannot be verified |
| MNP-04 | copy rewrites distort technical claims | stop if formula/code/benchmark claims need evidence that is not refreshed |
| MNP-05 | simplification refactor changes public behavior | stop if tests or screenshots cannot prove behavior parity |
| MNP-06 | release status is unverifiable | stop if production smoke cannot be checked or deployment target is unknown |

## Runtime Artifacts

| Artifact | Path | Agent Rule |
| --- | --- | --- |
| Loop Contract | `docs/misaya_notes_product_upgrade_2026_06_19/loop-contract.json` | Follow observe, select, execute, verify, record, decide before claiming progress. |
| Loop State | `docs/misaya_notes_product_upgrade_2026_06_19/loop-state.json` | Keep active phase, feature, iteration, status, and next action current. |
| Feature Oracle | `docs/misaya_notes_product_upgrade_2026_06_19/feature-oracle.json` | Update only status, evidence, and notes for the feature being worked. |
| Progress Log | `docs/misaya_notes_product_upgrade_2026_06_19/progress-log.md` | Append session start/end, validation, and blocker notes. |
| Agent Handoff | `docs/misaya_notes_product_upgrade_2026_06_19/agent-handoff.md` | Keep planner, generator, and evaluator notes file-based and brief. |
| Continuity Ledger | `docs/misaya_notes_product_upgrade_2026_06_19/continuity-ledger.md` | Preserve phase relatedness, code-summary writeback, and interface boundary decisions. |
| Next Window Prompt | `docs/misaya_notes_product_upgrade_2026_06_19/next-window-prompt.md` | Use this to restart work in a fresh context window. |

## Agent Role Handoffs

- Planner role: expand intent into phase contracts and feature-oracle cases without over-specifying implementation details.
- Generator role: execute one phase/feature item, update evidence, and hand off to evaluation.
- Evaluator role: review from files and runtime checks, reject superficial completion, and write actionable findings.
- For small low-risk phases, one agent may play generator and evaluator only after running objective validation commands.

## Goal Setup Templates

Use the exact phase file `GOAL_PROMPT` when creating an agent goal. If a phase has dependencies, do not execute it until dependency acceptance gates are met or explicitly waived in the previous phase report.

Example:

```text
Complete MNP-00 Current Product Contract And Evidence Audit for `.` by following `docs/misaya_notes_product_upgrade_2026_06_19/phase-00-current-product-contract-and-evidence-audit.md`; stay inside named edit boundaries; finish only after code-summary writeback, continuity update, validation, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
```

## Shared Agent Rules

- Use the exact phase `GOAL_PROMPT` when starting a goal.
- Open only `READ_FIRST` and `PRIMARY_CONTEXT` before planning.
- Expand edit scope only when a blocker is documented.
- Write the phase report before moving on.

## External Inputs Checklist

- External design source is the local design-system folder under `/Users/yang/Downloads`.
- Production credentials are not needed for this planning commit and must not be committed.
- The 2026-06-19 user request approves commit, push, and normal deployment trigger for this harness update only.
