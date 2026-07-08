import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentRelatedQuestions } from "./AgentRelatedQuestions";
import {
  AGENT_FOLLOW_UP_TASK_LIMIT,
  getVisibleAgentFollowUpTasks,
} from "./agentFollowUpTasks";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      (
        {
          "agent.related.title": "Continue reading",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

describe("AgentRelatedQuestions", () => {
  it("normalizes follow-up tasks before rendering", () => {
    expect(
      getVisibleAgentFollowUpTasks([
        "  Read the source trail  ",
        "",
        "Read the source trail",
        "Compare the next note",
        "Map prerequisites",
        "Hidden fourth task",
      ])
    ).toEqual([
      "Read the source trail",
      "Compare the next note",
      "Map prerequisites",
    ]);
    expect(AGENT_FOLLOW_UP_TASK_LIMIT).toBe(3);
  });

  it("renders title and the first three reading tasks", () => {
    const html = renderToStaticMarkup(
      <AgentRelatedQuestions
        questions={["one", "two", "three", "four"]}
        disabled={false}
        onPrompt={() => undefined}
      />
    );

    expect(html).toContain("Continue reading");
    expect(html).toContain("agent-related-list");
    expect(html).toContain("agent-related-button");
    expect(html).toContain("one");
    expect(html).toContain("two");
    expect(html).toContain("three");
    expect(html).not.toContain("four");
  });

  it("passes disabled state to question buttons", () => {
    const html = renderToStaticMarkup(
      <AgentRelatedQuestions
        questions={["disabled question"]}
        disabled
        onPrompt={() => undefined}
      />
    );

    expect(html).toContain("disabled");
    expect(html).toContain("disabled question");
  });

  it("renders nothing when no valid task remains", () => {
    const html = renderToStaticMarkup(
      <AgentRelatedQuestions
        questions={[" ", "\n"]}
        disabled={false}
        onPrompt={() => undefined}
      />
    );

    expect(html).toBe("");
  });
});
