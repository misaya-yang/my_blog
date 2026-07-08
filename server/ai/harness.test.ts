import { describe, expect, it, vi } from "vitest";
import { createMemoryConversationStore } from "./conversations";
import { createMemoryContextSourceStore } from "./contextSources";
import { buildAgentContext, createAgentService } from "./harness";
import { createMemoryQuotaStore } from "./quota";
import type { BlogSession } from "../auth";
import type { AgentContext, AgentModel, AgentStreamEvent } from "./types";
import type { KnowledgeSearchResult } from "./knowledge";

const routeContext = {
  path: "/applications",
  routeType: "track" as const,
  trackSlug: "ai-applications" as const,
};

const source: KnowledgeSearchResult = {
  chunkType: "post_chunk",
  postId: 1,
  postSlug: "agent-harness",
  postTitle: "Agent Harness Engine",
  categorySlug: "ai-applications",
  tagSlugs: ["harness-engine"],
  statusSnapshot: "published",
  visibilitySnapshot: "public",
  locale: "en",
  chunkIndex: 1,
  heading: "Evaluation Protocol",
  sectionPath: "Evaluation Protocol",
  content:
    "Harness engines evaluate tool-using agents under controlled context.",
  summary: null,
  keywords: ["harness", "agent"],
  contentHash: "hash",
  tokenEstimate: 24,
  sourceId: "post:agent-harness:1",
  score: 10,
  excerpt:
    "Harness engines evaluate tool-using agents under controlled context.",
  relevanceReason: "Matches harness and agent terms.",
};

const isohcSource: KnowledgeSearchResult = {
  ...source,
  postId: 2,
  postSlug: "isohc-fixed-vector-isometric-residual-mixing",
  postTitle: "IsoHC: Fixed-Vector Isometric Residual Mixing",
  categorySlug: "ai-algorithms",
  tagSlugs: ["isohc", "residual-stability"],
  heading: "Residual Stability",
  content:
    "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold.",
  sourceId: "post:isohc-fixed-vector-isometric-residual-mixing:1",
  excerpt:
    "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold.",
  relevanceReason: "Matches IsoHC residual stability terms.",
};

const siteOverviewSource: KnowledgeSearchResult = {
  ...source,
  chunkType: "site_overview_chunk",
  postId: null,
  postSlug: null,
  postTitle: null,
  categorySlug: null,
  tagSlugs: ["agent-systems", "isohc", "gated-ffn"],
  chunkIndex: 0,
  heading: "Public blog map",
  sectionPath: "site",
  content: [
    "Public blog knowledge map.",
    "Public posts:",
    "- Agent Harness Engine (agent-harness) [ai-applications]",
    "- IsoHC: Fixed-Vector Isometric Residual Mixing (isohc-fixed-vector-isometric-residual-mixing) [ai-algorithms]",
    "- Gated FFN: Transformer 里的乘法通道 (gated-ffn-multiplicative-channel-control) [ai-algorithms]",
  ].join("\n"),
  summary: "A compact map of public posts.",
  sourceId: "site_overview_chunk:0",
  excerpt: [
    "Public posts:",
    "- Agent Harness Engine (agent-harness) [ai-applications]",
    "- IsoHC: Fixed-Vector Isometric Residual Mixing (isohc-fixed-vector-isometric-residual-mixing) [ai-algorithms]",
    "- Gated FFN: Transformer 里的乘法通道 (gated-ffn-multiplicative-channel-control) [ai-algorithms]",
  ].join("\n"),
  relevanceReason: "Public blog inventory. Matched public article list intent.",
};

function anonymousContext(ip = "203.0.113.1"): AgentContext {
  return {
    req: {
      headers: {
        "x-forwarded-for": ip,
        "user-agent": "vitest",
      },
    },
    session: {
      isAuthenticated: false,
      isAdmin: false,
      role: "anonymous",
      displayName: null,
    },
  };
}

function visitorContext(): AgentContext {
  const session: BlogSession = {
    isAuthenticated: true,
    isAdmin: false,
    role: "visitor",
    displayName: "Reader",
    visitorId: "visitor-1",
  };
  return {
    req: {
      headers: {
        "x-forwarded-for": "203.0.113.2",
        "user-agent": "vitest",
      },
    },
    session,
  };
}

function visitorContextWithId(visitorId: string): AgentContext {
  const session: BlogSession = {
    isAuthenticated: true,
    isAdmin: false,
    role: "visitor",
    displayName: `Reader ${visitorId}`,
    visitorId,
  };
  return {
    req: {
      headers: {
        "x-forwarded-for": "203.0.113.20",
        "user-agent": "vitest",
      },
    },
    session,
  };
}

function adminContext(): AgentContext {
  return {
    req: {
      headers: { "x-forwarded-for": "203.0.113.88", "user-agent": "vitest" },
    },
    session: {
      isAuthenticated: true,
      isAdmin: true,
      role: "admin",
      displayName: "Misaya Yang",
    },
  };
}

function createHarness(
  overrides: Partial<Parameters<typeof createAgentService>[0]> = {}
) {
  const conversationStore = createMemoryConversationStore();
  const contextSourceStore = createMemoryContextSourceStore();
  const retrieve = vi.fn(async () => [source]);
  const model: AgentModel = {
    generate: vi.fn(async () => ({
      inputTokens: 120,
      outputTokens: 80,
      model: "test-model",
      answer: {
        answerType: "explanation",
        answerMarkdown:
          "Harness engines isolate context, tools, and evaluators.",
        sourceIds: [source.sourceId],
        sourceCards: [
          {
            sourceId: source.sourceId,
            postTitle: source.postTitle ?? "",
            postSlug: source.postSlug ?? "",
            categorySlug: source.categorySlug ?? undefined,
            tagSlugs: source.tagSlugs,
            heading: source.heading ?? undefined,
            excerpt: source.excerpt,
            relevanceReason: source.relevanceReason,
          },
        ],
        relatedQuestions: ["How should failed tool calls be evaluated?"],
        confidence: "high",
      },
    })),
  };

  const service = createAgentService({
    quotaStore: createMemoryQuotaStore(),
    conversationStore,
    contextSourceStore,
    getKnowledgeStatus: vi.fn(async () => ({
      chunkCount: 3,
      publicPostCount: 2,
      indexedPublicPostCount: 2,
      hiddenOrDraftExcludedCount: 1,
      lastReindexAt: new Date("2026-05-30T08:00:00.000Z"),
      latestReindexError: null,
      reindexCommand: "pnpm ai:reindex",
      publishCommand: "pnpm content:publish",
      stalePublicPostSlugs: [],
      extraIndexedPostSlugs: [],
      indexedPostSlugs: ["agent-harness", "df-rope"],
    })),
    retrieve,
    model,
    now: () => new Date("2026-05-30T08:00:00.000Z"),
    ...overrides,
  });

  return { service, conversationStore, contextSourceStore, retrieve, model };
}

