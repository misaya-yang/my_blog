import { describe, expect, it } from "vitest";
import {
  classifyClientRoute,
  renderClientShellHtml,
  renderPublicArticleSnapshotMarkup,
  shouldBypassClientRender,
} from "./client-render";

const baseHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <title>AI Tech Blog</title>
    <meta name="description" content="Default description" />
    <meta property="og:title" content="AI Tech Blog" />
    <meta property="og:description" content="Default description" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://example.com/" />
    <meta name="twitter:title" content="AI Tech Blog" />
    <meta name="twitter:description" content="Default description" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

const article = {
  id: 1,
  title: "Agent Harness Engine",
  slug: "agent-harness-engine",
  excerpt: "A product-quality harness for tool-using agents.",
  content: [
    "# Why harnesses matter",
    "",
    "Harnesses make agent behavior observable before launch.",
    "",
    "```ts",
    "const score = 1;",
    "```",
  ].join("\n"),
  coverImage: "/covers/harness.png",
  status: "published" as const,
  visibility: "public" as const,
  publishedAt: new Date("2026-05-01T00:00:00.000Z"),
  updatedAt: new Date("2026-05-02T00:00:00.000Z"),
  category: { name: "AI Applications", slug: "ai-applications" },
  tags: [{ name: "Harness Engine", slug: "harness-engine" }],
};

describe("client shell renderability", () => {
  it("classifies known dynamic routes while rejecting unknown public routes", () => {
    expect(classifyClientRoute("/post/agent-harness-engine")).toEqual({
      kind: "article",
      slug: "agent-harness-engine",
    });
    expect(classifyClientRoute("/tags/harness-engine")).toEqual({ kind: "known" });
    expect(classifyClientRoute("/not-a-real-route")).toEqual({ kind: "unknown" });
  });

  it("bypasses Vite source and asset requests so client modules are not rendered as HTML", () => {
    expect(shouldBypassClientRender("/src/main.tsx?v=test")).toBe(true);
    expect(shouldBypassClientRender("/@vite/client")).toBe(true);
    expect(shouldBypassClientRender("/assets/index.js")).toBe(true);
    expect(shouldBypassClientRender("/post/agent-harness-engine")).toBe(false);
  });

  it("injects indexable article content and canonical metadata into first HTML", async () => {
    const rendered = await renderClientShellHtml({
      baseUrl: "https://example.com",
      rawHtml: baseHtml,
      urlPath: "/post/agent-harness-engine",
      loadArticle: async () => article,
    });

    expect(rendered.status).toBe(200);
    expect(rendered.html).toContain("<h1>Agent Harness Engine</h1>");
    expect(rendered.html).toContain("A product-quality harness for tool-using agents.");
    expect(rendered.html).toContain("Harnesses make agent behavior observable before launch.");
    expect(rendered.html).toContain("Misaya Yang");
    expect(rendered.html).toContain("2026-05-01T00:00:00.000Z");
    expect(rendered.html).toContain('<link rel="canonical" href="https://example.com/post/agent-harness-engine" />');
    expect(rendered.html).toContain('<meta property="og:type" content="article" />');
    expect(rendered.html).toContain('"@type":"BlogPosting"');
  });

  it("returns a 404 shell with noindex metadata for unknown routes", async () => {
    const rendered = await renderClientShellHtml({
      baseUrl: "https://example.com",
      rawHtml: baseHtml,
      urlPath: "/unknown/deep/path",
      loadArticle: async () => article,
    });

    expect(rendered.status).toBe(404);
    expect(rendered.html).toContain('<meta name="robots" content="noindex,nofollow" />');
    expect(rendered.html).toContain('<link rel="canonical" href="https://example.com/unknown/deep/path" />');
  });

  it("renders a lightweight article snapshot without markdown syntax noise", () => {
    const markup = renderPublicArticleSnapshotMarkup(article);

    expect(markup).toContain("<article");
    expect(markup).toContain("<h1>Agent Harness Engine</h1>");
    expect(markup).not.toContain("```");
    expect(markup).not.toContain("# Why");
  });
});
