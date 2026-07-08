import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_OUTPUT =
  "docs/product_optimization/reports/css-ownership-latest.json";

const DEFAULT_CSS_FILES = [
  "client/src/index.css",
  "client/src/styles/visual-refresh.css",
  "client/src/styles/public-components.css",
  "client/src/styles/owner-tools.css",
  "client/src/styles/agent-surfaces.css",
  "client/src/styles/liquid-materials.css",
];

const SAMPLE_LIMIT = 8;

export type CssOwnershipStatus = "passed" | "failed";
export type CssOwnershipState = "passed" | "warning" | "failed";
export type CssOwner =
  | "global-base"
  | "public-visual"
  | "public-components"
  | "owner-tools"
  | "agent-surfaces"
  | "legacy-materials"
  | "unknown";

export type CssDebtMetricId =
  | "important"
  | "viewportFontSize"
  | "hardCodedColor"
  | "broadSelector"
  | "agentRuntimeOutsideAgentCss";

export type CssDebtSample = {
  line: number;
  text: string;
};

export type CssDebtMetric = {
  count: number;
  samples: CssDebtSample[];
};

export type CssFileOwnershipReport = {
  path: string;
  owner: CssOwner;
  lineCount: number;
  metrics: Record<CssDebtMetricId, CssDebtMetric>;
};

export type CssOwnershipCheck = {
  id: string;
  label: string;
  state: CssOwnershipState;
  blocking: boolean;
  evidence: string;
};

export type CssOwnershipTotals = Record<CssDebtMetricId, number> & {
  fileCount: number;
  lineCount: number;
};

export type CssOwnershipThresholds = Partial<
  Record<CssDebtMetricId, number | null>
>;

export type CssOwnershipOptions = {
  projectRoot: string;
  cssFiles: string[];
  outputPath: string | null;
  thresholds: CssOwnershipThresholds;
};

export type CssOwnershipReport = {
  generatedAt: string;
  status: CssOwnershipStatus;
  files: CssFileOwnershipReport[];
  missingFiles: string[];
  totals: CssOwnershipTotals;
  checks: CssOwnershipCheck[];
  failures: string[];
  warnings: string[];
  outputPath: string | null;
};

export function parseCssOwnershipArgs(
  argv: string[],
  cwd = process.cwd()
): CssOwnershipOptions {
  const options: CssOwnershipOptions = {
    projectRoot: cwd,
    cssFiles: [...DEFAULT_CSS_FILES],
    outputPath: DEFAULT_OUTPUT,
    thresholds: {},
  };
  let customCssFiles = false;

  for (const arg of argv) {
    if (arg === "--") {
      continue;
    } else if (arg === "--no-output") {
      options.outputPath = null;
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length).trim() || null;
    } else if (arg.startsWith("--css-file=")) {
      if (!customCssFiles) {
        options.cssFiles = [];
        customCssFiles = true;
      }
      const cssFile = arg.slice("--css-file=".length).trim();
      if (cssFile) options.cssFiles.push(cssFile);
    } else if (arg.startsWith("--max-important=")) {
      options.thresholds.important = parseNonNegativeInteger(
        arg.slice("--max-important=".length),
        "max important"
      );
    } else if (arg.startsWith("--max-viewport-font-size=")) {
      options.thresholds.viewportFontSize = parseNonNegativeInteger(
        arg.slice("--max-viewport-font-size=".length),
        "max viewport font-size"
      );
    } else if (arg.startsWith("--max-broad-selectors=")) {
      options.thresholds.broadSelector = parseNonNegativeInteger(
        arg.slice("--max-broad-selectors=".length),
        "max broad selectors"
      );
    } else if (arg.startsWith("--max-agent-runtime-outside-agent-css=")) {
      options.thresholds.agentRuntimeOutsideAgentCss = parseNonNegativeInteger(
        arg.slice("--max-agent-runtime-outside-agent-css=".length),
        "max Agent runtime selectors outside Agent CSS"
      );
    } else {
      throw new Error(`Unknown audit:css argument: ${arg}`);
    }
  }

  if (options.cssFiles.length === 0) {
    throw new Error("audit:css requires at least one --css-file value.");
  }

  return options;
}

