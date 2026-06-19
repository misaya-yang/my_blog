# MNP-06 Release Evidence and Production Verification Report

**Phase:** MNP-06 Release Evidence and Production Verification

**Status:** passed for the MNP-01 UI implementation slice

**Date:** 2026-06-19

---

## Summary

Committed, pushed, deployed, and smoke-tested the MNP-01 UI anti-slop implementation slice. The deployed public alias is `https://misaya.online`.

This release evidence is scoped to the MNP-01 UI slice. It does not mark MNP-02 reader-format work, MNP-03 Agent reliability work, MNP-04 content-voice work, or MNP-05 CSS simplification as complete.

## Release Inputs

| Item | Value |
| --- | --- |
| Branch | `main` |
| Implementation commit | `924ed85 feat: calm Misaya Notes UI surfaces` |
| Push target | `origin/main` |
| Deployment command | `pnpm dlx vercel@latest --prod --yes` |
| Production alias | `https://misaya.online` |
| First deployment URL observed | `https://my-blog-ncj7o2wpq-zedpl28174-3992s-projects.vercel.app` |

## Local Verification Before Release

| Gate | Result |
| --- | --- |
| `git diff --check` | passed |
| `pnpm check` | passed |
| Focused Vitest | passed, 3 files and 10 tests |
| `pnpm test` | passed, 35 files and 218 tests |
| `pnpm build` | passed |
| Chrome DevTools local browser checks | passed; details in `mnp-01-ui-anti-slop-visual-system-report.md` |

## Production Smoke

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

## Rollback Notes

- Revert `924ed85` if the UI slice causes a production regression.
- The changes are mostly component class placement and CSS overrides; no schema, data, or API contract changes were made.
- Owner authenticated screens were not logged into during MNP-01; if a regression appears there, first inspect `owner-tools.css` MNP-01 block and the `owner-dark-scope` loading/auth fallback changes.

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNP-F007 | failing | passing | This report, pushed `origin/main`, Vercel production deploy, and production smoke checks. |

## Handoff Notes

Proceed to MNP-02. The production site is reachable and the MNP-01 release slice has rollback notes.
