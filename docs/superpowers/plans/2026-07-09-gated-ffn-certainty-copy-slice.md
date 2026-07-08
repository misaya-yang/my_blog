# Gated FFN Certainty Copy Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`
Status: Passed

## Goal

Resolve the remaining content-audit suggestion in `gated_ffn_blog.md` by replacing an absolute "always" style training-stability claim with a scoped failure boundary.

## Scope

In:

- Update one bullet in the Gated FFN article.
- Re-run content audit and static checks.
- Write a slice evidence report.

Out:

- No article restructure.
- No title, metadata, or seed changes.
- No automated rewrite of other content.
- No deploy.

## Expected Files

- `gated_ffn_blog.md`
- `docs/product_optimization/reports/gated-ffn-certainty-copy-slice-2026-07-09/summary.md`

## Validation

```bash
corepack pnpm content:audit
corepack pnpm test -- scripts/audit/content-quality.test.ts
corepack pnpm check
git diff --check
```

## Acceptance

- `content:audit` reports 0 failures and no unsupported-certainty suggestion for `gated_ffn_blog.md:353`.
- The article still communicates the same boundary: Gated FFN does not automatically make training more stable.
