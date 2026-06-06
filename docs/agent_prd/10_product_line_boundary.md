# Blog Agent Product Line Boundary

## Purpose

Keep Blog Agent capability work separate from public visual polish and owner-tool UI polish. The Agent is a product surface with retrieval, grounding, quota, session, rendering, and source-citation behavior; it should not be treated as a decorative chat widget during redesign work.

## Grep Anchors

- `server/ai/knowledge.ts`: public corpus retrieval, query normalization, aliases, source filtering, current-page and site-overview context.
- `server/ai/harness.ts`: prompt contract, context packaging, answer refusal boundaries, model-call orchestration.
- `server/ai/model.ts`: model provider behavior, streaming and reasoning payload handling.
- `client/src/components/agent/BlogAgentRoot.tsx`: reader-facing Agent panel, message state, quota state, source cards, prompt suggestions.
- `client/src/styles/agent-surfaces.css`: Agent-specific visual surface only.
- `client/src/styles/public-components.css`: public site components and article surfaces.
- `client/src/styles/visual-refresh.css`: public visual language overrides.
- `client/src/styles/owner-tools.css`: admin/editor owner-tool surfaces.

## Change Boundaries

Agent capability changes may edit:

- `server/ai/**`
- `server/agent.router.test.ts`
- `client/src/components/agent/**`
- `client/src/styles/agent-surfaces.css`
- Agent docs and eval fixtures

Public UI polish may edit:

- `client/src/pages/Home.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/pages/Search.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/styles/public-components.css`
- `client/src/styles/visual-refresh.css`

Owner-tool polish may edit:

- `client/src/pages/Manage.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/styles/owner-tools.css`

Avoid combining capability and visual changes unless a phase explicitly requires both.

## Acceptance Gates

For Agent capability work:

- `pnpm check`
- `pnpm exec vitest run server/ai/knowledge.test.ts server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts`
- Browser check: ask a page-scoped question from a post and verify current article context is cited.
- Browser check: ask an inventory/find-page question from `/` and verify public-only source cards.

For public or owner UI polish:

- `pnpm check`
- `pnpm build`
- Browser check: no horizontal overflow at desktop and mobile widths.
- Browser check: no console warnings or errors on the touched route.
- Visual grep: touched pages should not introduce new `bg-blue-*`, `bg-sky-*`, `text-cyan-*`, or `text-sky-*` utilities when a tokenized class or owner/agent surface class exists.

## Non-Goals

- Do not add pgvector, PDF ingestion, autonomous browsing, hidden/admin source exposure, or a public `/agent` workspace as part of a visual polish task.
- Do not use public UI redesign work as evidence that Agent retrieval quality improved.
- Do not use Agent eval success as evidence that public typography, layout, or mobile behavior is acceptable.
