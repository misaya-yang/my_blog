# MNUI-00 Baseline Design Audit Plan

**Status:** in progress

## Scope

Execute MNUI-00 only. Product code stays read-only in this phase; durable changes are limited to the harness docs, report, oracle, progress log, handoff, source packet, continuity ledger, and screenshot folder.

## Requirement Mapping

| Gate | Evidence To Collect | Files Or Commands |
| --- | --- | --- |
| Design-source coverage | Count and classify all 79 files in the downloaded design package, including metadata and compiled demo support. | `find /Users/yang/Downloads/Misaya Notes Design System -type f`; `source-packet.md`; phase report |
| Current code facts | Confirm token layer, visual-refresh layer, shell, Home, PostDetail, Blog Agent, and package scripts. | `client/src/index.css`; `client/src/styles/visual-refresh.css`; `client/src/components/ResearchShell.tsx`; `client/src/pages/Home.tsx`; `client/src/pages/PostDetail.tsx`; `client/src/components/agent/BlogAgentRoot.tsx`; `package.json` |
| Static validation | TypeScript and Vitest baseline. | `pnpm check`; `pnpm test` |
| UI audit validation | Existing Playwright layout gate and baseline route gate. | `pnpm audit:ui`; `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick` |
| Browser evidence | Capture required public and owner/guard routes at desktop and mobile; record overflow, clipping, focus, console errors, and Agent open state. | Local dev server; Playwright screenshot script; `reports/screenshots/mnui-00/` |
| Compliance and rollback | Record no secrets, no production data mutation, no deployment, no product-code edits, and doc-only rollback path. | Phase report |
| Handoff | Mark MNUI-F001 with evidence and name MNUI-01 as next action. | `feature-oracle.json`; `loop-state.json`; `progress-log.md`; `agent-handoff.md`; `continuity-ledger.md`; `next-window-prompt.md` |

## Validation Order

1. Run `pnpm check` and `pnpm test`.
2. Start a local dev server on `http://localhost:3000`.
3. Run `pnpm audit:ui`.
4. Run `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick`.
5. Capture screenshots into `reports/screenshots/mnui-00/`.
6. Write the phase report and update runtime artifacts.

## Completion Rule

MNUI-00 is complete only when the phase report contains command results, screenshot paths or blocker notes, a design-source coverage table, current UI risk inventory, compliance notes, rollback notes, and a clear MNUI-01 unlock decision.