export async function runCssOwnershipAudit(
  options: CssOwnershipOptions,
  now = () => new Date()
): Promise<CssOwnershipReport> {
  const files: CssFileOwnershipReport[] = [];
  const missingFiles: string[] = [];

  for (const cssFile of options.cssFiles) {
    const absolutePath = resolve(options.projectRoot, cssFile);
    if (!existsSync(absolutePath)) {
      missingFiles.push(cssFile);
      continue;
    }

    const source = await readFile(absolutePath, "utf8");
    files.push(analyzeCssFile(cssFile, source));
  }

  const totals = collectTotals(files);
  const checks = [
    buildFilePresenceCheck(options.cssFiles.length, missingFiles),
    buildDebtWarningCheck(
      "important-baseline",
      "`!important` baseline",
      totals.important,
      "`!important` declarations exist. New UI slices should avoid increasing this count without a waiver."
    ),
    buildDebtWarningCheck(
      "viewport-font-baseline",
      "Viewport font-size baseline",
      totals.viewportFontSize,
      "Readable text should not add viewport-unit font-size rules."
    ),
    buildDebtWarningCheck(
      "hard-coded-color-baseline",
      "Hard-coded color baseline",
      totals.hardCodedColor,
      "Prefer semantic tokens over one-off color literals when touching CSS."
    ),
    buildDebtWarningCheck(
      "broad-selector-baseline",
      "Broad selector baseline",
      totals.broadSelector,
      "Broad/global selectors should not grow for local component fixes."
    ),
    buildDebtWarningCheck(
      "agent-runtime-ownership-baseline",
      "Agent runtime selector ownership baseline",
      totals.agentRuntimeOutsideAgentCss,
      "Agent frame/panel runtime selectors outside agent-surfaces.css are legacy ownership debt."
    ),
    ...buildThresholdChecks(totals, options.thresholds),
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
    files,
    missingFiles,
    totals,
    checks,
    failures,
    warnings,
    outputPath: options.outputPath,
  };
}

export function formatCssOwnershipLines(report: CssOwnershipReport) {
  return [
    `CSS ownership status: ${report.status}`,
    `CSS files scanned: ${report.totals.fileCount} files, ${report.totals.lineCount} lines`,
    `CSS debt counts: ${report.totals.important} !important, ${report.totals.viewportFontSize} viewport font-size, ${report.totals.hardCodedColor} color literals, ${report.totals.broadSelector} broad selectors`,
    `CSS ownership warnings: ${report.warnings.length}; failures: ${report.failures.length}`,
    ...(report.outputPath ? [`CSS ownership report: ${report.outputPath}`] : []),
  ];
}

export function analyzeCssFile(
  path: string,
  source: string
): CssFileOwnershipReport {
  const cleanSource = stripCssCommentsPreserveLines(source);
  const lines = cleanSource.split(/\r?\n/);
  const metrics = createMetrics();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    addLineMetric(
      metrics.important,
      countMatches(line, /!important\b/g),
      lineNumber,
      line
    );
    if (hasViewportFontSize(line)) {
      addLineMetric(metrics.viewportFontSize, 1, lineNumber, line);
    }
    addLineMetric(
      metrics.hardCodedColor,
      countMatches(
        line,
        /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/gi
      ),
      lineNumber,
      line
    );
    if (ownsAgentRuntimeSelectorsOutsideAgentCss(path) && hasAgentRuntimeSelector(line)) {
      addLineMetric(metrics.agentRuntimeOutsideAgentCss, 1, lineNumber, line);
    }
  });

  for (const sample of collectBroadSelectorSamples(cleanSource)) {
    addLineMetric(metrics.broadSelector, 1, sample.line, sample.text);
  }

  return {
    path,
    owner: classifyCssOwner(path),
    lineCount: lines.length,
    metrics,
  };
}

function createMetrics(): Record<CssDebtMetricId, CssDebtMetric> {
  return {
    important: createMetric(),
    viewportFontSize: createMetric(),
    hardCodedColor: createMetric(),
    broadSelector: createMetric(),
    agentRuntimeOutsideAgentCss: createMetric(),
  };
}

function createMetric(): CssDebtMetric {
  return { count: 0, samples: [] };
}

function addLineMetric(
  metric: CssDebtMetric,
  count: number,
  line: number,
  text: string
) {
  if (count <= 0) return;
  metric.count += count;
  if (metric.samples.length < SAMPLE_LIMIT) {
    metric.samples.push({ line, text: compactText(text) });
  }
}

function collectTotals(files: CssFileOwnershipReport[]): CssOwnershipTotals {
  const totals: CssOwnershipTotals = {
    fileCount: files.length,
    lineCount: 0,
    important: 0,
    viewportFontSize: 0,
    hardCodedColor: 0,
    broadSelector: 0,
    agentRuntimeOutsideAgentCss: 0,
  };

  for (const file of files) {
    totals.lineCount += file.lineCount;
    for (const metricId of Object.keys(file.metrics) as CssDebtMetricId[]) {
      totals[metricId] += file.metrics[metricId].count;
    }
  }

  return totals;
}

function buildFilePresenceCheck(
  expectedCount: number,
  missingFiles: string[]
): CssOwnershipCheck {
  return {
    id: "css-files-present",
    label: "CSS ownership files present",
    state: missingFiles.length > 0 ? "failed" : "passed",
    blocking: true,
    evidence:
      missingFiles.length > 0
        ? `Missing CSS files: ${missingFiles.join(", ")}.`
        : `${expectedCount} configured CSS files are present.`,
  };
}

