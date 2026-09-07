import { describe, expect, it } from "vitest";
import { headingAtPosition } from "./useArticleReadingPosition";

describe("article reading position", () => {
  const offsets = [500, 800, 2500, 2600, 9000];
  it("keeps the section active through long paragraphs and formula gaps", () => {
    expect(headingAtPosition(offsets, 2100)).toBe(1);
    expect(headingAtPosition(offsets, 8500)).toBe(3);
  });
  it("handles fast forward, reverse scroll and exact boundaries", () => {
    expect(
      [9500, 2600, 2500, 799, 0].map(y => headingAtPosition(offsets, y))
    ).toEqual([4, 3, 2, 0, 0]);
  });
});
