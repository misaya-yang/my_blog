# Phase 04 - Content Atlas And Article Quality

> For agentic workers: enter plan-first mode before editing. Execute this phase only, write evidence, and do not advance to WPU-05 until public inventory and content freshness gates pass.

**Goal:** Unify content source, series/track atlas, search quality, and article lint expectations.

**Architecture:** WPU-04 owns content metadata and discovery correctness. It may touch seed/fallback content source, series catalog, discovery/search, SEO/feed generation, content audit scripts, and tests. It must preserve hidden/draft/admin boundaries.

**Tech Stack:** seeded Markdown, Drizzle-backed discovery, public seed fallback, RSS/sitemap/robots routes, content audit scripts, Vitest.

---

## Machine Contract

```json
{
  "schema_version": "prd-phase-harness/v3",
  "harness_role": "execution",
  "phase": {
    "id": "WPU-04",
    "number": "04",
    "title": "Content Atlas And Article Quality",
    "status": "ready",
    "type": "implementation",
    "repo_path": "/Users/yang/projects/ai-tech-blog",
    "docs_path": "docs/webdeb_product_upgrade_2026_06_16",
    "phase_file": "docs/webdeb_product_upgrade_2026_06_16/phase-04-content-atlas-and-article-quality.md",
    "depends_on": ["WPU-03"],
    "unlocks": ["WPU-05"]
  },
  "goal": {
    "target": "Unify content source, series/track atlas, search quality, and article lint expectations.",
    "prompt": "Complete WPU-04 Content Atlas And Article Quality for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-04-content-atlas-and-article-quality.md`; work on feature-oracle item WPU-F005; keep public, hidden, admin, and draft boundaries intact; finish only after content/discovery/SEO tests, content audit, freshness checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.",
    "plan_required": true,
    "plan_output": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-04-content-atlas-and-article-quality-plan.md",
    "completion_report": "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-04-content-atlas-and-article-quality-report.md"
  },
  "runtime": {
    "feature_oracle": "docs/webdeb_product_upgrade_2026_06_16/feature-oracle.json",
    "loop_contract": "docs/webdeb_product_upgrade_2026_06_16/loop-contract.json",
    "loop_state": "docs/webdeb_product_upgrade_2026_06_16/loop-state.json",
    "progress_log": "docs/webdeb_product_upgrade_2026_06_16/progress-log.md",
    "handoff": "docs/webdeb_product_upgrade_2026_06_16/agent-handoff.md",
    "continuity_ledger": "docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md",
    "next_window_prompt": "docs/webdeb_product_upgrade_2026_06_16/next-window-prompt.md",
    "session_boot": {
      "read_progress": true,
      "run_baseline_check": true,
      "update_progress_before_exit": true
    },
    "agent_roles": ["planner", "generator", "evaluator"]
  },
  "context": {
    "read_first": [
      "docs/webdeb_product_upgrade_2026_06_16/README.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md",
      "docs/webdeb_product_upgrade_2026_06_16/source-packet.md",
      "docs/webdeb_product_upgrade_2026_06_16/continuity-ledger.md",
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-03-writing-workbench-and-content-backlog-report.md",
      "docs/webdeb_product_upgrade_2026_06_16/phase-04-content-atlas-and-article-quality.md"
    ],
    "primary_context": [
      "seed-blog.mjs",
      "server/publicSeedPosts.ts",
      "shared/content-series.ts",
      "shared/content-ops.ts",
      "server/db.ts",
      "server/discovery.ts",
      "server/routers.ts",
      "server/seo.ts",
      "server/searchMisses.ts",
      "scripts/audit/content-quality.ts",
      "scripts/audit/publish-freshness.ts",
      "scripts/audit/baseline.ts",
      "scripts/ai/reindex-knowledge.ts",
      "server/discovery.test.ts",
      "server/discovery.router.test.ts",
      "server/seo.test.ts",
      "scripts/audit/content-quality.test.ts",
      "scripts/audit/publish-freshness.test.ts",
      "docs/product_optimization/reports/po-08-publish-freshness-latest.json",
      "README.md"
    ],
    "context_budget": "focused",
    "do_not_load_unless": [
      "public UI style files",
      "Agent model prompt internals",
      "deployment configuration"
    ]
  },
  "boundaries": {
    "likely_edit_paths": [
      "seed-blog.mjs",
      "server/publicSeedPosts.ts",
      "shared/content-series.ts",
      "shared/content-ops.ts",
      "server/db.ts",
      "server/discovery.ts",
      "server/routers.ts",
      "server/seo.ts",
      "server/searchMisses.ts",
      "scripts/audit/content-quality.ts",
      "scripts/audit/publish-freshness.ts",
      "scripts/audit/baseline.ts",
      "scripts/ai/reindex-knowledge.ts",
      "server/discovery.test.ts",
      "server/discovery.router.test.ts",
      "server/seo.test.ts",
      "scripts/audit/content-quality.test.ts",
      "scripts/audit/publish-freshness.test.ts",
      "README.md",
      "docs/webdeb_product_upgrade_2026_06_16/**"
    ],
    "do_not_edit": [
      "client/src/styles/**",
      "client/src/components/agent/**",
      "server/ai/model.ts",
      "drizzle/**",
      ".env*",
      "production systems"
    ],
    "external_inputs": [],
    "secrets_required": []
  },
  "tool_policy": {
    "allowed_tools": [
      "repo search",
      "shell validation",
      "local server",
      "browser route checks"
    ],
    "approval_required": [
      "schema migration",
      "production data mutation",
      "deployment",
      "external service changes"
    ],
    "dangerous_commands": [
      "git reset --hard",
      "rm -rf",
      "production migration",
      "force push"
    ]
  },
  "risk": {
    "tags": ["content", "seo", "database", "release", "privacy"],
    "data_mutation": true,
    "migration_required": false,
    "browser_required": true,
    "ai_eval_required": false,
    "external_service_required": false,
    "release_blocking": true
  },
  "validation": {
    "commands": [
      {
        "id": "content-and-discovery-tests",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm exec vitest run scripts/audit/content-quality.test.ts server/discovery.test.ts server/discovery.router.test.ts server/seo.test.ts scripts/audit/publish-freshness.test.ts",
        "expected": "Content, discovery, SEO, and freshness tests pass.",
        "required": true
      },
      {
        "id": "content-audit",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:audit",
        "expected": "Content audit reports zero failures or documented blockers.",
        "required": true
      },
      {
        "id": "content-verify",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm content:verify",
        "expected": "Freshness report is generated and skipped HTTP checks are marked blocked or explained.",
        "required": true
      },
      {
        "id": "typecheck",
        "cwd": "/Users/yang/projects/ai-tech-blog",
        "command": "pnpm check",
        "expected": "TypeScript check passes.",
        "required": true
      }
    ],
    "browser_checks": [
      "With local server, verify /archive public inventory.",
      "Verify /rss.xml includes public posts and excludes hidden draft.",
      "Verify /sitemap.xml includes public routes and excludes hidden draft.",
      "Verify /search handles mixed Chinese/English topic queries and no-hit recovery.",
      "Verify one public article renders title, series, tags, and RSS/sitemap consistency."
    ],
    "regression_scope": [
      "Hidden/draft/admin content stays excluded from discovery, RSS, sitemap, Agent chunks, and fallback.",
      "Public article slugs remain stable.",
      "Series and track metadata remain consistent across home, track pages, article pages, seed, fallback, and audits.",
      "Dynamic SEO routes still register before client fallback."
    ],
    "compliance_gates": [
      "No hidden content leakage.",
      "No direct personal contact data stored in search miss backlog.",
      "Content audit rules distinguish shell-provided titles from missing-title defects.",
      "README release workflow names content:publish for public content changes."
    ],
    "acceptance_gates": [
      "seed-blog.mjs and server/publicSeedPosts.ts do not drift on public slug, visibility, series, track, excerpt, and cover/thumbnail strategy.",
      "Search supports key aliases or records a durable improvement blocker.",
      "Search misses persist or a blocker explains why persistence is deferred.",
      "RSS contains updated-date evidence or report documents a deliberate standard decision.",
      "Baseline no longer mislabels dynamic SEO routes as missing static files, or the mismatch is explicitly tracked.",
      "WPU-F005 is passing with content, discovery, SEO, and freshness evidence."
    ],
    "rollback_plan": [
      "Revert content source and discovery changes if public inventory diverges.",
      "If publish freshness output changes, retain before/after reports for comparison."
    ]
  },
  "evidence": {
    "outputs": [
      "docs/webdeb_product_upgrade_2026_06_16/reports/wpu-04-content-atlas-and-article-quality-report.md"
    ],
    "required_artifacts": [
      "phase report",
      "test output summary",
      "content audit output",
      "freshness report",
      "browser route evidence",
      "source-packet update",
      "continuity-ledger update"
    ],
    "waiver_policy": "Hidden-content, public inventory, and freshness gates require explicit user waiver to skip.",
    "next_phase_handoff": "WPU-05 may start when public inventory and freshness contracts are stable."
  },
  "stop_conditions": [
    "A database migration becomes required and rollback cannot be written.",
    "Public and fallback content inventories cannot be reconciled.",
    "Search miss persistence would store sensitive data without privacy design.",
    "Freshness checks require production-only services."
  ]
}
```

## Coding Agent Contract

- PHASE_ID: WPU-04
- GOAL_TARGET: Unify content source, series/track atlas, search quality, and article lint expectations.
- GOAL_PROMPT: Complete WPU-04 Content Atlas And Article Quality for `/Users/yang/projects/ai-tech-blog` by following `docs/webdeb_product_upgrade_2026_06_16/phase-04-content-atlas-and-article-quality.md`; work on feature-oracle item WPU-F005; keep public, hidden, admin, and draft boundaries intact; finish only after content/discovery/SEO tests, content audit, freshness checks, source-packet writeback, continuity-ledger update, report evidence, and acceptance gates pass or blockers are documented.
- DEPENDS_ON: WPU-03
- READ_FIRST: `docs/webdeb_product_upgrade_2026_06_16/README.md`, `docs/webdeb_product_upgrade_2026_06_16/phase-manifest.md`, this file
- PRIMARY_CONTEXT: `seed-blog.mjs`, `server/publicSeedPosts.ts`, `shared/content-series.ts`, `shared/content-ops.ts`, `server/db.ts`, `server/discovery.ts`, `server/routers.ts`, `server/seo.ts`, `server/searchMisses.ts`, `scripts/audit/content-quality.ts`, `scripts/audit/publish-freshness.ts`, `scripts/audit/baseline.ts`, `scripts/ai/reindex-knowledge.ts`, content/discovery/SEO/freshness tests, `README.md`
- LIKELY_EDIT_PATHS: content source, discovery, SEO, audit scripts, tests, README, docs
- DO_NOT_EDIT: `client/src/styles/**`, `client/src/components/agent/**`, `server/ai/model.ts`, `drizzle/**`, `.env*`, production systems
- EXECUTION_MODE: plan-first; preserve public/hidden boundary; verify before completion; write evidence before handoff
- VALIDATION_COMMANDS: content/discovery/SEO/freshness focused tests; `pnpm content:audit`; `pnpm content:verify`; `pnpm check`
- BROWSER_CHECKS: archive, RSS, sitemap, search, public article against local server
- REGRESSION_SCOPE: public slugs stable; hidden content excluded; series/track metadata consistent; dynamic SEO still registered
- COMPLIANCE_GATES: no hidden leakage; no personal data in misses; title lint clarity; README names content:publish
- ROLLBACK_PLAN: revert content/discovery changes if inventory diverges; retain freshness before/after reports
- ACCEPTANCE_GATES: seed/fallback parity; search quality plan; search miss durability or blocker; RSS updated-date decision; dynamic SEO baseline mismatch addressed; WPU-F005 passing
- EVIDENCE_OUTPUT: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-04-content-atlas-and-article-quality-report.md`
- STOP_CONDITIONS: stop if migration rollback, inventory reconciliation, privacy design, or production-only freshness blocks completion

## Task Spec

Make the content graph reliable enough for readers, SEO, and Agent retrieval. This phase turns scattered article metadata into a content atlas and strengthens discovery quality.

## Context Policy

Load the harness runtime files first, then inspect content seeds, markdown posts, taxonomy helpers, content audit scripts, SEO/feed routes, and knowledge-index dependencies named by this phase. Avoid broad article rewriting unless a quality gate identifies a specific blocker.

## Problem Boundary

In scope:

- Seed/fallback/series metadata parity.
- Content audit lint rules.
- Search quality and search miss durability.
- RSS/sitemap/robots evidence.
- README release workflow for content changes.

Out of scope:

- Public UI redesign.
- Agent model prompt behavior.
- pgvector migration.
- Deployment.

## Requirements

### R1 Content Source Parity

Public inventory must match across DB seed, fallback, series catalog, discovery, feeds, sitemap, and Agent chunks.

### R2 Article Quality Lint

Content audit must catch missing or inconsistent title strategy, excerpt gaps, series gaps, references/cover strategy gaps, and malformed AI-ish residue where relevant.

### R3 Search Discovery

Search should handle topic aliases and mixed Chinese/English queries better than raw substring matching, or record a concrete blocker and next implementation target.

### R4 SEO And Feed Evidence

Dynamic route metadata, RSS, sitemap, and baseline checks must agree. Skipped route checks must be marked blocked or explained.

## Test and Regression Requirements

Run all validation commands. Run browser route checks against local server when possible.

## Compliance and Safety Requirements

Hidden/draft/admin content must stay excluded. Search misses must not capture direct personal data.

## Rollback and Recovery

Revert content/discovery changes if public inventory diverges. Keep before/after freshness reports.

## Execution Capture

Write `reports/wpu-04-content-atlas-and-article-quality-report.md` with inventory tables, tests, freshness output, route evidence, and WPU-05 handoff.

## Evaluator Protocol

Evaluator must compare public and hidden slugs across seed, fallback, discovery, RSS, sitemap, and Agent chunks.

## Acceptance Criteria

WPU-04 is accepted when WPU-F005 is passing with content, discovery, SEO, and freshness evidence.

## Risks

- Seed/fallback unification can accidentally expose hidden draft metadata.
- Search miss persistence can collect sensitive user queries without a retention design.
- Baseline tools may need updating to understand dynamic SEO routes.
