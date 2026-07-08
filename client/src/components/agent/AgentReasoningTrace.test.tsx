import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentReasoningTrace } from "./AgentReasoningTrace";
import type { ChatMessage } from "./types";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string, vars?: Record<string, string | number>) => {
      if (key === "agent.trace.thinking") return "Thinking";
      if (key === "agent.trace.done") return "Done";
      if (key === "agent.trace.elapsed") return `${vars?.seconds}s`;
      if (key === "agent.trace.currentPage") return "current page";
      if (key === "agent.trace.stage.sources") {
        const current = vars?.current ? ` ${vars.current}` : "";
        return `${vars?.count} sources${current}`;
      }
      if (key === "agent.trace.stage.retrieval") return "Retrieval";
      if (key === "agent.trace.stage.answer") return "Answer";
      return key;
    },
  }),
}));

describe("AgentReasoningTrace", () => {
  it("renders nothing for user messages", () => {
    expect(
      renderToStaticMarkup(
        <AgentReasoningTrace
          message={{
            id: "user-1",
            role: "user",
            content: "Question",
          }}
        />
      )
    ).toBe("");
  });

  it("renders streaming traces open with the thinking label", () => {
    const html = renderToStaticMarkup(
      <AgentReasoningTrace
        message={{
          id: "assistant-1",
          role: "assistant",
          content: "",
          streaming: true,
          traceEntries: [{ stage: "retrieval", elapsedMs: 1200 }],
        }}
      />
    );

    expect(html).toContain("<details");
    expect(html).toContain('open=""');
    expect(html).toContain("Thinking");
    expect(html).toContain("Retrieval");
    expect(html).toContain("1.2s");
    expect(html).toContain("animate-spin");
  });

  it("prefers final elapsed time for the trace summary", () => {
    const html = renderTrace({
      finalElapsedMs: 8420,
      traceEntries: [
        { stage: "retrieval", elapsedMs: 1200 },
        { stage: "answer", elapsedMs: 2300 },
      ],
    });

    expect(html).toContain("Done");
    expect(html).toContain("8.4s");
    expect(html).not.toContain("2.3s");
  });

  it("renders source-count trace stage with current-page context", () => {
    const html = renderTrace({
      traceEntries: [
        {
          stage: "sources",
          elapsedMs: 900,
          sourceCount: 2,
          currentPageContextInjected: true,
        },
      ],
    });

    expect(html).toContain("2 sources current page");
  });
});

function renderTrace(message: Partial<ChatMessage>) {
  return renderToStaticMarkup(
    <AgentReasoningTrace
      message={{
        id: "assistant-1",
        role: "assistant",
        content: "Answer",
        ...message,
      }}
    />
  );
}
