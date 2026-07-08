import { execFile } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const OUTPUT_TAIL_LIMIT = 12_000;
const DEFAULT_OUTPUT =
  "docs/product_optimization/reports/release-check-latest.json";

export type ReleaseStepId =
  | "git-status"
  | "diff-check"
  | "typecheck"
  | "unit-tests"
  | "content-audit"
  | "content-verify"
  | "build"
  | "performance-audit"
  | "css-ownership"
  | "ui-audit";

export type ReleaseCheckOptions = {
  projectRoot: string;
  outputPath: string | null;
  baseUrl: string;
  dryRun: boolean;
  skipUi: boolean;
  skipContentVerify: boolean;
  allowDirty: boolean;
  agentEvalReportPath: string | null;
  agentEvalWaiver: string | null;
};

export type ReleaseStep = {
  id: ReleaseStepId;
  label: string;
  command: string;
  args: string[];
  blocking: boolean;
  env?: Record<string, string>;
  skipReason?: string;
};

export type ReleaseStepResult = {
  id: ReleaseStepId;
  label: string;
  command: string;
  blocking: boolean;
  state: "passed" | "failed" | "skipped" | "not_run";
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  reason: string | null;
};

export type ReleaseCheckReport = {
  generatedAt: string;
  status: "passed" | "failed" | "dry-run";
  projectRoot: string;
  git: {
    branch: string;
    commit: string;
    dirty: boolean;
    statusShort: string;
  };
  options: {
    baseUrl: string;
    dryRun: boolean;
    skipUi: boolean;
    skipContentVerify: boolean;
    allowDirty: boolean;
    agentEvalReportPath: string | null;
    agentEvalWaiver: string | null;
  };
  agentEvalEvidence: AgentEvalEvidence;
  steps: ReleaseStepResult[];
  failures: string[];
  outputPath: string | null;
};

export type AgentEvalEvidence = {
  status:
    | "provided"
    | "waived"
    | "missing"
    | "missing_report"
    | "invalid_report"
    | "failed_report";
  reportPath: string | null;
  reportStatus: string | null;
  waiver: string | null;
  reason: string | null;
  ownerImpact: string;
};

type CommandRunner = (
  step: ReleaseStep,
  projectRoot: string
) => Promise<ReleaseStepResult>;

export function parseReleaseCheckArgs(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd()
): ReleaseCheckOptions {
  const options: ReleaseCheckOptions = {
    projectRoot: cwd,
    outputPath: DEFAULT_OUTPUT,
    baseUrl: env.AUDIT_BASE_URL ?? "http://localhost:3000",
    dryRun: false,
    skipUi: false,
    skipContentVerify: false,
    allowDirty: false,
    agentEvalReportPath: env.AGENT_EVAL_REPORT ?? null,
    agentEvalWaiver: env.AGENT_EVAL_WAIVER ?? null,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-ui") {
      options.skipUi = true;
    } else if (arg === "--skip-content-verify") {
      options.skipContentVerify = true;
    } else if (arg === "--allow-dirty") {
      options.allowDirty = true;
    } else if (arg.startsWith("--agent-eval-report=")) {
      options.agentEvalReportPath = arg.slice("--agent-eval-report=".length);
    } else if (arg.startsWith("--agent-eval-waiver=")) {
      options.agentEvalWaiver = arg.slice("--agent-eval-waiver=".length);
    } else if (arg === "--no-output") {
      options.outputPath = null;
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length);
    } else if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length);
    } else {
      throw new Error(`Unknown release:check argument: ${arg}`);
    }
  }

  if (options.agentEvalReportPath?.trim() && options.agentEvalWaiver?.trim()) {
    throw new Error(
      "Use either --agent-eval-report or --agent-eval-waiver, not both."
    );
  }
  options.agentEvalReportPath = options.agentEvalReportPath?.trim() || null;
  options.agentEvalWaiver = options.agentEvalWaiver?.trim() || null;

  return options;
}

export function buildReleaseSteps(options: ReleaseCheckOptions): ReleaseStep[] {
  return [
    {
      id: "git-status",
      label: "Git status",
      command: "git",
      args: ["status", "--short", "--branch"],
      blocking: false,
    },
    {
      id: "diff-check",
      label: "Diff whitespace check",
      command: "git",
      args: ["diff", "--check"],
      blocking: true,
    },
    {
      id: "typecheck",
      label: "TypeScript check",
      command: "corepack",
      args: ["pnpm", "check"],
      blocking: true,
    },
    {
      id: "unit-tests",
      label: "Vitest suite",
      command: "corepack",
      args: ["pnpm", "test"],
      blocking: true,
    },
    {
      id: "content-audit",
      label: "Content quality audit",
      command: "corepack",
      args: ["pnpm", "content:audit"],
      blocking: true,
    },
    {
      id: "content-verify",
      label: "Publish freshness check",
      command: "corepack",
      args: ["pnpm", "content:verify"],
      blocking: true,
      skipReason: options.skipContentVerify
        ? "Skipped by --skip-content-verify."
        : undefined,
    },
    {
      id: "build",
      label: "Production build",
      command: "corepack",
      args: ["pnpm", "build"],
      blocking: true,
    },
    {
      id: "performance-audit",
      label: "Performance budget audit",
      command: "corepack",
      args: ["pnpm", "audit:performance"],
      blocking: true,
    },
    {
      id: "css-ownership",
      label: "CSS ownership audit",
      command: "corepack",
      args: ["pnpm", "audit:css"],
      blocking: true,
    },
    {
      id: "ui-audit",
      label: "Browser UI layout audit",
      command: "corepack",
      args: ["pnpm", "audit:ui"],
      blocking: true,
      env: { AUDIT_BASE_URL: options.baseUrl },
      skipReason: options.skipUi
        ? "Skipped by --skip-ui. Start a production server and run without this flag for full release verification."
        : undefined,
    },
  ];
}

