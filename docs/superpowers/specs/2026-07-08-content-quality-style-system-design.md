# Content Quality And Writing Style System Design

Date: 2026-07-08
Status: Proposed
Parent spec: [Reading and writing loop optimization](./2026-07-08-reading-writing-loop-optimization-design.md)

## Summary

Article quality is part of the product experience. The current audit catches several structural and style problems, but it also misclassifies project policy docs such as `agent.md`. The next pass should separate article content from project docs, distinguish fatal failures from recommendations, and produce actionable writing feedback.

This spec focuses on content audit, article style rules, and the author-facing quality report.

## Goals

- Fix content audit scope so project docs do not fail article rules.
- Add severity levels that distinguish release blockers from style suggestions.
- Detect AI-ish phrasing, awkward subjectivity, unsupported certainty, and vague claims.
- Produce machine-readable findings that can feed the owner cockpit.
- Keep the author's technical voice concrete rather than over-polished.

## Non-Goals

- No automated rewriting of published articles in this phase.
- No LLM dependency for content audit.
- No plagiarism or citation database integration.
- No editorial rewrite before the author approves findings.

## Current Files

- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- `server/publicSeedPosts.ts`
- `seed-blog.mjs`
- root Markdown files including `README.md`, `PRODUCT.md`, and `agent.md`
- `client/src/i18n/copyVoice.test.ts`
- `client/src/i18n/*`

## Audit Scope Contract

Article content sources:

- Seed post content used by `server/publicSeedPosts.ts`.
- Any explicit future article directory if introduced later.
- Markdown files that are intentionally registered as posts.

Non-article project docs:

- `README.md`
- `PRODUCT.md`
- `agent.md`
- `docs/**`
- skill docs
- release audit docs
- generated reports

Rules:

- Non-article docs can have documentation checks later, but they must not fail article H1, excerpt, series, or style rules.
- The audit output should report skipped non-article Markdown count for transparency.
- Root policy docs should not need fake H1 content just to satisfy article checks.

Immediate acceptance:

- `corepack pnpm content:audit` no longer fails only because `agent.md` lacks an article H1.

## Severity Model

```ts
type ContentFindingSeverity = "failure" | "warning" | "suggestion";

type ContentFindingCategory =
  | "structure"
  | "metadata"
  | "markdown"
  | "style"
  | "evidence"
  | "readability"
  | "linking";
```

Failure:

- Missing required article title.
- Broken required metadata.
- Malformed Markdown that can break rendering.
- Broken internal links.
- Published article missing from knowledge index after publish.

Warning:

- Weak excerpt.
- Missing series connection for a series article.
- Unclear source note.
- Overlong paragraph.
- Table or code likely to overflow.

Suggestion:

- AI-ish filler phrase.
- Over-subjective framing.
- Vague claim.
- Missing concrete example.
- Awkward transition.

## Finding Output Contract

JSON shape:

```ts
type ContentFinding = {
  severity: ContentFindingSeverity;
  category: ContentFindingCategory;
  code: string;
  file?: string;
  articleSlug?: string;
  line?: number;
  span?: string;
  message: string;
  reason?: string;
  rewriteIntent?: string;
  confidence?: "low" | "medium" | "high";
  suggestion?: string;
};

type ContentAuditReport = {
  generatedAt: string;
  summary: {
    articleFiles: number;
    skippedMarkdownFiles: number;
    seedPosts: number;
    failures: number;
    warnings: number;
    suggestions: number;
  };
  findings: ContentFinding[];
};
```

Rules:

- Terminal output can stay concise.
- JSON report should be complete enough for owner cockpit ingestion.
- Suggestions do not fail the release gate by default.
- Style findings should include `span`, `reason`, `rewriteIntent`, and `confidence` when the script can identify them deterministically.

## Style Finding Taxonomy

Required style codes:

- `aiish_phrase`: stock article setup or AI-product phrasing.
- `awkward_expression`: grammatically valid but visibly unnatural phrasing.
- `subjective_overreach`: author stance or certainty that is stronger than the evidence.
- `translationese`: phrasing that reads like literal translation rather than natural technical prose.
- `vague_claim`: claim without mechanism, metric, or task context.
- `unsupported_certainty`: absolute claim without scope or caveat.

