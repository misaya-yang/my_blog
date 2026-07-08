import { describe, expect, it } from "vitest";

import { getHighlightedTextParts } from "./Search";

describe("search highlight helpers", () => {
  it("keeps text unhighlighted when the query is empty", () => {
    expect(getHighlightedTextParts("Agent runtime notes", " ")).toEqual([
      { text: "Agent runtime notes", highlighted: false },
    ]);
  });

  it("highlights case-insensitive matches and preserves casing", () => {
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

  it("highlights multiple alias-aware occurrences without overlapping matches", () => {
    expect(getHighlightedTextParts("Agent loop and agent runtime", "agent")).toEqual([
      { text: "Agent", highlighted: true },
      { text: " ", highlighted: false },
      { text: "loop", highlighted: true },
      { text: " and ", highlighted: false },
      { text: "agent", highlighted: true },
      { text: " ", highlighted: false },
      { text: "runtime", highlighted: true },
    ]);
  });

  it("highlights alias-expanded excerpt matches", () => {
    expect(
      getHighlightedTextParts(
        "Preference optimization often uses DPO or RLHF.",
        "偏好优化"
      )
    ).toEqual([
      { text: "Preference optimization", highlighted: true },
      { text: " often uses ", highlighted: false },
      { text: "DPO", highlighted: true },
      { text: " or ", highlighted: false },
      { text: "RLHF", highlighted: true },
      { text: ".", highlighted: false },
    ]);
  });
});
