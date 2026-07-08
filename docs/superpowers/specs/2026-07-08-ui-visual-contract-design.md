# UI Visual Contract Design

Date: 2026-07-08
Status: Proposed
Parent spec: [Reading and writing loop optimization](./2026-07-08-reading-writing-loop-optimization-design.md)

## Design Read

Reading this as an editorial personal AI research blog for technical readers, with a calm research notebook language. The product should feel authored, precise, and readable. It should not feel like a generic AI SaaS dashboard, a decorative glass demo, or a marketing landing page.

Recommended dials:

- Design variance: 5 of 10. Use restrained asymmetry and editorial rhythm, not chaotic layouts.
- Motion intensity: 3 of 10. Prefer state feedback and subtle transitions. Avoid scroll spectacle.
- Visual density: 4 of 10. Dense enough for research metadata, but the article body must breathe.

## Goals

- Make the public product visibly less AI-template-like.
- Preserve the current information architecture and routes.
- Stabilize light and dark modes with semantic tokens.
- Make article reading surfaces visually dominant over rails, cards, and controls.
- Reduce CSS override risk by clarifying ownership between global visual files.
- Create screenshot evidence that future work can compare against.

## Non-Goals

- No new component library.
- No route, slug, SEO, auth, or database contract change.
- No full CSS rewrite in one pass.
- No visual-only redesign that ignores Agent, content, and owner workflows.
- No landing-page hero rebuild.

## Current Surface Map

Primary public surfaces:

- `client/src/pages/Home.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Search.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/TaxonomyPage.tsx`
- `client/src/pages/About.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/MarkdownRenderer.tsx`

Agent surfaces:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/AgentMarkdown.tsx`
- `client/src/styles/agent-surfaces.css`

Owner surfaces:

- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/styles/owner-tools.css`

Global style layers:

- `client/src/index.css`
- `client/src/styles/public-components.css`
- `client/src/styles/visual-refresh.css`
- `client/src/styles/liquid-materials.css`
- `client/src/styles/owner-tools.css`
- `client/src/styles/agent-surfaces.css`

## Visual Principles

1. Reading surface first. The article column receives the strongest contrast, cleanest rhythm, and most stable line length.
2. Tools should recede. TOC, Agent prompts, metadata, and feedback modules are tools, not peer content blocks.
3. Cards are earned. Use a card only when it separates an item from a collection. Do not wrap every section in a card.
4. One accent family. Cobalt or blue-green may act as the action accent. Avoid multiple competing accent colors.
5. Typography carries identity. Use size, weight, rhythm, and a reading serif where already supported before adding decoration.
6. No decorative AI tells. Avoid neon glow, purple-blue gradients, decorative dots, fake metrics, over-rounded pills, and equal feature-card rows.

## Semantic Token Contract

The next implementation should introduce or consolidate semantic tokens before changing individual selectors.

Required token groups:

```css
:root {
  --surface-page: ;
  --surface-reading: ;
  --surface-rail: ;
  --surface-muted: ;
  --surface-overlay: ;
  --text-primary: ;
  --text-secondary: ;
  --text-tertiary: ;
  --text-link: ;
  --border-subtle: ;
  --border-strong: ;
  --accent-action: ;
  --accent-reading: ;
  --agent-surface: ;
  --agent-border: ;
  --focus-ring: ;
}
```

Rules:

- Body text must meet WCAG AA. The target for article body text is near AAA where feasible.
- Dark mode uses low-glare surfaces, not pure black.
- Light mode uses a paper-like base, not pure white chrome everywhere.
- Accent colors are reserved for actionable or selected states.
- Warning and error colors remain semantic, not decorative.

## CSS Ownership Rules

`index.css`:

- Owns base resets, theme variables, font defaults, and global browser behavior.
- Should not contain page-specific layout rules.

`public-components.css`:

- Owns reusable public components such as article cards, nav, lists, and search patterns.
- Should avoid overriding Agent or owner tools.

`visual-refresh.css`:

- Owns editorial page composition and reader shell styling.
- Should be reduced over time to named page and component classes.

`liquid-materials.css`:

- Owns material effects only where the project explicitly wants liquid or glass behavior.
- Should not make major content containers transparent by default.
- Broad `!important` overrides should be retired or isolated.

`owner-tools.css`:

- Owns `/manage`, `/manage/agent`, and `/write`.
- Owner screens may be denser, but they must still use the same token system.

`agent-surfaces.css`:

