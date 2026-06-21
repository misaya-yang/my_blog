import { describe, expect, it } from "vitest";
import {
  createHeadingAnchorId,
  createSourceCardSemanticAnchorId,
  createUniqueHeadingAnchors,
  extractMarkdownHeadingAnchors,
  extractMarkdownHeadings,
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

  it("creates source-card semantic anchors from section titles before headings", () => {
    expect(
      createSourceCardSemanticAnchorId({
        sectionTitle: "2. Runtime Stack",
        heading: "Fallback Heading",
      })
    ).toBe("2-runtime-stack");
    expect(
      createSourceCardSemanticAnchorId({
        heading: "核心机制：从 ReAct 到运行时",
      })
    ).toBe("核心机制-从-react-到运行时");
  });

  it("does not create numeric fallback anchors for source cards without semantic text", () => {
    expect(createSourceCardSemanticAnchorId({ heading: "" })).toBeNull();
    expect(createSourceCardSemanticAnchorId({ sectionTitle: null })).toBeNull();
  });

  it("extracts markdown headings without treating fenced code comments as headings", () => {
    const markdown = [
      "# Overview",
      "",
      "```python",
      "# x: tensor shape note",
      "print(x)",
      "```",
      "",
      "## Implementation Notes ##",
      "",
      "~~~ts",
      "### not a real heading",
      "~~~",
      "",
      "### Implementation Notes",
    ].join("\n");

    expect(extractMarkdownHeadings(markdown)).toEqual([
      { text: "Overview", level: 1 },
      { text: "Implementation Notes", level: 2 },
      { text: "Implementation Notes", level: 3 },
    ]);
    expect(extractMarkdownHeadingAnchors(markdown)).toEqual([
      { id: "overview", text: "Overview", level: 1 },
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
});
