import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentRelatedQuestions } from "./AgentRelatedQuestions";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      (
        {
          "agent.related.title": "Related questions",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

describe("AgentRelatedQuestions", () => {
  it("renders title and the first three related questions", () => {
    const html = renderToStaticMarkup(
      <AgentRelatedQuestions
        questions={["one", "two", "three", "four"]}
        disabled={false}
        onPrompt={() => undefined}
      />
    );

    expect(html).toContain("Related questions");
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
});
