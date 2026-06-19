# MNP-06 Release Evidence and Production Verification Report

**Phase:** MNP-06 Release Evidence and Production Verification

**Status:** passed for the MNP-01 UI slice and MNP-02 reader-format slice

**Date:** 2026-06-19

---

## Summary

Committed, pushed, deployed, and smoke-tested the MNP-01 UI anti-slop implementation slice and the MNP-02 reader-format implementation slice. The deployed public alias is `https://misaya.online`.

This release evidence is scoped to MNP-01 and MNP-02. It does not mark MNP-03 Agent reliability work, MNP-04 content-voice work, or MNP-05 CSS simplification as complete.

## MNP-01 Release Inputs

| Item | Value |
| --- | --- |
| Branch | `main` |
| Implementation commit | `924ed85 feat: calm Misaya Notes UI surfaces` |
| Push target | `origin/main` |
| Deployment command | `pnpm dlx vercel@latest --prod --yes` |
| Production alias | `https://misaya.online` |
| First deployment URL observed | `https://my-blog-ncj7o2wpq-zedpl28174-3992s-projects.vercel.app` |

## MNP-01 Local Verification Before Release

| Gate | Result |
| --- | --- |
| `git diff --check` | passed |
| `pnpm check` | passed |
| Focused Vitest | passed, 3 files and 10 tests |
| `pnpm test` | passed, 35 files and 218 tests |
| `pnpm build` | passed |
| Chrome DevTools local browser checks | passed; details in `mnp-01-ui-anti-slop-visual-system-report.md` |

## MNP-01 Production Smoke

Smoke was run against `https://misaya.online` with redirects followed.

| Route | Status | Bytes | Title |
| --- | --- | --- | --- |
| `/` | 200 | 1974 | `Misaya Notes` |
| `/post/llm-rl-post-training-verifiable-rewards` | 200 | 6528 | `大模型强化学习：从 RLHF 到可验证奖励的后训练主线 · Misaya Notes` |
| `/search?q=zzzz-no-hit-ui-audit` | 200 | 1739 | `Search · Misaya Notes` |
| `/algorithms` | 200 | 1977 | `AI Algorithms · Misaya Notes` |
| `/rss.xml` | 200 | 8467 | `Misaya Notes` |
| `/sitemap.xml` | 200 | 9172 | no HTML title expected |
| `/robots.txt` | 200 | 167 | no HTML title expected |

## MNP-01 Rollback Notes

- Revert `924ed85` if the UI slice causes a production regression.
- The changes are mostly component class placement and CSS overrides; no schema, data, or API contract changes were made.
- Owner authenticated screens were not logged into during MNP-01; if a regression appears there, first inspect `owner-tools.css` MNP-01 block and the `owner-dark-scope` loading/auth fallback changes.

## MNP-02 Release Inputs

| Item | Value |
| --- | --- |
| Branch | `main` |
| Implementation commit | `c8901f0 feat: harden reader format rendering` |
| Push target | `origin/main` |
| Deployment command | `pnpm dlx vercel@latest --prod --yes` |
| Production alias | `https://misaya.online` |
| Deployment URL observed | `https://my-blog-rf8qpzbia-zedpl28174-3992s-projects.vercel.app` |
| Deployment ID | `dpl_Jn9eGhQ9vfmkKzYjDnRs4cjG6KF9` |

## MNP-02 Local Verification Before Release

| Gate | Result |
| --- | --- |
| `git diff --check` | passed |
| Focused Vitest | passed, 3 files and 13 tests |
| `pnpm check` | passed |
| `pnpm test` | passed, 37 files and 223 tests |
| `pnpm build` | passed |
| Chrome DevTools local browser checks | passed for 390 dark, 768 dark, 1024 dark, and 1024 light reader states; screenshot capture timed out, so durable evidence is the MNP-02 report plus a11y/DOM/CSS snapshots |

## MNP-02 Production Smoke

Smoke was run against `https://misaya.online` with redirects followed using Node `fetch`, because `curl` is not installed in this environment.

| Route | Status | Bytes | Time |
| --- | --- | --- | --- |
| `/` | 200 | 1974 | 1.51s |
| `/post/goal-harness-agent-phase-protocol` | 200 | 4572 | 0.87s |
| `/post/llm-rl-post-training-verifiable-rewards` | 200 | 4601 | 0.50s |
| `/search?q=zzzz-no-hit-ui-audit` | 200 | 1738 | 0.40s |
| `/algorithms` | 200 | 1976 | 0.37s |
| `/applications` | 200 | 1920 | 0.29s |
| `/archive` | 200 | 1760 | 3.49s |
| `/rss.xml` | 200 | 7771 | 0.30s |
| `/sitemap.xml` | 200 | 9172 | 0.91s |
| `/robots.txt` | 200 | 167 | 0.24s |

## MNP-02 SSR/Metadata Smoke

The production article route `/post/goal-harness-agent-phase-protocol` passed these SSR metadata checks:

| Check | Result |
| --- | --- |
| `<title>` contains the article title | passed |
| `og:type` is `article` | passed |
| canonical URL points at `https://misaya.online/post/goal-harness-agent-phase-protocol` | passed |
| JSON-LD is present | passed |
| production asset references are present | passed |

## MNP-02 Rollback Notes

- Revert `c8901f0` if the reader-format slice causes a production regression.
- The changes are scoped to Markdown rendering, shared reading-time helpers, reader light/dark contrast, and harness evidence; no schema or API shape changes were made.
- If article formatting regresses, first inspect `client/src/components/MarkdownRenderer.tsx`, `shared/reading-time.ts`, and `client/src/styles/owner-tools.css`.

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNP-F007 | failing | passing | This report, pushed `origin/main`, Vercel production deploy, and production smoke checks. |
| MNP-F007 | passing | passing | MNP-02 commit `c8901f0` pushed to `origin/main`, Vercel production deploy `dpl_Jn9eGhQ9vfmkKzYjDnRs4cjG6KF9`, production route smoke, and SSR metadata smoke. |

## Handoff Notes

Proceed to MNP-03. The production site is reachable, and the MNP-01 and MNP-02 release slices have rollback notes. MNP-03 through MNP-05 remain open.