describe("AI agent harness", () => {
  it("assigns anonymous readers a browser-scoped guest identity", async () => {
    const req: AgentContext["req"] = {
      headers: {
        "user-agent": "vitest",
      },
      socket: { remoteAddress: "203.0.113.200" },
    };
    let setCookieHeader: string | string[] | undefined = [
      "existing_session=1; Path=/; HttpOnly",
    ];
    const res = {
      getHeader: vi.fn(() => setCookieHeader),
      setHeader: vi.fn((_name: string, value: string | string[]) => {
        setCookieHeader = value;
      }),
    };

    const firstContext = await buildAgentContext(req, res);
    expect(firstContext.session.role).toBe("anonymous");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.arrayContaining([
        "existing_session=1; Path=/; HttpOnly",
        expect.stringContaining("agent_guest_id="),
      ])
    );
    expect(req.headers?.cookie).toContain("agent_guest_id=");

    const secondRes = { setHeader: vi.fn() };
    await buildAgentContext(req, secondRes);
    expect(secondRes.setHeader).not.toHaveBeenCalled();
  });

  it("returns bootstrap quota and contextual prompts without reserving quota", async () => {
    const { service } = createHarness();

    const bootstrap = await service.bootstrap(anonymousContext(), {
      routeContext,
    });

    expect(bootstrap.sessionTier).toBe("anonymous");
    expect(bootstrap.quota).toMatchObject({
      limit: 10,
      used: 0,
      remaining: 10,
    });
    expect(bootstrap.currentScope).toEqual({
      type: "track",
      value: "ai-applications",
    });
    expect(bootstrap.suggestedPrompts.length).toBeGreaterThan(0);
  });

  it("blocks anonymous readers after ten messages before retrieval or model work", async () => {
    const { service, retrieve, model } = createHarness();
    const ctx = anonymousContext();

    const attempts = [];
    for (let index = 0; index < 11; index += 1) {
      attempts.push(
        await service.sendMessage(ctx, {
          message: `Question ${index + 1}`,
          routeContext,
        })
      );
    }

    expect(
      attempts.slice(0, 10).every(result => result.status === "completed")
    ).toBe(true);
    expect(attempts[10].status).toBe("blocked");
    expect(attempts[10].quota).toMatchObject({
      allowed: false,
      used: 10,
      remaining: 0,
    });
    expect(retrieve).toHaveBeenCalledTimes(10);
    expect(model.generate).toHaveBeenCalledTimes(10);
  });

  it("streams quota blocks as an explicit terminal outcome", async () => {
    const { service, retrieve, model } = createHarness();
    const ctx = anonymousContext("203.0.113.29");
    for (let index = 0; index < 10; index += 1) {
      await service.sendMessage(ctx, {
        message: `Question ${index + 1}`,
        routeContext,
      });
    }

    const events: AgentStreamEvent[] = [];
    const result = await service.streamMessage(
      ctx,
      {
        message: "Question 11",
        routeContext,
      },
      event => events.push(event)
    );

    expect(result.status).toBe("blocked");
    expect(retrieve).toHaveBeenCalledTimes(10);
    expect(model.generate).toHaveBeenCalledTimes(10);
    expect(events).toEqual([
      expect.objectContaining({
        type: "final",
        outcome: "blocked",
        reason: "quota",
        output: expect.objectContaining({ status: "blocked" }),
      }),
    ]);
  });

  it("blocks visitor readers after thirty messages", async () => {
    const { service, retrieve, model } = createHarness();
    const ctx = visitorContext();

    const attempts = [];
    for (let index = 0; index < 31; index += 1) {
      attempts.push(
        await service.sendMessage(ctx, {
          message: `Question ${index + 1}`,
          routeContext,
        })
      );
    }

    expect(
      attempts.slice(0, 30).every(result => result.status === "completed")
    ).toBe(true);
    expect(attempts[30].status).toBe("blocked");
    expect(retrieve).toHaveBeenCalledTimes(30);
    expect(model.generate).toHaveBeenCalledTimes(30);
  });

  it("persists the user message and failed run when the model fails", async () => {
    const failingModel: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model unavailable");
      }),
    };
    const { service, conversationStore } = createHarness({
      model: failingModel,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "Explain controlled context",
      routeContext,
    });

    expect(result).toMatchObject({
      status: "failed",
      runStatus: "failed",
      errorCode: "agent_generation_failed",
    });
    expect(conversationStore.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          status: "completed",
          content: "Explain controlled context",
        }),
        expect.objectContaining({ role: "assistant", status: "failed" }),
      ])
    );
    expect(conversationStore.runs[0]).toMatchObject({
      status: "failed",
      errorCode: "agent_generation_failed",
    });
  });

  it("returns a source-grounded fallback when the model is not configured but public sources exist", async () => {
    const failingModel: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
      }),
    };
    const { service, conversationStore } = createHarness({
      retrieve: vi.fn(async () => [isohcSource]),
      model: failingModel,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "解释这篇文章里的核心抽象。",
      routeContext: {
        path: "/post/isohc-fixed-vector-isometric-residual-mixing",
        routeType: "post",
        postSlug: "isohc-fixed-vector-isometric-residual-mixing",
        postTitle: "IsoHC: Fixed-Vector Isometric Residual Mixing",
        locale: "zh",
      },
    });

    expect(failingModel.generate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer.answerMarkdown).toContain("模型服务暂时未配置");
    expect(result.answer.answerMarkdown).toContain("Residual Stability");
    expect(result.sourceCards[0]).toMatchObject({
      postSlug: "isohc-fixed-vector-isometric-residual-mixing",
    });
    expect(conversationStore.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          status: "completed",
          sourceJson: expect.objectContaining({
            fallbackReason: "model_not_configured",
          }),
        }),
      ])
    );
    expect(conversationStore.runs[0]).toMatchObject({
      status: "completed",
      retrievedChunkIds: [isohcSource.sourceId],
      errorCode: "model_not_configured",
    });

    const radar = await service.adminQuestionRadar(adminContext(), {
      limit: 20,
    });
    expect(radar.summary.failedRuns).toBe(1);
    expect(radar.failedRuns[0]).toMatchObject({
      errorCode: "model_not_configured",
    });
  });

  it("returns normal answers with source cards for the applications harness article", async () => {
    const { service } = createHarness();

    const result = await service.sendMessage(anonymousContext(), {
      message: "What does the Agent Harness Engine article explain?",
      routeContext,
    });

    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.sourceCards[0]).toMatchObject({
      postSlug: "agent-harness",
      categorySlug: "ai-applications",
    });
    expect(result.answer.sourceIds).toContain(source.sourceId);
  });

  it("answers public article inventory questions without calling the model", async () => {
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model should not be called");
      }),
    };
    const { service, conversationStore } = createHarness({
      retrieve: vi.fn(async () => [siteOverviewSource]),
      model,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "都有那几篇文章啊",
      routeContext: {
        path: "/",
        routeType: "home",
        locale: "zh",
      },
    });

    expect(model.generate).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer.answerType).toBe("reading_path");
    expect(result.answer.answerMarkdown).toContain("目前公开笔记有 3 篇");
    expect(result.answer.answerMarkdown).toContain(
      "/post/gated-ffn-multiplicative-channel-control"
    );
    expect(result.sourceCards[0]).toMatchObject({
      sourceId: "site_overview_chunk:0",
      postSlug: "",
    });
    expect(conversationStore.runs[0]).toMatchObject({
      status: "completed",
      inputTokens: 0,
      outputTokens: 0,
      retrievedChunkIds: ["site_overview_chunk:0"],
    });
  });

  it("answers find-post intents with deterministic public post links", async () => {
    const agentLoopSource: KnowledgeSearchResult = {
      ...source,
      postId: 4,
      postSlug: "agent-loop-observable-tool-using-agents",
      postTitle: "Agent Loop: 从 ReAct 模式到可观测运行时",
      tagSlugs: ["agent-loop", "agent-systems"],
      heading: "From Pattern to Runtime",
      content:
        "Agent Loop moves from a ReAct pattern to an observable runtime.",
      sourceId: "post:agent-loop-observable-tool-using-agents:1",
      excerpt:
        "Agent Loop moves from a ReAct pattern to an observable runtime.",
      relevanceReason: "Matched AgentLoop post title and tag.",
    };
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model should not be called for find-post intents");
      }),
    };
    const { service, conversationStore } = createHarness({
      retrieve: vi.fn(async () => [
        agentLoopSource,
        source,
        siteOverviewSource,
      ]),
      model,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "帮我找 AgentLoop 那篇",
      routeContext: {
        path: "/",
        routeType: "home",
        locale: "zh",
      },
    });

    expect(model.generate).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer.answerType).toBe("reading_path");
    expect(result.answer.answerMarkdown).toContain(
      "/post/agent-loop-observable-tool-using-agents"
    );
    expect(result.answer.answerMarkdown).not.toContain("公众号");
    expect(result.sourceCards[0]).toMatchObject({
      postSlug: "agent-loop-observable-tool-using-agents",
      postTitle: "Agent Loop: 从 ReAct 模式到可观测运行时",
    });
    expect(result.sourceCards).toHaveLength(1);
    expect(conversationStore.runs[0]).toMatchObject({
      status: "completed",
      inputTokens: 0,
      outputTokens: 0,
      retrievedChunkIds: [
        agentLoopSource.sourceId,
        source.sourceId,
        siteOverviewSource.sourceId,
      ],
    });
  });

  it("does not treat explanatory show-me questions as find-post intents", async () => {
    const agentLoopSource: KnowledgeSearchResult = {
      ...source,
      postId: 4,
      postSlug: "agent-loop-observable-tool-using-agents",
      postTitle: "Agent Loop: 从 ReAct 模式到可观测运行时",
      tagSlugs: ["agent-loop", "agent-systems"],
      heading: "State Transition View",
      content: "AgentLoop stores runtime state outside the prompt.",
      sourceId: "post:agent-loop-observable-tool-using-agents:2",
      excerpt: "AgentLoop stores runtime state outside the prompt.",
      relevanceReason: "Matched AgentLoop runtime state terms.",
    };
    const model: AgentModel = {
      generate: vi.fn(async ({ sources }) => ({
        inputTokens: 10,
        outputTokens: 20,
        model: "test-model",
        answer: {
          answerType: "explanation",
          answerMarkdown: "AgentLoop keeps runtime state outside the prompt.",
          sourceIds: [sources[0].sourceId],
          sourceCards: [
            {
              sourceId: sources[0].sourceId,
              postTitle: sources[0].postTitle ?? "",
              postSlug: sources[0].postSlug ?? "",
              tagSlugs: sources[0].tagSlugs,
              excerpt: sources[0].excerpt,
              relevanceReason: sources[0].relevanceReason,
            },
          ],
          relatedQuestions: ["What is the state transition view?"],
          confidence: "high",
        },
      })),
    };
    const { service } = createHarness({
      retrieve: vi.fn(async () => [agentLoopSource]),
      model,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "Show me how AgentLoop handles runtime state",
      routeContext,
    });

    expect(model.generate).toHaveBeenCalledOnce();
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer.answerType).toBe("explanation");
    expect(result.answer.answerMarkdown).not.toContain(
      "I found this public note"
    );
  });

  it("cites IsoHC when the retrieved public source is IsoHC", async () => {
    const model: AgentModel = {
      generate: vi.fn(async ({ sources }) => ({
        answer: {
          answerType: "explanation",
          answerMarkdown:
            "IsoHC constrains residual mixing while preserving invariants.",
          sourceIds: [sources[0].sourceId],
          sourceCards: [
            {
              sourceId: sources[0].sourceId,
              postTitle: sources[0].postTitle ?? "",
              postSlug: sources[0].postSlug ?? "",
              categorySlug: sources[0].categorySlug ?? undefined,
              tagSlugs: sources[0].tagSlugs,
              heading: sources[0].heading ?? undefined,
              excerpt: sources[0].excerpt,
              relevanceReason: sources[0].relevanceReason,
            },
          ],
          relatedQuestions: ["How does IsoHC preserve residual energy?"],
          confidence: "high",
        },
      })),
    };
    const { service } = createHarness({
      retrieve: vi.fn(async () => [isohcSource]),
      model,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "Explain IsoHC residual stability",
      routeContext: {
        path: "/post/isohc-fixed-vector-isometric-residual-mixing",
        routeType: "post",
        postSlug: "isohc-fixed-vector-isometric-residual-mixing",
      },
    });

    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.sourceCards[0]).toMatchObject({
      postSlug: "isohc-fixed-vector-isometric-residual-mixing",
      categorySlug: "ai-algorithms",
    });
    expect(result.answer.sourceIds).toContain(isohcSource.sourceId);
  });

  it("marks vague post-scoped questions as using current page context", async () => {
    const model: AgentModel = {
      generate: vi.fn(async ({ sources }) => ({
        answer: {
          answerType: "explanation",
          answerMarkdown:
            "This article explains IsoHC as a residual stability mechanism.",
          sourceIds: [sources[0].sourceId],
          sourceCards: [
            {
              sourceId: sources[0].sourceId,
              postTitle: sources[0].postTitle ?? "",
              postSlug: sources[0].postSlug ?? "",
              categorySlug: sources[0].categorySlug ?? undefined,
              tagSlugs: sources[0].tagSlugs,
              heading: sources[0].heading ?? undefined,
              excerpt: sources[0].excerpt,
              relevanceReason: sources[0].relevanceReason,
            },
          ],
          relatedQuestions: ["What invariant does IsoHC preserve?"],
          confidence: "high",
        },
      })),
    };
    const currentPageSource = {
      ...isohcSource,
      relevanceReason:
        "Current public article context. Metadata and opening section are included.",
    };
    const { service } = createHarness({
      retrieve: vi.fn(async () => [currentPageSource]),
      model,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "这篇文章核心是什么？",
      routeContext: {
        path: "/post/isohc-fixed-vector-isometric-residual-mixing",
        routeType: "post",
        postSlug: "isohc-fixed-vector-isometric-residual-mixing",
      },
    });

    expect(model.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPageContextInjected: true,
        routeContext: expect.objectContaining({
          postSlug: "isohc-fixed-vector-isometric-residual-mixing",
        }),
      })
    );
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.sourceCards[0]).toMatchObject({
      postSlug: "isohc-fixed-vector-isometric-residual-mixing",
      relevanceReason: expect.stringContaining(
        "Current public article context"
      ),
    });
  });

  it("streams deltas and persists the same public source cards as the final event", async () => {
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("streaming path should use streamGenerate");
      }),
      streamGenerate: vi.fn(
        async ({ sources, onReasoningDelta, onAnswerDelta }) => {
          onReasoningDelta("Inspecting retrieved public context.\n");
          onAnswerDelta("Harness engines stream grounded answers.");

          return {
            inputTokens: 42,
            outputTokens: 24,
            model: "stream-test-model",
            reasoningMarkdown: "Inspecting retrieved public context.",
            answer: {
              answerType: "explanation",
              answerMarkdown: "Harness engines stream grounded answers.",
              sourceIds: [sources[0].sourceId],
              sourceCards: [
                {
                  sourceId: sources[0].sourceId,
                  postTitle: sources[0].postTitle ?? "",
                  postSlug: sources[0].postSlug ?? "",
                  categorySlug: sources[0].categorySlug ?? undefined,
                  tagSlugs: sources[0].tagSlugs,
                  heading: sources[0].heading ?? undefined,
                  excerpt: sources[0].excerpt,
                  relevanceReason: sources[0].relevanceReason,
                },
              ],
              relatedQuestions: ["How should streamed answers cite sources?"],
              confidence: "high",
            },
          };
        }
      ),
    };
    const { service, conversationStore } = createHarness({ model });
    const events: AgentStreamEvent[] = [];

    const result = await service.streamMessage(
      visitorContextWithId("visitor-stream-1"),
      {
        message: "Explain harness engines with sources",
        routeContext,
      },
      event => events.push(event)
    );

    expect(model.generate).not.toHaveBeenCalled();
    expect(model.streamGenerate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;

    const finalEvent = events.find(event => event.type === "final");
    expect(finalEvent).toMatchObject({
      type: "final",
      output: {
        status: "completed",
        sourceCards: result.sourceCards,
      },
    });
    expect(finalEvent).not.toHaveProperty("reasoningMarkdown");
    expect(events.some(event => event.type === "reasoning_delta")).toBe(false);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "answer_delta",
          delta: "Harness engines stream grounded answers.",
        }),
      ])
    );

    const assistantMessage = conversationStore.messages.find(
      message => message.role === "assistant"
    );
    expect(assistantMessage).toMatchObject({
      status: "completed",
      content: "Harness engines stream grounded answers.",
      sourceJson: {
        sourceCards: result.sourceCards,
      },
    });
    expect(assistantMessage?.sourceJson).not.toHaveProperty(
      "reasoningMarkdown"
    );
  });

  it("streams a source-grounded fallback instead of an error when the model is not configured", async () => {
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("streaming path should use streamGenerate");
      }),
      streamGenerate: vi.fn(async () => {
        throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
      }),
    };
    const { service, conversationStore } = createHarness({
      retrieve: vi.fn(async () => [isohcSource]),
      model,
    });
    const events: AgentStreamEvent[] = [];

    const result = await service.streamMessage(
      anonymousContext("203.0.113.91"),
      {
        message: "解释这篇文章里的核心抽象。",
        routeContext: {
          path: "/post/isohc-fixed-vector-isometric-residual-mixing",
          routeType: "post",
          postSlug: "isohc-fixed-vector-isometric-residual-mixing",
          postTitle: "IsoHC: Fixed-Vector Isometric Residual Mixing",
          locale: "zh",
        },
      },
      event => events.push(event)
    );

    expect(model.streamGenerate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer.answerMarkdown).toContain("模型服务暂时未配置");
    expect(result.sourceCards[0]).toMatchObject({
      postSlug: "isohc-fixed-vector-isometric-residual-mixing",
    });
    expect(events.some(event => event.type === "error")).toBe(false);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "answer_delta",
          delta: expect.stringContaining("模型服务暂时未配置"),
        }),
        expect.objectContaining({
          type: "final",
          output: expect.objectContaining({
            status: "completed",
            sourceCards: result.sourceCards,
          }),
        }),
      ])
    );
    expect(
      conversationStore.messages.find(message => message.role === "assistant")
    ).toMatchObject({
      status: "completed",
      sourceJson: expect.objectContaining({
        fallbackReason: "model_not_configured",
      }),
    });
    expect(conversationStore.runs[0]).toMatchObject({
      status: "completed",
      errorCode: "model_not_configured",
    });
  });

  it("streams no-source refusals without calling the model", async () => {
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model should not run without public sources");
      }),
      streamGenerate: vi.fn(async () => {
        throw new Error(
          "streaming model should not run without public sources"
        );
      }),
    };
    const { service, conversationStore } = createHarness({
      retrieve: vi.fn(async () => []),
      model,
    });
    const events: AgentStreamEvent[] = [];

    const result = await service.streamMessage(
      anonymousContext("203.0.113.90"),
      {
        message: "Can you explain EVQ hidden details?",
        routeContext,
      },
      event => events.push(event)
    );

    expect(model.generate).not.toHaveBeenCalled();
    expect(model.streamGenerate).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer).toMatchObject({
      answerType: "refusal",
      refusalReason: "no_public_source",
      sourceCards: [],
    });
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "status",
          stage: "answer",
        }),
        expect.objectContaining({
          type: "status",
          stage: "saving",
        }),
        expect.objectContaining({
          type: "answer_delta",
          delta: result.answer.answerMarkdown,
        }),
        expect.objectContaining({
          type: "final",
          outcome: "no_source",
          reason: "no_public_source",
          output: expect.objectContaining({
            status: "completed",
            sourceCards: [],
          }),
        }),
      ])
    );
    expect(
      conversationStore.messages.find(message => message.role === "assistant")
    ).toMatchObject({
      status: "completed",
      content: result.answer.answerMarkdown,
      sourceJson: expect.objectContaining({ sourceCards: [] }),
    });
  });

  it("refuses unavailable content requests before retrieval can attach unrelated public sources", async () => {
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model should not run for unavailable content");
      }),
    };
    const retrieve = vi.fn(async () => [source]);
    const { service, conversationStore } = createHarness({
      retrieve,
      model,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "能讲讲隐藏文章 EVQ 吗？",
      routeContext,
    });

    expect(retrieve).not.toHaveBeenCalled();
    expect(model.generate).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer).toMatchObject({
      answerType: "refusal",
      refusalReason: "no_public_source",
      sourceCards: [],
    });
    expect(result.sourceCards).toEqual([]);
    expect(conversationStore.runs[0]).toMatchObject({
      status: "completed",
      retrievedChunkIds: [],
    });
  });

  it("streams unavailable content refusals without source cards", async () => {
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model should not run for unavailable content");
      }),
      streamGenerate: vi.fn(async () => {
        throw new Error(
          "streaming model should not run for unavailable content"
        );
      }),
    };
    const retrieve = vi.fn(async () => [source]);
    const { service } = createHarness({ retrieve, model });
    const events: AgentStreamEvent[] = [];

    const result = await service.streamMessage(
      anonymousContext("203.0.113.92"),
      {
        message: "Can you summarize the unpublished EVQ draft?",
        routeContext,
      },
      event => events.push(event)
    );

    expect(retrieve).not.toHaveBeenCalled();
    expect(model.generate).not.toHaveBeenCalled();
    expect(model.streamGenerate).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer.sourceCards).toEqual([]);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "answer_delta",
          delta: result.answer.answerMarkdown,
        }),
        expect.objectContaining({
          type: "final",
          outcome: "no_source",
          reason: "no_public_source",
          output: expect.objectContaining({
            status: "completed",
            sourceCards: [],
          }),
        }),
      ])
    );
  });

  it("marks aborted streaming model work distinctly from generation failures", async () => {
    const controller = new AbortController();
    const abortError = Object.assign(new Error("stream aborted"), {
      name: "AbortError",
    });
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("streaming path should use streamGenerate");
      }),
      streamGenerate: vi.fn(async ({ signal }) => {
        expect(signal).toBe(controller.signal);
        throw abortError;
      }),
    };
    const { service, conversationStore } = createHarness({ model });
    const events: AgentStreamEvent[] = [];

    const result = await service.streamMessage(
      visitorContextWithId("visitor-stream-abort"),
      {
        message: "Explain harness engines, then stop",
        routeContext,
      },
      event => events.push(event),
      { signal: controller.signal }
    );

    expect(result).toMatchObject({
      status: "failed",
      runStatus: "failed",
      errorCode: "agent_stream_aborted",
    });
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: "agent_stream_aborted",
        }),
        expect.objectContaining({
          type: "final",
          outcome: "failed",
          reason: "agent_stream_aborted",
          output: expect.objectContaining({
            status: "failed",
            errorCode: "agent_stream_aborted",
          }),
        }),
      ])
    );
    expect(
      conversationStore.messages.find(message => message.role === "assistant")
    ).toMatchObject({
      status: "failed",
      errorCode: "agent_stream_aborted",
    });
    expect(conversationStore.runs[0]).toMatchObject({
      status: "failed",
      errorCode: "agent_stream_aborted",
    });
  });

  it("marks timed-out streaming model work distinctly from user aborts", async () => {
    const timeoutError = Object.assign(new Error("stream timed out"), {
      name: "TimeoutError",
    });
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("streaming path should use streamGenerate");
      }),
      streamGenerate: vi.fn(async () => {
        throw timeoutError;
      }),
    };
    const { service, conversationStore } = createHarness({ model });
    const events: AgentStreamEvent[] = [];

    const result = await service.streamMessage(
      visitorContextWithId("visitor-stream-timeout"),
      {
        message: "Explain harness engines, but the model stalls",
        routeContext,
      },
      event => events.push(event)
    );

    expect(result).toMatchObject({
      status: "failed",
      runStatus: "failed",
      errorCode: "agent_stream_timeout",
    });
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: "agent_stream_timeout",
        }),
        expect.objectContaining({
          type: "final",
          outcome: "failed",
          reason: "agent_stream_timeout",
          output: expect.objectContaining({
            status: "failed",
            errorCode: "agent_stream_timeout",
          }),
        }),
      ])
    );
    expect(conversationStore.runs[0]).toMatchObject({
      status: "failed",
      errorCode: "agent_stream_timeout",
    });
  });

  it("refuses hidden or unavailable EVQ content when no public source is retrieved", async () => {
    const model: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model should not run without public sources");
      }),
    };
    const { service, conversationStore } = createHarness({
      retrieve: vi.fn(async () => []),
      model,
    });

    const result = await service.sendMessage(anonymousContext(), {
      message: "Explain EVQ hidden details",
      routeContext,
    });

    expect(model.generate).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.answer).toMatchObject({
      answerType: "refusal",
      refusalReason: "no_public_source",
      sourceCards: [],
    });
    expect(result.answer.answerMarkdown).not.toContain("EVQ");
    expect(conversationStore.runs[0]).toMatchObject({ status: "completed" });
  });

  it("lets a visitor list, load, and continue a previous conversation", async () => {
    const { service, model } = createHarness();
    const ctx = visitorContextWithId("visitor-history-1");

    const first = await service.sendMessage(ctx, {
      message: "Explain harness engines",
      routeContext,
    });
    expect(first.status).toBe("completed");
    if (first.status !== "completed") return;

    const conversations = await service.listConversations(ctx);
    expect(conversations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: first.conversationId,
          ownerType: "visitor",
          ownerKey: "visitor-history-1",
        }),
      ])
    );

    const detail = await service.getConversation(ctx, {
      conversationId: first.conversationId,
    });
    expect(detail.messages.map(message => message.role)).toEqual([
      "user",
      "assistant",
    ]);

    const continued = await service.sendMessage(ctx, {
      conversationId: first.conversationId,
      message: "What should be evaluated next?",
      routeContext,
    });
    expect(continued.status).toBe("completed");
    if (continued.status !== "completed") return;
    expect(continued.conversationId).toBe(first.conversationId);
    expect(model.generate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        conversationHistory: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: "Explain harness engines",
          }),
          expect.objectContaining({
            role: "assistant",
            content: expect.stringContaining("Harness engines isolate"),
          }),
        ]),
      })
    );

    const continuedDetail = await service.getConversation(ctx, {
      conversationId: first.conversationId,
    });
    expect(continuedDetail.messages.map(message => message.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
  });

  it("prevents one visitor from loading another visitor's conversation", async () => {
    const { service } = createHarness();
    const owner = visitorContextWithId("visitor-owner");
    const other = visitorContextWithId("visitor-other");

    const first = await service.sendMessage(owner, {
      message: "Explain harness engines",
      routeContext,
    });
    expect(first.status).toBe("completed");
    if (first.status !== "completed") return;

    await expect(
      service.getConversation(other, { conversationId: first.conversationId })
    ).rejects.toThrow("Conversation not found");
  });

  it("keeps admin public history scoped to the current admin identity", async () => {
    const { service } = createHarness();
    const owner = visitorContextWithId("visitor-owner");

    const first = await service.sendMessage(owner, {
      message: "Explain harness engines",
      routeContext,
    });
    expect(first.status).toBe("completed");

    const adminConversations = await service.listConversations(adminContext());
    expect(adminConversations).toEqual([]);
  });

  it("validates an existing conversation before reserving message quota", async () => {
    const quotaStore = createMemoryQuotaStore();
    const reserveDailyMessage = vi.spyOn(quotaStore, "reserveDailyMessage");
    const { service } = createHarness({ quotaStore });

    await expect(
      service.sendMessage(visitorContextWithId("visitor-missing-conv"), {
        conversationId: "missing-conversation",
        message: "Continue the missing conversation",
        routeContext,
      })
    ).rejects.toThrow("Conversation not found");
    expect(reserveDailyMessage).not.toHaveBeenCalled();
  });

  it("continues a conversation with its stored scope, not the current page scope", async () => {
    const { service, retrieve } = createHarness();
    const ctx = visitorContextWithId("visitor-scope");

    const first = await service.sendMessage(ctx, {
      message: "Explain harness engines",
      routeContext,
    });
    expect(first.status).toBe("completed");
    if (first.status !== "completed") return;

    retrieve.mockClear();
    const continued = await service.sendMessage(ctx, {
      conversationId: first.conversationId,
      message: "What should I evaluate next?",
      routeContext: {
        path: "/post/isohc-fixed-vector-isometric-residual-mixing",
        routeType: "post",
        postSlug: "isohc-fixed-vector-isometric-residual-mixing",
      },
    });

    expect(continued.status).toBe("completed");
    expect(retrieve).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scope: { type: "track", value: "ai-applications" },
      })
    );
  });

  it("lets only admins inspect retrieval without model calls", async () => {
    const { service, retrieve, model } = createHarness();
    const adminCtx = adminContext();

    await expect(
      service.adminDebugRetrieval(visitorContext(), {
        query: "harness engine",
        routeContext,
      })
    ).rejects.toThrow("Admin authentication required");

    const result = await service.adminDebugRetrieval(adminCtx, {
      query: "harness engine",
      routeContext,
    });

    expect(result.sources[0]).toMatchObject({ sourceId: source.sourceId });
    expect(result.diagnostics).toMatchObject({
      status: "ready",
      terms: ["harness", "engine"],
      expandedTerms: expect.arrayContaining(["harness", "engine"]),
      currentPageContextInjected: false,
    });
    expect(retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "harness engine",
        scope: { type: "track", value: "ai-applications" },
      })
    );
    expect(model.generate).not.toHaveBeenCalled();
  });

  it("returns actionable diagnostics when retrieval has no public sources", async () => {
    const { service } = createHarness({ retrieve: vi.fn(async () => []) });

    const result = await service.adminDebugRetrieval(adminContext(), {
      query: "EVQ hidden details",
      routeContext,
    });

    expect(result.sources).toEqual([]);
    expect(result.diagnostics).toMatchObject({
      status: "no_sources",
      missingTerms: ["evq"],
      failureReason: "retrieval_failure",
    });
    expect(result.diagnostics.suggestions.join(" ")).toContain(
      "pnpm ai:reindex"
    );
  });

  it("marks custom retrieval-only evals as manual review instead of pass", async () => {
    const { service, model } = createHarness();
    const adminCtx = adminContext();

    const result = await service.adminRunEvals(adminCtx, {
      questions: ["Explain harness engines", "Compare context engines"],
      routeContext,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      status: "manual_review_required",
      passed: false,
      sourceCount: 1,
      manualReviewReason: "source_recall_only",
    });
    expect(result.items[0].notes.join(" ")).toContain(
      "source recall alone cannot prove answer quality"
    );
    expect(result.summary).toMatchObject({
      total: 2,
      passed: 0,
      failed: 0,
      manualReview: 2,
    });
    expect(model.generate).not.toHaveBeenCalled();
  });

  it("fails custom retrieval-only evals when no public source is found", async () => {
    const { service } = createHarness({ retrieve: vi.fn(async () => []) });

    const result = await service.adminRunEvals(adminContext(), {
      questions: ["Explain an unavailable internal note"],
      routeContext,
    });

    expect(result.items[0]).toMatchObject({
      status: "failed",
      passed: false,
      sourceCount: 0,
      failureReason: "retrieval_failure",
    });
    expect(result.summary).toMatchObject({
      total: 1,
      passed: 0,
      failed: 1,
      manualReview: 0,
    });
  });

  it("runs the default golden eval set with success and refusal cases", async () => {
    const retrieve = vi.fn(async ({ query }: { query: string }) => {
      if (query.includes("EVQ") || query.includes("weather")) return [];
      if (query.includes("IsoHC")) return [isohcSource];
      return [source];
    });
    const { service } = createHarness({ retrieve });

    const result = await service.adminRunEvals(adminContext(), {
      routeContext: { path: "/", routeType: "home" },
    });

    expect(result.summary.total).toBeGreaterThanOrEqual(8);
    expect(result.summary.refusalCases).toBeGreaterThanOrEqual(2);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "Refusal",
          expectedBehavior: "refusal",
          status: "passed",
          passed: true,
          sourceCount: 0,
        }),
      ])
    );
  });

  it("exposes admin knowledge status without running reindex", async () => {
    const getKnowledgeStatus = vi.fn(async () => ({
      chunkCount: 9,
      publicPostCount: 3,
      indexedPublicPostCount: 3,
      hiddenOrDraftExcludedCount: 2,
      lastReindexAt: new Date("2026-05-30T08:00:00.000Z"),
      latestReindexError: null,
      reindexCommand: "pnpm ai:reindex",
      publishCommand: "pnpm content:publish",
      stalePublicPostSlugs: [],
      extraIndexedPostSlugs: [],
      indexedPostSlugs: ["agent-harness", "rag-evidence-packet", "agent-loop"],
    }));
    const { service } = createHarness({ getKnowledgeStatus });

    await expect(
      service.adminKnowledgeStatus(visitorContext())
    ).rejects.toThrow("Admin authentication required");
    const status = await service.adminKnowledgeStatus(adminContext());

    expect(status).toMatchObject({
      chunkCount: 9,
      indexedPublicPostCount: 3,
      reindexCommand: "pnpm ai:reindex",
    });
    expect(getKnowledgeStatus).toHaveBeenCalledTimes(1);
  });

  it("extracts article ideas from a conversation without publishing anything", async () => {
    const { service } = createHarness();
    const owner = visitorContextWithId("visitor-ideas");
    const adminCtx = adminContext();
    const created = await service.sendMessage(owner, {
      message: "Can you explain failure modes in agent harness engines?",
      routeContext,
    });
    expect(created.status).toBe("completed");
    if (created.status !== "completed") return;

    const ideas = await service.adminExtractArticleIdeas(adminCtx, {
      conversationId: created.conversationId,
    });

    expect(ideas.ideas[0]).toMatchObject({
      sourceConversationId: created.conversationId,
      proposedTitle: expect.stringContaining("failure modes"),
    });
  });

  it("summarizes agent questions into an owner-only content radar", async () => {
    const { service, conversationStore } = createHarness();
    conversationStore.runs.push(
      {
        id: "run-radar-1",
        conversationId: "conv-radar-1",
        question: "Why did the harness fail without sources?",
        status: "completed",
        scopeType: "track",
        scopeValue: "ai-applications",
        retrievedChunkIds: [],
        createdAt: new Date("2026-05-30T08:00:00.000Z"),
      },
      {
        id: "run-radar-2",
        conversationId: "conv-radar-2",
        question: "Why did the harness fail without sources?",
        status: "failed",
        errorCode: "agent_generation_failed",
        scopeType: "track",
        scopeValue: "ai-applications",
        retrievedChunkIds: ["agent-harness:1"],
        createdAt: new Date("2026-05-30T09:00:00.000Z"),
      }
    );

    await expect(
      service.adminQuestionRadar(visitorContext(), { limit: 20 })
    ).rejects.toThrow("Admin authentication required");
    const radar = await service.adminQuestionRadar(adminContext(), {
      limit: 20,
    });

    expect(radar.summary).toMatchObject({
      totalRuns: 2,
      failedRuns: 1,
      noSourceRuns: 1,
      uniqueQuestions: 1,
    });
    expect(radar.frequentQuestions[0]).toMatchObject({
      question: "Why did the harness fail without sources?",
      count: 2,
      signalTypes: expect.arrayContaining(["frequent", "no_source", "failed"]),
    });
    expect(radar.suggestedIdeas[0]).toMatchObject({
      status: "new",
      supportCount: 2,
    });
  });

  it("summarizes Agent quality into bounded owner action items", async () => {
    const getKnowledgeStatus = vi.fn(async () => ({
      chunkCount: 9,
      publicPostCount: 3,
      indexedPublicPostCount: 2,
      hiddenOrDraftExcludedCount: 1,
      lastReindexAt: new Date("2026-05-30T08:00:00.000Z"),
      latestReindexError: null,
      reindexCommand: "pnpm ai:reindex",
      publishCommand: "pnpm content:publish",
      stalePublicPostSlugs: ["agent-loop-observable"],
      extraIndexedPostSlugs: [],
      indexedPostSlugs: ["agent-harness", "rag-evidence-packet"],
    }));
    const { service, conversationStore } = createHarness({
      getKnowledgeStatus,
    });
    conversationStore.runs.push(
      {
        id: "run-summary-1",
        question: "Why did the harness fail without sources?",
        status: "completed",
        scopeType: "track",
        scopeValue: "ai-applications",
        retrievedChunkIds: [],
        createdAt: new Date("2026-05-30T08:00:00.000Z"),
      },
      {
        id: "run-summary-2",
        question: "Why did the harness fail without sources?",
        status: "failed",
        errorCode: "agent_generation_failed",
        scopeType: "track",
        scopeValue: "ai-applications",
        retrievedChunkIds: ["agent-harness:1"],
        createdAt: new Date("2026-05-30T09:00:00.000Z"),
      }
    );

    await expect(
      service.adminQualitySummary(visitorContext(), { limit: 20 })
    ).rejects.toThrow("Admin authentication required");
    const summary = await service.adminQualitySummary(adminContext(), {
      limit: 20,
    });

    expect(summary.releaseBlocking).toBe(true);
    expect(summary.knowledgeStatus.stalePublicPostSlugs).toEqual([
      "agent-loop-observable",
    ]);
    expect(summary.radar.summary).toMatchObject({
      failedRuns: 1,
      noSourceRuns: 1,
    });
    expect(summary.actionItems.map(item => item.id)).toEqual([
      "index_stale",
      "no_source_runs",
      "failed_runs",
    ]);
    expect(summary.actionItems[0]).toMatchObject({
      severity: "high",
      target: "index",
      details: ["agent-loop-observable"],
    });
    expect(summary.actionItems[1]).toMatchObject({
      target: "content_radar",
      details: ["run-summary-1 · track:ai-applications"],
    });
    expect(summary.actionItems[2]).toMatchObject({
      target: "traces",
      details: [
        "run-summary-2 · agent_generation_failed · track:ai-applications",
      ],
    });
    expect(JSON.stringify(summary.actionItems)).not.toContain(
      "Why did the harness fail without sources?"
    );
  });

  it("attaches pasted context to the current conversation and passes it to the model", async () => {
    const model: AgentModel = {
      generate: vi.fn(async ({ contextSources }) => ({
        answer: {
          answerType: "explanation",
          answerMarkdown:
            "The uploaded note says the harness should keep tool traces deterministic.",
          sourceIds: [contextSources[0].sourceId],
          sourceCards: [
            {
              sourceId: contextSources[0].sourceId,
              sourceType: "user_context",
              postTitle: "Pasted context",
              postSlug: "",
              tagSlugs: ["user-context"],
              excerpt: contextSources[0].excerpt,
              relevanceReason: "Matches the pasted conversation context.",
            },
          ],
          relatedQuestions: [
            "How should I turn this note into a blog section?",
          ],
          confidence: "high",
        },
      })),
    };
    const { service } = createHarness({
      retrieve: vi.fn(async () => []),
      model,
    });
    const ctx = visitorContextWithId("visitor-context-1");

    const context = await service.addContext(ctx, {
      routeContext,
      kind: "pasted_text",
      content: "Harness note: keep tool traces deterministic and replayable.",
    });

    expect(context.status).toBe("completed");
    if (context.status !== "completed") return;

    const answer = await service.sendMessage(ctx, {
      conversationId: context.conversationId,
      message: "What does my attached note say about harness design?",
      routeContext,
    });

    expect(answer.status).toBe("completed");
    if (answer.status !== "completed") return;
    expect(model.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        contextSources: [
          expect.objectContaining({
            sourceType: "user_context",
            sourceId: context.contextSource.sourceId,
            content: expect.stringContaining("tool traces deterministic"),
          }),
        ],
      })
    );
    expect(answer.sourceCards[0]).toMatchObject({
      sourceType: "user_context",
      postTitle: "Pasted context",
    });
  });

  it("uses upload quota separately from message quota when adding context", async () => {
    const { service } = createHarness();
    const ctx = anonymousContext("203.0.113.77");

    const first = await service.addContext(ctx, {
      routeContext,
      kind: "text_file",
      filename: "notes.txt",
      mimeType: "text/plain",
      content: "A short note about context engines.",
    });
    const second = await service.addContext(ctx, {
      conversationId:
        first.status === "completed" ? first.conversationId : undefined,
      routeContext,
      kind: "text_file",
      filename: "more-notes.txt",
      mimeType: "text/plain",
      content: "Another note about context engines.",
    });
    const message = await service.sendMessage(ctx, {
      conversationId:
        first.status === "completed" ? first.conversationId : undefined,
      message: "Explain context engines",
      routeContext,
    });

    expect(first.status).toBe("completed");
    expect(second).toMatchObject({ status: "blocked", reason: "quota" });
    expect(message.status).toBe("completed");
  });
});
