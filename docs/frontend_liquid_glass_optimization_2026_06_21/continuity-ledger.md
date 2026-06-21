# Continuity Ledger

## Interface Boundaries

- Routes remain unchanged in `client/src/App.tsx`.
- tRPC, Express, Drizzle/Postgres, auth, analytics, SEO metadata, and content markdown contracts are outside redesign scope.
- Component props remain backward compatible; optional styling props may be added only when a phase names the component and evidence.
- No dependency is added in FLG-01.

## Code Facts

- `client/src/main.tsx` imports all global styles in this order: `index.css`, `public-components.css`, `visual-refresh.css`, `agent-surfaces.css`, `owner-tools.css`, `liquid-materials.css`.
- `client/src/styles/liquid-materials.css` was reduced from 973 lines to 258 lines in FLG-01 and is imported last.
- `client/src/styles/visual-refresh.css` contains 5874 lines after FLG-02 and is a major public visual layer.
- `client/src/styles/visual-refresh.css` contains 6039 lines after FLG-03.
- `client/src/styles/owner-tools.css` contains 2100 lines and is a public/owner bleed risk.
- `client/src/styles/owner-tools.css` contains 2565 lines after FLG-04. The FLG-04 owner material layer is intentionally at EOF so it can beat older owner rules without expanding `liquid-materials.css`.
- `client/src/App.tsx` defines all target routes and mounts `BlogAgentRoot` globally.
- FLG-02 added material class adoption through shared public components: `SiteHeader`, mobile sheet, `Surface`, `ArticleCard`, and non-embedded `SubscriptionForm`.
- FLG-02 added page-scoped public material adoption in `visual-refresh.css`; `liquid-materials.css` stayed at 258 lines and still does not own page layouts.
- FLG-02 changed Taxonomy layout to a `hero / notes / side` grid so desktop rails do not push the note list below the first viewport.
- FLG-02 evaluated `content-visibility: auto` for public rows but replaced it with `contain: paint` because full-page screenshots showed delayed offscreen content as blank areas.
- FLG-03 added reader material classes in `PostDetail.tsx` and scoped reader overrides at the end of `visual-refresh.css`.
- FLG-03 refined Agent shell visuals in `agent-surfaces.css`; no agent server/API contract changed.
- FLG-03 keeps the left `paper-brief-rail` hidden after QA showed it compressing the article column at 1728px.
- FLG-04 added scoped semantic classes to `ManageAgent.tsx` and `Editor.tsx` only; no owner route, auth, API, or editor content contract changed.
- FLG-04 owner QA used Playwright tRPC fixtures because local browser state was not admin-authenticated. Public `/` regression screenshots were captured without owner fixtures and showed no owner CSS bleed.
- FLG-05 added `RouteEffectController` to `client/src/App.tsx`; routes remain unchanged, and the controller only writes document-root data attributes for route kind, view-transition support, and route entrance state.
- FLG-05 grew `client/src/styles/liquid-materials.css` to 344 lines. The new layer is effects/fallback-only: route entrance, solid fallback, reduced transparency, reduced motion, focus, overflow, and safe visibility.
- FLG-05 browser QA captured 40 screenshots under `.cache/flg-05-qa/`; failures were 0 and max horizontal overflow was 0px.
- FLG-06 final QA captured 92 screenshots under `.cache/flg-06-qa/`: 56 full-route screenshots, 4 Agent-open screenshots, and 32 theme/preference/fallback screenshots. Failures were 0, max horizontal overflow was 0px, and max non-editor header height was 72px.

## Design Decisions

- Liquid Glass is a web approximation using CSS transparency, blur, highlights, shadows, and fallbacks, not an Apple platform material API.
- Public material surfaces should use restraint: navigation, controls, rails, panels, and overlays.
- Reading and data surfaces use opaque or near-opaque backgrounds.
- Owner/editor writing and data surfaces use opaque or near-opaque backgrounds; glass is limited to shells, controls, panels, tabs, and toolbars.
- Motion is progressive and disabled or simplified under reduced motion preferences.
- Transparency is progressive and replaced with solid surfaces under reduced transparency preferences or unsupported blur.
- `data-solid-surfaces="true"` is the deterministic QA hook for blur-disabled contrast checks.
- `content-visibility: auto` remains rejected for public rows and article bodies unless a later phase collects fresh nonblank screenshot evidence.

## Phase Continuity

- FLG-00 unlocks FLG-01 after baseline and source packet are recorded.
- FLG-01 unlocks page adoption only after the material layer is compact and verified.
- FLG-01 passed command gates and screenshot sampling. FLG-02 should apply the material vocabulary at page/component level rather than expanding global selectors.
- FLG-02 passed command gates and a 40-screenshot public route matrix. FLG-03 is now unlocked for article reader and agent companion work.
- FLG-03 passed command gates and a 32-state reader/agent screenshot matrix. FLG-04 is now unlocked for owner tools and editor work.
- FLG-04 passed command gates, audits, and a 17-state owner/editor/public-regression screenshot matrix. FLG-05 is now unlocked for motion, performance, and accessibility work.
- FLG-02 through FLG-05 should favor shared components and page-scoped classes over global selector expansion.
- FLG-05 must verify reduced preferences before FLG-06 final QA, including owner/editor opacity decisions from FLG-04.
- FLG-05 passed command gates, audits, and a 40-state motion/preference/fallback screenshot matrix. FLG-06 is now unlocked for final full-site QA and handoff.
- FLG-06 passed the full command suite, audits, and final screenshot matrix. The harness is closed; future deployment or production smoke is a separate approved scope.

## Final Residual Risks

- Production deployment and `https://misaya.online` smoke were not in scope.
- Lighthouse targets were not measured in this final local harness; local command/audit/visual evidence passed.
- The worktree remains dirty with protected user/prior-agent changes; do not infer unrelated files were reviewed.

## Protected Worktree Notes

- The worktree is dirty before this harness. Do not revert unrelated modified files.
- Treat generated audit reports and existing server/agent changes as protected unless a phase explicitly names them.
