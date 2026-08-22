# Frontend upgrade — 2026-08

Upgrade pass over the public surfaces of Misaya Notes: typography, theme
correctness, controls, accessibility, and the bilingual typographic system.
The existing `--v2-*` house language (accent, radii, blur/saturate materials,
motion durations) was extended, not replaced.

## Typefaces

Self-hosted, OFL, `latin` + `latin-ext` `unicode-range` slices only. Files live
in `client/public/fonts/`; roles and rationale are in that directory's
`README.md`.

| Role | Latin | Chinese |
|---|---|---|
| display, long-form reading | **Fraunces** (`opsz` 9–144, `wght` 300–900, `SOFT` 0–100, `WONK` 0–1) | 宋体 — Songti SC → Source Han Serif SC → Noto Serif CJK SC |
| UI, navigation, metadata | **Instrument Sans** (`wdth` 75–100, `wght` 400–700) | 黑体 — PingFang SC → Source Han Sans SC → Noto Sans CJK SC → Microsoft YaHei |
| code, technical labels | **JetBrains Mono** (`wght` 400–700) | — |

Before this pass every text role resolved to `-apple-system`, i.e. whatever
face the reader's OS supplied — no typographic decision had been made, and the
audit reported it as both a `fonts` failure and a `typeface-decision` warning.

Why these: the subject is a personal research notebook, so display type needs
*character* rather than the engineered neutrality a product UI wants. Fraunces
is an old-style serif with idiosyncratic forms and, unusually, exposes `SOFT`
and `WONK` axes. Instrument Sans supplies the opposite register for UI —
flat terminals, large x-height, open apertures — so the two never compete.

**Chinese is deliberately not a webfont.** A usable Han family is several MB
even sliced. Instead the CJK families are named explicitly per role rather than
relying on `system-ui`, which resolves to a different face on every platform,
and the genre is matched to the Latin role: 宋体 beside the serif, 黑体 beside
the sans. Previously a 黑体 sat beside a Latin sans by accident.

Re-fetch the font files with:

```bash
curl -sS -A "<a modern browser UA>" \
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..900,0..100,0..1&display=swap"
```

then download the `latin` and `latin-ext` `src` URLs from the response. Same
for `Instrument+Sans:wdth,wght@75..100,400..700` and
`JetBrains+Mono:wght@400..700`.

## The signature

Fraunces' `SOFT` and `WONK` axes are tied to typographic scale
(`--wonk-display`, `--wonk-title`, `--wonk-quiet` in `index.css`): the serif
leans further into its idiosyncratic forms the larger it is set, the way
handwriting loosens when written big. Running text stays at `WONK 0` so the
quirk never costs legibility. Where variation axes are unsupported it degrades
to a plain serif.

## Bilingual typography

The interface language and the content language are **independent** here — a
Chinese post title is routinely listed inside an English UI — so `<html lang>`
cannot describe a post title.

- `client/src/lib/contentLang.ts` detects a predominantly-Han run and marks the
  element with `lang="zh-CN"`. Applied to post titles, excerpts, search
  results and article bodies.
- All CJK typography in `notebook.css` is therefore keyed off `:lang(zh)`,
  which matches whether the language comes from `<html>` or from the content.
- No shared content heading carries negative tracking, because any of them can
  render Han. Only the hero, which is authored per locale in JSX, tracks
  negative — and it has a `:lang(zh)` override.
- Chinese gets its own display size, leading (1.24 display / 1.85 body),
  tracking, measure (`--measure-cjk`, 36em vs 68ch for Latin) and a 14px
  legibility floor for metadata.

`<html lang>` is now owned solely by `LanguageContext`. It used to be set by
`useSeo`, but only 4 of 12 pages passed a locale, so navigating to any of the
others reset `lang` to `en-US` while the interface stayed in Chinese.

## Theme

- The app now respects `prefers-color-scheme`. Precedence is stored choice →
  OS preference → the site's canonical dark. **This is a behaviour change**:
  readers whose OS is set to light now get the light theme by default. The
  theme is persisted only on an explicit toggle, so the OS link keeps working
  for everyone who never touches the switch.
- Before this, the light theme was effectively unreachable and therefore
  unverified — the audit's "light" run was rendering the dark theme.
- The light canvas is one warm paper. `body` and `.space-page` previously
  painted two different colours, leaving a visible seam.
- ~133 hardcoded dark-only palette utilities (`text-white`, `text-slate-400`,
  `bg-slate-950/35`, `border-white/10`, …) across the public pages were mapped
  to semantic tokens, which is why light mode had failed contrast.

## Controls and accessibility

- The default `Button` variant failed WCAG 1.4.3 in **both** themes (2.72:1 on
  the dark accent, ~3.96:1 on the light primary). Fixed at the token level via
  `--v2-on-accent`, which also collapsed two accents into one — the light
  theme's primary was blue while its accent was teal.
- The search dock suppressed `outline` on `:focus-visible`, leaving the field
  and its submit button with no keyboard affordance at all. Every interactive
  control now shows a 2px ring at 2px offset, measured at 10.07:1 in dark.
- Target sizes raised to the 24×24 AA floor on inline read links, both tables
  of contents, the reading header's author links and the series footer.
- Hover lift is gated behind `(hover: hover) and (pointer: fine)`.
- A persistent `will-change: transform` on a large selector list was removed.

## Composition

- The orbit photograph behind the home index was removed. There was no
  position where it both read as atmosphere and stayed off the copy: behind
  the index it put Han post titles on a wireframe globe and measured 3.67:1,
  and pushed far enough away to be safe it was invisible.
- The hero column now takes the larger share of the grid (0.95fr vs the old
  0.82fr) so the display line stops wrapping mid-term.
- Reading-path rows stack the series label above the title instead of beside
  it, which doubled the measure available to Chinese titles.
- The reading column caps its measure per script on `p`/`li`/`blockquote`
  rather than on the container, so code blocks and figures keep full width.

## Verification

Run against the dev server:

```bash
bash ~/.claude/skills/motion-landing-page-builder/scripts/check-source.sh client/src
```

```bash
node ~/.claude/skills/motion-landing-page-builder/scripts/audit-page.mjs --url http://localhost:3000/ --out .audit/after --scheme both
```

Two helper scripts were written for this pass and left in the git-ignored
`.audit/` directory:

- `contrast-over-paint.mjs` — resolves the `contrast-unverifiable` warnings the
  page audit cannot decide. It paints every glyph transparent, screenshots the
  pure background, and checks each text run against the darkest **and**
  lightest pixel actually behind it.
- `menu-lifecycle.mjs` — mobile menu open/close/Escape/navigate/scroll-restore.
  Needed because the in-app Browser pane reports
  `document.visibilityState === "hidden"`, which freezes the document timeline
  so no CSS animation completes and every exit transition looks stuck.

## Known, not addressed

`long_horizon_agent_continuous_convergence.md` uses `\[ … \]` for display
math. `remark-math` only recognises `$…$` / `$$…$$`, so those four blocks
render as literal text on the article page. This is a content-delimiter issue,
not a frontend one — the repo already has `check-latex.ts` for this class of
problem.
