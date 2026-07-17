import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  AgentContextDock,
  AgentTrustBoundary,
} from "./AgentContextSurfaces";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: translate,
  }),
}));

describe("AgentContextSurfaces", () => {
  it("renders collapsed context state with attached count", () => {
    const html = renderToStaticMarkup(
      <AgentContextDock
        panelId="agent-context"
        open={false}
        value=""
        count={2}
        attaching={false}
        disabled={false}
        onChange={() => undefined}
        onToggle={() => undefined}
        onAttach={() => undefined}
        onPickFile={() => undefined}
      />
    );

    expect(html).toContain("Conversation context");
    expect(html).toContain("2 attached");
    expect(html).not.toContain("Paste notes");
    expect(html).toContain('aria-label="2 attached"');
  });

  it("renders open context controls and limit hint", () => {
    const html = renderToStaticMarkup(
      <AgentContextDock
        panelId="agent-context"
        open
        value=""
        count={0}
        attaching={false}
        disabled={false}
        onChange={() => undefined}
        onToggle={() => undefined}
        onAttach={() => undefined}
        onPickFile={() => undefined}
      />
    );

    expect(html).toContain("Paste notes");
    expect(html).toContain("Attach file");
    expect(html).toContain("Attach");
    expect(html).toContain("20k characters");
    expect(html).toContain('id="agent-context"');
    expect(html).toContain('aria-labelledby="agent-context-title"');
  });

  it("renders attached context loading and lifecycle hint", () => {
    const html = renderToStaticMarkup(
      <AgentContextDock
        panelId="agent-context"
        open
        value="private note"
        count={1}
        attaching
        disabled={false}
        onChange={() => undefined}
        onToggle={() => undefined}
        onAttach={() => undefined}
        onPickFile={() => undefined}
      />
    );

    expect(html).toContain("1 attached");
    expect(html).toContain("stays with this conversation");
    expect(html).toContain("animate-spin");
  });

  it("renders trust boundary details for public and attached context", () => {
    const privateHtml = renderToStaticMarkup(
      <AgentTrustBoundary
        scopeLabel="Current article"
        attachedContextCount={0}
      />
    );
    const attachedHtml = renderToStaticMarkup(
      <AgentTrustBoundary scopeLabel="Site" attachedContextCount={1} />
    );

    expect(privateHtml).toContain("Public scope: Current article");
    expect(privateHtml).toContain("conversation-local");
    expect(privateHtml).not.toContain("agent-trust-boundary-attached");
    expect(attachedHtml).toContain("Public scope: Site · 1 attached");
    expect(attachedHtml).toContain("source cards stay separated");
    expect(attachedHtml).not.toContain("open=");
    expect(attachedHtml).toContain("agent-trust-boundary-attached");
  });
});

function translate(key: string, values?: Record<string, string | number>) {
  if (key === "agent.context.count") return `${values?.count} attached`;
  if (key === "agent.trust.publicScope") {
    return `Public scope: ${values?.scope}`;
  }
  return (
    (
      {
        "agent.context.title": "Conversation context",
        "agent.context.close": "Close context",
        "agent.context.inputLabel": "Context text",
        "agent.context.active": "Active",
        "agent.context.supported": "Paste notes",
        "agent.context.placeholder": "Context placeholder",
        "agent.context.file": "Attach file",
        "agent.context.fileLabel": "Attach a text file",
        "agent.context.attach": "Attach",
        "agent.context.limit": "Text is limited to 20k characters.",
        "agent.context.lifecycle": "Attached context stays with this conversation.",
        "agent.trust.contextPrivate":
          "Private context stays conversation-local.",
        "agent.trust.contextAttached": "Public source cards stay separated.",
      } satisfies Record<string, string>
    )[key] ?? key
  );
}
