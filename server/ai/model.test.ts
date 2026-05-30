import { describe, expect, it } from "vitest";
import { createNoPublicSourceAnswer, normalizeAgentAnswer } from "./model";
import type { AgentSourceCard } from "./types";

const harnessSource: AgentSourceCard = {
  sourceId: "agent-harness-engine:3",
  postTitle: "Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context",
  postSlug: "agent-harness-engine-evaluating-tool-using-agents",
  categorySlug: "ai-applications",
  tagSlugs: ["harness-engine", "agent-systems"],
  heading: "Harness Architecture",
  excerpt: "A minimal harness engine can be modeled as a loop around a typed task contract.",
  relevanceReason: "Matched harness architecture terms.",
};

describe("agent answer quality normalization", () => {
  it("normalizes invalid answer types and preserves real source cards", () => {
    const answer = normalizeAgentAnswer(
      {
        answerType: "grounded" as any,
        answerMarkdown: "Harness engines make agent evaluation repeatable.",
        sourceIds: ["hallucinated", harnessSource.sourceId],
        relatedQuestions: ["How does the context builder work?"],
        confidence: "high",
      },
      [harnessSource]
    );

    expect(answer.answerType).toBe("explanation");
    expect(answer.sourceIds).toEqual([harnessSource.sourceId]);
    expect(answer.sourceCards).toEqual([harnessSource]);
    expect(answer.relatedQuestions).toEqual(["How does the context builder work?"]);
  });

  it("falls back to all retrieved source ids when the model omits valid ids", () => {
    const answer = normalizeAgentAnswer(
      {
        answerMarkdown: "The article explains the harness boundary.",
        sourceIds: [],
      },
      [harnessSource]
    );

    expect(answer.sourceIds).toEqual([harnessSource.sourceId]);
    expect(answer.relatedQuestions.length).toBeGreaterThan(0);
  });

  it("returns a public-source refusal without exposing unavailable material", () => {
    const answer = createNoPublicSourceAnswer();

    expect(answer.answerType).toBe("refusal");
    expect(answer.refusalReason).toBe("no_public_source");
    expect(answer.sourceCards).toEqual([]);
    expect(answer.answerMarkdown).not.toContain("EVQ");
  });
});
