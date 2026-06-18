# MNUI-04 Owner Tools And System States Plan

**Status:** in progress

## Scope

Align owner-only Manage, Write, Login, and Agent Ops surfaces with the MNUI token system while preserving auth boundaries, data mutation controls, public Agent hiding, server procedures, schemas, and production state.

## Requirement Mapping

| Gate | Implementation | Validation |
| --- | --- | --- |
| Owner guard/login consistency | Keep unauthenticated guard and login panels centered, quiet, dense, and tokenized. | Desktop/mobile `/manage`, `/write`, `/manage/agent`, `/login` screenshots |
| Owner control states | Normalize owner inputs, buttons, segmented controls, tables, tabs, loading/empty surfaces, and editor chrome through owner tokens. | `pnpm check`; `pnpm build`; screenshots |
| Auth and mutation boundary | Do not log in, publish, delete, seed, migrate, or mutate production/local content during this phase. | Report notes; owner-adjacent tests |
| Public Agent separation | Public Blog Agent remains hidden on owner/login routes. | Browser metrics and existing route-helper tests from MNUI-03 |
| Authenticated layout evidence | Capture authenticated owner states only if already available locally. | Screenshot evidence or blocker note |

## Edit Boundary

Expected changed files:

- `client/src/styles/visual-refresh.css`
- `client/src/styles/owner-tools.css`
- MNUI-04 report and runtime docs

No server, auth/session, schema, seed, content, or provider code should change in this phase.

## Completion Rule

MNUI-04 is complete only when owner validation commands pass, available owner/login screenshots exist, public Agent is hidden on owner/auth routes, data-mutation boundaries are documented, authenticated-state blockers are recorded if needed, and MNUI-F005 has evidence.
