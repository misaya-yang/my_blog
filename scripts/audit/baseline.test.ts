import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  collectDistAssetSizes,
  collectMetadata,
  routeInventory,
  runBaselineAudit,
} from "./baseline";

describe("baseline audit harness", () => {
  it("declares the required public route inventory with explicit expectations", () => {
    const paths = routeInventory.map((route) => route.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/algorithms",
        "/applications",
        "/login",
        "/404",
        "/not-a-real-route",
        "/post/isohc-fixed-vector-isometric-residual-mixing",
        "/post/agent-harness-engine-evaluating-tool-using-agents",
        "/robots.txt",
        "/sitemap.xml",
        "/rss.xml",
      ])
    );

    for (const route of routeInventory) {
      expect(route).toEqual(
        expect.objectContaining({
          path: expect.any(String),
          audience: expect.stringMatching(/^(public|owner|utility|generated)$/),
          expectedStatus: expect.any(Number),
          expectedContent: expect.any(String),
          requiresSeededDatabase: expect.any(Boolean),
        })
      );
    }
  });

  it("captures metadata and missing share fields from an HTML document", () => {
    const metadata = collectMetadata(`<!doctype html>
      <html lang="zh">
        <head>
          <title>Article Title</title>
          <meta name="description" content="Short article summary" />
          <link rel="canonical" href="https://example.com/post/a" />
          <meta property="og:title" content="OG Article Title" />
          <meta name="twitter:card" content="summary_large_image" />
          <script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting"}</script>
        </head>
      </html>`);

    expect(metadata).toMatchObject({
      title: "Article Title",
      description: "Short article summary",
      canonical: "https://example.com/post/a",
      htmlLang: "zh",
      openGraph: {
        title: "OG Article Title",
        description: null,
        image: null,
        type: null,
        url: null,
      },
      twitter: {
        card: "summary_large_image",
        title: null,
        description: null,
        image: null,
      },
      jsonLdTypes: ["BlogPosting"],
    });
  });

  it("records raw and gzip sizes for production dist assets", async () => {
    const dir = await mkdtemp(join(tmpdir(), "blog-audit-"));
    try {
      await mkdir(join(dir, "assets"));
      await writeFile(join(dir, "index.html"), "<html><body>hello</body></html>");
      await writeFile(join(dir, "assets", "index-test.js"), "console.log('hello world');");
      await writeFile(join(dir, "assets", "index-test.css"), "body{color:white}");

      const assets = await collectDistAssetSizes(dir);

      expect(assets.html?.rawBytes).toBeGreaterThan(0);
      expect(assets.javascript[0]).toEqual(
        expect.objectContaining({
          file: "assets/index-test.js",
          rawBytes: expect.any(Number),
          gzipBytes: expect.any(Number),
        })
      );
      expect(assets.css[0]?.file).toBe("assets/index-test.css");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("can produce a useful baseline report without a running web server", async () => {
    const report = await runBaselineAudit({
      projectRoot: process.cwd(),
      baseUrl: null,
      distDir: "missing-dist-directory",
      includeChecks: false,
    });

    expect(report.generatedAt).toEqual(expect.any(String));
    expect(report.git.commit).toEqual(expect.any(String));
    expect(report.routes).toHaveLength(routeInventory.length);
    expect(report.routes.every((route) => route.statusResult.state === "skipped")).toBe(true);
    expect(report.knownGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "missing-robots" }),
        expect.objectContaining({ id: "missing-sitemap" }),
        expect.objectContaining({ id: "missing-rss" }),
      ])
    );
  });
});
