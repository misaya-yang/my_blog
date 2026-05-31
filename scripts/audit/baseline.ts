import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type RouteAudience = "public" | "owner" | "utility" | "generated";

export type RouteAuditTarget = {
  path: string;
  audience: RouteAudience;
  expectedStatus: number;
  expectedContent: string;
  requiresSeededDatabase: boolean;
};

export type MetadataSnapshot = {
  title: string | null;
  description: string | null;
  canonical: string | null;
  htmlLang: string | null;
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    url: string | null;
  };
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
  };
  jsonLdTypes: string[];
};

export type SizedAsset = {
  file: string;
  rawBytes: number;
  gzipBytes: number;
};

export type DistAssetSizes = {
  html: SizedAsset | null;
  javascript: SizedAsset[];
  css: SizedAsset[];
};

export type CommandTrace = {
  command: string;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
};

export type RouteStatusResult =
  | {
      state: "skipped";
      reason: string;
    }
  | {
      state: "checked";
      status: number;
      ok: boolean;
      contentType: string | null;
      metadata: MetadataSnapshot | null;
      error: null;
    }
  | {
      state: "error";
      status: null;
      ok: false;
      contentType: null;
      metadata: null;
      error: string;
    };

export type RouteAuditResult = RouteAuditTarget & {
  statusResult: RouteStatusResult;
};

export type KnownGap = {
  id: string;
  severity: "warning" | "failure";
  summary: string;
  evidence: string;
};

export type BaselineAuditReport = {
  generatedAt: string;
  git: {
    branch: string;
    commit: string;
    dirty: boolean;
  };
  commands: CommandTrace[];
  routes: RouteAuditResult[];
  dist: DistAssetSizes;
  accessibility: {
    hasReducedMotionRule: boolean;
    iconOnlyButtonPatternCount: number;
  };
  browserSmoke: {
    state: "manual-required";
    viewport: {
      width: number;
      height: number;
    };
    routes: string[];
    note: string;
  };
  knownGaps: KnownGap[];
};

export type RunBaselineAuditOptions = {
  projectRoot?: string;
  baseUrl?: string | null;
  distDir?: string;
  includeChecks?: boolean;
  outputPath?: string | null;
};

export const routeInventory: RouteAuditTarget[] = [
  {
    path: "/",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "home page shell and research index",
    requiresSeededDatabase: false,
  },
  {
    path: "/algorithms",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "AI algorithm track page",
    requiresSeededDatabase: false,
  },
  {
    path: "/applications",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "AI application engineering track page",
    requiresSeededDatabase: false,
  },
  {
    path: "/login",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "visitor and admin login surface",
    requiresSeededDatabase: false,
  },
  {
    path: "/archive",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "public archive route",
    requiresSeededDatabase: true,
  },
  {
    path: "/categories/ai-applications",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "public AI Applications category route",
    requiresSeededDatabase: true,
  },
  {
    path: "/tags/agent-systems",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "public Agent Systems tag route",
    requiresSeededDatabase: true,
  },
  {
    path: "/404",
    audience: "utility",
    expectedStatus: 200,
    expectedContent: "client-rendered not found page",
    requiresSeededDatabase: false,
  },
  {
    path: "/not-a-real-route",
    audience: "utility",
    expectedStatus: 404,
    expectedContent: "server-level not found status",
    requiresSeededDatabase: false,
  },
  {
    path: "/post/isohc-fixed-vector-isometric-residual-mixing",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "public seeded algorithm article",
    requiresSeededDatabase: true,
  },
  {
    path: "/post/agent-harness-engine-evaluating-tool-using-agents",
    audience: "public",
    expectedStatus: 200,
    expectedContent: "public seeded application article",
    requiresSeededDatabase: true,
  },
  {
    path: "/robots.txt",
    audience: "generated",
    expectedStatus: 200,
    expectedContent: "robots directives and sitemap pointer",
    requiresSeededDatabase: false,
  },
  {
    path: "/sitemap.xml",
    audience: "generated",
    expectedStatus: 200,
    expectedContent: "public route and article sitemap",
    requiresSeededDatabase: true,
  },
  {
    path: "/rss.xml",
    audience: "generated",
    expectedStatus: 200,
    expectedContent: "public article feed",
    requiresSeededDatabase: true,
  },
];

