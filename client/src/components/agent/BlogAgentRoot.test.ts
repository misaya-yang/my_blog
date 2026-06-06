import { describe, expect, it, vi } from "vitest";
import {
  BLOG_AGENT_OPEN_EVENT,
  buildRouteContext,
  getCompanionPromptKeys,
  getCompanionWelcomeKeys,
  inferClientScope,
  openBlogAgentWithPrompt,
} from "./routeContext";
import { streamAgentMessage } from "./streamClient";

describe("BlogAgent route context", () => {
  it("infers post scope from article routes", () => {
    const context = buildRouteContext("/post/agent-harness-engine", "en");

    expect(context).toMatchObject({
      path: "/post/agent-harness-engine",
      routeType: "post",
      postSlug: "agent-harness-engine",
      locale: "en",
    });
    expect(inferClientScope(context)).toEqual({
      type: "post",
      value: "agent-harness-engine",
    });
  });

  it("infers AI application track scope", () => {
    const context = buildRouteContext("/applications", "zh");

    expect(context).toMatchObject({
      routeType: "track",
      trackSlug: "ai-applications",
      locale: "zh",
    });
    expect(inferClientScope(context)).toEqual({
      type: "track",
      value: "ai-applications",
    });
  });

  it("falls back to site scope for public pages without a tighter scope", () => {
    const context = buildRouteContext("/archive", "en");

    expect(context.routeType).toBe("archive");
    expect(inferClientScope(context)).toEqual({ type: "site" });
  });

  it("returns distinct companion prompt sets by route type", () => {
    const postContext = buildRouteContext(
      "/post/agent-loop-observable-tool-using-agents",
      "en"
    );
    const applicationsContext = buildRouteContext("/applications", "en");
    const algorithmsContext = buildRouteContext("/algorithms", "en");

    expect(getCompanionPromptKeys(postContext)).toContain(
      "agent.prompts.postAbstraction"
    );
    expect(getCompanionPromptKeys(postContext)).toContain(
      "agent.prompts.nextReading"
    );
    expect(getCompanionPromptKeys(applicationsContext)).toContain(
      "agent.prompts.applicationsPath"
    );
    expect(getCompanionPromptKeys(algorithmsContext)).toContain(
      "agent.prompts.algorithmsMap"
    );
    expect(getCompanionPromptKeys(postContext)).not.toEqual(
      getCompanionPromptKeys(applicationsContext)
    );
  });

  it("uses article and track welcome copy keys", () => {
    expect(
      getCompanionWelcomeKeys(buildRouteContext("/post/agent-loop", "en"))
    ).toEqual({
      titleKey: "agent.welcome.postTitle",
      bodyKey: "agent.welcome.postBody",
    });
    expect(
      getCompanionWelcomeKeys(buildRouteContext("/applications", "en"))
    ).toEqual({
      titleKey: "agent.welcome.trackTitle",
      bodyKey: "agent.welcome.trackBody",
    });
  });

  it("dispatches an open event with an article prompt", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });

    openBlogAgentWithPrompt("Explain the core abstraction.");

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(BLOG_AGENT_OPEN_EVENT);
    expect(event.detail).toEqual({
      prompt: "Explain the core abstraction.",
    });

    vi.unstubAllGlobals();
  });

  it("aborts an in-flight stream when cancellation is requested", async () => {
    const controller = new AbortController();
    vi.stubGlobal("window", {
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        });
      })
    );

    const promise = streamAgentMessage({
      message: "Explain AgentLoop",
      routeContext: buildRouteContext("/", "en"),
      signal: controller.signal,
      onStatus: vi.fn(),
      onReasoningDelta: vi.fn(),
      onAnswerDelta: vi.fn(),
      onFinal: vi.fn(),
    });

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/agent/stream",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );

    vi.unstubAllGlobals();
  });
});
