# WPU-02 Article Companion And Agent UX Plan

**Date:** 2026-06-16

## Objective

Harden the public Blog Agent as a source-grounded article and track companion. Public readers must not see raw model reasoning, hidden/admin/draft content, or unsupported technical claims.

## Scope

- Inspect the public Agent UI state shape, stream client, persisted message reconstruction, source cards, route context, and AI harness stream behavior.
- Remove raw reasoning from public stream events, persisted source metadata, message state, trace details, and visible UI.
- Make `answerMode` an active request parameter inferred from reader intent and route context.
- Preserve source-card rendering, quota/cancel/timeout states, file-context limits, and public route launcher behavior.
- Verify hidden/draft/admin prompts produce a public-source limit response instead of leaking non-public material.

## Execution Steps

1. Audit current Agent reasoning and answer-mode paths with targeted source search.
2. Update client Agent types, stream client, message reconstruction, and UI traces so public messages contain only answer text, stage trace, and source evidence.
3. Update server harness/stream contracts so raw reasoning is consumed internally only and is not sent or persisted through public conversation metadata.
4. Add focused regression tests for answer-mode request payloads and persisted reasoning suppression.
5. Run focused Agent tests, typecheck, build, and browser checks on desktop and mobile.
6. Record evidence in the feature oracle, source packet, continuity ledger, progress log, and phase report.

## Acceptance Criteria

- No `reasoning_delta` public SSE event remains.
- No public `ChatMessage` or restored history carries `reasoningMarkdown`.
- Existing persisted `sourceJson.reasoningMarkdown` is ignored by the client.
- Article questions show public source cards.
- Hidden/draft/admin-only questions are refused or bounded to public-source limits.
- `answerMode` is sent by the public Agent request path.
- WPU-F003 can move from failing to passing with test and browser evidence.
