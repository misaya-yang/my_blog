# Design System Component Contract Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md)

## Summary

The current product has strong product direction but still carries style debt across public pages, owner tools, and Agent surfaces. This spec turns the design system into an implementation contract so future UI slices improve consistency instead of adding another local visual dialect.

The target is a calm editorial research notebook with operational owner tools. It is not a decorative glass system, generic AI dashboard, or marketing hero kit.

## Goals

- Make typography, spacing, elevation, color, and controls predictable across public, article, Agent, and owner surfaces.
- Keep light and dark themes readable without one-off selector overrides.
- Reduce nested cards, large glowing panels, and repeated decorative wrappers.
- Give future agents a clear place for component-level decisions.
- Preserve existing component APIs unless a slice explicitly changes them.

## Non-Goals

- No rewrite to CSS-in-JS.
- No new component library dependency.
- No wholesale replacement of shadcn/Radix primitives.
- No visual refresh that changes data contracts, routes, auth, or database schema.

## Current Evidence

- Global theme and base tokens live in `client/src/index.css`.
- Public visual layers live in `client/src/styles/visual-refresh.css` and `client/src/styles/public-components.css`.
- Owner/admin styling lives in `client/src/styles/owner-tools.css`.
- Agent styling lives in `client/src/styles/agent-surfaces.css`.
- Legacy material effects live in `client/src/styles/liquid-materials.css`.
- Existing primitives live under `client/src/components/ui/`.

## Ownership Contract

| Layer | Owns | Should Not Own |
| --- | --- | --- |
| `index.css` | base tokens, theme variables, body defaults, focus defaults | page-specific layout |
| `visual-refresh.css` | public shell rhythm and route-level public layout | Agent internals, owner cockpit internals |
| `public-components.css` | public cards, article list rows, reading surfaces | admin-only controls |
| `owner-tools.css` | owner cockpit, editor, manage surfaces | public article typography |
| `agent-surfaces.css` | Agent frame, panel, composer, trace, sources, trust | global typography overrides |
| `liquid-materials.css` | narrow legacy material effects | new broad overrides or Agent fixes |
| `components/ui/*` | reusable primitive behavior and accessible defaults | route-specific copy or business logic |

## Component Rules

### Typography

- Body text uses stable sizes, not viewport-unit font sizing.
- Chinese and English mixed text must keep readable line height and paragraph width.
- Heading hierarchy should signal content structure, not visual excitement.
- Buttons, badges, table headers, and compact metadata use smaller type with enough contrast.

### Layout

- Prefer ledgers, lists, grouped rows, or split bands for dense operational data.
- Use cards only for repeated items, bounded tools, and modals.
- Do not place cards inside larger decorative cards.
- Fixed-format controls need stable dimensions so hover, loading, or translated text does not shift layout.

### Color And Elevation

- Use semantic tokens before adding new hex colors.
- Low-glare dark mode is mandatory; light mode must not wash out body text.
- Accent color marks state, focus, or action. It is not a page background strategy.
- Shadows and borders should clarify hierarchy, not simulate floating glass everywhere.

### Controls

- Icon buttons need accessible names and tooltips where meaning is not obvious.
- Text buttons are for clear commands; icon-only controls should use existing lucide icons where available.
- Inputs and textareas must preserve label, help, validation, disabled, focus, and error states in both themes.
- Segmented controls, toggles, sliders, and menus should match the control semantics instead of ad hoc pills.

### Responsive And Zoom

- No page-level horizontal overflow at 320px, 390px, 768px, 1024px, and 1440px.
- At 400% zoom or narrow viewport, two-dimensional scrolling is allowed only inside code/table containers.
- Mobile should show useful content before decorative scaffolding.

## Token Requirements

New tokens must be:

- Semantic, for example `--surface-readable`, not `--blue-card-2`.
- Defined in the smallest owning layer that can safely reuse them.
- Tested in light and dark mode.
- Documented in the slice report when added.

## Acceptance Checklist

- Changed selectors belong to the correct ownership layer.
- No `!important`, viewport font sizing, broad selector, or hard-coded color count increases without a report waiver.
- Public and Agent screenshots show readable Chinese and English text in light and dark mode.
- Buttons, inputs, links, and icon-only controls keep accessible names and visible focus.
- No nested cards or decorative wrappers are added to solve spacing problems.

## Validation

```bash
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
git diff --check
```

