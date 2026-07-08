import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  AgentBootstrapUnavailable,
  AgentMessageRecovery,
  AgentNotice,
  getRecoveryMessageKey,
} from "./AgentRecoverySurfaces";
import type { ChatMessage } from "./types";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: translate,
  }),
}));

describe("AgentRecoverySurfaces", () => {
  it("renders warning and error notices with distinct tones", () => {
    const warning = renderToStaticMarkup(
      <AgentNotice tone="warning" message="Check context" />
    );
    const error = renderToStaticMarkup(
      <AgentNotice tone="error" message="Failed" />
    );

    expect(warning).toContain("Check context");
    expect(warning).toContain("border-slate-700");
    expect(error).toContain("Failed");
    expect(error).toContain("border-red-300/25");
  });

  it("renders bootstrap retry state", () => {
    const html = renderToStaticMarkup(
      <AgentBootstrapUnavailable retrying onRetry={() => undefined} />
    );

    expect(html).toContain("Agent unavailable");
    expect(html).toContain("Bootstrap failed");
    expect(html).toContain("Retry");
    expect(html).toContain("animate-spin");
  });

  it("renders retry recovery for failed messages with prompts", () => {
    const html = renderToStaticMarkup(
      <AgentMessageRecovery
        message={message({
          state: "failed",
          recoveryMessage: "Model failed.",
          recoveryPrompt: "try again",
        })}
        disabled={false}
        visitorLoading={false}
        onRetry={() => undefined}
        onContinueAsVisitor={() => undefined}
      />
    );

    expect(html).toContain("Model failed.");
    expect(html).toContain("The answer failed.");
    expect(html).toContain("Retry answer");
  });

  it("renders anonymous quota visitor recovery", () => {
    const html = renderToStaticMarkup(
      <AgentMessageRecovery
        message={message({
          state: "quota_blocked",
          quotaTier: "anonymous",
          recoveryPrompt: "continue question",
        })}
        disabled={false}
        visitorLoading
        onRetry={() => undefined}
        onContinueAsVisitor={() => undefined}
      />
    );

    expect(html).toContain("Quota stopped this run.");
    expect(html).toContain("Continue as visitor");
    expect(html).toContain("animate-spin");
  });

  it("returns no recovery surface for messages without a state", () => {
    expect(
      renderToStaticMarkup(
        <AgentMessageRecovery
          message={message({ state: undefined })}
          disabled={false}
          visitorLoading={false}
          onRetry={() => undefined}
          onContinueAsVisitor={() => undefined}
        />
      )
    ).toBe("");
  });

  it("maps recovery state keys", () => {
    expect(getRecoveryMessageKey("cancelled")).toBe("agent.recovery.cancelled");
    expect(getRecoveryMessageKey("timeout")).toBe("agent.recovery.timeout");
    expect(getRecoveryMessageKey("quota_blocked")).toBe(
      "agent.recovery.quota"
    );
    expect(getRecoveryMessageKey("no_source")).toBe(
      "agent.recovery.noSource"
    );
    expect(getRecoveryMessageKey("failed")).toBe("agent.recovery.failed");
  });
});

function message(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: "msg-1",
    role: "assistant",
    content: "",
    ...overrides,
  };
}

function translate(key: string) {
  return (
    (
      {
        "agent.bootstrap.unavailable": "Agent unavailable",
        "agent.error.bootstrap": "Bootstrap failed",
        "agent.bootstrap.retry": "Retry",
        "agent.input.retry": "Retry answer",
        "agent.quota.continueAsVisitor": "Continue as visitor",
        "agent.recovery.cancelled": "The answer was cancelled.",
        "agent.recovery.timeout": "The answer timed out.",
        "agent.recovery.quota": "Quota stopped this run.",
        "agent.recovery.noSource": "No public source was found.",
        "agent.recovery.failed": "The answer failed.",
      } satisfies Record<string, string>
    )[key] ?? key
  );
}
