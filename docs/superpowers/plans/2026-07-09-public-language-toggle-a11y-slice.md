# Public Language Toggle A11y Slice

Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-public-i18n-bilingual-reading-contract-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Make the public header language toggle explicit for assistive technology while preserving the current route, query, and hash behavior.

## Scope

In:

- Add bilingual aria/title labels for language toggle controls.
- Apply labels to desktop and mobile header toggles.
- Add focused tests proving the label and route preservation behavior.
- Write evidence report.

Out:

- No article-body translation.
- No locale routing.
- No i18n framework change.
- No public route shape change.

## Tasks

- [x] Add nav copy keys.
- [x] Wire labels into `SiteHeader`.
- [x] Add focused header tests.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: label language toggle accessibly`.

## Risk Notes

- The button text should remain compact for mobile fit.
- Toggle behavior must not navigate or rewrite the URL.
