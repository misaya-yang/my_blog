import { describe, expect, it } from "vitest";

import { buildEditorPublishPreflight } from "./editorPublishPreflight";

const baseInput = {
  title: "Grounded Agent Evaluation",
  content:
    "A practical note about measuring source coverage, refusal behavior, and answer usefulness across repeated reader questions. It keeps the owner focused on observable gaps, concrete evidence, and publish-ready follow-up actions.",
  excerpt: "How to measure source coverage and answer usefulness.",
  categoryId: 1,
  selectedTags: [1, 2],
  seriesSlug: "",
  seriesOrder: "",
  featuredRank: "",
  pinnedTrack: "none" as const,
};

describe("buildEditorPublishPreflight", () => {
  it("passes complete publish-ready inputs", () => {
    const result = buildEditorPublishPreflight(baseInput);

    expect(result.canPublish).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("blocks missing title, missing content, and invalid numeric curation", () => {
    const result = buildEditorPublishPreflight({
      ...baseInput,
      title: " ",
      content: "",
      seriesOrder: "0",
      featuredRank: "abc",
    });

    expect(result.canPublish).toBe(false);
    expect(result.blockers.map(issue => issue.code)).toEqual([
      "missing_title",
      "missing_content",
      "invalid_series_order",
      "invalid_featured_rank",
    ]);
  });

  it("keeps metadata and length problems as warnings", () => {
    const result = buildEditorPublishPreflight({
      ...baseInput,
      content: "Short note.",
      excerpt: "",
      categoryId: null,
      selectedTags: [],
      seriesSlug: "agent-evals",
      pinnedTrack: "applications",
    });

    expect(result.canPublish).toBe(true);
    expect(result.warnings.map(issue => issue.code)).toEqual([
      "missing_excerpt",
      "missing_category",
      "missing_tags",
      "short_content",
      "series_without_order",
      "track_without_taxonomy",
    ]);
  });
});