export async function runReleaseCheck(
  options: ReleaseCheckOptions,
  runner: CommandRunner = runStepCommand
): Promise<ReleaseCheckReport> {
  const git = await collectGitState(options.projectRoot);
  const agentEvalEvidence = await collectAgentEvalEvidence(options);
  const steps = buildReleaseSteps(options);
  const results: ReleaseStepResult[] = [];
  let failed = false;

  for (const step of steps) {
    if (options.dryRun) {
      results.push(skippedResult(step, "Dry run; command was not executed."));
      continue;
    }

    if (step.skipReason) {
      results.push(skippedResult(step, step.skipReason));
      continue;
    }

    if (failed) {
      results.push(
        skippedResult(
          step,
          "Not run because an earlier blocking step failed.",
          "not_run"
        )
      );
      continue;
    }

    const result = await runner(step, options.projectRoot);
    results.push(result);
    if (step.blocking && result.state === "failed") {
      failed = true;
    }
  }

  const failures = collectFailures(results);
  if (!options.dryRun && agentEvalEvidence.reason) {
    failures.unshift(agentEvalEvidence.reason ?? "Agent eval evidence missing.");
  }
  if (git.dirty && !options.allowDirty) {
    failures.unshift(
      "Working tree is dirty. Commit, stash, or rerun with --allow-dirty for an explicitly non-release diagnostic."
    );
  }

  const report: ReleaseCheckReport = {
    generatedAt: new Date().toISOString(),
    status: options.dryRun
      ? "dry-run"
      : failures.length > 0
        ? "failed"
        : "passed",
    projectRoot: options.projectRoot,
    git,
    options: {
      baseUrl: options.baseUrl,
      dryRun: options.dryRun,
      skipUi: options.skipUi,
      skipContentVerify: options.skipContentVerify,
      allowDirty: options.allowDirty,
      agentEvalReportPath: options.agentEvalReportPath,
      agentEvalWaiver: options.agentEvalWaiver,
    },
    agentEvalEvidence,
    steps: results,
    failures,
    outputPath: options.outputPath,
  };

  if (options.outputPath) {
    await writeJsonReport(options.projectRoot, options.outputPath, report);
  }

  return report;
}

async function runStepCommand(
  step: ReleaseStep,
  projectRoot: string
): Promise<ReleaseStepResult> {
  const startedAt = Date.now();
  const env = { ...process.env, ...step.env };

  try {
    const { stdout, stderr } = await execFileAsync(step.command, step.args, {
      cwd: projectRoot,
      env,
      maxBuffer: 20 * 1024 * 1024,
    });
    return {
      id: step.id,
      label: step.label,
      command: formatCommand(step),
      blocking: step.blocking,
      state: "passed",
      exitCode: 0,
      durationMs: Date.now() - startedAt,
      stdout: cleanOutput(stdout),
      stderr: cleanOutput(stderr),
      reason: null,
    };
  } catch (error) {
    const failure = error as {
      code?: number;
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    return {
      id: step.id,
      label: step.label,
      command: formatCommand(step),
      blocking: step.blocking,
      state: "failed",
      exitCode: typeof failure.code === "number" ? failure.code : 1,
      durationMs: Date.now() - startedAt,
      stdout: cleanOutput(failure.stdout ?? ""),
      stderr: cleanOutput(failure.stderr ?? failure.message ?? ""),
      reason: failure.message ?? "Command failed.",
    };
  }
}

function skippedResult(
  step: ReleaseStep,
  reason: string,
  state: "skipped" | "not_run" = "skipped"
): ReleaseStepResult {
  return {
    id: step.id,
    label: step.label,
    command: formatCommand(step),
    blocking: step.blocking,
    state,
    exitCode: null,
    durationMs: 0,
    stdout: "",
    stderr: "",
    reason,
  };
}

async function collectGitState(projectRoot: string) {
  const [branch, commit, statusShort] = await Promise.all([
    gitOutput(projectRoot, ["branch", "--show-current"]),
    gitOutput(projectRoot, ["rev-parse", "--short", "HEAD"]),
    gitOutput(projectRoot, ["status", "--short"]),
  ]);

  return {
    branch: branch.trim() || "unknown",
    commit: commit.trim() || "unknown",
    dirty: statusShort.trim().length > 0,
    statusShort: statusShort.trim(),
  };
}

async function gitOutput(projectRoot: string, args: string[]) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: projectRoot,
      maxBuffer: 1024 * 1024,
    });
    return stdout;
  } catch {
    return "";
  }
}

