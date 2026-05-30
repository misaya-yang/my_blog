import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

function source(path: string) {
  return readFileSync(resolve(root, path), "utf-8");
}

describe("Phase 05 performance boundaries", () => {
  it("keeps route pages behind lazy route-level imports", () => {
    const app = source("client/src/App.tsx");

    expect(app).toContain("lazy(");
    expect(app).toContain("<Suspense");
    expect(app).not.toMatch(/import\s+Editor\s+from\s+["']\.\/pages\/Editor["']/);
    expect(app).not.toMatch(/import\s+Manage\s+from\s+["']\.\/pages\/Manage["']/);
    expect(app).not.toMatch(/import\s+PostDetail\s+from\s+["']\.\/pages\/PostDetail["']/);
    expect(app).not.toMatch(/import\s+Login\s+from\s+["']\.\/pages\/Login["']/);
  });

  it("keeps markdown and syntax-highlighting dependencies out of page entry modules", () => {
    const postDetail = source("client/src/pages/PostDetail.tsx");
    const editor = source("client/src/pages/Editor.tsx");

    for (const pageSource of [postDetail, editor]) {
      expect(pageSource).not.toContain('from "react-markdown"');
      expect(pageSource).not.toContain('from "remark-gfm"');
      expect(pageSource).not.toContain('from "remark-math"');
      expect(pageSource).not.toContain('from "rehype-katex"');
      expect(pageSource).not.toContain('from "rehype-highlight"');
      expect(pageSource).not.toContain('katex/dist/katex.min.css');
      expect(pageSource).not.toContain('highlight.js/styles/github-dark.min.css');
    }
  });

  it("gates Manus and JSX location plugins out of normal production builds", () => {
    const viteConfig = source("vite.config.ts");

    expect(viteConfig).toContain("createVitePlugins");
    expect(viteConfig).toContain("VITE_MANUS_RUNTIME");
    expect(viteConfig).toContain("isProduction");
    expect(viteConfig).toContain("manualChunks");
  });
});
