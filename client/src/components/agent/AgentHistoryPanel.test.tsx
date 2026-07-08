import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  AgentHistoryPanel,
  formatConversationTime,
  getConversationOwnerLabel,
} from "./AgentHistoryPanel";
import type { ConversationItem } from "./types";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: translate,
  }),
}));

describe("AgentHistoryPanel", () => {
  it("renders the empty history state", () => {
    const html = renderToStaticMarkup(
      <AgentHistoryPanel
        conversations={[]}
        loading={false}
        onLoadConversation={() => undefined}
      />
    );

    expect(html).toContain("History");
    expect(html).toContain("No history yet");
  });

  it("renders active conversations with owner and fallback title labels", () => {
    const conversations: ConversationItem[] = [
      {
        id: "conv-1",
        title: null,
        scopeType: "post",
        scopeValue: "agent-loop",
        ownerType: "visitor",
        updatedAt: "bad date",
      },
      {
        id: "conv-2",
        title: "Existing conversation",
        scopeType: "site",
        scopeValue: null,
        ownerType: "admin",
        updatedAt: "2026-07-09T00:00:00.000Z",
      },
    ];

    const html = renderToStaticMarkup(
      <AgentHistoryPanel
        conversations={conversations}
        loading
        activeConversationId="conv-1"
        onLoadConversation={() => undefined}
      />
    );

    expect(html).toContain("Continue");
    expect(html).toContain("agent-loop");
    expect(html).toContain("Visitor");
    expect(html).toContain("Existing conversation");
    expect(html).toContain("Owner");
    expect(html).toContain("No time");
    expect(html).toContain("border-slate-500 bg-slate-900");
    expect(html).toContain("animate-spin");
  });

  it("formats owner labels and invalid times through localized fallbacks", () => {
    expect(getConversationOwnerLabel("admin", translate)).toBe("Owner");
    expect(getConversationOwnerLabel("visitor", translate)).toBe("Visitor");
    expect(getConversationOwnerLabel("anonymous", translate)).toBe("Anonymous");
    expect(getConversationOwnerLabel(undefined, translate)).toBe("Anonymous");
    expect(formatConversationTime(null, translate)).toBe("No time");
    expect(formatConversationTime("not a date", translate)).toBe("No time");
  });
});

function translate(key: string) {
  return (
    (
      {
        "agent.history.title": "History",
        "agent.history.empty": "No history yet",
        "agent.history.continue": "Continue",
        "agent.history.noTime": "No time",
        "agent.history.owner.admin": "Owner",
        "agent.history.owner.visitor": "Visitor",
        "agent.history.owner.anonymous": "Anonymous",
      } satisfies Record<string, string>
    )[key] ?? key
  );
}
