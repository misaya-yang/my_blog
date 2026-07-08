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
    });
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
      "build",
      "ui-audit",
    ]);
    expect(steps.at(-1)).toEqual(
      expect.objectContaining({
        command: "corepack",
        args: ["pnpm", "audit:ui"],
        env: { AUDIT_BASE_URL: "http://localhost:3000" },
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
      ["--allow-dirty", "--no-output"],
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
