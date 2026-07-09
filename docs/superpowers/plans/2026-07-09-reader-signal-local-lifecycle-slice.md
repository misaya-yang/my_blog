# Reader Signal Local Lifecycle Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-reader-signal-normalization-lifecycle-contract-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Give the owner a visible Phase 1 lifecycle affordance for normalized reader signals without pretending the status is durable.

## Scope

In:

- Add a client helper for local-only reader signal status storage.
- Support `new`, `triaged`, `planned`, `in_revision`, `resolved`, and `ignored`.
- Apply local status to `/manage` normalized signal rows.
- Add a compact status selector and local-only note.
- Add focused tests and evidence report.

Out:

- No DB schema changes.
- No tRPC mutation or API contract change.
- No durable reader signal table.
- No owner notes or timestamps.
- No changes to signal generation logic.

## Tasks

- [x] Add `client/src/pages/manageReaderSignalLifecycle.ts`.
- [x] Add lifecycle helper tests.
- [x] Wire local status into `/manage` normalized signal rows.
- [x] Add bilingual copy.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `corepack pnpm audit:ui`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: add local reader signal lifecycle`.

## Risk Notes

- Local status must be labeled as browser-local and temporary.
- Storage failures should not break the owner dashboard.
- Signal IDs stay server-derived; local status only overlays the read model.
