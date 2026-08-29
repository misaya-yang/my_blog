import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentMarkdown } from "./AgentMarkdown";

describe("AgentMarkdown", () => {
  beforeEach(() => vi.stubGlobal("React", React));

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders model-authored CJK math without flooding the console", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const html = renderToStaticMarkup(
      <AgentMarkdown>
        {"$单步能力 \\times 持续收敛 = 长程任务成功$"}
      </AgentMarkdown>
    );

    expect(html).toContain("katex");
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps unlabeled fenced code as a block", () => {
    const html = renderToStaticMarkup(
      <AgentMarkdown>{"```\nconst answer = 42;\n```"}</AgentMarkdown>
    );

    expect(html).toContain("<pre>");
    expect(html).toContain("const answer = 42;");
    expect(html).not.toContain("bg-[var(--surface-inline)]");
  });

  it("does not auto-fetch model-authored remote images", () => {
    const html = renderToStaticMarkup(
      <AgentMarkdown>
        {"![diagram](https://tracker.example/pixel.png)"}
      </AgentMarkdown>
    );

    expect(html).toContain("diagram");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("tracker.example");
  });
});
