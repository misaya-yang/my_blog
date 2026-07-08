import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { collectDistAssetSizes, type SizedAsset } from "./baseline.js";

const DEFAULT_OUTPUT =
  "docs/product_optimization/reports/performance-budget-latest.json";
const DEFAULT_DIST_DIR = "dist/public";
const DEFAULT_LARGEST_JS_GZIP_WARNING_BYTES = 200 * 1024;
const DEFAULT_TOTAL_CSS_GZIP_WARNING_BYTES = 96 * 1024;

export type PerformanceBudgetStatus = "passed" | "failed";
export type PerformanceBudgetState = "passed" | "warning" | "failed";

export type PerformanceBudgetCheck = {
  id: string;
  label: string;
  state: PerformanceBudgetState;
  blocking: boolean;
  evidence: string;
};

export type PerformanceBudgetReport = {
  generatedAt: string;
  status: PerformanceBudgetStatus;
  distDir: string;
  totals: {
    javascriptRawBytes: number;
    javascriptGzipBytes: number;
    cssRawBytes: number;
    cssGzipBytes: number;
    javascriptAssetCount: number;
    cssAssetCount: number;
  };
  largestAssets: {
    javascript: SizedAsset[];
    css: SizedAsset[];
  };
  checks: PerformanceBudgetCheck[];
  failures: string[];
  warnings: string[];
  outputPath: string | null;
};

export type PerformanceBudgetOptions = {
  projectRoot: string;
  distDir: string;
  outputPath: string | null;
  largestJsGzipWarningBytes: number;
  totalCssGzipWarningBytes: number;
};

export function parsePerformanceBudgetArgs(
  argv: string[],
  cwd = process.cwd()
): PerformanceBudgetOptions {
  const options: PerformanceBudgetOptions = {
    projectRoot: cwd,
    distDir: DEFAULT_DIST_DIR,
    outputPath: DEFAULT_OUTPUT,
    largestJsGzipWarningBytes: DEFAULT_LARGEST_JS_GZIP_WARNING_BYTES,
    totalCssGzipWarningBytes: DEFAULT_TOTAL_CSS_GZIP_WARNING_BYTES,
  };

  for (const arg of argv) {
    if (arg === "--no-output") {
      options.outputPath = null;
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length).trim() || null;
    } else if (arg.startsWith("--dist-dir=")) {
      options.distDir =
        arg.slice("--dist-dir=".length).trim() || DEFAULT_DIST_DIR;
    } else if (arg.startsWith("--largest-js-gzip-warning=")) {
      options.largestJsGzipWarningBytes = parseByteLimit(
        arg.slice("--largest-js-gzip-warning=".length),
        "largest JS gzip warning"
      );
    } else if (arg.startsWith("--total-css-gzip-warning=")) {
      options.totalCssGzipWarningBytes = parseByteLimit(
        arg.slice("--total-css-gzip-warning=".length),
        "total CSS gzip warning"
      );
    } else {
      throw new Error(`Unknown audit:performance argument: ${arg}`);
    }
  }

  return options;
}

export async function runPerformanceBudgetAudit(
  options: PerformanceBudgetOptions,
  now = () => new Date()
): Promise<PerformanceBudgetReport> {
  const distDir = resolve(options.projectRoot, options.distDir);
  const dist = await collectDistAssetSizes(distDir);
  const checks = [
    buildDistPresenceCheck(
      options.distDir,
      dist.javascript.length,
      dist.css.length
    ),
    ...(await collectRouteBoundaryChecks(options.projectRoot)),
    ...collectBundleWarningChecks(dist, options),
  ];
  const failures = checks
    .filter(check => check.blocking && check.state === "failed")
    .map(check => `${check.label}: ${check.evidence}`);
  const warnings = checks
    .filter(check => check.state === "warning")
    .map(check => `${check.label}: ${check.evidence}`);

  return {
    generatedAt: now().toISOString(),
    status: failures.length > 0 ? "failed" : "passed",
    distDir: options.distDir,
    totals: {
      javascriptRawBytes: sumBytes(dist.javascript, "rawBytes"),
      javascriptGzipBytes: sumBytes(dist.javascript, "gzipBytes"),
      cssRawBytes: sumBytes(dist.css, "rawBytes"),
      cssGzipBytes: sumBytes(dist.css, "gzipBytes"),
      javascriptAssetCount: dist.javascript.length,
      cssAssetCount: dist.css.length,
    },
    largestAssets: {
      javascript: dist.javascript.slice(0, 8),
      css: dist.css.slice(0, 5),
    },
    checks,
    failures,
    warnings,
    outputPath: options.outputPath,
  };
}

export function formatPerformanceBudgetLines(report: PerformanceBudgetReport) {
  return [
    `Performance budget status: ${report.status}`,
    `Performance assets: ${report.totals.javascriptAssetCount} JS / ${formatBytes(
      report.totals.javascriptGzipBytes
    )} gzip, ${report.totals.cssAssetCount} CSS / ${formatBytes(
      report.totals.cssGzipBytes
    )} gzip`,
    `Performance checks: ${
      report.checks.filter(check => check.state === "passed").length
    } passed, ${report.warnings.length} warnings, ${report.failures.length} failures`,
    ...(report.outputPath ? [`Performance report: ${report.outputPath}`] : []),
  ];
}

