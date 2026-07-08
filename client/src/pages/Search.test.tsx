import { describe, expect, it } from "vitest";

import { getHighlightedTextParts } from "./Search";

describe("search highlight helpers", () => {
  it("keeps text unhighlighted when the query is empty", () => {
    expect(getHighlightedTextParts("Agent runtime notes", " ")).toEqual([
      { text: "Agent runtime notes", highlighted: false },
    ]);
  });

  it("highlights the first case-insensitive match and preserves casing", () => {
    expect(getHighlightedTextParts("Agent Runtime notes", "runtime")).toEqual([
      { text: "Agent ", highlighted: false },
      { text: "Runtime", highlighted: true },
      { text: " notes", highlighted: false },
    ]);
  });

  it("keeps text unhighlighted when no match exists", () => {
    expect(getHighlightedTextParts("Archive ledger", "rope")).toEqual([
      { text: "Archive ledger", highlighted: false },
    ]);
  });
});