function collectFailures(results: ReleaseStepResult[]) {
  return results
    .filter(result => result.blocking && result.state === "failed")
    .map(result => `${result.label} failed with exit code ${result.exitCode}.`);
}

async function collectAgentEvalEvidence(
  options: ReleaseCheckOptions
): Promise<AgentEvalEvidence> {
  if (options.agentEvalWaiver) {
    return {
      status: "waived",
      reportPath: null,
      reportStatus: null,
      waiver: options.agentEvalWaiver,
      reason: null,
      ownerImpact:
        "Agent answer-quality eval evidence was waived for this release check. Treat release readiness as conditional on owner acceptance of the waiver.",
    };
  }

  if (options.agentEvalReportPath) {
    const absoluteReportPath = resolve(
      options.projectRoot,
      options.agentEvalReportPath
    );
    try {
      await access(absoluteReportPath);
      const reportStatus = await readAgentEvalReportStatus(absoluteReportPath);
      if (!reportStatus) {
        return {
          status: "invalid_report",
          reportPath: options.agentEvalReportPath,
          reportStatus: null,
          waiver: null,
          reason: `Agent eval report at ${options.agentEvalReportPath} does not expose a top-level status. Run pnpm ai:eval or provide an explicit waiver.`,
          ownerImpact:
            "Release readiness cannot be claimed because Agent quality evidence is not in the expected report format.",
        };
      }
      if (reportStatus !== "passed") {
        return {
          status: "failed_report",
          reportPath: options.agentEvalReportPath,
          reportStatus,
          waiver: null,
          reason: `Agent eval report status is ${reportStatus}. Provide a passing report or use --agent-eval-waiver=<reason>.`,
          ownerImpact:
            "Release readiness cannot be claimed because the attached Agent quality report is not passing.",
        };
      }
      return {
        status: "provided",
        reportPath: options.agentEvalReportPath,
        reportStatus,
        waiver: null,
        reason: null,
        ownerImpact:
          "Agent answer-quality eval evidence is attached to this release report.",
      };
    } catch {
      return {
        status: "missing_report",
        reportPath: options.agentEvalReportPath,
        reportStatus: null,
        waiver: null,
        reason: `Agent eval report was not found at ${options.agentEvalReportPath}. Provide an existing report or use --agent-eval-waiver=<reason>.`,
        ownerImpact:
          "Release readiness cannot be claimed because Agent quality evidence was referenced but not available.",
      };
    }
  }

  return {
    status: "missing",
    reportPath: null,
    reportStatus: null,
    waiver: null,
    reason:
      "Agent eval evidence is missing. Provide --agent-eval-report=<path> or --agent-eval-waiver=<reason> before claiming release readiness.",
    ownerImpact:
      "Release readiness cannot be claimed because Agent answer-quality evidence or an explicit waiver is absent.",
  };
}

async function readAgentEvalReportStatus(absoluteReportPath: string) {
  try {
    const report = JSON.parse(await readFile(absoluteReportPath, "utf8")) as {
      status?: unknown;
    };
    return typeof report.status === "string" ? report.status : null;
  } catch {
    return null;
  }
}

function formatCommand(step: ReleaseStep) {
  const envPrefix = step.env
    ? Object.entries(step.env)
        .map(([key, value]) => `${key}=${value}`)
        .join(" ")
    : "";
  return [envPrefix, step.command, ...step.args].filter(Boolean).join(" ");
}

function cleanOutput(value: string) {
  return tail(redactSensitiveOutput(value.trim()), OUTPUT_TAIL_LIMIT);
}

function redactSensitiveOutput(value: string) {
  return value
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(
      /\b((?:OPENAI|ANTHROPIC|GOOGLE|DATABASE|POSTGRES|OAUTH|SESSION|JWT)[A-Z0-9_]*=)[^\s]+/gi,
      "$1[REDACTED]"
    );
}

function tail(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `...[truncated]\n${value.slice(-limit)}`;
}

async function writeJsonReport(
  projectRoot: string,
  outputPath: string,
  report: ReleaseCheckReport
) {
  const absoluteOutput = resolve(projectRoot, outputPath);
  await mkdir(dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  const options = parseReleaseCheckArgs(process.argv.slice(2));
  const report = await runReleaseCheck(options);
  const output = report.outputPath ? ` See ${report.outputPath}.` : "";

  if (report.status === "passed") {
    console.log(`Release check passed.${output}`);
    return;
  }

  if (report.status === "dry-run") {
    console.log(`Release check dry run generated.${output}`);
    return;
  }

  console.error(`Release check failed.${output}`);
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
