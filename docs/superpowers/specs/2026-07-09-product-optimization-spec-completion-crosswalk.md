# Product Optimization Spec Completion Crosswalk

Date: 2026-07-09
Status: Covered by owner-approved execution baseline
Parent package: [2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md)

## Summary

This crosswalk marks the complete review set now used as the execution baseline. It exists to prevent ambiguity about which specs are in scope and which areas are intentionally out of scope.

## Complete Spec Set

| Area | Primary Specs |
| --- | --- |
| Product loop | `2026-07-08-reading-writing-loop-optimization-design.md` |
| Visual system | `2026-07-08-ui-visual-contract-design.md`, `2026-07-09-design-system-component-contract-design.md`, `2026-07-09-css-ownership-style-debt-budget-design.md` |
| Public discovery | `2026-07-08-discovery-research-map-design.md`, `2026-07-09-search-relevance-alias-contract-design.md`, `2026-07-09-archive-taxonomy-density-filtering-design.md`, `2026-07-09-seo-distribution-public-index-contract-design.md` |
| Reading | `2026-07-08-article-reading-rendering-design.md`, `2026-07-09-reading-continuity-route-state-design.md`, `2026-07-09-public-i18n-bilingual-reading-contract-design.md` |
| Agent UX | `2026-07-08-agent-reading-companion-design.md`, `2026-07-09-agent-quality-operations-design.md` |
| Owner tools | `2026-07-08-reader-signal-owner-cockpit-design.md`, `2026-07-09-owner-cockpit-ia-contract-design.md`, `2026-07-09-owner-writing-publish-studio-design.md` |
| Reader loop | `2026-07-09-reader-signal-normalization-lifecycle-contract-design.md`, `2026-07-09-reader-relationship-subscription-design.md` |
| Content quality | `2026-07-08-content-quality-style-system-design.md`, `2026-07-09-publish-freshness-signal-bridge-design.md` |
| Security/privacy | `2026-07-09-privacy-retention-signal-data-contract-design.md`, `2026-07-09-admin-auth-session-boundary-design.md` |
| Data/content ops | `2026-07-09-data-model-content-ops-contract-design.md` |
| Release/ops | `2026-07-08-engineering-release-gates-design.md`, `2026-07-09-release-gate-orchestration-design.md`, `2026-07-09-production-observability-runbook-design.md` |
| Runtime gates | `2026-07-09-theme-language-runtime-contract-design.md`, `2026-07-09-route-contract-sync-design.md`, `2026-07-09-accessibility-automation-matrix-design.md`, `2026-07-09-performance-budget-design.md`, `2026-07-09-test-matrix-ownership-design.md` |

## Implementation Rule

After owner approval, implementation should start from:

```text
docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md
```

Use this crosswalk only to confirm coverage. Do not use it as a replacement for the detailed module specs.

## Intentional Out Of Scope

- Public multi-user workspace.
- Autonomous browsing Agent.
- Hidden/draft content in public Agent answers.
- New CMS migration.
- Schema migration without explicit approval.
- New auth provider without explicit approval.
- New analytics or observability vendor without explicit approval.
- Deployment without explicit approval.

## Owner Review Pass Criteria

- Every requested direction has a corresponding spec: UI, functionality, Agent, reading, owner operations, article quality, and release gates.
- Every high-risk boundary has a spec: auth, privacy, public visibility, data model, and deployment stop conditions.
- Every implementation slice can name one primary spec, one focused test set, and one report path.
