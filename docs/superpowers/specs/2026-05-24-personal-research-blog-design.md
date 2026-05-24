# Personal Research Blog Design

## Goal

Turn the site into Misaya Yang's personal deep-learning research blog with owner-only professional writing tools, lightweight visitor JWT login, an updated EVQ-Cosh article based on `/Users/yang/projects/hybrid-rope`, and a less generic global visual identity.

## Scope

- Admin remains the single owner and can create, edit, publish, manage, and delete posts.
- Visitors can create a nickname-based JWT session without email providers. This is identity-light, intended for future comments/bookmarks, not strong account security.
- The current DF-RoPE seed article is replaced by an EVQ-Cosh research explainer that matches the latest NeurIPS-style paper narrative.
- The public site should feel like a personal research notebook: editorial, technical, and calm, avoiding generic AI gradients, feature-card filler, and over-rounded marketing surfaces.

## Architecture

The existing Vite + React + tRPC + Express + Drizzle/Postgres stack stays in place. Auth logic moves out of `server/routers.ts` into a focused server auth module using `jose` JWTs and HTTP-only cookies. The frontend uses a richer markdown-first research editor rather than changing the persisted post format, because the renderer, seed pipeline, and existing content already use Markdown with KaTeX and code highlighting.

## Auth Design

- `admin_session` becomes a signed JWT with role `admin`, issued by `auth.adminLogin`.
- `visitor_session` is a signed JWT with role `visitor`, nickname, and anonymous stable id, issued by `auth.visitorLogin`.
- `auth.session` returns `{ isAuthenticated, isAdmin, role, displayName }`.
- `auth.logout` clears both admin and visitor cookies.
- Admin-only tRPC procedures continue to rely on server-side cookie verification.

## Editor Design

The editor remains Markdown-first and adds professional research-writing affordances:

- A command rail for headings, citations, theorem blocks, code, display math, figures, and proof sketches.
- Better status metadata: words, reading time, equations, code blocks, save state, draft/publish state.
- Stronger split preview typography and a compact settings panel.
- Owner-only access. Visitor sessions do not unlock writing.

## Article Design

The seeded post is rewritten from old DF-RoPE to EVQ-Cosh:

- Core framing: RoPE as a finite spectral budget, not only a positional operator.
- Method: EVQ-Cosh closed-form inverse-CDF frequency allocation with zero learned parameters.
- Evidence tiers: EVQ+YaRN primary result, PE-dominant diagnostic, MLA scarce-channel stress test.
- Caveats: not a universal long-context SOTA claim; `tau=d_eff/sqrt(L)` is a basin default, not a global optimum; PK means teacher-forced NLL-gap retrieval.

## UI Design

Visual direction: editorial research notebook with restrained technical instrumentation.

- Palette: paper/ink neutrals plus restrained blue-green and amber accents.
- Layout: asymmetrical intro, research ledger list, stronger article typography, compact navigation.
- Avoid: blobs, generic gradient hero, equal cards everywhere, fake metrics, large marketing CTAs.
- Preserve: Chinese/English toggle, dark/light mode, Scholar/email links, markdown math/code rendering.

## Testing

- Add server tests for visitor login/session/logout and signed admin cookies.
- Keep existing posts/category/tag tests passing.
- Run `pnpm check`, `pnpm test`, and `pnpm build`.
- Start the dev server and use browser QA for home, login, editor, article detail, and mobile layout.
