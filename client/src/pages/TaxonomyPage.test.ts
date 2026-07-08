import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  buildTaxonomyPageHref,
  getHiddenTaxonomyTagCount,
  getTaxonomyPostExcerpt,
  getTaxonomyOffset,
  getTaxonomyPageInfo,
  getVisibleTaxonomyTags,
  parseTaxonomyPage,
  TAXONOMY_PAGE_SIZE,
  TaxonomyArticleRow,
} from "./TaxonomyPage";

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("location", { pathname: "/", search: "", hash: "" });
  vi.stubGlobal("history", { pushState: vi.fn(), replaceState: vi.fn() });
  vi.stubGlobal("addEventListener", vi.fn());
  vi.stubGlobal("removeEventListener", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("taxonomy pagination helpers", () => {
  it("parses invalid page query values as the first page", () => {
    expect(parseTaxonomyPage("")).toBe(1);
    expect(parseTaxonomyPage("page=0")).toBe(1);
    expect(parseTaxonomyPage("page=-2")).toBe(1);
    expect(parseTaxonomyPage("page=1.5")).toBe(1);
    expect(parseTaxonomyPage("page=abc")).toBe(1);
  });

  it("parses valid integer page query values", () => {
    expect(parseTaxonomyPage("page=2")).toBe(2);
    expect(parseTaxonomyPage("q=agent&page=12")).toBe(12);
  });

  it("derives the backend offset from the public page size", () => {
    expect(TAXONOMY_PAGE_SIZE).toBe(24);
    expect(getTaxonomyOffset(1)).toBe(0);
    expect(getTaxonomyOffset(3)).toBe(48);
  });

  it("keeps the first page canonical and adds page state after that", () => {
    expect(buildTaxonomyPageHref("tag", "rlhf", 1)).toBe("/tags/rlhf");
    expect(buildTaxonomyPageHref("tag", "rlhf", 2)).toBe("/tags/rlhf?page=2");
    expect(buildTaxonomyPageHref("category", "ai-applications", 3)).toBe(
      "/categories/ai-applications?page=3"
    );
  });

  it("summarizes visible ranges and navigation boundaries", () => {
    expect(getTaxonomyPageInfo(61, 1)).toMatchObject({
      start: 1,
      end: 24,
      totalPages: 3,
      hasPrevious: false,
      hasNext: true,
      nextPage: 2,
    });

    expect(getTaxonomyPageInfo(61, 3)).toMatchObject({
      start: 49,
      end: 61,
      totalPages: 3,
      hasPrevious: true,
      hasNext: false,
      previousPage: 2,
    });

    expect(getTaxonomyPageInfo(0, 1)).toMatchObject({
      start: 0,
      end: 0,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });
});

describe("taxonomy compact row helpers", () => {
  const tags = [
    { id: 1, name: "RAG", slug: "rag" },
    { id: 2, name: "Evaluation", slug: "evaluation" },
    { id: 3, name: "Agent", slug: "agent" },
    { id: 4, name: "Long context", slug: "long-context" },
  ];

  it("caps visible taxonomy tags and reports hidden count", () => {
    expect(getVisibleTaxonomyTags(tags).map(tag => tag.slug)).toEqual([
      "rag",
      "evaluation",
      "agent",
    ]);
    expect(getHiddenTaxonomyTagCount(tags)).toBe(1);
    expect(getHiddenTaxonomyTagCount(tags.slice(0, 2))).toBe(0);
  });

  it("prefers excerpt and falls back to stripped content", () => {
    expect(
      getTaxonomyPostExcerpt({
        id: 1,
        slug: "with-excerpt",
        title: "With excerpt",
        excerpt: "Concrete summary",
      })
    ).toBe("Concrete summary");
    expect(
      getTaxonomyPostExcerpt({
        id: 2,
        slug: "with-content",
        title: "With content",
        content: "# Heading\n\nThis **article** explains retrieval.",
      })
    ).toContain("This article explains retrieval.");
  });

  it("renders a compact taxonomy row with capped tags and overflow", () => {
    const html = renderToStaticMarkup(
      createElement(TaxonomyArticleRow, {
        post: {
          id: 1,
          slug: "agent-eval",
          title: "Agent evaluation harnesses need source coverage",
          excerpt: "How source coverage changes answer quality review.",
          publishedAt: "2026-07-09T00:00:00.000Z",
          readingMinutes: 8,
          category: { name: "AI Applications", slug: "ai-applications" },
          tags,
        },
        language: "en",
        t: (key, vars) => {
          if (key === "home.minRead") return "min read";
          if (key === "home.readMore") return "Read";
          if (key === "discovery.moreTags") return `+${vars?.count}`;
          if (key === "common.draft") return "Draft";
          return key;
        },
      })
    );

    expect(html).toContain("taxonomy-article-row");
    expect(html).toContain("Agent evaluation harnesses");
    expect(html).toContain("How source coverage changes");
    expect(html).toContain("/post/agent-eval");
    expect(html).toContain("+1");
    expect(html).not.toContain("article-card");
  });
});
