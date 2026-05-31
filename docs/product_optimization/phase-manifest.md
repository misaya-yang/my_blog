# Product Optimization Phase Manifest

This is the compact index for coding agents. Prefer this file plus the target phase file over loading the whole directory.

## Grep Usage

Find a phase:

```bash
rg -n "PHASE_ID: PO-05" docs/product_optimization
```

Find all goal prompts:

```bash
rg -n "GOAL_PROMPT:" docs/product_optimization
```

Find validation commands:

```bash
rg -n "VALIDATION_COMMANDS:" docs/product_optimization
```

Find acceptance gates:

```bash
rg -n "ACCEPTANCE_GATES:" docs/product_optimization
```

## Phase Index

| PHASE_ID | File | Depends On | Goal Target | Main Validation |
| --- | --- | --- | --- | --- |
| PO-00 | `phase-00-product-optimization-baseline.md` | none | Capture baseline before product changes. | `pnpm check`, `pnpm test`, `pnpm build`, `pnpm audit:baseline:quick` |
| PO-01 | `phase-01-content-source-series.md` | PO-00 | Organize content into stable series and concepts. | `pnpm check`, discovery tests |
| PO-02 | `phase-02-research-index-track-maps.md` | PO-01 | Turn home/tracks into research maps. | `pnpm check`, browser route checks |
| PO-03 | `phase-03-visual-shell-reading-calm.md` | PO-00 | Reduce template-like visual noise. | `pnpm check`, `pnpm test`, `pnpm build`, browser screenshots |
| PO-04 | `phase-04-article-reading-summary-layer.md` | PO-01, PO-03 | Add article summary and series reading layer. | `pnpm check`, article browser checks |
| PO-05 | `phase-05-article-companion-productization.md` | PO-00, PO-04 | Make Blog Agent context-aware on articles/tracks. | agent tests, browser companion checks |
| PO-06 | `phase-06-agent-quality-operations.md` | PO-00, PO-05 | Improve Agent evals, traces, retrieval, and reindex ops. | agent tests, `pnpm ai:reindex` |
| PO-07 | `phase-07-feedback-to-content-backlog.md` | PO-06 | Convert feedback and Agent questions into writing backlog. | engagement and agent tests |
| PO-08 | `phase-08-publish-quality-freshness.md` | PO-01, PO-06 | Gate publish freshness across content, feeds, and Agent knowledge. | full release checklist |

## Dependency Flow

```text
PO-00 Baseline
  -> PO-01 Content Source and Series
      -> PO-02 Research Index and Track Maps
      -> PO-04 Article Reading and Summary Layer
  -> PO-03 Visual Shell and Reading Calm
      -> PO-04 Article Reading and Summary Layer
  -> PO-05 Article Companion Productization
      -> PO-06 Agent Quality and Operations
          -> PO-07 Feedback to Content Backlog
          -> PO-08 Publish Quality and Knowledge Freshness
PO-01 also feeds PO-08.
```

## Validation Matrix

| PHASE_ID | Mutates DB? | Needs Browser? | Needs Agent Tests? | Release Blocking? |
| --- | --- | --- | --- | --- |
| PO-00 | optional, only if publish freshness is checked | yes | manual golden questions | no |
| PO-01 | maybe, if seed/schema changes | maybe | no | yes for content metadata |
| PO-02 | no | yes | no | no |
| PO-03 | no | yes | no | no |
| PO-04 | no | yes | no | no |
| PO-05 | no unless backend source metadata changes | yes | yes | no |
| PO-06 | maybe, if eval/index data changes | yes for admin surfaces | yes | yes for Agent quality |
| PO-07 | maybe, if backlog/status schema changes | yes | yes | no |
| PO-08 | yes, publish/reindex phase | yes | yes | yes |

## Goal Setup Templates

Use the exact phase file `GOAL_PROMPT` when creating a Codex goal. If a phase has dependencies, do not execute it until the dependency acceptance gates are met or explicitly waived by the user.

Example:

```text
Complete PO-05 Article Companion Productization for /Users/yang/projects/ai-tech-blog by following docs/product_optimization/phase-05-article-companion-productization.md. Keep edits within LIKELY_EDIT_PATHS, preserve public/hidden content boundaries, and finish only after VALIDATION_COMMANDS, BROWSER_CHECKS, and ACCEPTANCE_GATES pass or are explicitly documented as blocked.
```

## Shared Agent Rules

- Do not implement global rewrites when a phase names bounded edit paths.
- Do not expose hidden/admin content in public discovery, RSS, sitemap, or Agent source cards.
- Do not add pgvector, PDF ingestion, public `/agent` workspace, autonomous browsing, or author impersonation in this roadmap.
- Do not claim completion without recording command validation and browser checks requested by the phase.
- Prefer existing schema and routes before introducing new tables or routes.
- If local database state blocks validation, document the blocker and run the non-DB checks.
