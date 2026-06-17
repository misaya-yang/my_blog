# WPU-01 Reader IA And Visual System Plan

**Phase:** WPU-01

**Oracle:** WPU-F002

**Status:** planned

## Design Read

WebDeb is a personal AI systems research product, not a generic blog landing page. Preserve the dark research identity, route structure, cobalt accent, bilingual copy, and current article typography improvements while making the first read and article entry calmer.

## Implementation Plan

| Requirement | Files | Work | Evidence |
| --- | --- | --- | --- |
| Home first-read path | `client/src/pages/Home.tsx`, `client/src/i18n/home.ts`, `client/src/styles/visual-refresh.css` | Add a compact "start here" path with latest note plus both tracks. Keep search prominent but make the recommended route explicit. | Home screenshots at 1440x900 and 390x844, `pnpm audit:ui` home metrics. |
| Article reading calm | `client/src/pages/PostDetail.tsx`, `client/src/i18n/post.ts`, `client/src/styles/visual-refresh.css` | Keep title and metadata primary, make brief/series/assistant visible but compact, and move extra context behind details. | Article screenshots at 1440x900 and 390x844, audit prose/entry metrics. |
| Mobile reader parity | `client/src/pages/PostDetail.tsx`, `client/src/styles/visual-refresh.css` | Replace mobile `display: none` behavior with compact collapsible TOC/brief patterns. | Mobile article screenshot and audit checks. |
| Visual ownership | `client/src/styles/visual-refresh.css`, `source-packet.md`, `continuity-ledger.md` | Preserve existing reader typography diff and add a named WPU-01 override block for IA fixes. | Diff summary in report. |
| State clarity | Home/search existing states | Verify loading, empty, and zero-result states remain distinct; adjust only if browser evidence shows ambiguity. | Browser screenshots and audit output. |

## Validation

1. `pnpm check`
2. `pnpm test`
3. `pnpm build`
4. Run local dev server.
5. `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:ui`
6. Browser screenshots for `/`, `/algorithms`, `/applications`, `/search?q=zzzz-no-hit-ui-audit`, `/post/goal-harness-agent-phase-protocol` at the required viewports.

## Boundaries

Do not edit `server/ai/**`, `seed-blog.mjs`, route slugs, deployment config, or production data. If a UI fix requires server behavior, stop and document a blocker.
