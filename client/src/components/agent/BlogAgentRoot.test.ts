import { describe, expect, it, vi } from "vitest";
import {
  BLOG_AGENT_OPEN_EVENT,
  buildRouteContext,
  getCompanionPromptKeys,
  getCompanionWelcomeKeys,
  inferClientScope,
  openBlogAgentWithPrompt,
} from "./routeContext";
import {
  clampAgentFrameState,
  getAgentDisplayElapsedMs,
  getDefaultAgentFrameState,
  getTraceStageDurations,
  inferAnswerMode,
  isBlogAgentHiddenRoute,
} from "./BlogAgentRoot";
import {
  getNextAgentStreamFollowState,
  isAgentNearBottom,
  shouldScrollAgentMessagesToEnd,
} from "./agentScrollPolicy";
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

  it("keeps route context stable when public routes include query or hash state", () => {
    expect(buildRouteContext("/search?q=agent", "en")).toMatchObject({
      path: "/search?q=agent",
      routeType: "search",
      locale: "en",
    });

    expect(
      buildRouteContext("/archive?month=2026-07#timeline", "zh")
    ).toMatchObject({
      path: "/archive?month=2026-07#timeline",
      routeType: "archive",
      locale: "zh",
    });

    expect(buildRouteContext("/tags/rlhf?page=2", "en")).toMatchObject({
      path: "/tags/rlhf?page=2",
      routeType: "tag",
      tagSlug: "rlhf",
    });

    expect(
      buildRouteContext("/post/agent-loop-observable#trace", "en")
    ).toMatchObject({
      path: "/post/agent-loop-observable#trace",
      routeType: "post",
      postSlug: "agent-loop-observable",
    });
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

  it("prefers final elapsed time over cumulative trace status values", () => {
    expect(
      getAgentDisplayElapsedMs({
        id: "assistant-1",
        role: "assistant",
        content: "Done",
        finalElapsedMs: 8420,
        traceEntries: [
          { stage: "retrieval", elapsedMs: 1200 },
          { stage: "saving", elapsedMs: 2300 },
        ],
      })
    ).toBe(8420);
  });

  it("derives clamped stage durations from cumulative trace events", () => {
    expect(
      getTraceStageDurations([
        { stage: "understanding", elapsedMs: 100 },
        { stage: "retrieval", elapsedMs: 450 },
        { stage: "saving", elapsedMs: 425 },
        { stage: "answer", elapsedMs: 700 },
      ]).map(entry => ({
        stage: entry.stage,
        durationMs: entry.durationMs,
      }))
    ).toEqual([
      { stage: "understanding", durationMs: 100 },
      { stage: "saving", durationMs: 325 },
      { stage: "retrieval", durationMs: 25 },
      { stage: "answer", durationMs: 250 },
    ]);
  });

  it("keeps the desktop frame inside the viewport", () => {
    expect(
      clampAgentFrameState(
        { width: 900, height: 900, x: -200, y: 1200 },
        { width: 800, height: 700 }
      )
    ).toMatchObject({
      width: 768,
      height: 668,
      x: 16,
      y: 16,
    });

    expect(getDefaultAgentFrameState({ width: 1440, height: 900 })).toEqual({
      width: 520,
      height: 680,
      x: 896,
      y: 124,
      preset: "comfortable",
    });
  });

  it("only follows streaming output when the reader is near the bottom", () => {
    const nearBottom = {
      scrollHeight: 1200,
      scrollTop: 680,
      clientHeight: 440,
    } as HTMLElement;
    const awayFromBottom = {
      scrollHeight: 1200,
      scrollTop: 320,
      clientHeight: 440,
    } as HTMLElement;

    expect(isAgentNearBottom(nearBottom)).toBe(true);
    expect(isAgentNearBottom(awayFromBottom)).toBe(false);
    expect(
      getNextAgentStreamFollowState({
        event: "stream_status",
        scroller: nearBottom,
      })
    ).toBe(true);
    expect(
      getNextAgentStreamFollowState({
        event: "answer_delta",
        scroller: awayFromBottom,
      })
    ).toBe(false);
  });

  it("starts following on submit but stops after final or failed events", () => {
    const nearBottom = {
      scrollHeight: 1200,
      scrollTop: 680,
      clientHeight: 440,
    } as HTMLElement;

    expect(
      getNextAgentStreamFollowState({
        event: "submit",
        scroller: null,
      })
    ).toBe(true);
    expect(
      getNextAgentStreamFollowState({
        event: "final",
        scroller: nearBottom,
      })
    ).toBe(false);
    expect(
      getNextAgentStreamFollowState({
        event: "failed",
        scroller: nearBottom,
      })
    ).toBe(false);
  });

  it("scrolls message viewport only while streaming and following", () => {
    expect(
      shouldScrollAgentMessagesToEnd({
        streaming: true,
        shouldFollowStream: true,
      })
    ).toBe(true);
    expect(
      shouldScrollAgentMessagesToEnd({
        streaming: true,
        shouldFollowStream: false,
      })
    ).toBe(false);
    expect(
      shouldScrollAgentMessagesToEnd({
        streaming: false,
        shouldFollowStream: true,
      })
    ).toBe(false);
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
