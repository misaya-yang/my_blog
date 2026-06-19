import { describe, expect, it } from "vitest";
import {
  countReadableUnits,
  estimateArticleReadingMinutes,
  estimateReadingMinutes,
  stripMatchingMarkdownTitle,
} from "./reading-time";

describe("reading time helpers", () => {
  it("counts CJK characters and latin words with the same budget", () => {
    const mixedContent = `${"模型".repeat(160)} RLHF`;

    expect(countReadableUnits(mixedContent)).toBe(321);
    expect(estimateReadingMinutes(mixedContent)).toBe(2);
  });

  it("keeps short empty or punctuation-only content at one minute", () => {
    expect(estimateReadingMinutes("")).toBe(1);
    expect(estimateReadingMinutes("# --- ``` ```")).toBe(1);
  });

  it("counts readable markdown labels without counting syntax noise", () => {
    const content = [
      "# Goal Harness",
      "[Agent Harness](/post/agent-harness) connects 评价 loops.",
      "![Evidence packet](/images/evidence.png)",
      "```ts",
      "const rlvr = 'verifier';",
      "```",
    ].join("\n");

    expect(countReadableUnits(content)).toBe(13);
  });

  it("normalizes duplicate markdown article titles before estimating", () => {
    const content = [
      "# **Goal Harness: Phase Protocol**",
      "",
      `${"读".repeat(319)} RLVR`,
    ].join("\n");

    expect(
      stripMatchingMarkdownTitle(content, "Goal Harness: Phase Protocol")
    ).not.toContain("# **Goal Harness");
    expect(estimateReadingMinutes(content)).toBe(2);
    expect(
      estimateArticleReadingMinutes({
        title: "Goal Harness: Phase Protocol",
        content,
      })
    ).toBe(1);
  });
});
