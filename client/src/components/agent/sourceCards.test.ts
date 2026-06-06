import { describe, expect, it } from "vitest";
import {
  formatSourceExcerpt,
  getSourceFallbackAnchorId,
  getSourceHref,
} from "./BlogAgentRoot";
import type { SourceCard } from "./types";

const source: SourceCard = {
  sourceId: "isohc-fixed-vector-isometric-residual-mixing:4",
  sourceType: "blog",
  postTitle: "IsoHC: Fixed-Vector Isometric Residual Mixing",
  postSlug: "isohc-fixed-vector-isometric-residual-mixing",
  categorySlug: "ai-algorithms",
  tagSlugs: ["isohc", "residual-stability"],
  heading: "3. Exact Invariants",
  excerpt:
    "## 3. Exact Invariants Let $H\\in\\mathcal{M}_{\\mathrm{iso}}$ and $X\\in\\mathbb{R}^{n\\times d}$. The stream mean is preserved: $$ \\frac{1}{n}\\mathbf{1}^{\\top}HX = \\frac{1}{n}\\mathbf{1}^{\\top}X. $$",
  relevanceReason: "Current public article context. Matched: invariant.",
};

describe("Agent source cards", () => {
  it("links blog sources to the article section anchor", () => {
    expect(getSourceFallbackAnchorId(source)).toBe("heading-2");
    expect(getSourceHref(source)).toBe(
      "/post/isohc-fixed-vector-isometric-residual-mixing#heading-2"
    );
  });

  it("formats source excerpts for compact reader-facing cards", () => {
    const excerpt = formatSourceExcerpt(source);

    expect(excerpt).not.toContain("##");
    expect(excerpt).not.toContain("3. Exact Invariants 3. Exact Invariants");
    expect(excerpt.length).toBeLessThanOrEqual(150);
    expect(excerpt).toContain("stream mean");
  });
});
