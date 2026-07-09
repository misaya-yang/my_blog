# Editor Publish Preflight Slice

Date: 2026-07-09
Status: Passed
Branch: dev

## Summary

Added a deterministic publish preflight to `/write`. The editor now computes blockers and warnings from local draft state, shows a compact topbar status, shows detailed blocker/warning lists in the settings sheet, and prevents publish when blockers exist.

## Changed Files

- `client/src/pages/editorPublishPreflight.ts`
- `client/src/pages/editorPublishPreflight.test.ts`
- `client/src/pages/Editor.tsx`
- `client/src/i18n/editor.ts`
- `docs/superpowers/plans/2026-07-09-editor-publish-preflight-slice.md`
- `docs/product_optimization/reports/editor-publish-preflight-slice-2026-07-09/browser-checks.json`
- `docs/product_optimization/reports/editor-publish-preflight-slice-2026-07-09/editor-preflight-desktop.png`

## User-Visible Behavior

- `/write` topbar shows publish preflight status on desktop.
- Article settings sheet lists blockers and warnings.
- Missing title/content and invalid numeric curation values block publish.
- Missing excerpt/category/tags, short body, incomplete series order, and track-without-taxonomy remain warnings.
- Backlog seeded drafts still use safe scaffold headings and do not inject private prose.

## Browser Evidence

- Local production route: `/write?idea=Agent%20preflight%20reading%20path&source=agent_question`
- Viewport: `1440x900`
- Screenshot: `editor-preflight-desktop.png`
- JSON: `browser-checks.json`

Observed: topbar showed `PreflightReady2 warnings`; settings sheet listed category and tag warnings. The browser check used a temporary local test password set after dotenv load and did not use production credentials.

## Verification

```bash
corepack pnpm test -- client/src/pages/editorPublishPreflight.test.ts client/src/pages/editorBacklogSource.test.ts
corepack pnpm audit:i18n -- --no-output
corepack pnpm check
corepack pnpm build
corepack pnpm audit:i18n
corepack pnpm audit:performance
git diff --check
```

All passed.

## Risk Notes

- This slice does not run content audit scripts in the browser.
- Warnings are advisory and intentionally do not block publish.
- The screenshot covers desktop English only; mobile settings-sheet behavior remains covered by existing responsive sheet implementation, not a fresh screenshot.
