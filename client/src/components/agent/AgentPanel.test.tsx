import React, { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentPanel } from "./AgentPanel";
import type { AgentFrameControls } from "./AgentFloatingFrame";
import type { ConversationItem } from "./types";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: translate,
  }),
}));

describe("AgentPanel", () => {
  it("renders desktop complementary panel with welcome prompts", () => {
    const html = renderToStaticMarkup(
      <AgentPanel {...baseProps()} isMobile={false} />
    );

    expect(html).toContain('role="complementary"');
    expect(html).toContain('aria-labelledby="agent-title"');
    expect(html).toContain("Blog assistant");
    expect(html).toContain("Welcome title");
    expect(html).toContain("Welcome body");
    expect(html).toContain("Prompt one");
    expect(html).toContain("Prompt two");
  });

  it("renders mobile dialog semantics", () => {
    const html = renderToStaticMarkup(
      <AgentPanel {...baseProps()} isMobile />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("renders history panel when history is open", () => {
    const conversations: ConversationItem[] = [
      {
        id: "conv-1",
        ownerType: "visitor",
        title: "Prior question",
        scopeType: "post",
        scopeValue: "agent-panel",
        updatedAt: "bad date",
      },
    ];
    const html = renderToStaticMarkup(
      <AgentPanel
        {...baseProps()}
        historyOpen
        conversations={conversations}
        activeConversationId="conv-1"
      />
    );

    expect(html).toContain("History");
    expect(html).toContain("Prior question");
    expect(html).toContain("Visitor");
    expect(html).toContain("No time");
  });
});

function baseProps(): React.ComponentProps<typeof AgentPanel> {
  return {
    isMobile: false,
    panelId: "agent-panel",
    titleId: "agent-title",
    panelRef: createRef<HTMLElement>(),
    draftInputRef: createRef<HTMLTextAreaElement>(),
    bootstrapping: false,
    bootstrapRetrying: false,
    bootstrapError: false,
    currentScope: { type: "post", value: "agent-panel" },
    draft: "",
    messages: [],
    notice: null,
    quota: null,
    contextDraft: "",
    contextOpen: false,
    attachedContextCount: 0,
    attachingContext: false,
    historyOpen: false,
    conversations: [],
    historyLoading: false,
    conversationSwitching: false,
    activeConversationId: undefined,
    suggestedPrompts: ["Prompt one", "Prompt two"],
    welcomeTitle: "Welcome title",
    welcomeBody: "Welcome body",
    sending: false,
    visitorLoading: false,
    frameControls: frameControls(),
    onClose: () => undefined,
    onRetryBootstrap: () => undefined,
    onPanelKeyDown: () => undefined,
    onDraftChange: () => undefined,
    onContextDraftChange: () => undefined,
    onToggleContext: () => undefined,
    onAttachPastedContext: () => undefined,
    onPickContextFile: () => undefined,
    onToggleHistory: () => undefined,
    onLoadConversation: () => undefined,
    onPrompt: () => undefined,
    onSubmit: () => undefined,
    onCancel: () => undefined,
    onContinueAsVisitor: () => undefined,
    messageScrollerRef: createRef<HTMLDivElement>(),
    pendingAssistantFocusRef: { current: null },
  };
}

function frameControls(): AgentFrameControls {
  return {
    isFloating: false,
    onApplyPreset: () => undefined,
    onReset: () => undefined,
  };
}

function translate(key: string, values?: Record<string, string | number>) {
  if (key === "agent.trust.publicScope") {
    return `Public scope: ${values?.scope}`;
  }
  if (key === "agent.context.count") return `${values?.count} attached`;
  return (
    (
      {
        "agent.header.title": "Blog assistant",
        "agent.header.subtitle": "Based on public notes",
        "agent.frame.drag": "Drag",
        "agent.frame.compact": "Compact",
        "agent.frame.comfortable": "Comfortable",
        "agent.frame.wide": "Wide",
        "agent.frame.reset": "Reset",
        "agent.header.close": "Close",
        "agent.scope.post": "Current article",
        "agent.trust.contextPrivate": "Conversation-local context",
        "agent.trust.contextAttached": "Attached context separated",
        "agent.history.button": "History",
        "agent.history.title": "History",
        "agent.history.empty": "No history",
        "agent.history.continue": "Continue",
        "agent.history.noTime": "No time",
        "agent.history.owner.admin": "Owner",
        "agent.history.owner.visitor": "Visitor",
        "agent.history.owner.anonymous": "Anonymous",
        "agent.context.title": "Conversation context",
        "agent.context.toggle": "Attach context",
        "agent.context.placeholder": "Ask about notes",
        "agent.input.placeholder": "Ask the blog",
        "agent.input.send": "Send",
        "agent.input.cancel": "Cancel",
      } satisfies Record<string, string>
    )[key] ?? key
  );
}
