# Owner Cockpit Release Risk Summary Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-owner-cockpit-ia-contract-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Make `/manage` answer the owner question "what needs attention before the next edit or publish?" before showing the longer backlog and raw reader signal lists.

## Scope

In:

- Add a small owner cockpit summary helper for release risk, high reader signals, backlog count, and Agent gap count.
- Render a compact `/manage` cockpit panel above Writing Backlog.
- Prioritize publish freshness risk as the next action when present.
- Add bilingual copy and focused helper tests.
- Run UI layout audit for owner routes.

Out:

- No route changes.
- No backend/tRPC contract changes.
- No schema migration.
- No full dashboard redesign.
- No changes to `/manage/agent` or `/write`.

## Tasks

- [x] Add owner cockpit summary helper and tests.
- [x] Add `/manage` cockpit panel.
- [x] Add i18n copy.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `corepack pnpm audit:ui`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: add owner cockpit release summary`.

## Risk Notes

- The panel must summarize existing owner-only data only; it must not fetch new public data or expose private details.
- It should stay compact and operational, not become a marketing hero.
- Publish freshness risk should be visible without duplicating the full reader signal ledger.
