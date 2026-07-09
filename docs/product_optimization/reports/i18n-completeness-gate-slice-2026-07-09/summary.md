# I18n Completeness Gate Slice

Date: 2026-07-09
Branch: dev
Spec source: `docs/superpowers/specs/2026-07-09-public-i18n-bilingual-reading-contract-design.md`

## Summary

Added a structural bilingual translation gate. `audit:i18n` checks the registered translation dictionary for missing English or Chinese values, empty strings, and mismatched interpolation placeholders.

## Changed Files

- `scripts/audit/i18n-completeness.ts`
- `scripts/audit/i18n-completeness.test.ts`
- `scripts/release/check.ts`
- `scripts/release/check.test.ts`
- `package.json`
- `docs/product_optimization/reports/i18n-completeness-latest.json`
- `docs/product_optimization/reports/i18n-completeness-gate-slice-2026-07-09/i18n-completeness.json`
- `docs/superpowers/plans/2026-07-09-i18n-completeness-gate-slice.md`

## Result

- Translation keys checked: 1135
- Issues found: 0
- Placeholder mismatches: 0

## Validation

```bash
corepack pnpm test -- scripts/audit/i18n-completeness.test.ts scripts/release/check.test.ts client/src/i18n/copyVoice.test.ts
corepack pnpm audit:i18n
corepack pnpm check
corepack pnpm build
git diff --check
```

Result: passed.

Note: the focused Vitest command currently runs the repo Vitest suite under this configuration; 75 files and 433 tests passed.

## Risk Notes

- This gate is structural and does not judge translation quality or tone.
- Article bodies remain author-authored content and are not translated by this gate.
- Release checks now include `i18n-audit` before build.
