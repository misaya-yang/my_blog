import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildReleaseSteps,
  parseReleaseCheckArgs,
  runReleaseCheck,
  type ReleaseStep,
  type ReleaseStepResult,
} from "./check";

describe("release check orchestration", () => {
  it("parses explicit release check options", () => {
    const options = parseReleaseCheckArgs(
      [
        "--dry-run",
        "--skip-ui",
        "--skip-content-verify",
        "--allow-dirty",
        "--agent-eval-waiver=local diagnostic only",
        "--base-url=http://127.0.0.1:4321",
        "--output=.cache/release.json",
      ],
      {},
      "/repo"
    );

    expect(options).toMatchObject({
      projectRoot: "/repo",
      outputPath: ".cache/release.json",
      baseUrl: "http://127.0.0.1:4321",
      dryRun: true,
      skipUi: true,
      skipContentVerify: true,
      allowDirty: true,
      agentEvalReportPath: null,
      agentEvalWaiver: "local diagnostic only",
    });
  });

  it("rejects conflicting Agent eval evidence options", () => {
    expect(() =>
      parseReleaseCheckArgs([
        "--agent-eval-report=.cache/agent-eval.json",
        "--agent-eval-waiver=manual waiver",
      ])
    ).toThrow("Use either --agent-eval-report or --agent-eval-waiver");
  });

  it("keeps the full release gate sequence explicit", () => {
    const steps = buildReleaseSteps(
      parseReleaseCheckArgs([], { AUDIT_BASE_URL: "http://localhost:3000" })
    );

    expect(steps.map(step => step.id)).toEqual([
      "git-status",
      "diff-check",
      "typecheck",
      "unit-tests",
      "content-audit",
      "content-verify",
      "i18n-audit",
      "build",
      "performance-audit",
      "css-ownership",
      "ui-audit",
    ]);
    expect(steps.at(-1)).toEqual(
      expect.objectContaining({
        command: "corepack",
        args: ["pnpm", "audit:ui"],
        env: { AUDIT_BASE_URL: "http://localhost:3000" },
      })
    );
    expect(steps.find(step => step.id === "performance-audit")).toEqual(
      expect.objectContaining({
        command: "corepack",
        args: ["pnpm", "audit:performance"],
        blocking: true,
      })
    );
    expect(steps.find(step => step.id === "i18n-audit")).toEqual(
      expect.objectContaining({
        command: "corepack",
        args: ["pnpm", "audit:i18n"],
        blocking: true,
      })
    );
    expect(steps.find(step => step.id === "css-ownership")).toEqual(
      expect.objectContaining({
        command: "corepack",
        args: ["pnpm", "audit:css"],
        blocking: true,
      })
    );
  });

  it("records skipped optional gates without removing them from the report", () => {
    const options = parseReleaseCheckArgs([
      "--skip-ui",
      "--skip-content-verify",
    ]);
    const skipped = buildReleaseSteps(options).filter(step => step.skipReason);

    expect(skipped.map(step => step.id)).toEqual([
      "content-verify",
      "ui-audit",
    ]);
  });

  it("stops after the first blocking command failure and records not-run steps", async () => {
    const options = parseReleaseCheckArgs(
      ["--allow-dirty", "--no-output", "--agent-eval-waiver=test failure"],
      {},
      process.cwd()
    );
    const report = await runReleaseCheck(options, async step =>
      fakeResult(step, step.id === "typecheck" ? "failed" : "passed")
    );

    expect(report.status).toBe("failed");
    expect(report.failures).toEqual([
      "TypeScript check failed with exit code 1.",
    ]);
    expect(report.steps.find(step => step.id === "unit-tests")?.state).toBe(
      "not_run"
    );
  });

  it("fails release readiness when Agent eval evidence is missing", async () => {
    const options = parseReleaseCheckArgs(
      ["--allow-dirty", "--no-output"],
      {},
      process.cwd()
    );
    const report = await runReleaseCheck(options, async step =>
      fakeResult(step, "passed")
    );

    expect(report.status).toBe("failed");
    expect(report.agentEvalEvidence).toMatchObject({
      status: "missing",
      reportPath: null,
      reportStatus: null,
      waiver: null,
    });
    expect(report.failures[0]).toContain("Agent eval evidence is missing");
  });

  it("passes with an existing Agent eval report path", async () => {
    const projectRoot = await makeTempProject({
      "agent-eval.json": JSON.stringify({ status: "passed" }),
    });
    const options = parseReleaseCheckArgs(
      ["--allow-dirty", "--no-output", "--agent-eval-report=agent-eval.json"],
      {},
      projectRoot
    );
    try {
      const report = await runReleaseCheck(options, async step =>
        fakeResult(step, "passed")
      );

      expect(report.status).toBe("passed");
      expect(report.agentEvalEvidence).toMatchObject({
        status: "provided",
        reportPath: "agent-eval.json",
        reportStatus: "passed",
        waiver: null,
      });
      expect(report.failures).toEqual([]);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("passes with an explicit Agent eval waiver", async () => {
    const options = parseReleaseCheckArgs(
      [
        "--allow-dirty",
        "--no-output",
        "--agent-eval-waiver=provider credentials unavailable in local diagnostic",
      ],
      {},
      process.cwd()
    );
    const report = await runReleaseCheck(options, async step =>
      fakeResult(step, "passed")
    );

    expect(report.status).toBe("passed");
    expect(report.agentEvalEvidence).toMatchObject({
      status: "waived",
      reportPath: null,
      reportStatus: null,
      waiver: "provider credentials unavailable in local diagnostic",
    });
    expect(report.failures).toEqual([]);
  });

  it("fails when the Agent eval report path is missing", async () => {
    const options = parseReleaseCheckArgs(
      [
        "--allow-dirty",
        "--no-output",
        "--agent-eval-report=.cache/missing-agent-eval.json",
      ],
      {},
      process.cwd()
    );
    const report = await runReleaseCheck(options, async step =>
      fakeResult(step, "passed")
    );

    expect(report.status).toBe("failed");
    expect(report.agentEvalEvidence).toMatchObject({
      status: "missing_report",
      reportPath: ".cache/missing-agent-eval.json",
      reportStatus: null,
    });
    expect(report.failures[0]).toContain("Agent eval report was not found");
  });

  it("fails when the Agent eval report is not passing", async () => {
    const projectRoot = await makeTempProject({
      "agent-eval.json": JSON.stringify({ status: "manual_review_required" }),
    });
    const options = parseReleaseCheckArgs(
      ["--allow-dirty", "--no-output", "--agent-eval-report=agent-eval.json"],
      {},
      projectRoot
    );
    try {
      const report = await runReleaseCheck(options, async step =>
        fakeResult(step, "passed")
      );

      expect(report.status).toBe("failed");
      expect(report.agentEvalEvidence).toMatchObject({
        status: "failed_report",
        reportPath: "agent-eval.json",
        reportStatus: "manual_review_required",
      });
      expect(report.failures[0]).toContain(
        "Agent eval report status is manual_review_required"
      );
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("does not execute commands in dry-run mode", async () => {
    const options = parseReleaseCheckArgs(
      ["--dry-run", "--no-output"],
      {},
      process.cwd()
    );
    const report = await runReleaseCheck(options, async () => {
      throw new Error("runner should not be called");
    });

    expect(report.status).toBe("dry-run");
    expect(report.steps.every(step => step.state === "skipped")).toBe(true);
  });
});

function fakeResult(
  step: ReleaseStep,
  state: "passed" | "failed"
): ReleaseStepResult {
  return {
    id: step.id,
    label: step.label,
    command: [step.command, ...step.args].join(" "),
    blocking: step.blocking,
    state,
    exitCode: state === "passed" ? 0 : 1,
    durationMs: 1,
    stdout: "",
    stderr: "",
    reason: state === "passed" ? null : "failed",
  };
}

async function makeTempProject(files: Record<string, string>) {
  const dir = await mkdtemp(join(tmpdir(), "ai-tech-blog-release-"));
  await Promise.all(
    Object.entries(files).map(([name, content]) =>
      writeFile(join(dir, name), content)
    )
  );
  return dir;
}
