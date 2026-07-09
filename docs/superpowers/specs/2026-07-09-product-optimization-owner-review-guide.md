# Product Optimization Owner Review Guide

Date: 2026-07-09
Status: Ready for owner review
Scope: UI, reading, Agent, owner workflow, content quality, privacy, release gates

## Purpose

This guide is the single review path for the complete optimization spec set. It is intentionally shorter than the module specs: use it to decide whether the program direction is acceptable, then use the final package and module specs during implementation.

Primary execution contract after approval:

- [2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md)

Coverage crosswalk:

- [2026-07-09-product-optimization-spec-completion-crosswalk.md](./2026-07-09-product-optimization-spec-completion-crosswalk.md)

## Review Decision

Approve only if these four statements are acceptable:

1. The product direction is a calm personal AI systems research archive, not a generic AI SaaS dashboard or decorative glass UI.
2. Implementation can proceed in bounded slices without per-slice confirmation, but every slice must be tested, reported, committed, and stopped before deployment, schema migration, credential work, force push, or destructive data operations.
3. The first implementation emphasis is public UI and reading calm, then Agent companion completion, then owner/quality loops and release gates.
4. Specs are allowed to improve existing contracts additively. Route shapes, API contracts, DB schemas, auth providers, dependencies, and production services do not change without separate approval.

## Review Order

Fast path:

1. Read this guide.
2. Read [2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md).
3. Skim the "Spec Inventory" and "Implementation Waves After Approval" sections in the final package.
4. Use the crosswalk only if you want to confirm coverage by area.

Deep path:

1. Product loop and current identity.
2. UI visual contract and design-system/CSS ownership.
3. Article reading, Markdown, route continuity, and i18n.
4. Agent companion UX and Agent quality operations.
5. Owner cockpit, writing studio, reader signals, and subscriptions.
6. Content quality, privacy, auth/session, data operations, SEO, observability, and release gates.

## Review Questions By Area

| Area | Review Question | Primary Specs |
| --- | --- | --- |
| UI | Does this remove AI-template feel without losing the research archive identity? | `2026-07-08-ui-visual-contract-design.md`, `2026-07-09-design-system-component-contract-design.md`, `2026-07-09-css-ownership-style-debt-budget-design.md` |
| Reading | Does the article page prioritize readable technical prose over surrounding controls? | `2026-07-08-article-reading-rendering-design.md`, `2026-07-09-reading-continuity-route-state-design.md`, `2026-07-09-public-i18n-bilingual-reading-contract-design.md` |
| Agent UX | Does the Agent show answer first, keep sources traceable, and avoid taking over the reading viewport? | `2026-07-08-agent-reading-companion-design.md`, `2026-07-09-agent-quality-operations-design.md` |
| Owner flow | Can weak reader intent, Agent gaps, feedback, freshness, and content audit findings turn into owner action? | `2026-07-08-reader-signal-owner-cockpit-design.md`, `2026-07-09-owner-cockpit-ia-contract-design.md`, `2026-07-09-owner-writing-publish-studio-design.md` |
| Article quality | Do quality checks target concrete awkwardness, vague claims, and unsupported certainty without overblocking style? | `2026-07-08-content-quality-style-system-design.md`, `2026-07-09-publish-freshness-signal-bridge-design.md` |
| Privacy | Are public, owner-only, private pasted, contact, hidden, and draft boundaries explicit enough? | `2026-07-09-privacy-retention-signal-data-contract-design.md`, `2026-07-09-admin-auth-session-boundary-design.md`, `2026-07-09-data-model-content-ops-contract-design.md` |
| Release | Are test, build, UI audit, content audit, Agent eval, SEO, and deployment stop conditions explicit? | `2026-07-08-engineering-release-gates-design.md`, `2026-07-09-release-gate-orchestration-design.md`, `2026-07-09-test-matrix-ownership-design.md`, `2026-07-09-production-observability-runbook-design.md` |

## Implementation Waves For Approval

### Wave 0: Scope Freeze

Output:

- Confirm `dev` branch and clean worktree.
- Create the first implementation plan under `docs/superpowers/plans/`.
- Do not deploy.

Exit gate:

```bash
git status --short --branch
git diff --check
```

### Wave 1: Public UI And Reading Calm

Output:

- Public shell, typography, contrast, search/archive/taxonomy density, article first-screen hierarchy, and Markdown safety.

Required evidence:

- Focused tests.
- `corepack pnpm check`.
- `corepack pnpm audit:ui`.
- `corepack pnpm build`.
- Screenshot/report evidence for affected routes.

### Wave 2: Agent Companion Completion

Output:

- Answer-first scroll behavior, collapsed source summary, final elapsed semantics, compact trust boundary, desktop frame behavior, mobile sheet stability, and component simplification.

Required evidence:

- Agent focused tests.
- Light/dark desktop and mobile browser checks.
- No horizontal overflow in source expansion.
- Composer remains reachable after long answer completion.

### Wave 3: Agent Quality Operations

Output:

- Owner-visible Agent quality summary, eval evidence, manual-review distinction, reindex/freshness status, and weak-run signal normalization.

Required evidence:

- Agent eval/report tests.
- ReaderSignal redaction and grouping tests.
- Owner route screenshot/report evidence if UI changes.

### Wave 4: Owner Cockpit And Writing Studio

Output:

- Manage cockpit clarity, safe backlog-to-editor intent, publish preflight, freshness signal bridge, and editor scaffolding boundaries.

Required evidence:

- Engagement/router tests.
- Publish freshness tests.
- Editor/manage focused tests.
- No private feedback or contact data in URLs, drafts, screenshots, or reports.

### Wave 5: Reader Relationship Loop

Output:

- Feedback reason taxonomy, subscription state clarity, signal lifecycle display, and backlog action clarity.

Required evidence:

- Feedback/subscription tests.
- Signal lifecycle tests.
- UI evidence for touched public and owner surfaces.

### Wave 6: Final Release Evidence

Output:

- Full release gate report proving the completed program does not regress public reading, Agent, owner tools, privacy, content quality, SEO/distribution, build, and release checks.

Required evidence:

```bash
corepack pnpm release:check
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
corepack pnpm build
```

Deployment remains separate and requires explicit owner approval.

## Stop Conditions

Implementation must stop and ask for approval before:

- Production deployment or rollback.
- Force push or history rewrite.
- DB schema migration.
- Auth provider change.
- New dependency.
- New analytics, observability, email, or hosted service vendor.
- Credential creation, rotation, printing, or storage.
- Destructive data operation.
- Public contract break: route, slug, tRPC procedure, sitemap/RSS visibility, API shape, or DB column.

## Self-Review Result

No remaining spec gaps are intentionally left open. The package covers:

- UI design and theme readability.
- Reading and Markdown rendering.
- Agent answer layout, citations, timing, operations, and evals.
- Owner cockpit and writing workflow.
- Reader feedback, subscription, and signal lifecycle.
- Article quality and style risks.
- Privacy, auth, data/content operations, SEO, observability, release, performance, accessibility, i18n, test ownership, and CSS ownership.

If this guide and the final package are approved, the next action is to write the first implementation plan, then start Wave 0.
