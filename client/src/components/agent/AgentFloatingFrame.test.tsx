import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentFloatingFrame } from "./AgentFloatingFrame";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      (
        {
          "agent.frame.drag": "Drag panel",
          "agent.frame.resize": "Resize panel",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

describe("AgentFloatingFrame", () => {
  it("renders the mobile sheet wrapper with non-floating controls", () => {
    const html = renderToStaticMarkup(
      <AgentFloatingFrame isMobile>
        {controls => (
          <div>
            mobile:{String(controls.isFloating)}
            {controls.resizeHandle ? "resize" : "no-resize"}
          </div>
        )}
      </AgentFloatingFrame>
    );

    expect(html).toContain("agent-modal-frame");
    expect(html).toContain("mobile:false");
    expect(html).toContain("no-resize");
  });

  it("renders the desktop floating frame with drag and resize controls", () => {
    const html = renderToStaticMarkup(
      <AgentFloatingFrame isMobile={false}>
        {controls => (
          <div>
            desktop:{String(controls.isFloating)}
            preset:{controls.activePreset}
            drag:{controls.dragHandleProps?.title}
            {controls.resizeHandle}
          </div>
        )}
      </AgentFloatingFrame>
    );

    expect(html).toContain("agent-floating-frame");
    expect(html).toContain("desktop:true");
    expect(html).toContain("preset:comfortable");
    expect(html).toContain("drag:Drag panel");
    expect(html).toContain("Resize panel");
    expect(html).toContain("agent-frame-resize-handle");
  });
});
