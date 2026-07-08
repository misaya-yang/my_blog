import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  formatPerformanceBudgetLines,
  parsePerformanceBudgetArgs,
  runPerformanceBudgetAudit,
} from "./performance-budget";

describe("performance budget audit", () => {
  it("parses output, dist, and warning threshold options", () => {
    expect(
      parsePerformanceBudgetArgs(
        [
          "--output=.cache/perf.json",
          "--dist-dir=custom-dist",
          "--largest-js-gzip-warning=123",
          "--total-css-gzip-warning=456",
        ],
        "/repo"
      )
    ).toMatchObject({
      projectRoot: "/repo",
      outputPath: ".cache/perf.json",
      distDir: "custom-dist",
      largestJsGzipWarningBytes: 123,
      totalCssGzipWarningBytes: 456,
    });
    expect(parsePerformanceBudgetArgs(["--no-output"], "/repo")).toMatchObject({
      outputPath: null,
    });
    expect(() =>
      parsePerformanceBudgetArgs(["--largest-js-gzip-warning=nope"], "/repo")
    ).toThrow("Invalid largest JS gzip warning");
  });

  it("fails when build output assets are missing", async () => {
    const projectRoot = await makeTempProject();
    try {
      await writeSourceFiles(projectRoot);
      const report = await runPerformanceBudgetAudit({
        projectRoot,
        distDir: "dist/public",
        outputPath: null,
        largestJsGzipWarningBytes: 1024,
        totalCssGzipWarningBytes: 1024,
      });

      expect(report.status).toBe("failed");
      expect(report.failures[0]).toContain("Build output assets present");
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("records dist size warnings without failing route-boundary checks", async () => {
    const projectRoot = await makeTempProject();
    try {
      await writeSourceFiles(projectRoot);
      await writeDistFiles(projectRoot, {
        "assets/index.js": "const value = 'large';\n".repeat(80),
        "assets/index.css": ".root{color:black;}\n",
      });
      const report = await runPerformanceBudgetAudit({
        projectRoot,
        distDir: "dist/public",
        outputPath: "perf.json",
        largestJsGzipWarningBytes: 10,
        totalCssGzipWarningBytes: 1024,
      });

      expect(report.status).toBe("passed");
      expect(
        report.warnings.some(warning => warning.includes("Largest JS"))
      ).toBe(true);
      expect(
        report.checks.find(check => check.id === "route-pages-lazy-loaded")
      ).toMatchObject({ state: "passed", blocking: true });
      expect(formatPerformanceBudgetLines(report)[0]).toBe(
        "Performance budget status: passed"
      );
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("fails when owner/editor route modules stop being lazy-loaded", async () => {
    const projectRoot = await makeTempProject();
    try {
      await writeSourceFiles(projectRoot, {
        appSource: 'import Editor from "./pages/Editor";\n<Suspense />',
      });
      await writeDistFiles(projectRoot, {
        "assets/index.js": "const ok = true;",
        "assets/index.css": ".root{color:black;}",
      });
      const report = await runPerformanceBudgetAudit({
        projectRoot,
        distDir: "dist/public",
        outputPath: null,
        largestJsGzipWarningBytes: 1024,
        totalCssGzipWarningBytes: 1024,
      });

      expect(report.status).toBe("failed");
      expect(report.failures[0]).toContain("Route pages remain lazy-loaded");
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});

async function makeTempProject() {
  return await mkdtemp(join(tmpdir(), "ai-tech-blog-perf-"));
}

async function writeSourceFiles(
  projectRoot: string,
  overrides: { appSource?: string } = {}
) {
  await mkdir(join(projectRoot, "client/src/pages"), { recursive: true });
  await writeFile(
    join(projectRoot, "client/src/App.tsx"),
    overrides.appSource ??
      [
        'const Editor = lazy(() => import("./pages/Editor"));',
        'const Manage = lazy(() => import("./pages/Manage"));',
        'const PostDetail = lazy(() => import("./pages/PostDetail"));',
        "<Suspense />",
      ].join("\n")
  );
  await writeFile(
    join(projectRoot, "client/src/pages/PostDetail.tsx"),
    'const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer"));'
  );
  await writeFile(
    join(projectRoot, "client/src/pages/Editor.tsx"),
    'const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer"));'
  );
  await writeFile(
    join(projectRoot, "vite.config.ts"),
    [
      "manualChunks(id) {",
      '  if (packageName.startsWith("@tiptap/")) return "editor";',
      "}",
    ].join("\n")
  );
}

async function writeDistFiles(
  projectRoot: string,
  files: Record<string, string>
) {
  for (const [file, contents] of Object.entries(files)) {
    const absolutePath = join(projectRoot, "dist/public", file);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, contents);
  }
}
