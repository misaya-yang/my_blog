import { describe, expect, it } from "vitest";
import { hasMarkdownMath, normalizeMarkdownMath } from "./markdown-math";

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

describe("hasMarkdownMath", () => {
  it("finds inline, display and LaTeX-delimited formulas", () => {
    expect(hasMarkdownMath("Energy $E=mc^2$ is conserved.")).toBe(true);
    expect(hasMarkdownMath("$$\n\\sum_i p_i = 1\n$$")).toBe(true);
    expect(hasMarkdownMath("A rate \\(r_t\\) per step.")).toBe(true);
    expect(hasMarkdownMath("\\[x^2\\]")).toBe(true);
    expect(hasMarkdownMath("$ spaced $ still counts")).toBe(true);
  });

  it("ignores dollars inside code and prose without formulas", () => {
    expect(hasMarkdownMath("Plain prose, no formulas.")).toBe(false);
    expect(hasMarkdownMath("Run `echo $HOME` and `$PATH`.")).toBe(false);
    expect(
      hasMarkdownMath("```bash\nexport A=$HOME\necho $A\n```\nDone.")
    ).toBe(false);
    expect(hasMarkdownMath("It costs $5.")).toBe(false);
  });
});
