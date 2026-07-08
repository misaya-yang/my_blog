import { describe, expect, it } from "vitest";

import {
  formatAgentEvalReportLines,
  getAgentEvalReportStatus,
  parseAgentEvalArgs,
  parseAgentEvalScope,
  type AgentEvalReport,
} from "./agent-eval-report";
import type { AgentEvalRunOutput } from "../../server/ai/types";

const passingRun: AgentEvalRunOutput = {
  summary: {
    total: 1,
    passed: 1,
    failed: 0,
    manualReview: 0,
    successCases: 1,
    refusalCases: 0,
    runAt: new Date("2026-07-09T00:00:00.000Z"),
    retrievalStrategy: "supabase_keyword",
    modelProvider: "retrieval-only",
  },
  items: [],
};

describe("Agent eval report CLI helpers", () => {
  it("parses output, question, and scope options", () => {
    expect(
      parseAgentEvalArgs([
        "--output=.cache/agent-eval.json",
        "--question=What problem does IsoHC solve?",
        "--scope=track:ai-applications",
      ])
    ).toEqual({
      outputPath: ".cache/agent-eval.json",
      questions: ["What problem does IsoHC solve?"],
      scope: { type: "track", value: "ai-applications" },
    });
    expect(parseAgentEvalArgs(["--no-output"])).toMatchObject({
      outputPath: null,
      questions: [],
      scope: { type: "site" },
    });
  });

  it("rejects invalid scopes and unknown arguments", () => {
    expect(() => parseAgentEvalScope("track")).toThrow(
      "Missing value for ai:eval scope track"
    );
    expect(() => parseAgentEvalScope("private:notes")).toThrow(
      "Invalid ai:eval scope"
    );
    expect(() => parseAgentEvalArgs(["--publish"])).toThrow(
      "Unknown ai:eval argument: --publish"
    );
  });

  it("maps eval summaries to release-report status", () => {
    expect(getAgentEvalReportStatus(passingRun)).toBe("passed");
    expect(
      getAgentEvalReportStatus({
        ...passingRun,
        summary: { ...passingRun.summary, passed: 0, failed: 1 },
      })
    ).toBe("failed");
    expect(
      getAgentEvalReportStatus({
        ...passingRun,
        summary: { ...passingRun.summary, passed: 0, manualReview: 1 },
      })
    ).toBe("manual_review_required");
  });

  it("formats concise owner-facing summary lines", () => {
    const report: AgentEvalReport = {
      ...passingRun,
      generatedAt: "2026-07-09T00:00:00.000Z",
      status: "passed",
      failures: [],
      manualReviewRequired: [],
      options: { scope: { type: "site" }, questionCount: 1 },
      outputPath: "docs/product_optimization/reports/agent-eval-latest.json",
    };

    expect(formatAgentEvalReportLines(report)).toEqual([
      "Agent eval status: passed",
      "Agent eval summary: 1/1 passed, 0 failed, 0 manual review",
      "Agent eval report: docs/product_optimization/reports/agent-eval-latest.json",
    ]);
  });
});
