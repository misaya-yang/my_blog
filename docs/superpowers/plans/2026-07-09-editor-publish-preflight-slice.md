# Editor Publish Preflight Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-owner-writing-publish-studio-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Add a compact, testable publish preflight to `/write` so the owner can see blockers and warnings before publishing without changing server routes, schemas, auth, content audit scripts, or knowledge refresh behavior.

## Scope

In:

- Add a pure editor publish preflight helper.
- Distinguish blockers from warnings.
- Show compact preflight counts in the editor topbar.
- Show detailed blocker/warning lists in the settings sheet.
- Prevent publish when blockers are present.
- Add focused tests and an evidence report.

Out:

- No API, tRPC, DB, auth, or deployment changes.
- No content audit execution on every keystroke.
- No AI writing or article prose generation.
- No broad editor redesign.
- No schema migration.

## Tasks

- [x] Add `client/src/pages/editorPublishPreflight.ts`.
- [x] Add `client/src/pages/editorPublishPreflight.test.ts`.
- [x] Wire `Editor.tsx` to compute preflight state.
- [x] Add compact topbar preflight status.
- [x] Add detailed settings-sheet preflight list.
- [x] Add i18n copy for blocker and warning labels.
- [x] Prevent publish when blockers exist.
- [x] Run focused tests.
- [x] Run `corepack pnpm audit:i18n`.
- [x] Run `corepack pnpm audit:performance`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run browser evidence for `/write`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: add editor publish preflight`.

## Risk Notes

- The helper is intentionally local and deterministic. It does not claim article quality scoring.
- Warnings remain advisory; they should not block publish.
- The publish guard mirrors existing title/content checks and adds invalid numeric curation blockers.
