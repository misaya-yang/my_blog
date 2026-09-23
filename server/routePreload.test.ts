import { describe, expect, it } from "vitest";
import {
  buildRoutePreloadTags,
  injectPreloadTags,
  type ViteManifest,
} from "./routePreload";

const manifest: ViteManifest = {
  "index.html": {
    file: "assets/index-a.js",
    isEntry: true,
    imports: ["_app-vendor.js"],
  },
  "_app-vendor.js": { file: "assets/app-vendor-b.js" },
  "_ArticleCard.js": {
    file: "assets/ArticleCard-c.js",
    imports: ["_app-vendor.js"],
  },
  "src/pages/Home.tsx": {
    file: "assets/Home-d.js",
    imports: ["_ArticleCard.js", "_app-vendor.js"],
  },
  "src/pages/PostDetail.tsx": {
    file: "assets/PostDetail-e.js",
    imports: ["_ArticleCard.js"],
  },
};

describe("route preload tags", () => {
  it("preloads the page chunk and its imports, skipping what the entry already loads", () => {
    const tags = buildRoutePreloadTags(manifest, "/");
    expect(tags).toContain('href="/assets/Home-d.js"');
    expect(tags).toContain('href="/assets/ArticleCard-c.js"');
    expect(tags).not.toContain("app-vendor");
    expect(tags).not.toContain("index-a");
  });

  it("maps article paths to the reader chunk and ignores unknown routes", () => {
    expect(buildRoutePreloadTags(manifest, "/post/some-slug")).toContain(
      "PostDetail-e.js"
    );
    expect(buildRoutePreloadTags(manifest, "/manage")).toBe("");
    expect(buildRoutePreloadTags({}, "/")).toBe("");
  });

  it("injects tags before the closing head", () => {
    const html = injectPreloadTags(
      "<html><head><title>x</title></head></html>",
      '<link rel="modulepreload" href="/a.js" />'
    );
    expect(html).toMatch(/modulepreload.*<\/head>/s);
    expect(injectPreloadTags("<head></head>", "")).toBe("<head></head>");
  });

  it("drops build-time home preloads on other routes", () => {
    const html =
      '<head>\n    <link rel="modulepreload" crossorigin href="/assets/Home-d.js" data-route-preload />\n  </head>';
    expect(injectPreloadTags(html, "")).not.toContain("Home-d.js");
    const swapped = injectPreloadTags(
      html,
      buildRoutePreloadTags(manifest, "/post/x")
    );
    expect(swapped).toContain("PostDetail-e.js");
    expect(swapped).not.toContain("Home-d.js");
  });
});
