# Agent Review Summary

**Date:** 2026-05-31

This file summarizes the three parallel read-only reviews used to shape the Product Optimization roadmap.

## Review 1: Content and Information Architecture

Key findings:

- The blog already has a strong dual-track information architecture: `AI Algorithms` and `AI Applications`.
- The applications track is becoming a coherent Agent/RAG/Harness series through `agent_harness_engine_blog.md`, `rag_evidence_packet_context_compiler.md`, and `agent_loop_blog.md`.
- Algorithm content exists but the publishing surface is less coherent: EVQ remains a hidden draft, and content files and seed files are not yet a fully stable source-of-truth system.
- The product should not repeat foundational work from `docs/harness_engine`; it should move toward content systemization and AI productization.

Recommended phases:

- Content source and series metadata.
- Dual-track topic maps.
- Agent retrieval and answer quality.
- Reading paths and concept graph.
- Feedback to content backlog.
- AI application showcase.
- Publish and knowledge freshness.

Risks:

- Hidden content leakage.
- Published date drift during repeated seeding.
- Tag inflation.
- Agent hallucination.
- PRD scope creep.

## Review 2: UI and Reading Experience

Key findings:

- The site still reads as a deep-space technical console: repeated star fields, grid, planet horizon, glass panels, blue/cyan glow, and abstract visuals.
- Home has better concrete wording now, but still follows a SaaS hero pattern: giant title, chip row, author badge, track cards, search, subscription, stats, sidebar.
- Track pages mostly reuse the home formula rather than presenting distinct research maps.
- Article pages have strong functionality, but the reading experience is still wrapped in a decorative glass-card shell.
- Subscription form and several controls need better labels, autocomplete, `aria-live`, and keyboard/focus checks.

Recommended phases:

- Visual token and shell reduction.
- Home as personal research index.
- Track pages as topic maps.
- Long-form reading system.
- Cards, lists, forms, and accessibility polish.

Risks:

- Overcorrecting can remove the technical identity.
- Chinese/English typography and line wrapping need dual-language verification.
- Code, formulas, and tables can regress when article width is changed.

## Review 3: Functional and Engineering Feasibility

Key findings:

- Engineering foundations are strong: scripts, public routes, discovery routes, engagement routes, Agent schema, Blog Agent UI, and `/manage/agent` already exist.
- Existing Agent functionality includes conversations, context sources, quota, source cards, debug/eval/admin routes, and run traces.
- The next step should be incremental improvement, not a rewrite.
- Current PRD/implementation drift exists around reindexing and source table naming. The code uses `ai_context_sources`; older docs mention alternative names.
- Retrieval can improve with DB full-text/metadata search before introducing pgvector.

Recommended phases:

- PRD/implementation alignment and reindex ops.
- Retrieval quality and eval baseline.
- Agent UX state machine.
- Admin Agent Operations 2.0.
- Context/file lifecycle.
- Agent answer feedback and observability.

Risks:

- Do not combine retrieval refactor, Agent UX rewrite, and admin ops in one phase.
- Avoid pgvector/PDF/public workspace/automatic authoring in this stage.
- Keep current `ai_context_sources` schema as the source of truth unless a deliberate migration is planned.

## Consolidated Direction

The Product Optimization roadmap should focus on:

1. Structure: series, concepts, reading paths.
2. UI: calmer research index and long-form reading.
3. AI product: article-aware assistant, source grounding, evals, operational visibility.
4. Trust: honest subscription state, publish freshness, hidden-content boundaries.
