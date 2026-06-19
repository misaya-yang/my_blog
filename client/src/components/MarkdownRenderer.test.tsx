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
  "An inline `token` remains compact.",
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
        ]}
        copiedCode={null}
        copyCodeLabel="Copy code"
        onCopyCode={() => undefined}
      />
    );

    expect(html).toContain('id="method"');
    expect(html).toContain('id="detail-anchor"');
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
      '<pre class="overflow-x-auto"><code>plain fenced block'
    );
    expect(html).toContain(
      '<code class="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm">token</code>'
    );
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('alt="Evidence mesh"');
  });
});
