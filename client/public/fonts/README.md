# Self-hosted typefaces

All three families are SIL Open Font License 1.1 (OFL), which permits web
embedding and redistribution. Files are the `latin` and `latin-ext`
`unicode-range` slices of the variable builds served by Google Fonts; the
`latin-ext` slices only download when the page actually renders those
codepoints.

| File | Family | Axes | Role |
|---|---|---|---|
| `fraunces-*.woff2` | Fraunces | `opsz` 9–144, `wght` 300–900, `SOFT` 0–100, `WONK` 0–1 | display + long-form reading |
| `instrument-sans-*.woff2` | Instrument Sans | `wdth` 75–100, `wght` 400–700 | UI, navigation, metadata |
| `jetbrains-mono-*.woff2` | JetBrains Mono | `wght` 400–700 | code and technical labels |

Chinese is intentionally **not** a webfont: a usable Han family is several MB
even sliced. The CJK families are named explicitly per role instead of relying
on `system-ui`, which resolves to a different face on every platform — 宋体
(Songti SC / Source Han Serif SC) for display and reading to match the serif
skeleton, 黑体 (PingFang SC / Source Han Sans SC) for UI.

Re-fetch with the commands recorded in `docs/frontend-upgrade-2026-08.md`.
