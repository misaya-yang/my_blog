# Public Language Toggle A11y Slice

Date: 2026-07-09
Status: Passed
Branch: dev

## Summary

Added explicit bilingual accessible labels and titles to the public header language toggle in both desktop and mobile navigation. The visible control remains compact (`中文` / `EN`), while assistive technology receives the full action label.

## Changed Files

- `client/src/components/ResearchShell.tsx`
- `client/src/components/ResearchShell.test.tsx`
- `client/src/i18n/nav.ts`
- `docs/superpowers/plans/2026-07-09-public-language-toggle-a11y-slice.md`

## Behavior

- English runtime label: `Switch language to Chinese`.
- Chinese runtime label: `切换到英文`.
- The language toggle remains a `button`, so it does not navigate or rewrite route/query/hash state.
- No locale routing, article-body translation, or public route shape change was introduced.

## Verification

```bash
corepack pnpm test -- client/src/components/ResearchShell.test.tsx client/src/contexts/LanguageContext.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

Results:

- Focused Vitest command ran 81 files / 453 tests: passed.
- `check`: passed.
- `build`: passed.
- `git diff --check`: passed.

## Risk Notes

- This is an accessibility label improvement only. The visible label intentionally stays short for narrow header fit.
