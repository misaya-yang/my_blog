import { describe, expect, it, vi } from "vitest";
import { createMemoryConversationStore } from "./conversations";
import { createMemoryContextSourceStore } from "./contextSources";
import { createAgentService } from "./harness";
import { createMemoryQuotaStore } from "./quota";
import type { BlogSession } from "../auth";
import type { AgentContext, AgentModel } from "./types";
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
  content: "Harness engines evaluate tool-using agents under controlled context.",
  summary: null,
  keywords: ["harness", "agent"],
  contentHash: "hash",
  tokenEstimate: 24,
  sourceId: "post:agent-harness:1",
  score: 10,
  excerpt: "Harness engines evaluate tool-using agents under controlled context.",
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
  content: "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold.",
  sourceId: "post:isohc-fixed-vector-isometric-residual-mixing:1",
  excerpt: "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold.",
  relevanceReason: "Matches IsoHC residual stability terms.",
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

function createHarness(overrides: Partial<Parameters<typeof createAgentService>[0]> = {}) {
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
        answerMarkdown: "Harness engines isolate context, tools, and evaluators.",
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
    retrieve,
    model,
    now: () => new Date("2026-05-30T08:00:00.000Z"),
    ...overrides,
  });

  return { service, conversationStore, contextSourceStore, retrieve, model };
}

describe("AI agent harness", () => {
  it("returns bootstrap quota and contextual prompts without reserving quota", async () => {
    const { service } = createHarness();

    const bootstrap = await service.bootstrap(anonymousContext(), { routeContext });

    expect(bootstrap.sessionTier).toBe("anonymous");
    expect(bootstrap.quota).toMatchObject({ limit: 2, used: 0, remaining: 2 });
    expect(bootstrap.currentScope).toEqual({ type: "track", value: "ai-applications" });
    expect(bootstrap.suggestedPrompts.length).toBeGreaterThan(0);
  });

  it("blocks anonymous readers on the third message before retrieval or model work", async () => {
    const { service, retrieve, model } = createHarness();
    const ctx = anonymousContext();

    await service.sendMessage(ctx, { message: "Explain harness engines", routeContext });
    await service.sendMessage(ctx, { message: "Explain context engines", routeContext });
    const third = await service.sendMessage(ctx, { message: "Explain tool use", routeContext });

    expect(third.status).toBe("blocked");
    expect(third.quota).toMatchObject({ allowed: false, used: 2, remaining: 0 });
    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(model.generate).toHaveBeenCalledTimes(2);
  });

  it("blocks visitor readers on the seventh message", async () => {
    const { service, retrieve, model } = createHarness();
    const ctx = visitorContext();

    const attempts = [];
    for (let index = 0; index < 7; index += 1) {
      attempts.push(
        await service.sendMessage(ctx, {
          message: `Question ${index + 1}`,
          routeContext,
        })
      );
    }

    expect(attempts.slice(0, 6).every((result) => result.status === "completed")).toBe(true);
    expect(attempts[6].status).toBe("blocked");
    expect(retrieve).toHaveBeenCalledTimes(6);
    expect(model.generate).toHaveBeenCalledTimes(6);
  });

  it("persists the user message and failed run when the model fails", async () => {
    const failingModel: AgentModel = {
      generate: vi.fn(async () => {
        throw new Error("model unavailable");
      }),
    };
    const { service, conversationStore } = createHarness({ model: failingModel });

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
        expect.objectContaining({ role: "user", status: "completed", content: "Explain controlled context" }),
        expect.objectContaining({ role: "assistant", status: "failed" }),
      ])
    );
    expect(conversationStore.runs[0]).toMatchObject({
      status: "failed",
      errorCode: "agent_generation_failed",
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

  it("cites IsoHC when the retrieved public source is IsoHC", async () => {
    const model: AgentModel = {
      generate: vi.fn(async ({ sources }) => ({
        answer: {
          answerType: "explanation",
          answerMarkdown: "IsoHC constrains residual mixing while preserving invariants.",
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
    const { service } = createHarness();
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

    const detail = await service.getConversation(ctx, { conversationId: first.conversationId });
    expect(detail.messages.map((message) => message.role)).toEqual(["user", "assistant"]);

    const continued = await service.sendMessage(ctx, {
      conversationId: first.conversationId,
      message: "What should be evaluated next?",
      routeContext,
    });
    expect(continued.status).toBe("completed");
    if (continued.status !== "completed") return;
    expect(continued.conversationId).toBe(first.conversationId);

    const continuedDetail = await service.getConversation(ctx, {
      conversationId: first.conversationId,
    });
    expect(continuedDetail.messages.map((message) => message.role)).toEqual([
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

  it("lets only admins inspect retrieval without model calls", async () => {
    const { service, retrieve, model } = createHarness();
    const adminCtx: AgentContext = {
      req: { headers: { "x-forwarded-for": "203.0.113.88", "user-agent": "vitest" } },
      session: {
        isAuthenticated: true,
        isAdmin: true,
        role: "admin",
        displayName: "Misaya Yang",
      },
    };

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
    expect(retrieve).toHaveBeenCalledWith(
      expect.objectContaining({ query: "harness engine", scope: { type: "track", value: "ai-applications" } })
    );
    expect(model.generate).not.toHaveBeenCalled();
  });

  it("runs retrieval-only evals for admins", async () => {
    const { service, model } = createHarness();
    const adminCtx: AgentContext = {
      req: { headers: { "x-forwarded-for": "203.0.113.88", "user-agent": "vitest" } },
      session: {
        isAuthenticated: true,
        isAdmin: true,
        role: "admin",
        displayName: "Misaya Yang",
      },
    };

    const result = await service.adminRunEvals(adminCtx, {
      questions: ["Explain harness engines", "Compare context engines"],
      routeContext,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ passed: true, sourceCount: 1 });
    expect(model.generate).not.toHaveBeenCalled();
  });

  it("extracts article ideas from a conversation without publishing anything", async () => {
    const { service } = createHarness();
    const owner = visitorContextWithId("visitor-ideas");
    const adminCtx: AgentContext = {
      req: { headers: { "x-forwarded-for": "203.0.113.88", "user-agent": "vitest" } },
      session: {
        isAuthenticated: true,
        isAdmin: true,
        role: "admin",
        displayName: "Misaya Yang",
      },
    };
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

  it("attaches pasted context to the current conversation and passes it to the model", async () => {
    const model: AgentModel = {
      generate: vi.fn(async ({ contextSources }) => ({
        answer: {
          answerType: "explanation",
          answerMarkdown: "The uploaded note says the harness should keep tool traces deterministic.",
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
          relatedQuestions: ["How should I turn this note into a blog section?"],
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
      conversationId: first.status === "completed" ? first.conversationId : undefined,
      routeContext,
      kind: "text_file",
      filename: "more-notes.txt",
      mimeType: "text/plain",
      content: "Another note about context engines.",
    });
    const message = await service.sendMessage(ctx, {
      conversationId: first.status === "completed" ? first.conversationId : undefined,
      message: "Explain context engines",
      routeContext,
    });

    expect(first.status).toBe("completed");
    expect(second).toMatchObject({ status: "blocked", reason: "quota" });
    expect(message.status).toBe("completed");
  });
});
