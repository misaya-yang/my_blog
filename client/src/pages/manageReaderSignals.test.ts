import { describe, expect, it } from "vitest";

import {
  getReaderSignalKindLabel,
  getReaderSignalPrimaryText,
  getReaderSignalSeverityLabel,
} from "./manageReaderSignals";

describe("manage reader signal helpers", () => {
  const t = (key: string) =>
    (
      {
        "manage.readerSignals.kind.searchMiss": "Search miss",
        "manage.readerSignals.kind.articleFeedback": "Article feedback",
        "manage.readerSignals.kind.agentQuestion": "Agent question",
        "manage.readerSignals.kind.agentLowConfidence": "Low confidence",
        "manage.readerSignals.kind.agentRefusal": "Agent refusal",
        "manage.readerSignals.kind.contentAudit": "Content audit",
        "manage.readerSignals.kind.publishFreshness": "Publish freshness",
        "manage.readerSignals.severity.high": "High",
        "manage.readerSignals.severity.medium": "Medium",
        "manage.readerSignals.severity.low": "Low",
      } satisfies Record<string, string>
    )[key] ?? key;

  it("labels known reader signal kinds and severities", () => {
    expect(getReaderSignalKindLabel("article_feedback", t)).toBe(
      "Article feedback"
    );
    expect(getReaderSignalKindLabel("agent_low_confidence", t)).toBe(
      "Low confidence"
    );
    expect(getReaderSignalSeverityLabel("high", t)).toBe("High");
  });

  it("falls back for future unknown values", () => {
    expect(getReaderSignalKindLabel("future_signal", t)).toBe("future_signal");
    expect(getReaderSignalSeverityLabel("urgent", t)).toBe("urgent");
  });

  it("chooses a stable primary text without exposing extra payload fields", () => {
    expect(
      getReaderSignalPrimaryText({
        id: "fallback",
        kind: "article_feedback",
        status: "new",
        severity: "high",
        articleSlug: "agent-harness-engine",
        query: "should be second",
      })
    ).toBe("agent-harness-engine");
    expect(
      getReaderSignalPrimaryText({
        id: "fallback",
        kind: "search_miss",
        status: "new",
        severity: "medium",
        query: "agent memory",
      })
    ).toBe("agent memory");
  });
});
