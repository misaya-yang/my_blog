import { describe, expect, it } from "vitest";
import {
  formatSourceExcerpt,
  getSourceAnchorId,
  getSourceFallbackAnchorId,
  getSourceHref,
} from "./BlogAgentRoot";
import { toChatMessage } from "./messageState";
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
    expect(getSourceAnchorId(source)).toBe("3-exact-invariants");
    expect(getSourceHref(source)).toBe(
      "/post/isohc-fixed-vector-isometric-residual-mixing#3-exact-invariants"
    );
  });

  it("prefers explicit source anchor ids from persisted cards", () => {
    expect(
      getSourceHref({
        ...source,
        anchorId: "exact-invariants",
      })
    ).toBe(
      "/post/isohc-fixed-vector-isometric-residual-mixing#exact-invariants"
    );
  });

  it("keeps the old chunk-index fallback when no heading is available", () => {
    const fallbackSource = { ...source, heading: undefined };

    expect(getSourceFallbackAnchorId(fallbackSource)).toBe("heading-2");
    expect(getSourceAnchorId(fallbackSource)).toBe("heading-2");
    expect(getSourceHref(fallbackSource)).toBe(
      "/post/isohc-fixed-vector-isometric-residual-mixing#heading-2"
    );
  });

  it("encodes CJK anchors in source hrefs", () => {
    expect(
      getSourceHref({
        ...source,
        heading: "核心机制：从 ReAct 到运行时",
      })
    ).toBe(
      "/post/isohc-fixed-vector-isometric-residual-mixing#%E6%A0%B8%E5%BF%83%E6%9C%BA%E5%88%B6-%E4%BB%8E-react-%E5%88%B0%E8%BF%90%E8%A1%8C%E6%97%B6"
    );
  });

  it("formats source excerpts for compact reader-facing cards", () => {
    const excerpt = formatSourceExcerpt(source);

    expect(excerpt).not.toContain("##");
    expect(excerpt).not.toContain("3. Exact Invariants 3. Exact Invariants");
    expect(excerpt.length).toBeLessThanOrEqual(150);
    expect(excerpt).toContain("stream mean");
  });

  it("prefers compact excerpts when retrieval provides one", () => {
    expect(
      formatSourceExcerpt({
        ...source,
        compactExcerpt: "Compact section summary.",
        excerpt: "Longer raw source text.",
      })
    ).toBe("Compact section summary.");
  });

  it("does not create a blog href for conversation-local context cards", () => {
    expect(
      getSourceHref({
        ...source,
        sourceId: "context:attached-note",
        sourceType: "user_context",
        postTitle: "Attached note",
        postSlug: "",
        excerpt: "Private context should stay conversation-local.",
      })
    ).toBe("#");
  });

  it("does not restore raw reasoning from persisted source metadata", () => {
    const message = toChatMessage({
      id: "assistant-1",
      role: "assistant",
      content: "Grounded answer.",
      sourceJson: {
        sourceCards: [{ ...source, anchorId: "3-exact-invariants" }],
        reasoningMarkdown: "private chain of thought should not render",
      },
    });

    expect(message).not.toHaveProperty("reasoningMarkdown");
    expect(message.sourceCards).toHaveLength(1);
    expect(message.sourceCards?.[0]?.anchorId).toBe("3-exact-invariants");
  });
});
