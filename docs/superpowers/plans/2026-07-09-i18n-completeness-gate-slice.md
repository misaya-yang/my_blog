# I18n Completeness Gate Slice

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-public-i18n-bilingual-reading-contract-design.md`
Parent contract: `docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md`

## Goal

Add a lightweight bilingual translation gate that verifies all registered UI translation entries have usable English and Chinese strings with matching interpolation placeholders.

## Scope

In:

- Add a dependency-free `audit:i18n` script.
- Check every key in `client/src/i18n/index.ts` for non-empty `en` and `zh` values.
- Check placeholder parity between languages, for example `{count}` and `{title}`.
- Generate a JSON evidence report.
- Add focused tests and include the gate in `release:check`.

Out:

- No new i18n framework.
- No article body translation.
- No user-facing copy rewrite in this slice.
- No route, auth, DB, Agent, or deployment changes.

## Tasks

- [x] Add `scripts/audit/i18n-completeness.ts`.
- [x] Add `scripts/audit/i18n-completeness.test.ts`.
- [x] Add package script `audit:i18n`.
- [x] Add `i18n-audit` to `release:check`.
- [x] Update release orchestration tests.
- [x] Run focused tests.
- [x] Run `corepack pnpm audit:i18n`.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: add i18n completeness audit`.

## Verification Commands

```bash
corepack pnpm test -- scripts/audit/i18n-completeness.test.ts scripts/release/check.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm audit:i18n
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- This gate is intentionally structural. It does not judge translation quality.
- The report can pass with equivalent but awkward copy; content quality remains covered by existing copy voice and content audit gates.
