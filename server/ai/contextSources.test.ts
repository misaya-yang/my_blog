import { describe, expect, it } from "vitest";
import {
  createMemoryContextSourceStore,
  normalizeContextSourceInput,
} from "./contextSources";
import type { AgentIdentity } from "./types";

const owner: AgentIdentity = {
  type: "visitor",
  tier: "visitor",
  key: "visitor-context-owner",
  displayName: "Reader",
};

const other: AgentIdentity = {
  type: "visitor",
  tier: "visitor",
  key: "visitor-context-other",
  displayName: "Other Reader",
};

describe("AI conversation context sources", () => {
  it("normalizes pasted text and rejects binary-style uploads", () => {
    const pasted = normalizeContextSourceInput({
      kind: "pasted_text",
      content:
        "  Harness note\n\nContext engines should preserve source boundaries.  ",
    });

    expect(pasted).toMatchObject({
      kind: "pasted_text",
      filename: "Pasted context",
      mimeType: "text/plain",
    });
    expect(pasted.content).toContain("Context engines");

    expect(() =>
      normalizeContextSourceInput({
        kind: "text_file",
        filename: "trace.pdf",
        mimeType: "application/pdf",
        content: "not allowed",
      })
    ).toThrow("Only pasted text, .txt, and .md context sources are supported");
  });

  it("rejects pasted context over the configured character limit", () => {
    expect(() =>
      normalizeContextSourceInput({
        kind: "pasted_text",
        content: "x".repeat(20_001),
      })
    ).toThrow("20000 characters or fewer");
  });

  it("stores sources per conversation owner and removes expired context", async () => {
    const store = createMemoryContextSourceStore();
    const now = new Date("2026-05-30T08:00:00.000Z");
    const expiresAt = new Date("2026-06-06T08:00:00.000Z");

    const source = await store.addSource({
      conversationId: "conversation-1",
      identity: owner,
      kind: "markdown_file",
      filename: "agent-notes.md",
      mimeType: "text/markdown",
      content: "# Agent Notes\nUse a harness engine to control context.",
      expiresAt,
      now,
    });

    expect(source.sourceId).toMatch(/^context:/);
    expect(source.tokenEstimate).toBeGreaterThan(0);
    expect(
      await store.listSources({
        conversationId: "conversation-1",
        identity: owner,
        now,
      })
    ).toHaveLength(1);
    expect(
      await store.listSources({
        conversationId: "conversation-1",
        identity: other,
        now,
      })
    ).toHaveLength(0);

    const deleted = await store.cleanupExpired(
      new Date("2026-06-07T08:00:00.000Z")
    );

    expect(deleted).toBe(1);
    expect(
      await store.listSources({
        conversationId: "conversation-1",
        identity: owner,
        now: new Date("2026-06-07T08:00:00.000Z"),
      })
    ).toHaveLength(0);
  });
});