- Owns Agent-specific surfaces and final Agent overrides.
- Should not style public article content outside Agent containers.

## Page-Level Specs

### Homepage

Intent: communicate the research map and recent writing quickly.

Changes to plan:

- Make the author and research map the first read.
- Keep search prominent, but reduce "product dashboard" chrome.
- Treat research tracks as editorial sections rather than equal cards.
- Lower the visual weight of secondary modules such as latest note, archive links, and supporting stats.
- Avoid decorative labels that do not add information.

Acceptance:

- At 1440x900, the first meaningful content after the intro is visible without a large empty hero.
- At 390x844, the first article or research track appears without excessive module stacking.
- No horizontal overflow.

### Article Detail

Intent: make long technical writing comfortable and credible.

Changes to plan:

- Keep the article title, summary, and body as the dominant hierarchy.
- Make side rails thinner and calmer.
- Collapse or defer non-reading modules on mobile.
- Agent prompt chips should sit near the reading task, not as a large promotional block.
- Feedback and subscription modules should appear after meaningful reading progress.

Acceptance:

- Article body starts earlier than the current dense chrome allows.
- Desktop body width stays in a readable range, target 66 to 78 characters for paragraphs.
- TOC and metadata never compete with the article title.
- Mobile page has no two-dimensional scrolling.

### Search

Intent: help readers recover when they do not know the author's taxonomy.

Changes to plan:

- Preserve current search recovery behavior.
- Make empty and zero-result states explicit and useful.
- Include track and article suggestions before generic empty prose.
- Align public search intent with Agent retrieval aliases in a later functional spec.

Acceptance:

- Query input remains reachable on mobile.
- Zero-result state offers next actions.
- Results are scan-friendly without repeated card chrome.

### Archive And Track Pages

Intent: expose the research corpus without looking like a generic blog grid.

Changes to plan:

- Use timeline, grouped track, or ledger patterns instead of repeated large cards where density is high.
- Make dates, tracks, and series metadata readable but secondary.
- Keep filters compact and keyboard accessible.

Acceptance:

- Long lists remain scannable.
- Repeated cards do not dominate the page.

### Owner Tools

Intent: make admin work efficient without breaking the public brand language.

Changes to plan:

- Owner tools can use denser layouts, tabs, and tables.
- Use operational labels, not poetic labels.
- Debug panels live behind details or advanced sections.
- Keep token parity with public surfaces.

Acceptance:

- Owner screens feel like part of the same product.
- Operational information is denser but not visually chaotic.

## Light And Dark Mode QA

Required scenarios:

- System light preference.
- System dark preference.
- Manual theme toggle if present.
- Desktop 1440x900.
- Tablet width around 1024.
- Mobile 390x844.
- High zoom or 320 CSS px equivalent.

Checks:

- Body text contrast.
- Link contrast.
- Button contrast.
- Focus ring visibility.
- Agent panel readability.
- Code block readability.
- Table overflow behavior.
- No theme section flips that feel like another site.

## Accessibility Requirements

- Focus states visible in both themes.
- Interactive controls have accessible names.
- Icon-only controls have tooltips or labels.
- Touch targets meet practical mobile size.
- Reduced motion removes non-essential transitions.
- Layout survives high zoom without page-level horizontal scroll.

## Evidence Artifacts

Future implementation should save screenshots under a new dated folder:

```text
docs/product_optimization/reports/ui-visual-contract-2026-07-08/
  home-1440-light.png
  home-1440-dark.png
  home-390-light.png
  post-1440-light.png
  post-1024-dark.png
  post-390-dark.png
  search-390-light.png
  agent-1440-light.png
  agent-390-dark.png
  summary.md
```

## Verification

Required commands after implementation:

```bash
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

Optional but recommended:

```bash
corepack pnpm test
```

## Implementation Slices

1. Token and ownership audit. Add the token map and document current selector ownership.
2. Homepage density pass. Reduce equal-card feel and clarify hierarchy.
3. Article page hierarchy pass. Make reading surface dominant.
4. Agent visual pass. Keep panel compact and theme-stable.
5. Owner surface token pass. Align admin screens without redesigning flows.
6. Screenshot evidence pass. Save before and after artifacts.

## Review Questions

- Does the visual direction preserve the personal research identity?
- Are we reducing visible AI-template patterns enough?
- Are we avoiding a risky full CSS rewrite?
- Are light and dark mode requirements concrete enough for QA?
