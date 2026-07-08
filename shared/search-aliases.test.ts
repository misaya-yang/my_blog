import { describe, expect, it } from "vitest";
import {
  SEARCH_RECOVERY_TOPICS,
  expandSearchToken,
  getAliasGroupsForQuery,
  getSearchHighlightNeedles,
  normalizeSearchText,
  queryContainsSearchAlias,
  tokenizeSearchQuery,
} from "./search-aliases";

describe("search aliases", () => {
  it("normalizes whitespace and casing for shared query handling", () => {
    expect(normalizeSearchText("  Agent   Loop  ")).toBe("agent loop");
  });

  it("tokenizes latin multi-word queries without short stop words", () => {
    expect(tokenizeSearchQuery("the ai agent loop")).toEqual(["agent", "loop"]);
  });

  it("does not match latin aliases from arbitrary substrings", () => {
    const queryTokens = tokenizeSearchQuery("isolation");

    expect(queryContainsSearchAlias("isolation", queryTokens, "iso")).toBe(
      false
    );
    expect(
      queryContainsSearchAlias("iso residual", ["iso", "residual"], "iso")
    ).toBe(true);
  });

  it("expands mixed Chinese and English technical terms", () => {
    expect(expandSearchToken("rlhf")).toContain("后训练");
    expect(expandSearchToken("偏好优化")).toContain("dpo");
  });

  it("builds alias groups from full non-latin query text", () => {
    const groups = getAliasGroupsForQuery("帮我找偏好优化");

    expect(groups.flat()).toContain("preference optimization");
    expect(groups.flat()).toContain("rlhf");
  });

  it("exposes recovery topics from the same shared model", () => {
    expect(SEARCH_RECOVERY_TOPICS.map(topic => topic.id)).toContain(
      "agent-systems"
    );
    expect(
      SEARCH_RECOVERY_TOPICS.find(topic => topic.id === "rag-retrieval")?.aliases
    ).toContain("检索");
  });

  it("returns alias-aware highlight needles sorted by specificity", () => {
    const needles = getSearchHighlightNeedles("偏好优化");

    expect(needles.indexOf("preference optimization")).toBeLessThan(
      needles.indexOf("dpo")
    );
    expect(needles).toContain("rlhf");
  });
});
