import { describe, expect, it } from "vitest";
import { formatMonth } from "./Archive";

describe("archive month labels", () => {
  it("keeps the server's UTC grouping month in both interface languages", () => {
    expect(formatMonth(2026, 8, "zh-CN")).toBe("2026年8月");
    expect(formatMonth(2026, 1, "en-US")).toBe("January 2026");
  });
});
