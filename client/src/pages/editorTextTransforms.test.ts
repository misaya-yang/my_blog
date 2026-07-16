import { describe, expect, it } from "vitest";

import {
  insertMarkdownBlock,
  insertMarkdownLink,
} from "./editorTextTransforms";

describe("insertMarkdownBlock", () => {
  it("preserves text before and after a caret inside a populated line", () => {
    const content = "keep this sentence";
    const result = insertMarkdownBlock({
      content,
      selectionStart: 10,
      selectionEnd: 10,
      prefix: "## ",
      placeholder: "Heading",
    });

    expect(result.content).toBe("## keep this sentence");
    expect(result.selectionStart).toBe(13);
    expect(result.selectionEnd).toBe(13);
  });

  it("inserts and selects a placeholder on an empty line", () => {
    const result = insertMarkdownBlock({
      content: "before\n\nafter",
      selectionStart: 7,
      selectionEnd: 7,
      prefix: "- ",
      placeholder: "Item",
    });

    expect(result.content).toBe("before\n- Item\nafter");
    expect(result.selectionStart).toBe(9);
    expect(result.selectionEnd).toBe(13);
  });

  it("prefixes the selected line without replacing the selection", () => {
    const result = insertMarkdownBlock({
      content: "alpha beta",
      selectionStart: 6,
      selectionEnd: 10,
      prefix: "> ",
    });

    expect(result.content).toBe("> alpha beta");
    expect(result.selectionStart).toBe(8);
    expect(result.selectionEnd).toBe(12);
  });
});

describe("insertMarkdownLink", () => {
  it("uses selected text as the label and the provided value as the URL", () => {
    const result = insertMarkdownLink({
      content: "Read the paper today",
      selectionStart: 9,
      selectionEnd: 14,
      url: "https://example.com/paper",
    });

    expect(result.content).toBe(
      "Read the [paper](https://example.com/paper) today"
    );
    expect(result.selectionStart).toBe(10);
    expect(result.selectionEnd).toBe(15);
  });

  it("prefers explicit link text when provided", () => {
    const result = insertMarkdownLink({
      content: "Read here",
      selectionStart: 5,
      selectionEnd: 9,
      url: "https://example.com",
      text: "source",
    });

    expect(result.content).toBe("Read [source](https://example.com)");
  });
});
