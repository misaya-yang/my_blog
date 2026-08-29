import { describe, expect, it, vi } from "vitest";
import {
  BLOG_AGENT_OPEN_EVENT,
  buildRouteContext,
  getCompanionPromptKeys,
  inferClientScope,
  openBlogAgentWithPrompt,
} from "./routeContext";
import {
  getDisplayRelevanceReason,
  inferAnswerMode,
  isAgentNearBottom,
  isBlogAgentHiddenRoute,
  shouldClearAgentDraft,
  shouldFinalizeAgentStream,
} from "./BlogAgentRoot";
import {
  AGENT_STREAM_TIMEOUT_MS,
  isAbortError,
  isTimeoutError,
  streamAgentMessage,
} from "./streamClient";

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

  it("carries the current post title through the route context", () => {
    const context = buildRouteContext(
      "/post/agent-harness-engine",
      "zh",
      "Agent Harness 工程实践"
    );
    const untitledContext = buildRouteContext(
      "/post/agent-harness-engine",
      "zh"
    );

    expect(context).toMatchObject({
      routeType: "post",
      postSlug: "agent-harness-engine",
      postTitle: "Agent Harness 工程实践",
    });
    expect(untitledContext).toMatchObject({ routeType: "post" });
    if (untitledContext.routeType === "post") {
      expect(untitledContext.postTitle).toBeUndefined();
    }
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
      "agent.prompts.postCoreWithTitle"
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

  it("hides the public Blog Agent on owner and auth routes only", () => {
    expect(isBlogAgentHiddenRoute("/manage")).toBe(true);
    expect(isBlogAgentHiddenRoute("/manage/agent")).toBe(true);
    expect(isBlogAgentHiddenRoute("/manage?tab=index")).toBe(true);
    expect(isBlogAgentHiddenRoute("/write")).toBe(true);
    expect(isBlogAgentHiddenRoute("/write?draft=1")).toBe(true);
    expect(isBlogAgentHiddenRoute("/login")).toBe(true);
    expect(isBlogAgentHiddenRoute("/login?reason=expired")).toBe(true);

    expect(isBlogAgentHiddenRoute("/")).toBe(false);
    expect(isBlogAgentHiddenRoute("/archive")).toBe(false);
    expect(isBlogAgentHiddenRoute("/post/agent-loop")).toBe(false);
    expect(isBlogAgentHiddenRoute("/managed-reading-notes")).toBe(false);
  });

  it("infers answer mode from companion prompt intent", () => {
    expect(inferAnswerMode("Compare Harness Engine and Agent Loop")).toBe(
      "compare"
    );
    expect(inferAnswerMode("What should I read next?")).toBe("reading_path");
    expect(inferAnswerMode("What implementation implications matter?")).toBe(
      "deep"
    );
    expect(inferAnswerMode("Summarize the notebook")).toBe("summary");
    expect(
      inferAnswerMode(
        "Explain the core abstraction.",
        buildRouteContext("/post/agent-loop", "en")
      )
    ).toBe("deep");
  });

  it("only follows streaming output when the reader is near the bottom", () => {
    expect(
      isAgentNearBottom({
        scrollHeight: 1200,
        scrollTop: 680,
        clientHeight: 440,
      } as HTMLElement)
    ).toBe(true);
    expect(
      isAgentNearBottom({
        scrollHeight: 1200,
        scrollTop: 320,
        clientHeight: 440,
      } as HTMLElement)
    ).toBe(false);
  });

  it("only finalizes the controller that still owns the active stream", () => {
    const completed = new AbortController();
    const replacement = new AbortController();

    expect(shouldFinalizeAgentStream(completed, completed)).toBe(true);
    expect(shouldFinalizeAgentStream(replacement, completed)).toBe(false);
    expect(shouldFinalizeAgentStream(null, completed)).toBe(false);
  });

  it("clears the retried prompt but preserves a newly edited draft", () => {
    expect(
      shouldClearAgentDraft(
        "Explain retry persistence",
        "Explain retry persistence",
        true
      )
    ).toBe(true);
    expect(
      shouldClearAgentDraft(
        "A different follow-up draft",
        "Explain retry persistence",
        true
      )
    ).toBe(false);
    expect(shouldClearAgentDraft("Any draft", "New message", false)).toBe(true);
  });

  it("removes stale current-page source prefixes after route changes", () => {
    const source = {
      sourceId: "post:agent-loop:1",
      postTitle: "Agent Loop",
      postSlug: "agent-loop",
      tagSlugs: [],
      excerpt: "Loop details",
      relevanceReason: "Current public article context. Matched loop terms.",
    };
    const translate = (key: string) =>
      key === "agent.sources.currentPage" ? "Current page" : "Blog";

    expect(getDisplayRelevanceReason(source, false, translate)).toBe(
      "Matched loop terms."
    );
    expect(
      getDisplayRelevanceReason(
        { ...source, relevanceReason: "Current public article context." },
        true,
        translate
      )
    ).toBe("Current page");
    expect(
      getDisplayRelevanceReason(
        { ...source, relevanceReason: "Current public article context." },
        false,
        translate
      )
    ).toBe("Blog");
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

  it("waits for the final stream event when an error frame arrives first", async () => {
    const onFinal = vi.fn();
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'data: {"type":"error","message":"model_not_configured"}',
              "",
              'data: {"type":"final","elapsedMs":12,"output":{"status":"failed","conversationId":"conv-1","messageId":"msg-1","quota":{"limit":10,"used":1,"remaining":9,"resetAt":"2026-06-06T16:00:00.000Z","tier":"anonymous","allowed":true},"runStatus":"failed","errorCode":"model_not_configured"}}',
              "",
            ].join("\n")
          )
        );
        controller.close();
      },
    });
    vi.stubGlobal("window", {
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body, { status: 200 }))
    );

    await expect(
      streamAgentMessage({
        message: "解释这篇文章里的核心机制。",
        routeContext: buildRouteContext("/", "zh"),
        onStatus: vi.fn(),
        onAnswerDelta: vi.fn(),
        onFinal,
      })
    ).resolves.toBeUndefined();

    expect(onFinal).toHaveBeenCalledWith(
      expect.objectContaining({
        output: expect.objectContaining({
          status: "failed",
          errorCode: "model_not_configured",
        }),
      })
    );

    vi.unstubAllGlobals();
  });

  it("sends inferred answer mode through the stream request body", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'data: {"type":"final","elapsedMs":9,"output":{"status":"failed","conversationId":"conv-1","messageId":"msg-1","quota":{"limit":10,"used":1,"remaining":9,"resetAt":"2026-06-06T16:00:00.000Z","tier":"anonymous","allowed":true},"runStatus":"failed","errorCode":"model_not_configured"}}',
              "",
            ].join("\n")
          )
        );
        controller.close();
      },
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    vi.stubGlobal("window", {
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal("fetch", fetchMock);

    await streamAgentMessage({
      message: "Compare the two tracks",
      routeContext: buildRouteContext("/", "en"),
      answerMode: "compare",
      onStatus: vi.fn(),
      onAnswerDelta: vi.fn(),
      onFinal: vi.fn(),
    });

    const requestBody = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body)
    );
    expect(requestBody.answerMode).toBe("compare");

    vi.unstubAllGlobals();
  });

  it("sends retry identity and exposes persisted turn ids from status", async () => {
    const onStatus = vi.fn();
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'data: {"type":"status","stage":"understanding","elapsedMs":2,"conversationId":"conv-1","userMessageId":"user-1"}',
              "",
              'data: {"type":"final","elapsedMs":9,"output":{"status":"failed","conversationId":"conv-1","userMessageId":"user-1","messageId":"msg-1","quota":{"limit":10,"used":1,"remaining":9,"resetAt":"2026-06-06T16:00:00.000Z","tier":"anonymous","allowed":true},"runStatus":"failed","errorCode":"agent_generation_failed"}}',
              "",
            ].join("\n")
          )
        );
        controller.close();
      },
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    vi.stubGlobal("fetch", fetchMock);

    await streamAgentMessage({
      conversationId: "conv-1",
      retryUserMessageId: "user-1",
      message: "Retry the same turn",
      routeContext: buildRouteContext("/", "en"),
      onStatus,
      onAnswerDelta: vi.fn(),
      onFinal: vi.fn(),
    });

    expect(onStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conv-1",
        userMessageId: "user-1",
      })
    );
    const requestBody = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body)
    );
    expect(requestBody).toMatchObject({
      conversationId: "conv-1",
      retryUserMessageId: "user-1",
      message: "Retry the same turn",
    });

    vi.unstubAllGlobals();
  });

  it("passes explicit quota block stream outcome to final handlers", async () => {
    const onFinal = vi.fn();
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'data: {"type":"final","elapsedMs":7,"outcome":"blocked","reason":"quota","output":{"status":"blocked","reason":"quota","quota":{"limit":10,"used":10,"remaining":0,"resetAt":"2026-06-06T16:00:00.000Z","tier":"anonymous","allowed":false}}}',
              "",
            ].join("\n")
          )
        );
        controller.close();
      },
    });
    vi.stubGlobal("window", {
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body, { status: 200 }))
    );

    await streamAgentMessage({
      message: "Explain AgentLoop",
      routeContext: buildRouteContext("/", "en"),
      onStatus: vi.fn(),
      onAnswerDelta: vi.fn(),
      onFinal,
    });

    expect(onFinal).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "blocked",
        reason: "quota",
        output: expect.objectContaining({ status: "blocked" }),
      })
    );

    vi.unstubAllGlobals();
  });

  it("passes explicit no-source stream outcome to final handlers", async () => {
    const onFinal = vi.fn();
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'data: {"type":"status","stage":"sources","elapsedMs":3,"sourceCount":0}',
              "",
              'data: {"type":"final","elapsedMs":11,"outcome":"no_source","reason":"no_public_source","output":{"status":"completed","conversationId":"conv-1","messageId":"msg-1","answer":{"answerMarkdown":"No public source found.","answerType":"refusal","refusalReason":"no_public_source"},"sourceCards":[],"relatedQuestions":[],"quota":{"limit":10,"used":1,"remaining":9,"resetAt":"2026-06-06T16:00:00.000Z","tier":"anonymous","allowed":true},"runStatus":"completed"}}',
              "",
            ].join("\n")
          )
        );
        controller.close();
      },
    });
    vi.stubGlobal("window", {
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body, { status: 200 }))
    );

    await streamAgentMessage({
      message: "Explain hidden notes",
      routeContext: buildRouteContext("/", "en"),
      onStatus: vi.fn(),
      onAnswerDelta: vi.fn(),
      onFinal,
    });

    expect(onFinal).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "no_source",
        reason: "no_public_source",
        output: expect.objectContaining({
          answer: expect.objectContaining({
            refusalReason: "no_public_source",
          }),
          sourceCards: [],
        }),
      })
    );

    vi.unstubAllGlobals();
  });

  it("rejects incomplete streams that close before a final event", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            ['data: {"type":"answer_delta","delta":"Partial answer"}', ""].join(
              "\n"
            )
          )
        );
        controller.close();
      },
    });
    vi.stubGlobal("window", {
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body, { status: 200 }))
    );

    await expect(
      streamAgentMessage({
        message: "Explain AgentLoop",
        routeContext: buildRouteContext("/", "en"),
        onStatus: vi.fn(),
        onAnswerDelta: vi.fn(),
        onFinal: vi.fn(),
      })
    ).rejects.toThrow("agent_stream_incomplete");

    vi.unstubAllGlobals();
  });

  it("aborts stalled streams after the configured timeout", async () => {
    vi.useFakeTimers();
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
            () => reject(init.signal?.reason),
            { once: true }
          );
        });
      })
    );

    try {
      const promise = streamAgentMessage({
        message: "Explain AgentLoop",
        routeContext: buildRouteContext("/", "en"),
        onStatus: vi.fn(),
        onAnswerDelta: vi.fn(),
        onFinal: vi.fn(),
      });
      const expectation = expect(promise).rejects.toMatchObject({
        name: "TimeoutError",
      });

      await vi.advanceTimersByTimeAsync(AGENT_STREAM_TIMEOUT_MS);
      await expectation;
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("distinguishes user cancellation from timeout cancellation", () => {
    expect(isAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
    expect(isTimeoutError(new DOMException("Timed out", "TimeoutError"))).toBe(
      true
    );
    expect(isAbortError(new DOMException("Timed out", "TimeoutError"))).toBe(
      false
    );
  });
});
