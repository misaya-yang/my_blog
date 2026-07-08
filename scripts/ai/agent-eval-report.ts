import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  evaluateAgentGoldenQuestions,
  getGoldenQuestionsForInput,
} from "../../server/ai/evals.js";
import { searchPublicKnowledgeChunkSources } from "../../server/ai/knowledgeDb.js";
import type { AgentEvalRunOutput, AgentScope } from "../../server/ai/types.js";
import { closeDb } from "../../server/db.js";

const DEFAULT_OUTPUT =
  "docs/product_optimization/reports/agent-eval-latest.json";

export type AgentEvalReportStatus =
  | "passed"
  | "failed"
  | "manual_review_required";

export type AgentEvalCliOptions = {
  outputPath: string | null;
  questions: string[];
  scope: AgentScope;
};

export type AgentEvalReport = AgentEvalRunOutput & {
  generatedAt: string;
  status: AgentEvalReportStatus;
  failures: string[];
  manualReviewRequired: string[];
  options: {
    scope: AgentScope;
    questionCount: number;
  };
  outputPath: string | null;
};

export function parseAgentEvalArgs(argv: string[]): AgentEvalCliOptions {
  const options: AgentEvalCliOptions = {
    outputPath: DEFAULT_OUTPUT,
    questions: [],
    scope: { type: "site" },
  };

  for (const arg of argv) {
    if (arg === "--no-output") {
      options.outputPath = null;
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length).trim() || null;
    } else if (arg.startsWith("--question=")) {
      const question = arg.slice("--question=".length).trim();
      if (question) options.questions.push(question);
    } else if (arg.startsWith("--scope=")) {
      options.scope = parseAgentEvalScope(arg.slice("--scope=".length));
    } else {
      throw new Error(`Unknown ai:eval argument: ${arg}`);
    }
  }

  return options;
}

export function parseAgentEvalScope(value: string): AgentScope {
  const normalized = value.trim();
  if (!normalized || normalized === "site") return { type: "site" };

  const [type, ...rest] = normalized.split(":");
  const scopeType = type as AgentScope["type"];
  const scopeValue = rest.join(":").trim();
  if (!["post", "category", "tag", "track"].includes(scopeType)) {
    throw new Error(
      "Invalid ai:eval scope. Use site, post:<slug>, category:<slug>, tag:<slug>, or track:<slug>."
    );
  }
  if (!scopeValue) {
    throw new Error(`Missing value for ai:eval scope ${scopeType}.`);
  }
  return { type: scopeType, value: scopeValue };
}

export async function runAgentEvalReport(
  options: AgentEvalCliOptions,
  now = () => new Date()
): Promise<AgentEvalReport> {
  const run = await evaluateAgentGoldenQuestions({
    goldens: getGoldenQuestionsForInput(options.questions),
    defaultScope: options.scope,
    routeContext: { path: "/", routeType: "home" },
    retrieve: async input =>
      searchPublicKnowledgeChunkSources({
        query: input.query,
        scope: input.scope,
        limit: input.limit,
      }),
    now,
  });
  const failures = run.items
    .filter(item => item.status === "failed")
    .map(item => `${item.question}: ${item.failureReason ?? "failed"}`);
  const manualReviewRequired = run.items
    .filter(item => item.status === "manual_review_required")
    .map(item => `${item.question}: ${item.manualReviewReason}`);
  const status = getAgentEvalReportStatus(run);

  return {
    generatedAt: now().toISOString(),
    status,
    summary: run.summary,
    items: run.items,
    failures,
    manualReviewRequired,
    options: {
      scope: options.scope,
      questionCount: options.questions.length || run.items.length,
    },
    outputPath: options.outputPath,
  };
}

export function getAgentEvalReportStatus(
  run: AgentEvalRunOutput
): AgentEvalReportStatus {
  if (run.summary.failed > 0) return "failed";
  if (run.summary.manualReview > 0) return "manual_review_required";
  return "passed";
}

export function formatAgentEvalReportLines(report: AgentEvalReport) {
  return [
    `Agent eval status: ${report.status}`,
    `Agent eval summary: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed, ${report.summary.manualReview} manual review`,
    ...(report.outputPath ? [`Agent eval report: ${report.outputPath}`] : []),
  ];
}

async function writeAgentEvalReport(
  projectRoot: string,
  outputPath: string,
  report: AgentEvalReport
) {
  const absoluteOutput = resolve(projectRoot, outputPath);
  await mkdir(dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  const options = parseAgentEvalArgs(process.argv.slice(2));
  const report = await runAgentEvalReport(options);
  if (options.outputPath) {
    await writeAgentEvalReport(process.cwd(), options.outputPath, report);
  }
  for (const line of formatAgentEvalReportLines(report)) {
    console.log(line);
  }
  if (report.status !== "passed") {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch(error => {
      console.error("Agent eval failed", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closeDb();
    });
}
