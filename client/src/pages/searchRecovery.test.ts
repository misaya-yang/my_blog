import { describe, expect, it, vi } from "vitest";
import { BLOG_AGENT_OPEN_EVENT } from "@/components/agent/routeContext";
import {
  buildSearchRecoveryAgentPrompt,
  getRecoveryTopics,
  openSearchRecoveryAgent,
} from "./searchRecovery";

describe("search recovery", () => {
  it("prioritizes nearby topics for mixed reader queries", () => {
    const topics = getRecoveryTopics("帮我找 iso 残差稳定性");

    expect(topics[0]).toMatchObject({
      query: "IsoHC",
      href: "/search?q=IsoHC",
    });
  });

  it("opens the reader with a query-aware recovery prompt", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", {
      dispatchEvent,
      location: { pathname: "/search", search: "?q=missing" },
    });
    vi.stubGlobal("navigator", {});

    openSearchRecoveryAgent("missing topic", "zh");

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(BLOG_AGENT_OPEN_EVENT);
    expect(event.detail.prompt).toContain("missing topic");
    expect(event.detail.prompt).toContain("公开笔记");

    vi.unstubAllGlobals();
  });

  it("builds English recovery prompts without changing the query", () => {
    expect(buildSearchRecoveryAgentPrompt("Agent memory", "en")).toContain(
      '"Agent memory"'
    );
  });
});
