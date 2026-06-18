# MNUI-03 Blog Agent And Trust Surface Plan

**Status:** in progress

## Scope

Align the public Blog Agent UI with the MNUI-02 reader surfaces while preserving route guard, streaming protocol, source boundaries, quota behavior, private context lifecycle, and backend retrieval/model behavior.

## Requirement Mapping

| Gate | Implementation | Validation |
| --- | --- | --- |
| Grounded public-note copy | Make the launcher/header use Blog Agent language and add an explicit public-notes trust boundary inside the panel. | Agent screenshots; route baseline; i18n typecheck |
| Source-first trust surface | Strengthen source-card hierarchy with icon, source type, current-page marker, section, post, excerpt, and match basis. | `sourceCards.test.ts`; post Agent screenshots |
| Route guard | Extract and test the hidden-route predicate for `/write`, `/manage`, and `/login`. | `BlogAgentRoot.test.ts`; route baseline |
| Mobile ergonomics | Keep the launcher touch-sized and panel bounded within mobile viewport while composer/source cards remain reachable. | Mobile post Agent screenshot and metrics |
| Privacy boundary | Preserve private context as conversation-local and keep user context out of public blog source links. | Existing Agent tests plus report notes |

## Edit Boundary

Expected changed files:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/styles/agent-surfaces.css`
- `client/src/i18n/agent.ts`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- `client/src/components/agent/sourceCards.test.ts`
- MNUI-03 report and runtime docs

## Completion Rule

MNUI-03 is complete only when Agent validation commands pass, public/owner route screenshots exist, no overflow/console issues are found in screenshot metrics, the hidden-route guard remains covered by tests, source-card behavior remains public-note scoped, and MNUI-F004 has evidence.