function buildDistPresenceCheck(
  distDir: string,
  javascriptAssetCount: number,
  cssAssetCount: number
): PerformanceBudgetCheck {
  const present = javascriptAssetCount > 0 && cssAssetCount > 0;
  return {
    id: "dist-assets-present",
    label: "Build output assets present",
    state: present ? "passed" : "failed",
    blocking: true,
    evidence: present
      ? `${distDir} includes ${javascriptAssetCount} JS and ${cssAssetCount} CSS assets.`
      : `${distDir} does not include both JS and CSS assets. Run pnpm build first.`,
  };
}

async function collectRouteBoundaryChecks(
  projectRoot: string
): Promise<PerformanceBudgetCheck[]> {
  const app = await readProjectFile(projectRoot, "client/src/App.tsx");
  const postDetail = await readProjectFile(
    projectRoot,
    "client/src/pages/PostDetail.tsx"
  );
  const editor = await readProjectFile(
    projectRoot,
    "client/src/pages/Editor.tsx"
  );
  const viteConfig = await readProjectFile(projectRoot, "vite.config.ts");

  return [
    {
      id: "route-pages-lazy-loaded",
      label: "Route pages remain lazy-loaded",
      state:
        app.includes("lazy(") &&
        app.includes("<Suspense") &&
        !/import\s+Editor\s+from\s+["']\.\/pages\/Editor["']/.test(app) &&
        !/import\s+Manage\s+from\s+["']\.\/pages\/Manage["']/.test(app) &&
        !/import\s+PostDetail\s+from\s+["']\.\/pages\/PostDetail["']/.test(app)
          ? "passed"
          : "failed",
      blocking: true,
      evidence:
        "client/src/App.tsx should keep route page modules behind React.lazy.",
    },
    {
      id: "markdown-heavy-deps-lazy",
      label: "Markdown heavy dependencies stay out of page entry modules",
      state: [postDetail, editor].every(
        source => !importsMarkdownHeavyDeps(source)
      )
        ? "passed"
        : "failed",
      blocking: true,
      evidence:
        "PostDetail and Editor should lazy-load MarkdownRenderer instead of importing markdown parsing packages directly.",
    },
    {
      id: "editor-deps-chunked",
      label: "Editor dependencies stay chunked",
      state:
        viteConfig.includes("manualChunks") &&
        viteConfig.includes('packageName.startsWith("@tiptap/")') &&
        viteConfig.includes('return "editor"')
          ? "passed"
          : "failed",
      blocking: true,
      evidence:
        "vite.config.ts should keep @tiptap packages in the editor chunk.",
    },
  ];
}

function collectBundleWarningChecks(
  dist: Awaited<ReturnType<typeof collectDistAssetSizes>>,
  options: PerformanceBudgetOptions
): PerformanceBudgetCheck[] {
  const largestJs = dist.javascript[0] ?? null;
  const totalCssGzipBytes = sumBytes(dist.css, "gzipBytes");

  return [
    {
      id: "largest-js-gzip-baseline",
      label: "Largest JS gzip baseline",
      state:
        largestJs && largestJs.gzipBytes > options.largestJsGzipWarningBytes
          ? "warning"
          : "passed",
      blocking: false,
      evidence: largestJs
        ? `${largestJs.file}: ${formatBytes(largestJs.gzipBytes)} gzip; warning threshold ${formatBytes(
            options.largestJsGzipWarningBytes
          )}.`
        : "No JavaScript assets found.",
    },
    {
      id: "total-css-gzip-baseline",
      label: "Total CSS gzip baseline",
      state:
        totalCssGzipBytes > options.totalCssGzipWarningBytes
          ? "warning"
          : "passed",
      blocking: false,
      evidence: `${formatBytes(
        totalCssGzipBytes
      )} total CSS gzip; warning threshold ${formatBytes(
        options.totalCssGzipWarningBytes
      )}.`,
    },
  ];
}

function importsMarkdownHeavyDeps(source: string) {
  return [
    'from "react-markdown"',
    'from "remark-gfm"',
    'from "remark-math"',
    'from "rehype-katex"',
    'from "rehype-highlight"',
    "katex/dist/katex.min.css",
    "highlight.js/styles/github-dark.min.css",
  ].some(pattern => source.includes(pattern));
}

async function readProjectFile(projectRoot: string, path: string) {
  const absolutePath = resolve(projectRoot, path);
  if (!existsSync(absolutePath)) return "";
  return await readFile(absolutePath, "utf8");
}

function sumBytes(assets: SizedAsset[], key: "rawBytes" | "gzipBytes") {
  return assets.reduce((total, asset) => total + asset[key], 0);
}

function parseByteLimit(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return Math.floor(parsed);
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} kB`;
}

async function writePerformanceBudgetReport(
  projectRoot: string,
  outputPath: string,
  report: PerformanceBudgetReport
) {
  const absoluteOutput = resolve(projectRoot, outputPath);
  await mkdir(dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  const options = parsePerformanceBudgetArgs(process.argv.slice(2));
  const report = await runPerformanceBudgetAudit(options);
  if (options.outputPath) {
    await writePerformanceBudgetReport(
      options.projectRoot,
      options.outputPath,
      report
    );
  }
  for (const line of formatPerformanceBudgetLines(report)) {
    console.log(line);
  }
  if (report.status !== "passed") {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error("Performance budget audit failed", error);
    process.exitCode = 1;
  });
}
