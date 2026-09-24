import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MarkdownRenderer from "./MathMarkdownRenderer";

const richArticleFixture = [
  "## Method",
  "",
  "A mixed note with 中文推理, [source links](/post/source), and inline $E=mc^2$ math.",
  "",
  "| Signal | Meaning |",
  "| --- | --- |",
  "| RLVR | verifier-backed reward |",
  "| RAG | evidence packet |",
  "",
  "$$",
  "\\sum_i p_i = 1",
  "$$",
  "",
  "```ts",
  "const verifier = (reward: number) => reward > 0;",
  "```",
  "",
  "```",
  "plain fenced block",
  "```",
  "",
  "#### Detail Anchor",
  "",
  "##### H5 Boundary",
  "",
  "###### H6 Boundary",
  "",
  "An inline `token` remains compact.",
  "",
  "A trace note has a footnote marker.[^trace]",
  "",
  "[^trace]: Footnote text with [archive link](/archive).",
  "",
  "![Evidence mesh](/images/article-thumbs/retrieval-evidence-mesh.jpg)",
].join("\n");

describe("MarkdownRenderer", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders rich article markdown without dropping reader affordances", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        content={richArticleFixture}
        headings={[
          { id: "method", text: "Method", level: 2 },
          { id: "detail-anchor", text: "Detail Anchor", level: 4 },
          { id: "h5-boundary", text: "H5 Boundary", level: 5 },
          { id: "h6-boundary", text: "H6 Boundary", level: 6 },
        ]}
        copiedCode={null}
        copyCodeLabel="Copy code"
        onCopyCode={() => undefined}
      />
    );

    expect(html).toContain('id="method"');
    expect(html).toContain('id="detail-anchor"');
    expect(html).toContain('id="h5-boundary"');
    expect(html).toContain('id="h6-boundary"');
    expect(html).toContain('href="/post/source"');
    expect(html).toContain("technical-table-wrap");
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Scrollable table"');
    expect(html).toContain("<table");
    expect(html).toContain("katex");
    expect(html).toContain("hljs");
    expect(html).toContain('class="hljs-keyword">const</span>');
    expect(html).toContain("verifier");
    expect(html).toContain(
      '<pre class="overflow-x-auto" tabindex="0"><code>plain fenced block'
    );
    expect(html).toContain(
      '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">token</code>'
    );
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain("Footnote text");
    expect(html).toContain("data-footnotes");
    expect(html).toContain('href="/archive"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('alt="Evidence mesh"');
  });

  it("allows article pages to localize the table scroll label", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        content={[
          "| 维度 | 说明 |",
          "| --- | --- |",
          "| source | evidence packet |",
        ].join("\n")}
        tableLabel="可横向滚动的文章表格"
      />
    );

    expect(html).toContain('aria-label="可横向滚动的文章表格"');
  });
  it("keeps unsupported code languages readable and HTML escaped", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        content={"```unknown-language\n<script>alert(1)</script>\n```"}
      />
    );
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});