Each taxonomy item must define:

- trigger rule.
- false-positive guard.
- example evidence.
- rewrite intent.
- severity default.

## Style Rules

### AI-Ish Filler

Flag phrases such as:

- "本文将"
- "在本文中"
- "值得注意的是"
- "深入探讨"
- "无疑"
- "显著提升" without evidence
- "革命性"
- "范式转变" without a concrete mechanism

Rule:

- Style suggestions should include the reason and a rewrite intent, not a full forced rewrite.

### Over-Subjective Framing

Flag patterns:

- "我认为" when it is not adding author position.
- "我们可以看到" when no evidence follows.
- "显然" when the point is not self-evident.
- "有趣的是" without explaining why it matters.

Rewrite intent:

- Replace with the concrete mechanism, evidence, limitation, or implication.

### Unsupported Certainty

Flag:

- absolute claims without source or caveat.
- broad field claims such as "all", "never", "always", "SOTA" without evidence.
- claims about performance without dataset, model, metric, or context.

Rewrite intent:

- Add scope, evidence, or caveat.

### Vague Technical Claims

Flag:

- "improves efficiency" without cost dimension.
- "better retrieval" without task or metric.
- "more robust" without failure mode.
- "stronger agent capability" without observable behavior.

Rewrite intent:

- Name the mechanism and observable outcome.

## Article Quality Rubric

Each article should expose:

1. Problem: what question or failure mode it addresses.
2. Mechanism: what changes at the technical level.
3. Evidence: what supports the claim.
4. Limitation: where the claim stops.
5. Implication: why it matters for builders or readers.

Audit should not fail every missing item immediately. Start as suggestions, then promote repeated structural gaps after review.

Machine-readable output:

```ts
type ArticleRubricFinding = {
  articleSlug: string;
  dimensions: {
    problem: "present" | "weak" | "missing";
    mechanism: "present" | "weak" | "missing";
    evidence: "present" | "weak" | "missing";
    limitation: "present" | "weak" | "missing";
    implication: "present" | "weak" | "missing";
  };
  lineRefs?: Record<string, number[]>;
  suggestions: string[];
};
```

Rules:

- Rubric output is advisory in the first pass.
- A weak or missing dimension should explain the concrete missing reader question.
- Rubric output can feed owner backlog but should not generate article prose.

## I18n Copy Quality

Visible UI copy should avoid generic AI-product voice.

Checks:

- No duplicate CTA intent.
- No vague action labels.
- No decorative version labels.
- No AI-purple or "next generation" phrasing in text.
- Chinese and English labels should be direct and functional.

Existing file to extend:

- `client/src/i18n/copyVoice.test.ts`

## Tests

Unit:

- Root docs are skipped from article H1 checks.
- Seed posts still receive article checks.
- AI-ish phrases produce suggestions, not failures.
- Broken internal links produce failures.
- JSON summary counts failures, warnings, suggestions, and skipped docs.

Commands:

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts
corepack pnpm content:audit
corepack pnpm check
```

Optional:

```bash
corepack pnpm test -- client/src/i18n/copyVoice.test.ts
```

## Owner Cockpit Integration

The audit report should feed `ReaderSignal` as `content_audit` findings.

Mapping:

- failure to high severity.
- warning to medium severity.
- suggestion to low severity.

Actions:

- open article editor.
- view finding in context.
- mark ignored with note.
- mark resolved after publish.

## Implementation Slices

1. Fix audit scope and tests.
2. Add severity and category output.
3. Add style suggestion rules.
4. Add JSON report output.
5. Connect findings to owner cockpit read model.
6. Add a short author style guide under docs after rule behavior is stable.

## Acceptance Checklist

- `content:audit` passes when only non-article docs lack article structure.
- Findings are actionable and line-specific when possible.
- Style suggestions do not block release by default.
- Audit output can feed owner signals.
- No LLM dependency is introduced.