export function collectMetadata(html: string): MetadataSnapshot {
  return {
    title: decodeHtml(matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    description: getMeta(html, "name", "description"),
    canonical: getLink(html, "canonical"),
    htmlLang: decodeHtml(matchFirst(html, /<html[^>]*\slang=["']?([^"'\s>]+)/i)),
    openGraph: {
      title: getMeta(html, "property", "og:title"),
      description: getMeta(html, "property", "og:description"),
      image: getMeta(html, "property", "og:image"),
      type: getMeta(html, "property", "og:type"),
      url: getMeta(html, "property", "og:url"),
    },
    twitter: {
      card: getMeta(html, "name", "twitter:card"),
      title: getMeta(html, "name", "twitter:title"),
      description: getMeta(html, "name", "twitter:description"),
      image: getMeta(html, "name", "twitter:image"),
    },
    jsonLdTypes: collectJsonLdTypes(html),
  };
}

export async function collectDistAssetSizes(distDir: string): Promise<DistAssetSizes> {
  const resolvedDist = resolve(distDir);
  if (!existsSync(resolvedDist)) {
    return { html: null, javascript: [], css: [] };
  }

  const files = await listFiles(resolvedDist);
  const sized = await Promise.all(files.map((file) => sizeAsset(resolvedDist, file)));
  const html = sized.find((asset) => asset.file === "index.html") ?? null;
  const javascript = sized
    .filter((asset) => asset.file.endsWith(".js"))
    .sort((a, b) => b.gzipBytes - a.gzipBytes);
  const css = sized
    .filter((asset) => asset.file.endsWith(".css"))
    .sort((a, b) => b.gzipBytes - a.gzipBytes);

  return { html, javascript, css };
}

export async function runBaselineAudit(
  options: RunBaselineAuditOptions = {}
): Promise<BaselineAuditReport> {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.AUDIT_BASE_URL ?? null);
  const distDir = resolve(projectRoot, options.distDir ?? "dist/public");
  const includeChecks = options.includeChecks ?? true;

  const commands = includeChecks
    ? await runCommandTraces(projectRoot, [
        ["pnpm", ["check"]],
        ["pnpm", ["test"]],
        ["pnpm", ["build"]],
      ])
    : [];

  const [git, routes, dist, accessibility] = await Promise.all([
    collectGitState(projectRoot),
    collectRouteResults(baseUrl),
    collectDistAssetSizes(distDir),
    collectAccessibilitySignals(projectRoot),
  ]);

  const report: BaselineAuditReport = {
    generatedAt: new Date().toISOString(),
    git,
    commands,
    routes,
    dist,
    accessibility,
    browserSmoke: {
      state: "manual-required",
      viewport: { width: 390, height: 844 },
      routes: ["/", "/algorithms", "/applications", "/login", routeInventory[6].path],
      note:
        "Use the Codex Browser plugin for rendered desktop/mobile checks; package script records the required viewport and route set.",
    },
    knownGaps: collectKnownGaps(projectRoot, routes, dist, accessibility),
  };

  if (options.outputPath) {
    const outputPath = resolve(projectRoot, options.outputPath);
    await mkdir(resolve(outputPath, ".."), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  }

  return report;
}

async function collectRouteResults(baseUrl: string | null): Promise<RouteAuditResult[]> {
  if (!baseUrl) {
    return routeInventory.map((route) => ({
      ...route,
      statusResult: {
        state: "skipped",
        reason: "Set AUDIT_BASE_URL=http://localhost:3000 to check route HTTP status.",
      },
    }));
  }

  return Promise.all(
    routeInventory.map(async (route) => ({
      ...route,
      statusResult: await checkRoute(baseUrl, route),
    }))
  );
}

async function checkRoute(baseUrl: string, route: RouteAuditTarget): Promise<RouteStatusResult> {
  try {
    const response = await fetch(new URL(route.path, baseUrl), {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const contentType = response.headers.get("content-type");
    const isHtml = contentType?.includes("text/html") || false;
    const text = isHtml ? await response.text() : "";

    return {
      state: "checked",
      status: response.status,
      ok: response.status === route.expectedStatus,
      contentType,
      metadata: isHtml ? collectMetadata(text) : null,
      error: null,
    };
  } catch (error) {
    return {
      state: "error",
      status: null,
      ok: false,
      contentType: null,
      metadata: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runCommandTraces(
  cwd: string,
  commands: Array<[string, string[]]>
): Promise<CommandTrace[]> {
  const traces: CommandTrace[] = [];

  for (const [command, args] of commands) {
    const startedAt = Date.now();
    try {
      const result = await execFileAsync(command, args, {
        cwd,
        maxBuffer: 1024 * 1024 * 20,
      });
      traces.push({
        command: [command, ...args].join(" "),
        exitCode: 0,
        durationMs: Date.now() - startedAt,
        stdout: result.stdout,
        stderr: result.stderr,
      });
    } catch (error) {
      const failure = error as {
        code?: number;
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      traces.push({
        command: [command, ...args].join(" "),
        exitCode: typeof failure.code === "number" ? failure.code : 1,
        durationMs: Date.now() - startedAt,
        stdout: failure.stdout ?? "",
        stderr: failure.stderr ?? failure.message ?? String(error),
      });
    }
  }

  return traces;
}

async function collectGitState(cwd: string): Promise<BaselineAuditReport["git"]> {
  const [branch, commit, status] = await Promise.all([
    runGit(cwd, ["branch", "--show-current"]),
    runGit(cwd, ["rev-parse", "--short", "HEAD"]),
    runGit(cwd, ["status", "--short"]),
  ]);

  return {
    branch: branch.trim() || "detached",
    commit: commit.trim() || "unknown",
    dirty: status.trim().length > 0,
  };
}

async function runGit(cwd: string, args: string[]) {
  try {
    const result = await execFileAsync("git", args, { cwd });
    return result.stdout;
  } catch {
    return "";
  }
}

async function collectAccessibilitySignals(projectRoot: string) {
  const cssPath = resolve(projectRoot, "client/src/index.css");
  const postDetailPath = resolve(projectRoot, "client/src/pages/PostDetail.tsx");
  const css = existsSync(cssPath) ? await readFile(cssPath, "utf-8") : "";
  const postDetail = existsSync(postDetailPath)
    ? await readFile(postDetailPath, "utf-8")
    : "";

  return {
    hasReducedMotionRule: css.includes("prefers-reduced-motion"),
    iconOnlyButtonPatternCount: countIconOnlyButtons(postDetail),
  };
}

function collectKnownGaps(
  projectRoot: string,
  routes: RouteAuditResult[],
  dist: DistAssetSizes,
  accessibility: BaselineAuditReport["accessibility"]
): KnownGap[] {
  const gaps: KnownGap[] = [];
  const publicDir = resolve(projectRoot, "client/public");

  for (const [id, file, summary] of [
    ["missing-robots", "robots.txt", "No robots.txt is present."],
    ["missing-sitemap", "sitemap.xml", "No sitemap.xml is present."],
    ["missing-rss", "rss.xml", "No RSS feed is present."],
  ] as const) {
    if (!existsSync(resolve(publicDir, file))) {
      gaps.push({
        id,
        severity: "warning",
        summary,
        evidence: `client/public/${file} not found`,
      });
    }
  }

  const htmlRoutes = routes.filter((route) => route.statusResult.state === "checked");
  const missingCanonical = htmlRoutes.filter((route) => {
    const metadata = route.statusResult.state === "checked" ? route.statusResult.metadata : null;
    return metadata && !metadata.canonical;
  });
  if (missingCanonical.length > 0) {
    gaps.push({
      id: "missing-canonical",
      severity: "warning",
      summary: "One or more checked HTML routes are missing canonical URLs.",
      evidence: missingCanonical.map((route) => route.path).join(", "),
    });
  }

  const notFoundRoute = routes.find((route) => route.path === "/not-a-real-route");
  if (
    notFoundRoute?.statusResult.state === "checked" &&
    notFoundRoute.statusResult.status !== 404
  ) {
    gaps.push({
      id: "unknown-route-not-404",
      severity: "failure",
      summary: "Unknown routes should return HTTP 404.",
      evidence: `/not-a-real-route returned ${notFoundRoute.statusResult.status}`,
    });
  }

  if (dist.javascript[0]?.gzipBytes && dist.javascript[0].gzipBytes > 200 * 1024) {
    gaps.push({
      id: "large-initial-js",
      severity: "warning",
      summary: "Largest JavaScript chunk is above the 200 kB gzip target.",
      evidence: `${dist.javascript[0].file}: ${formatBytes(dist.javascript[0].gzipBytes)} gzip`,
    });
  }

  if (!accessibility.hasReducedMotionRule) {
    gaps.push({
      id: "missing-reduced-motion",
      severity: "warning",
      summary: "Global CSS does not define a prefers-reduced-motion fallback.",
      evidence: "client/src/index.css",
    });
  }

  return gaps;
}

function countIconOnlyButtons(source: string) {
  const buttonMatches = source.match(/<button\b[\s\S]*?<\/button>/g) ?? [];
  return buttonMatches.filter((button) => {
    const hasAccessibleName = /\baria-label=|\btitle=/.test(button);
    const visibleText = button
      .replace(/<[^>]+>/g, "")
      .replace(/\{[^}]+\}/g, "")
      .trim();
    return !hasAccessibleName && visibleText.length === 0;
  }).length;
}

async function listFiles(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = resolve(current, entry.name);
      if (entry.isDirectory()) {
        return listFiles(root, absolutePath);
      }
      return [absolutePath];
    })
  );

  return files.flat();
}

async function sizeAsset(root: string, absolutePath: string): Promise<SizedAsset> {
  const contents = await readFile(absolutePath);
  const fileStat = await stat(absolutePath);
  return {
    file: toPosix(relative(root, absolutePath)),
    rawBytes: fileStat.size,
    gzipBytes: gzipSync(contents).byteLength,
  };
}

function getMeta(html: string, attribute: "name" | "property", key: string) {
  const tag =
    html.match(
      new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapeRegExp(key)}["'])[^>]*>`, "i")
    )?.[0] ?? null;
  if (!tag) return null;
  return getAttribute(tag, "content");
}

function getLink(html: string, rel: string) {
  const tag =
    html.match(new RegExp(`<link\\b(?=[^>]*\\brel=["']${escapeRegExp(rel)}["'])[^>]*>`, "i"))?.[0] ??
    null;
  if (!tag) return null;
  return getAttribute(tag, "href");
}

function getAttribute(tag: string, attribute: string) {
  return decodeHtml(
    matchFirst(tag, new RegExp(`\\b${attribute}=["']([^"']*)["']`, "i"))
  );
}

function collectJsonLdTypes(html: string) {
  const scripts = html.match(
    /<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!scripts) return [];

  return scripts.flatMap((script) => {
    const json = matchFirst(script, /<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!json) return [];
    try {
      const parsed = JSON.parse(json.trim()) as { "@type"?: string | string[] };
      const type = parsed["@type"];
      return Array.isArray(type) ? type : type ? [type] : [];
    } catch {
      return [];
    }
  });
}

function matchFirst(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1] ?? null;
}

function decodeHtml(value: string | null) {
  if (value === null) return null;
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBaseUrl(value: string | null) {
  if (!value) return null;
  return value.endsWith("/") ? value : `${value}/`;
}

function toPosix(value: string) {
  return value.split(sep).join("/");
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function parseArgs(argv: string[]) {
  const options: RunBaselineAuditOptions = {
    outputPath: "docs/harness_engine/reports/latest-baseline.json",
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length);
    } else if (arg.startsWith("--dist-dir=")) {
      options.distDir = arg.slice("--dist-dir=".length);
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length);
    } else if (arg === "--skip-checks") {
      options.includeChecks = false;
    } else if (arg === "--no-output") {
      options.outputPath = null;
    }
  }

  return options;
}

async function main() {
  const report = await runBaselineAudit(parseArgs(process.argv.slice(2)));
  const output = {
    generatedAt: report.generatedAt,
    commit: report.git.commit,
    dirty: report.git.dirty,
    commandFailures: report.commands.filter((command) => command.exitCode !== 0).length,
    routeChecks: report.routes.filter((route) => route.statusResult.state === "checked").length,
    skippedRoutes: report.routes.filter((route) => route.statusResult.state === "skipped").length,
    knownGaps: report.knownGaps.length,
    largestJsGzipBytes: report.dist.javascript[0]?.gzipBytes ?? null,
  };

  console.log(JSON.stringify(output, null, 2));

  if (report.commands.some((command) => command.exitCode !== 0)) {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
