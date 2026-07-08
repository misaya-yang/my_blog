import { describe, expect, it } from "vitest";

import {
  getAgentFailureNotice,
  getAgentFailureState,
  getClientStreamFailure,
  getCompletedMessageState,
  getQuotaBlockedNotice,
} from "./agentFailure";
import type { SourceCard } from "./types";

describe("agentFailure", () => {
  it("selects quota blocked copy by tier", () => {
    expect(getQuotaBlockedNotice("anonymous", translate)).toBe(
      "anonymous quota"
    );
    expect(getQuotaBlockedNotice("visitor", translate)).toBe("visitor quota");
    expect(getQuotaBlockedNotice("admin", translate)).toBe("visitor quota");
  });

  it("maps client timeout, abort, and generic send failures", () => {
    expect(
      getClientStreamFailure(
        new DOMException("timed out", "TimeoutError"),
        translate
      )
    ).toEqual({ content: "timeout", state: "timeout" });
    expect(
      getClientStreamFailure(new DOMException("aborted", "AbortError"), translate)
    ).toEqual({ content: "cancelled", state: "cancelled" });
    expect(getClientStreamFailure(new Error("network"), translate)).toEqual({
      content: "send failed",
      state: "failed",
    });
  });

  it("maps server failure notice and state by error code", () => {
    expect(getAgentFailureNotice("agent_stream_aborted", translate)).toBe(
      "cancelled"
    );
    expect(getAgentFailureState("agent_stream_aborted")).toBe("cancelled");
    expect(getAgentFailureNotice("agent_stream_timeout", translate)).toBe(
      "timeout"
    );
    expect(getAgentFailureState("agent_stream_timeout")).toBe("timeout");
    expect(getAgentFailureNotice("model_not_configured", translate)).toBe(
      "model missing"
    );
    expect(getAgentFailureState("model_not_configured")).toBe("failed");
  });

  it("maps no-source completed state only for empty no-public-source answers", () => {
    expect(
      getCompletedMessageState({
        answer: { refusalReason: "no_public_source" },
        sourceCards: [],
      })
    ).toBe("no_source");
    expect(
      getCompletedMessageState({
        answer: { refusalReason: "no_public_source" },
        sourceCards: [sourceCard()],
      })
    ).toBeUndefined();
    expect(
      getCompletedMessageState({
        answer: {},
        sourceCards: [],
      })
    ).toBeUndefined();
  });
});

function translate(key: string) {
  return (
    (
      {
        "agent.quota.blockedAnonymous": "anonymous quota",
        "agent.quota.blockedVisitor": "visitor quota",
        "agent.error.cancelled": "cancelled",
        "agent.error.timeout": "timeout",
        "agent.error.modelNotConfigured": "model missing",
        "agent.error.send": "send failed",
      } satisfies Record<string, string>
    )[key] ?? key
  );
}

function sourceCard(): SourceCard {
  return {
    sourceId: "post:1",
    postTitle: "Post",
    postSlug: "post",
    tagSlugs: [],
    excerpt: "Excerpt",
    relevanceReason: "Matched",
  };
}
