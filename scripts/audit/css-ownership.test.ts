import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  analyzeCssFile,
  formatCssOwnershipLines,
  parseCssOwnershipArgs,
  runCssOwnershipAudit,
} from "./css-ownership";

describe("CSS ownership audit", () => {
  it("parses output, css file, and threshold options", () => {
    const options = parseCssOwnershipArgs(
      [
        "--",
        "--output=.cache/css.json",
        "--css-file=client/src/index.css",
        "--css-file=client/src/styles/agent-surfaces.css",
        "--max-important=12",
        "--max-viewport-font-size=3",
        "--max-broad-selectors=5",
        "--max-agent-runtime-outside-agent-css=0",
      ],
      "/repo"
    );

    expect(options).toMatchObject({
      projectRoot: "/repo",
      outputPath: ".cache/css.json",
      cssFiles: [
        "client/src/index.css",
        "client/src/styles/agent-surfaces.css",
      ],
      thresholds: {
        important: 12,
        viewportFontSize: 3,
        broadSelector: 5,
        agentRuntimeOutsideAgentCss: 0,
      },
    });
    expect(parseCssOwnershipArgs(["--no-output"], "/repo")).toMatchObject({
      outputPath: null,
    });
    expect(() => parseCssOwnershipArgs(["--max-important=nope"], "/repo")).toThrow(
      "Invalid max important"
    );
  });

  it("extracts CSS debt metrics while ignoring comments", () => {
    const report = analyzeCssFile(
      "client/src/styles/visual-refresh.css",
      [
        "/* .ignored { color: #fff !important; } */",
        ":root { --surface: oklch(0.98 0.01 240); }",
        "* { box-sizing: border-box; }",
        ".title { font-size: clamp(1rem, 4vw, 2rem); }",
        ".card { color: #ffffff !important; }",
        "body .agent-liquid-panel { background: rgb(0 0 0 / 50%); }",
      ].join("\n")
    );

    expect(report.owner).toBe("public-visual");
    expect(report.metrics.important.count).toBe(1);
    expect(report.metrics.viewportFontSize.count).toBe(1);
    expect(report.metrics.hardCodedColor.count).toBe(3);
    expect(report.metrics.broadSelector.count).toBe(3);
    expect(report.metrics.agentRuntimeOutsideAgentCss.count).toBe(1);
    expect(report.metrics.important.samples[0]).toMatchObject({
      line: 5,
    });
  });

  it("fails when configured CSS files are missing", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "ai-tech-blog-css-"));
    try {
      const report = await runCssOwnershipAudit({
        projectRoot,
        cssFiles: ["client/src/index.css"],
        outputPath: null,
        thresholds: {},
      });

      expect(report.status).toBe("failed");
      expect(report.failures[0]).toContain("CSS ownership files present");
      expect(report.missingFiles).toEqual(["client/src/index.css"]);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("passes existing debt as warnings but fails explicit thresholds", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "ai-tech-blog-css-"));
    try {
      await writeCssFile(
        projectRoot,
        "client/src/index.css",
        [
          "body { color: oklch(0.2 0.01 240); }",
          ".copy { font-size: clamp(1rem, 2vw, 1.2rem); }",
          ".button { color: #fff !important; }",
        ].join("\n")
      );

      const warningReport = await runCssOwnershipAudit({
        projectRoot,
        cssFiles: ["client/src/index.css"],
        outputPath: "css.json",
        thresholds: {},
      });
      expect(warningReport.status).toBe("passed");
      expect(warningReport.warnings.length).toBeGreaterThan(0);
      expect(formatCssOwnershipLines(warningReport)[0]).toBe(
        "CSS ownership status: passed"
      );

      const failedReport = await runCssOwnershipAudit({
        projectRoot,
        cssFiles: ["client/src/index.css"],
        outputPath: null,
        thresholds: { important: 0 },
      });
      expect(failedReport.status).toBe("failed");
      expect(failedReport.failures[0]).toContain("`!important` maximum");
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});

async function writeCssFile(projectRoot: string, path: string, contents: string) {
  const absolutePath = join(projectRoot, path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents);
}
