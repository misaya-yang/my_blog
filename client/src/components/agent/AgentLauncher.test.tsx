import React from "react";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AgentLauncher } from "./AgentLauncher";

describe("AgentLauncher", () => {
  it("renders closed launcher attributes and label", () => {
    const html = renderToStaticMarkup(
      <AgentLauncher
        buttonRef={createRef<HTMLButtonElement>()}
        open={false}
        lowQuota={false}
        label="Blog assistant"
        tooltip="Open assistant"
        controls="blog-agent-panel"
        onClick={() => undefined}
      />
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="blog-agent-panel"');
    expect(html).toContain('aria-label="Blog assistant"');
    expect(html).toContain('title="Open assistant"');
    expect(html).toContain("Blog assistant");
    expect(html).toContain("lucide-book-open");
    expect(html).not.toContain("rounded-full bg-slate-400");
  });

  it("renders open launcher close icon and low quota dot", () => {
    const html = renderToStaticMarkup(
      <AgentLauncher
        buttonRef={createRef<HTMLButtonElement>()}
        open
        lowQuota
        label="Blog assistant"
        tooltip="Close assistant"
        controls="blog-agent-panel"
        onClick={() => undefined}
      />
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("lucide-x");
    expect(html).toContain("rounded-full bg-slate-400");
    expect(html).toContain('aria-hidden="true"');
  });
});
