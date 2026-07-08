import { describe, expect, it } from "vitest";

import {
  buildTaxonomyPageHref,
  getTaxonomyOffset,
  getTaxonomyPageInfo,
  parseTaxonomyPage,
  TAXONOMY_PAGE_SIZE,
} from "./TaxonomyPage";

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
