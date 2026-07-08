# Theme Language Runtime Resilience Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-theme-language-runtime-contract-design.md`
Status: Passed

## Goal

Make theme and language runtime behavior deterministic under invalid stored values, unavailable storage, browser language fallback, and DOM attribute synchronization. This is a resilience/test slice, not a visual redesign.

## Scope

In:

- Add focused provider-runtime helper tests.
- Keep ThemeProvider behavior stable and expose small helpers for invalid/default resolution.
- Make LanguageProvider localStorage reads/writes safe.
- Sync `document.documentElement.lang` when language changes.
- Write a slice evidence report.

Out:

- No new theme library.
- No locale routes.
- No article-body translation.
- No CSS token rewrite.
- No deploy.

## Expected Files

- `client/src/contexts/ThemeContext.tsx`
- `client/src/contexts/ThemeContext.test.ts`
- `client/src/contexts/LanguageContext.tsx`
- `client/src/contexts/LanguageContext.test.ts`
- `docs/product_optimization/reports/theme-language-runtime-resilience-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/contexts/ThemeContext.test.ts client/src/contexts/LanguageContext.test.ts client/src/components/ResearchShell.test.tsx client/src/pages/Home.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- Invalid stored theme/language values fall back deterministically.
- Storage read/write failures do not crash providers.
- Browser Chinese language resolves to `zh`; other browser languages resolve to `en`.
- Language changes can update `html[lang]`.
- Existing public header tests still pass.
