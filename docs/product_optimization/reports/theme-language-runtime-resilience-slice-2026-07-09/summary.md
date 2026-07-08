# Theme Language Runtime Resilience Slice

Date: 2026-07-09
Status: Passed
Spec: `docs/superpowers/specs/2026-07-09-theme-language-runtime-contract-design.md`
Plan: `docs/superpowers/plans/2026-07-09-theme-language-runtime-resilience-slice.md`

## Summary

Implemented a focused runtime resilience slice for theme and language behavior. Theme initialization now has explicit helper coverage for invalid stored values and switchable defaults. Language initialization now safely handles unavailable storage, invalid stored values, browser-language fallback, and synchronizes `document.documentElement.lang` through a deterministic language-to-HTML mapping.

## Changed Files

- `client/src/contexts/ThemeContext.tsx`
- `client/src/contexts/ThemeContext.test.ts`
- `client/src/contexts/LanguageContext.tsx`
- `client/src/contexts/LanguageContext.test.ts`
- `docs/superpowers/plans/2026-07-09-theme-language-runtime-resilience-slice.md`

## User-Visible Behavior

- Invalid stored language values no longer risk crashing the language provider.
- Storage read/write failures are swallowed consistently for language preference, matching the theme provider's existing resilience model.
- Chinese browser language still falls back to Chinese UI when no valid stored preference exists.
- `html[lang]` is updated to `en` or `zh-CN` when the runtime language changes.
- Existing theme switching behavior remains unchanged.

## Verification

```bash
corepack pnpm test -- client/src/contexts/ThemeContext.test.ts client/src/contexts/LanguageContext.test.ts client/src/components/ResearchShell.test.tsx client/src/pages/Home.test.ts
```

Result: passed. Vitest executed the full configured suite: 49 test files, 303 tests passed.

```bash
corepack pnpm check
```

Result: passed.

```bash
corepack pnpm build
```

Result: passed.

```bash
git diff --check
```

Result: passed.

## Known Risks

- This slice does not add a DOM-mounted React test for the provider effects. It tests the deterministic helpers and relies on React's standard effect execution for the `html[lang]` assignment.
- This slice does not modify CSS tokens or contrast values; it only hardens runtime state handling.
