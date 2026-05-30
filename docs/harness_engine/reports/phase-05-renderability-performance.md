# Phase 05 Renderability and Performance Report

Date: 2026-05-30

## Build Size Delta

| Surface | Phase 00 baseline | Phase 05 result | Notes |
| --- | ---: | ---: | --- |
| Production HTML gzip | 105.54 kB | 0.86 kB | Production-only Manus runtime/debug weight is gated out by default. |
| Main public JS gzip | 375.45 kB | 17.43 kB entry + 172.82 kB app vendor = 190.25 kB | Initial public route is under the 200 kB target. |
| Main CSS gzip | 33.12 kB | 24.94 kB | Markdown/KaTeX/highlight CSS is no longer linked from first HTML. |
| Markdown renderer gzip | in main bundle | 148.39 kB lazy chunk | Loads only when article/editor preview renders Markdown. |
| Editor page gzip | in main bundle | 6.54 kB route chunk | Owner page shell is route-lazy; editor preview loads Markdown after auth state. |

## Route and Runtime Checks

- `pnpm check` passed.
- `pnpm test` passed: 11 files, 52 tests.
- `pnpm build` passed.
- `curl http://localhost:3000/not-a-real-route` returns HTTP `404` with `noindex,nofollow`.
- `curl http://localhost:3000/src/main.tsx?v=test` returns HTTP `200` JavaScript, proving the client fallback no longer captures Vite source modules.
- Browser smoke covered `/`, `/login`, `/write`, `/not-a-real-route`, plus the 404 "返回首页" interaction. No relevant console errors or Vite overlays were observed.

## Remaining Risk

- Local dev has no `DATABASE_URL`, so public article first-HTML behavior is covered by `server/client-render.test.ts` fixture tests rather than a seeded browser article route.
- The lazy Markdown renderer remains a large chunk because KaTeX and highlight language support are expensive; it is no longer part of first route JS.
