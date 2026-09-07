import { describe, expect, it } from "vitest";
import { normalizeMarkdownMath } from "./markdown-math";

describe("LaTeX delimiter compatibility", () => {
  it("normalizes display math before a standalone equals sign becomes a setext heading", () => {
    expect(
      normalizeMarkdownMath(String.raw`\[
\text{Performance}
=
f(x)
\]`)
    ).toBe("\n$$\n\\text{Performance}\n=\nf(x)\n$$\n");
  });
  it("supports inline math and preserves existing dollar delimiters", () => {
    expect(normalizeMarkdownMath(String.raw`Inline \(x^2\), $y$, $$z$$.`)).toBe(
      "Inline $x^2$, $y$, $$z$$."
    );
  });
  it("leaves code, unmatched delimiters, links and unfinished fences unchanged", () => {
    const content = [
      String.raw`Use \[ literally, [source](https://example.com), and \(x`,
      String.raw`Inline \`\(x\)\``,
      "~~~tex",
      String.raw`\[x\]`,
      "~~~",
      "````md",
      "```",
      String.raw`\[x\]`,
      "````",
      "```tex",
      String.raw`\[x\]`,
    ].join("\n");
    expect(normalizeMarkdownMath(content)).toBe(content);
  });
});
