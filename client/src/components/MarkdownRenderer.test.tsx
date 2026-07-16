import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MarkdownRenderer from "./MarkdownRenderer";

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
  "> [!CLAIM]",
  "> The answer should stay readable before sources expand.",
  "",
  "$$",
  "\\sum_i p_i = 1",
  "$$",
  "",
  '```ts title="server/ai/harness.ts"',
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
  "_Figure: Evidence mesh connects retrieval and source cards._",
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
    expect(html).toContain("heading-anchor-link");
    expect(html).toContain('href="#method"');
    expect(html).toContain('id="detail-anchor"');
    expect(html).toContain('id="h5-boundary"');
    expect(html).toContain('id="h6-boundary"');
    expect(html).toContain('href="/post/source"');
    expect(html).toContain("technical-table-wrap");
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Scrollable article table"');
    expect(html).toContain("<table");
    expect(html).toContain("katex");
    expect(html).toContain("article-callout");
    expect(html).toContain('data-callout-type="claim"');
    expect(html).toContain("Claim");
    expect(html).toContain("The answer should stay readable");
    expect(html).toContain("code-block-meta");
    expect(html).toContain("code-block-shell");
    expect(html).toContain("code-block-pre");
    expect(html).toContain("code-copy-button");
    expect(html).toContain("server/ai/harness.ts");
    expect(html).toContain("ts");
    expect(html).toContain("hljs");
    expect(html).toContain('class="hljs-keyword">const</span>');
    expect(html).toContain("verifier");
    expect(html).toContain(
      '<pre class="code-block-pre overflow-x-auto"><code>plain fenced block'
    );
    expect(html).toContain(
      '<code class="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm">token</code>'
    );
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain("Footnote text");
    expect(html).toContain("data-footnotes");
    expect(html).toContain('href="/archive"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain("article-figure");
    expect(html).toContain("article-figure-caption");
    expect(html).toContain('alt="Evidence mesh"');
    expect(html).toContain("Figure: Evidence mesh connects retrieval");
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

  it("localizes generated markdown labels from the selected language", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        content={[
          "## 方法",
          "",
          "> [!NOTE]",
          "> 这是读者提示。",
          "",
          "| 维度 | 说明 |",
          "| --- | --- |",
          "| source | evidence packet |",
          "",
          "```ts",
          "const signal = true;",
          "```",
        ].join("\n")}
        headings={[{ id: "method-zh", text: "方法", level: 2 }]}
        copiedCode={null}
        language="zh"
        onCopyCode={() => undefined}
      />
    );

    expect(html).toContain('aria-label="前往小节：方法"');
    expect(html).toContain("提示");
    expect(html).toContain('aria-label="可横向滚动的文章表格"');
    expect(html).toContain(">代码</span>");
    expect(html).toContain('aria-label="复制代码"');
  });

  it("resolves heading anchors when markdown creates nested inline nodes", () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        content="## Method *with emphasis*"
        headings={[
          {
            id: "method-with-emphasis",
            text: "Method with emphasis",
            level: 2,
          },
        ]}
      />
    );

    expect(html).toContain('id="method-with-emphasis"');
    expect(html).toContain('href="#method-with-emphasis"');
    expect(html).toContain(
      'aria-label="Link to section: Method with emphasis"'
    );
  });
});
