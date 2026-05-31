# PO-03 Visual Shell and Reading Calm Report

**Generated:** 2026-05-31  
**Scope:** Global visual shell, surface hierarchy, reading page calm, mobile zoom, and public form accessibility.  
**Browser surface:** Codex in-app Browser only. Chrome was not used.

## Summary

PO-03 keeps the dark technical identity but reduces the repeated "AI glass console" feel:

- Removed mobile zoom blocking from `client/index.html`.
- Reduced default background star/grid/planet intensity and removed the planet horizon from subtle reading/login surfaces.
- Introduced calmer surface tokens and lighter glass treatment for panels, buttons, chips, article cards, and reading surfaces.
- Shifted article page titles to an editorial serif treatment and made the decorative article visual quieter.
- Removed viewport-scaled font sizes from the inspected CSS.
- Added accessible labels, autocomplete hints, and polite live regions to subscription, search, login, and article feedback forms.
- Fixed reading-path title clipping by allowing titles to wrap instead of truncating.

## Changed Files

| File | Change |
| --- | --- |
| `/Users/yang/projects/ai-tech-blog/client/index.html` | Removed `maximum-scale=1` so mobile users can zoom. |
| `/Users/yang/projects/ai-tech-blog/client/src/index.css` | Added surface tokens; reduced background/glass intensity; refined article/card typography; added focus affordance and non-clipping reading-path text. |
| `/Users/yang/projects/ai-tech-blog/client/src/components/ResearchShell.tsx` | Suppressed planet decoration on subtle backdrops and marked decorative research visuals as hidden. |
| `/Users/yang/projects/ai-tech-blog/client/src/components/SubscriptionForm.tsx` | Added field labels, autocomplete, `aria-describedby`, language group label, and `aria-live` status. |
| `/Users/yang/projects/ai-tech-blog/client/src/components/ArticleFeedback.tsx` | Added field labels, autocomplete, `aria-describedby`, and `aria-live` status. |
| `/Users/yang/projects/ai-tech-blog/client/src/pages/Home.tsx` | Added labeled/search-type home search input. |
| `/Users/yang/projects/ai-tech-blog/client/src/pages/Login.tsx` | Added labels and autocomplete for visitor/admin login controls. |
| `/Users/yang/projects/ai-tech-blog/client/src/pages/PostDetail.tsx` | Added calmer reading surface, serif article title class, quieter header visual, and calmer TOC surface. |

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm check` | Pass | TypeScript completed with no errors. |
| `pnpm test` | Pass | 24 test files, 116 tests passed. Test stderr still reports missing `OAUTH_SERVER_URL`, as in earlier phases. |
| `pnpm build` | Pass with warning | Vite/esbuild completed. Existing large chunk warning remains; largest reported gzip was `app-vendor` at about 422.99 kB. |

Static checks:

- `rg -n "font-size: clamp|maximum-scale" client/index.html client/src/index.css` returned no matches.
- Reduced-motion CSS is present through `@media (prefers-reduced-motion: reduce)`.

## Browser Checks

Artifacts:

| Artifact | Path |
| --- | --- |
| Browser metrics | `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-03-browser-checks.json` |
| DOM snapshots | `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-03-browser-snapshots/` |
| Screenshot failure note | `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-03-screenshots/screenshot-failure.json` |

Checked in Codex in-app Browser at `http://localhost:3000`:

| Check | Result |
| --- | --- |
| Routes | `/`, `/algorithms`, `/applications`, `/post/agent-loop-observable-tool-using-agents`, `/login` |
| Viewports | `390x844`, `768x1024`, `1280x800`, `1440x900` where required by phase |
| Horizontal overflow | Pass: 0 failures |
| Console errors | Pass: 0 route checks with console errors |
| Text clipping | Pass: 0 clipping candidates in headings, buttons, links, chips, reading-path titles, inputs, and textareas |
| Form labels | Pass: 0 visible form controls without a label or accessible name |
| Mobile zoom | Pass: viewport no longer contains `maximum-scale` |
| Reduced motion | Pass: CSS media query present |

Screenshot note:

- The in-app Browser screenshot API still times out with `Timed out running CDP command "Page.captureScreenshot" for tab 1`.
- DOM snapshots and structured viewport metrics were saved as fallback evidence.

## Acceptance Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Primary content visually outranks decoration | Pass | Subtle pages no longer render the planet horizon; glass and star intensity reduced; article title/prose use a calmer reading surface. |
| Surface levels are consistent | Pass | Surface tokens now distinguish primary reading surface, secondary panels, inline chips, and interactive buttons. |
| Mobile zoom/accessibility is not worse | Pass | Zoom blocking removed; visible controls have labels or accessible names; `aria-live` added to public forms. |
| No text clipping at `390px` | Pass | Browser metrics show 0 clip candidates after reading-path titles were allowed to wrap. |
| Subscription and major forms have accessible labels/status | Pass | Subscription, home search, login, and article feedback forms all pass form-control audit. |

## Risks And Follow-up

- Screenshot capture remains a Browser tool limitation in this session; use DOM snapshots and metrics for phase evidence.
- Owner tools were not redesigned in this bounded PO-03 pass; global visual token changes were validated through build/tests, and deeper owner-tool density belongs to a later focused pass if needed.
- The existing large JavaScript chunk warning remains outside PO-03 scope.
