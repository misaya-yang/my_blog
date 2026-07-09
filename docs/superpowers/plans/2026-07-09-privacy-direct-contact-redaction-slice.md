# Privacy Direct Contact Redaction Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-privacy-retention-signal-data-contract-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Centralize direct contact redaction before reader signals, search misses, and owner backlog evidence can expose user-supplied email or IP-like strings.

## Scope

In:

- Add a shared redaction helper for email and IP-like strings.
- Replace duplicate server-local redaction helpers in reader signals, search misses, and engagement summary generation.
- Add tests for shared redaction and existing owner-only signal flows.
- Write an evidence report.

Out:

- No new durable storage.
- No schema migration.
- No legal policy text.
- No broad privacy redesign.
- No changes to public article content or public metadata.

## Tasks

- [x] Add `shared/redaction.ts`.
- [x] Add `shared/redaction.test.ts`.
- [x] Replace duplicate redaction helpers in server signal paths.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `refactor: centralize contact redaction`.

## Risk Notes

- Redaction should stay intentionally narrow in this slice: direct email and IP-like strings only.
- Existing signal IDs that already contain `[redacted-email]` should remain stable.
- Owner-only reports should still avoid real private data.
