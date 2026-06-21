# FLG-03 Reader Discovery And Agent Plan

**Date:** 2026-06-21

**Feature:** FLG-F004

**Status:** Executed

## Plan

1. Inspect `PostDetail`, `MarkdownRenderer`, `BlogAgentRoot`, `agent-surfaces.css`, and reader CSS before editing.
2. Preserve existing reader, markdown, and agent API contracts; avoid server, content, and owner-tool changes.
3. Add material semantics to reader surfaces only where it improves hierarchy: mobile TOC, reading surface, entry panel, Agent prompts, share actions, related navigation, and TOC rail.
4. Keep prose, code, tables, formulas, and source cards opaque or near-opaque.
5. Use agent-specific CSS for the launcher, panel, trust boundary, messages, and source cards without changing agent logic.
6. Validate article screenshots, code/table screenshots, Agent closed/open states, source-card styling fixture, reduced motion, reduced transparency, and command gates.

## Design Decisions

- Reader content remains the visual priority; glass is used on rails, controls, and summary/action panels.
- The old hidden left `paper-brief-rail` remains hidden because restoring it at 1728px compressed the article column. The visible reader rail for this phase is the TOC rail plus the in-article reading guide.
- Source card readability is validated through the existing source-card class with a browser-injected CSS fixture, without calling the agent backend or external LLM services.
- No dependency is added.

## Acceptance Gates

- Reader rails/actions use the material system.
- Prose, code, formulas, tables, and source cards remain high contrast.
- Agent launcher and panel feel layered without reducing message readability.
- Reader and Agent screenshots exist at required viewports.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.
