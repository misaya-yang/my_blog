import { describe, expect, it } from "vitest";
import {
  buildAgentLowConfidenceSignal,
  buildAgentQuestionSignal,
  buildAgentRefusalSignal,
  buildAgentSignals,
  buildArticleFeedbackSignal,
  buildContentAuditSignal,
  buildPublishFreshnessSignal,
  buildSearchMissSignal,
  normalizeSignalSource,
  normalizeSignalText,
  type ReaderSignalStatus,
} from "./readerSignals";

describe("reader signal normalization", () => {
  it("normalizes source aliases, lifecycle status, and stable user text", () => {
    const status: ReaderSignalStatus = "in_revision";

    expect(status).toBe("in_revision");
    expect(normalizeSignalSource("agent_radar")).toBe("agent_question");
    expect(normalizeSignalSource("agent_question")).toBe("agent_question");
    expect(normalizeSignalSource("unknown_source")).toBeNull();
    expect(
      normalizeSignalText("  Ask User@Example.com from 203.0.113.8  ")
    ).toBe("ask [redacted-email] from [redacted-ip]");
  });

  it("builds stable search miss signals with redacted evidence", () => {
    const signal = buildSearchMissSignal({
      query: "Email me at user@example.com about AgentLoop",
      normalizedQuery: "email me at [redacted-email] about agentloop",
      count: 3,
      firstSeenAt: new Date("2026-07-08T01:00:00Z"),
      lastSeenAt: new Date("2026-07-08T02:00:00Z"),
      suggestedPrompt:
        "Write or connect a public note that answers: Email me at user@example.com about AgentLoop",
    });

    expect(signal).toMatchObject({
      id: "search_miss:email me at [redacted-email] about agentloop",
      kind: "search_miss",
      status: "new",
      severity: "high",
      query: "Email me at [redacted-email] about AgentLoop",
      count: 3,
    });
    expect(signal.excerpt).toContain("[redacted-email]");
    expect(signal.excerpt).not.toContain("user@example.com");
  });

  it("builds Agent question signals with legacy-safe grouping and redaction", () => {
    const signal = buildAgentQuestionSignal({
      question: "Email User@Example.com about AgentLoop",
      scopeType: "post",
      scopeValue: "agent-loop-observable",
      runId: "run-1",
      count: 3,
      firstSeenAt: "2026-07-08T01:00:00.000Z",
      lastSeenAt: "2026-07-08T02:00:00.000Z",
    });

    expect(signal).toMatchObject({
      id: "agent_question:post:agent-loop-observable:email [redacted-email] about agentloop",
      kind: "agent_question",
      status: "new",
      severity: "medium",
      articleSlug: "agent-loop-observable",
      sourceRef: "run-1",
      count: 3,
    });
    expect(signal.excerpt).toContain("[redacted-email]");
    expect(signal.excerpt).not.toContain("User@Example.com");
  });

  it("builds high-severity low-confidence and refusal Agent signals", () => {
    const lowConfidence = buildAgentLowConfidenceSignal({
      question: "",
      scopeType: "track",
      scopeValue: "ai-applications",
      runId: "run-low-1",
      count: 2,
      firstSeenAt: "2026-07-08T01:00:00.000Z",
      lastSeenAt: "2026-07-08T02:00:00.000Z",
    });
    const refusal = buildAgentRefusalSignal({
      question: "Why did it refuse?",
      refusalReason: "no_public_source",
      scopeType: "site",
      runId: "run-refusal-1",
      count: 1,
      firstSeenAt: "2026-07-08T01:00:00.000Z",
      lastSeenAt: "2026-07-08T02:00:00.000Z",
    });

    expect(lowConfidence).toMatchObject({
      id: "agent_low_confidence:track:ai-applications:run-low-1",
      kind: "agent_low_confidence",
      severity: "high",
      trackSlug: "ai-applications",
      sourceRef: "run-low-1",
    });
    expect(refusal).toMatchObject({
      id: "agent_refusal:site:no_public_source",
      kind: "agent_refusal",
      severity: "medium",
      sourceRef: "run-refusal-1",
    });
  });

  it("sorts aggregate Agent signals by severity and count", () => {
    const signals = buildAgentSignals([
      {
        kind: "agent_question",
        question: "How do traces work?",
        runId: "run-question",
        count: 1,
        firstSeenAt: "2026-07-08T01:00:00.000Z",
        lastSeenAt: "2026-07-08T01:00:00.000Z",
      },
      {
        kind: "agent_low_confidence",
        question: "Why no source?",
        runId: "run-low",
        count: 2,
        firstSeenAt: "2026-07-08T01:00:00.000Z",
        lastSeenAt: "2026-07-08T02:00:00.000Z",
      },
    ]);

    expect(signals.map(signal => signal.kind)).toEqual([
      "agent_low_confidence",
      "agent_question",
    ]);
  });

  it("builds feedback signals without leaking direct contact data", () => {
    const signal = buildArticleFeedbackSignal({
      articleSlug: "agent-loop-observable",
      feedbackType: "not_useful",
      count: 2,
      excerpt: "Confusing paragraph; email reader@example.com",
      firstSeenAt: "2026-07-08T01:00:00.000Z",
      lastSeenAt: "2026-07-08T02:00:00.000Z",
    });

    expect(signal).toMatchObject({
      id: "article_feedback:agent-loop-observable:not_useful",
      kind: "article_feedback",
      severity: "high",
      articleSlug: "agent-loop-observable",
      count: 2,
    });
    expect(signal.excerpt).toContain("[redacted-email]");
    expect(signal.excerpt).not.toContain("reader@example.com");
  });

  it("maps publish freshness findings to release-readiness signals", () => {
    const hiddenExposure = buildPublishFreshnessSignal({
      checkCode: "hidden_draft_exposed",
      articleSlug: "private-draft",
      message: "Hidden draft appeared in sitemap.",
      firstSeenAt: "2026-07-08T01:00:00.000Z",
      lastSeenAt: "2026-07-08T02:00:00.000Z",
    });
    const unavailable = buildPublishFreshnessSignal({
      checkCode: "report_unavailable",
      message: "Latest report could not be read.",
      firstSeenAt: "2026-07-08T01:00:00.000Z",
      lastSeenAt: "2026-07-08T02:00:00.000Z",
    });

    expect(hiddenExposure).toMatchObject({
      id: "publish_freshness:hidden_draft_exposed:private-draft",
      kind: "publish_freshness",
      severity: "high",
      articleSlug: "private-draft",
    });
    expect(unavailable).toMatchObject({
      id: "publish_freshness:report_unavailable:global",
      kind: "publish_freshness",
      severity: "medium",
    });
  });

  it("maps content audit failures to high severity article signals", () => {
    const signal = buildContentAuditSignal({
      severity: "failure",
      code: "content.missing_h1",
      file: "post.md",
      articleSlug: "post",
      line: 1,
      message: "Missing title.",
      evidence: "# Broken",
    });

    expect(signal).toMatchObject({
      id: "content_audit:post:content.missing_h1:1",
      kind: "content_audit",
      status: "new",
      severity: "high",
      articleSlug: "post",
      sourceRef: "post.md:1",
    });
  });

  it("maps content audit warnings to medium severity file signals", () => {
    const signal = buildContentAuditSignal({
      severity: "warning",
      code: "content.aiish_phrase",
      file: "agent_harness_engine_blog.md",
      message: "Review template-like phrase.",
    });

    expect(signal).toMatchObject({
      id: "content_audit:agent_harness_engine_blog.md:content.aiish_phrase:file",
      kind: "content_audit",
      status: "new",
      severity: "medium",
      sourceRef: "agent_harness_engine_blog.md",
    });
  });
});
