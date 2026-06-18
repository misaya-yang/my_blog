# MNUI-01 Design Tokens And Shared Primitives Plan

**Status:** in progress

## Scope

Implement token and shared primitive alignment only. Preserve route slugs, i18n keys, shadcn-compatible component exports, current auth boundaries, and the existing dependency list.

## Requirement Mapping

| Gate | Implementation | Validation |
| --- | --- | --- |
| Token source of truth | Add design-system token aliases for color, type, radius, shadow, motion, layout, glass, focus, and semantic states in `client/src/index.css`. | `pnpm check`; `pnpm build`; browser screenshots |
| Primitive consistency | Align Button, Card, Badge, Input, Textarea, Avatar, and BrandMark wrappers without removing existing props or exports. Add additive states for `Button` glass, `Badge` accent, and `Input` icon wrapper. | Targeted UI Vitest; `pnpm audit:ui`; screenshots |
| Visual refresh consumption | Replace key hard-coded glass, chip, tag, search, brand mark, and card surface values with token references in `visual-refresh.css`. | `pnpm build`; screenshot comparison |
| Font/network policy | Keep production on local font chains only; do not import the design package Google fallback. | Phase report |
| Accessibility foundation | Preserve visible focus rings, reduced-motion fallback, mobile hit targets, and IME behavior for CJK input. | `pnpm check`; `pnpm audit:ui`; Playwright focus metrics |

## Edit Boundary

Expected changed files:

- `client/src/index.css`
- `client/src/styles/visual-refresh.css`
- `client/src/styles/public-components.css`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/ui/button.tsx`
- `client/src/components/ui/card.tsx`
- `client/src/components/ui/input.tsx`
- `client/src/components/ui/textarea.tsx`
- `client/src/components/ui/badge.tsx`
- `client/src/components/ui/avatar.tsx`
- MNUI-01 report and runtime docs

`client/src/styles/public-components.css` is an explicit boundary expansion because it defines the base `.brand-mark` dimensions that would otherwise override the new BrandMark size prop before `visual-refresh.css` layers apply.

## Completion Rule

MNUI-01 is complete only when command validation passes, browser evidence is captured, the component contract matrix is written, the font/network policy is recorded, and MNUI-F002 has evidence or blocker notes.
