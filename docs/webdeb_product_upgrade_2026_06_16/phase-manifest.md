# WebDeb Product Upgrade PRD Harness Phase Manifest

This is the compact index for coding agents. Prefer this file plus the target phase file over loading the whole folder.

## Grep Usage

Find a phase:

```bash
rg -n "PHASE_ID: WPU-02" docs/webdeb_product_upgrade_2026_06_16
```

Find all goal prompts:

```bash
rg -n "GOAL_PROMPT:" docs/webdeb_product_upgrade_2026_06_16
```

Find validation commands:

```bash
rg -n "VALIDATION_COMMANDS:" docs/webdeb_product_upgrade_2026_06_16
```

Find acceptance gates:

```bash
rg -n "ACCEPTANCE_GATES:" docs/webdeb_product_upgrade_2026_06_16
```

## Phase Index

| PHASE_ID | File | Depends On | Goal Target | Main Validation | Evidence Output |
| --- | --- | --- | --- | --- | --- |
| WPU-00 | `phase-00-baseline-product-audit.md` | none | Record current product, UI, Agent, writing, content, and release baseline evidence. | `pnpm check`, `pnpm test`, `pnpm content:audit`, screenshots | `reports/wpu-00-baseline-product-audit-report.md` |
| WPU-01 | `phase-01-reader-ia-and-visual-system.md` | WPU-00 | Make home and article reading IA clearer while consolidating visual system risk. | `pnpm check`, `pnpm test`, `pnpm build`, browser screenshots | `reports/wpu-01-reader-ia-and-visual-system-report.md` |
| WPU-02 | `phase-02-article-companion-and-agent-ux.md` | WPU-01 | Harden public Agent trust boundaries and productize article/track companion UX. | focused Agent tests, browser companion checks, source-card evidence | `reports/wpu-02-article-companion-and-agent-ux-report.md` |
| WPU-03 | `phase-03-writing-workbench-and-content-backlog.md` | WPU-02 | Turn writing, feedback, search misses, and AgentOps radar into a durable author backlog. | owner route checks, engagement/agent tests | `reports/wpu-03-writing-workbench-and-content-backlog-report.md` |
| WPU-04 | `phase-04-content-atlas-and-article-quality.md` | WPU-03 | Unify content source, series/track atlas, search quality, and article lint expectations. | content/discovery/SEO tests, `pnpm content:audit` | `reports/wpu-04-content-atlas-and-article-quality-report.md` |
| WPU-05 | `phase-05-release-and-evaluation-gates.md` | WPU-04 | Prove release readiness across UI, Agent, content freshness, feeds, sitemap, and privacy gates. | full validation plus `pnpm content:publish` and browser route evidence | `reports/wpu-05-release-and-evaluation-gates-report.md` |

## Phase Report Index

| PHASE_ID | Required Report |
| --- | --- |
| WPU-00 | `reports/wpu-00-baseline-product-audit-report.md` |
| WPU-01 | `reports/wpu-01-reader-ia-and-visual-system-report.md` |
| WPU-02 | `reports/wpu-02-article-companion-and-agent-ux-report.md` |
| WPU-03 | `reports/wpu-03-writing-workbench-and-content-backlog-report.md` |
| WPU-04 | `reports/wpu-04-content-atlas-and-article-quality-report.md` |
| WPU-05 | `reports/wpu-05-release-and-evaluation-gates-report.md` |

## Dependency Flow

```text
WPU-00 Baseline Product Audit
  -> WPU-01 Reader IA And Visual System
      -> WPU-02 Article Companion And Agent UX
          -> WPU-03 Writing Workbench And Content Backlog
              -> WPU-04 Content Atlas And Article Quality
                  -> WPU-05 Release And Evaluation Gates
```

## Validation Matrix

