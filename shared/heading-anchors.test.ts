import { describe, expect, it } from "vitest";
import {
  createHeadingAnchorId,
  createUniqueHeadingAnchors,
} from "./heading-anchors";

describe("heading anchors", () => {
  it("creates stable ids from technical headings", () => {
    expect(createHeadingAnchorId("3. Exact Invariants")).toBe(
      "3-exact-invariants"
    );
    expect(createHeadingAnchorId("AgentLoop & Evidence Packet")).toBe(
      "agentloop-and-evidence-packet"
    );
  });

  it("keeps CJK heading text addressable", () => {
    expect(createHeadingAnchorId("核心抽象：从 ReAct 到运行时")).toBe(
      "核心抽象-从-react-到运行时"
    );
  });

  it("deduplicates repeated headings with stable suffixes", () => {
    expect(
      createUniqueHeadingAnchors([
        { text: "Implementation Notes", level: 2 },
        { text: "Implementation Notes", level: 3 },
      ])
    ).toEqual([
      {
        id: "implementation-notes",
        text: "Implementation Notes",
        level: 2,
      },
      {
        id: "implementation-notes-2",
        text: "Implementation Notes",
        level: 3,
      },
    ]);
  });

  it("falls back to a numeric id for empty headings", () => {
    expect(createHeadingAnchorId("", 4)).toBe("heading-4");
  });
});