function buildDebtWarningCheck(
  id: string,
  label: string,
  count: number,
  warningText: string
): CssOwnershipCheck {
  return {
    id,
    label,
    state: count > 0 ? "warning" : "passed",
    blocking: false,
    evidence: count > 0 ? `${count} found. ${warningText}` : "No debt found.",
  };
}

function buildThresholdChecks(
  totals: CssOwnershipTotals,
  thresholds: CssOwnershipThresholds
): CssOwnershipCheck[] {
  const labels: Record<CssDebtMetricId, string> = {
    important: "`!important` maximum",
    viewportFontSize: "Viewport font-size maximum",
    hardCodedColor: "Hard-coded color maximum",
    broadSelector: "Broad selector maximum",
    agentRuntimeOutsideAgentCss:
      "Agent runtime selectors outside Agent CSS maximum",
  };

  return (Object.keys(thresholds) as CssDebtMetricId[])
    .filter(metricId => thresholds[metricId] !== null && thresholds[metricId] !== undefined)
    .map(metricId => {
      const limit = thresholds[metricId] ?? 0;
      const actual = totals[metricId];
      return {
        id: `${metricId}-threshold`,
        label: labels[metricId],
        state: actual > limit ? "failed" : "passed",
        blocking: true,
        evidence: `${actual} found; configured maximum is ${limit}.`,
      };
    });
}

function classifyCssOwner(path: string): CssOwner {
  if (path.endsWith("client/src/index.css")) return "global-base";
  if (path.endsWith("visual-refresh.css")) return "public-visual";
  if (path.endsWith("public-components.css")) return "public-components";
  if (path.endsWith("owner-tools.css")) return "owner-tools";
  if (path.endsWith("agent-surfaces.css")) return "agent-surfaces";
  if (path.endsWith("liquid-materials.css")) return "legacy-materials";
  return "unknown";
}

function hasViewportFontSize(line: string) {
  return (
    /font-size\s*:/i.test(line) &&
    /(?:^|[\s(,])[-+]?\d*\.?\d+(?:dvw|svw|lvw|vw|vmin|vmax)\b/i.test(line)
  );
}

function ownsAgentRuntimeSelectorsOutsideAgentCss(path: string) {
  return !path.endsWith("agent-surfaces.css");
}

function hasAgentRuntimeSelector(line: string) {
  return /\.(?:agent-liquid|agent-source|agent-trust|agent-message|agent-floating|agent-launcher)[\w-]*/.test(
    line
  );
}

function collectBroadSelectorSamples(source: string): CssDebtSample[] {
  const samples: CssDebtSample[] = [];
  const lines = source.split(/\r?\n/);
  let depth = 0;
  let buffer = "";
  let bufferLine = 1;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    for (const char of line) {
      if (char === "{") {
        const selector = buffer.trim();
        if (selector && !selector.startsWith("@")) {
          for (const part of selector.split(",")) {
            const candidate = part.trim();
            if (isBroadSelector(candidate)) {
              samples.push({ line: bufferLine, text: candidate });
            }
          }
        }
        depth += 1;
        buffer = "";
        bufferLine = lineNumber;
      } else if (char === "}") {
        depth = Math.max(0, depth - 1);
        buffer = "";
        bufferLine = lineNumber;
      } else if (depth <= 1) {
        if (!buffer.trim() && char.trim()) bufferLine = lineNumber;
        buffer += char;
      }
    }
    if (depth <= 1) buffer += "\n";
  });

  return samples;
}

function isBroadSelector(selector: string) {
  if (!selector || selector.includes(";")) return false;
  if (selector === "*" || selector === ":root") return true;
  if (/^(?:html|body)(?:$|[\s[.:#>+~])/.test(selector)) return true;
  if (/\[class[*^$|~]?=/.test(selector)) return true;
  return false;
}

function stripCssCommentsPreserveLines(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, comment =>
    comment.replace(/[^\r\n]/g, " ")
  );
}

function countMatches(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

function compactText(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 180);
}

function parseNonNegativeInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return Math.floor(parsed);
}

async function writeCssOwnershipReport(
  projectRoot: string,
  outputPath: string,
  report: CssOwnershipReport
) {
  const absoluteOutput = resolve(projectRoot, outputPath);
  await mkdir(dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  const options = parseCssOwnershipArgs(process.argv.slice(2));
  const report = await runCssOwnershipAudit(options);
  if (options.outputPath) {
    await writeCssOwnershipReport(options.projectRoot, options.outputPath, report);
  }
  for (const line of formatCssOwnershipLines(report)) {
    console.log(line);
  }
  if (report.status !== "passed") {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error("CSS ownership audit failed", error);
    process.exitCode = 1;
  });
}