| PHASE_ID | Mutates Data | Needs Browser/UI | Needs Agent/LLM Eval | Needs Migration | Needs External Service | Release Blocking |
| --- | --- | --- | --- | --- | --- | --- |
| WPU-00 | no | yes | no | no | no | no |
| WPU-01 | no | yes | no | no | no | no |
| WPU-02 | maybe, conversation/context test data only | yes | yes | no | no | yes for public Agent trust |
| WPU-03 | maybe, if backlog persistence is implemented | yes | yes | maybe | no | no |
| WPU-04 | maybe, if seed/fallback/search metadata changes | yes | no | maybe | no | yes for content/discovery |
| WPU-05 | yes, local seed/reindex/publish gate | yes | yes | no unless prior phase added migration | no unless deployment requested | yes |

## Risk Matrix

| PHASE_ID | Primary Risk | Stop Condition |
| --- | --- | --- |
| WPU-00 | stale or incomplete audit facts causing wrong phase boundaries | stop if validation commands or key routes cannot be inspected |
| WPU-01 | visual polish changes regress reading, mobile, or SEO without evidence | stop if screenshots show overflow, inaccessible controls, or hidden primary reading affordances |
| WPU-02 | Agent exposes raw reasoning, hidden content, or unsupported claims | stop if public UI can show raw reasoning, hidden/admin content, or source-less technical claims |
| WPU-03 | owner workflow mutates content/backlog without durable status or privacy boundary | stop if backlog state cannot be persisted or privacy review is missing |
| WPU-04 | content source drift breaks discovery, series, fallback, RSS, or Agent chunks | stop if seed/fallback/series inventories disagree or hidden content appears in public outputs |
| WPU-05 | release evidence passes while route, feed, Agent, or freshness checks are skipped | stop if any required check is skipped without a blocker or user waiver |

## Runtime Artifacts

| Artifact | Path | Agent Rule |
| --- | --- | --- |
| Loop Contract | `docs/webdeb_product_upgrade_2026_06_16/loop-contract.json` | Follow observe, select, execute, verify, record, decide before claiming progress. |
| Loop State | `docs/webdeb_product_upgrade_2026_06_16/loop-state.json` | Keep active phase, feature, iteration, status, and next action current. |
| Feature Oracle | `docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json` | Update only status, evidence, and notes for the feature being worked. |
| Progress Log | `docs/webdeb_product_upgrade_2026_06_16/progress-log.md` | Append session start/end, validation, and blocker notes. |
| Agent Handoff | `docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md` | Keep planner, generator, and evaluator notes file-based and brief. |
| Continuity Ledger | `docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md` | Preserve phase relatedness, code-summary writeback, and interface boundary decisions. |
| Next Window Prompt | `docs/webdeb_product_upgrade_2026_06_16/next-window-prompt.md` | Use this to restart work in a fresh context window. |

## Agent Role Handoffs

- Planner role: keep this harness current, update source facts, and split requirements by risk profile.
- Generator role: execute one phase and one oracle item, stay inside likely edit paths, and write report evidence.
- Evaluator role: independently review changed files, screenshots, tests, Agent traces, content freshness, and oracle evidence.
- For WPU-02 and WPU-05, evaluator review is required because trust and release claims are high-risk.

## Goal Setup Templates

Use the exact phase file `GOAL_PROMPT` when creating an agent goal. If a phase has dependencies, do not execute it until dependency acceptance gates are met or explicitly waived in the previous phase report.

Example:

```text
Complete WPU-02 Article Companion And Agent UX for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-02-article-companion-and-agent-ux.md`; stay inside named edit boundaries; finish only after Agent trust, browser, regression, compliance, rollback, evidence, and acceptance gates pass or blockers are documented.
```

## Shared Agent Rules

- Use the exact phase `GOAL_PROMPT` when starting a goal.
- Open only `READ_FIRST` and `PRIMARY_CONTEXT` before planning.
- Expand edit scope only when a blocker is documented.
- Do not expose hidden/admin/draft/private content.
- Do not show raw model reasoning in public UI.
- Write the phase report before moving on.

## External Inputs Checklist

- No external Figma, dashboard, credential, provider, or production deployment is required by default.
- Deployment, production migrations, DNS/provider actions, and production data mutation require explicit user approval.
- If authenticated owner browser state is unavailable, record unauthenticated fallback evidence and code-level owner checks in the report.
