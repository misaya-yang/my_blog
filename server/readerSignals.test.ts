import { describe, expect, it } from "vitest";
import {
  buildContentAuditSignal,
  buildSearchMissSignal,
} from "./readerSignals";

describe("reader signal normalization", () => {
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
