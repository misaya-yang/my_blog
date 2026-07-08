# Theme And Language Runtime Contract Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

Theme and language are runtime product features, not just CSS and copy. The app must survive invalid stored values, unavailable storage, browser defaults, route changes, SSR/client shell behavior, and light/dark mode switching without losing readability.

## Goals

- Define ThemeProvider behavior for default, stored, invalid, and toggled states.
- Define LanguageProvider behavior for stored, browser, invalid, and fallback states.
- Keep `html` attributes and classes synchronized.
- Keep public and Agent UI readable in both themes and languages.
- Prevent theme/language changes from losing current route state.

## Non-Goals

- No new theme library.
- No locale route prefixes.
- No article-body translation.
- No design-token rewrite beyond necessary fixes.

## Current Files

- `client/src/contexts/ThemeContext.tsx`
- `client/src/contexts/LanguageContext.tsx`
- `client/src/App.tsx`
- `client/src/index.css`
- `client/src/styles/*.css`
- `client/src/i18n/*`
- `client/src/lib/seo.ts`

## Theme Contract

Theme provider should:

- Accept configured default theme.
- Use stored preference when valid.
- Ignore invalid stored values.
- Handle unavailable localStorage.
- Set `document.documentElement.dataset.theme`.
- Apply or remove `.dark` consistently.
- Set `color-scheme` when appropriate.
- Allow user toggle when `switchable` is true.

## Language Contract

Language provider should:

- Use stored preference when valid.
- Fall back to browser language when recognized.
- Fall back to default language when not recognized.
- Handle unavailable localStorage.
- Set `document.documentElement.lang`.
- Return a readable fallback for missing keys.
- Preserve route/query/hash on switch.

## Tests

Focused:

```bash
corepack pnpm test -- client/src/components/ResearchShell.test.tsx client/src/pages/Home.test.ts client/src/components/MarkdownRenderer.test.tsx
```

If provider-specific tests do not exist, add focused tests before making broad theme/language changes.

General:

```bash
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

## Acceptance Checklist

- Invalid stored theme/language values do not break rendering.
- Storage-unavailable cases have deterministic fallback behavior.
- Theme toggles update `dataset.theme`, `.dark`, and readable color scheme.
- Language switching updates `html[lang]` and preserves route state.
- Changed surfaces pass light/dark and zh/en visual checks.
