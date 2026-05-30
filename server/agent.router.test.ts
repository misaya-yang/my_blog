import { describe, expect, it, vi } from "vitest";

const agentMocks = vi.hoisted(() => ({
  bootstrap: vi.fn(async () => ({
    sessionTier: "anonymous",
    quota: {
      limit: 2,
      used: 0,
      remaining: 2,
      resetAt: new Date("2026-05-31T00:00:00.000Z"),
      tier: "anonymous",
    },
    currentScope: { type: "site" },
    suggestedPrompts: ["What are the main themes on this blog?"],
  })),
  sendMessage: vi.fn(async () => ({
    status: "blocked",
    reason: "quota",
    quota: {
      allowed: false,
      limit: 2,
      used: 2,
      remaining: 0,
      resetAt: new Date("2026-05-31T00:00:00.000Z"),
      tier: "anonymous",
    },
  })),
  listConversations: vi.fn(async () => [
    {
      id: "11111111-1111-4111-8111-111111111111",
      ownerType: "visitor",
      ownerKey: "visitor-1",
      title: "Harness question",
      scopeType: "track",
      scopeValue: "ai-applications",
    },
  ]),
  getConversation: vi.fn(async () => ({
    conversation: {
      id: "11111111-1111-4111-8111-111111111111",
      ownerType: "visitor",
      ownerKey: "visitor-1",
      title: "Harness question",
      scopeType: "track",
      scopeValue: "ai-applications",
    },
    messages: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        conversationId: "11111111-1111-4111-8111-111111111111",
        role: "user",
        status: "completed",
        content: "Explain harness engines",
      },
    ],
  })),
  addContext: vi.fn(async () => ({
    status: "completed",
    conversationId: "11111111-1111-4111-8111-111111111111",
    contextSource: {
      id: "33333333-3333-4333-8333-333333333333",
      sourceId: "context:33333333-3333-4333-8333-333333333333",
      sourceType: "user_context",
      kind: "pasted_text",
      filename: "Pasted context",
      mimeType: "text/plain",
      excerpt: "Context engines should preserve source boundaries.",
      tokenEstimate: 8,
    },
    quota: {
      allowed: true,
      limit: 1,
      used: 1,
      remaining: 0,
      resetAt: new Date("2026-05-31T00:00:00.000Z"),
      tier: "anonymous",
    },
  })),
  adminDebugRetrieval: vi.fn(async () => ({
    query: "harness engine",
    scope: { type: "track", value: "ai-applications" },
    sourceIds: ["post:agent-harness:1"],
    sources: [
      {
        sourceId: "post:agent-harness:1",
        sourceType: "blog",
        postTitle: "Agent Harness Engine",
        postSlug: "agent-harness",
        tagSlugs: ["harness-engine"],
        excerpt: "Harness engines evaluate agents.",
        relevanceReason: "Matched harness terms.",
      },
    ],
  })),
  adminRunEvals: vi.fn(async () => ({
    items: [
      {
        question: "What is a harness engine?",
        passed: true,
        sourceCount: 1,
        topSourceTitle: "Agent Harness Engine",
        sourceIds: ["post:agent-harness:1"],
      },
    ],
  })),
  adminExtractArticleIdeas: vi.fn(async () => ({
    ideas: [
      {
        sourceConversationId: "11111111-1111-4111-8111-111111111111",
        proposedTitle: "failure modes in agent harness engines",
        rationale: "Reader-facing technical question.",
        seedQuestions: ["Can you explain failure modes in agent harness engines?"],
      },
    ],
  })),
  buildAgentContext: vi.fn(async (req) => ({
    req,
    session: {
      isAuthenticated: false,
      isAdmin: false,
      role: "anonymous",
      displayName: null,
    },
  })),
}));

vi.mock("./ai/harness.js", () => ({
  defaultAgentService: {
    bootstrap: agentMocks.bootstrap,
    listConversations: agentMocks.listConversations,
    getConversation: agentMocks.getConversation,
    addContext: agentMocks.addContext,
    adminDebugRetrieval: agentMocks.adminDebugRetrieval,
    adminRunEvals: agentMocks.adminRunEvals,
    adminExtractArticleIdeas: agentMocks.adminExtractArticleIdeas,
    sendMessage: agentMocks.sendMessage,
  },
  buildAgentContext: agentMocks.buildAgentContext,
}));

import { appRouter } from "./routers";

function createContext() {
  return {
    req: {
      headers: {},
      socket: { remoteAddress: "203.0.113.9" },
    },
    res: {
      setHeader: vi.fn(),
    },
    user: null,
  } as any;
}

describe("agent router", () => {
  it("exposes agent.bootstrap", async () => {
    const caller = appRouter.createCaller(createContext());

    const output = await caller.agent.bootstrap({
      routeContext: { path: "/", routeType: "home" },
    });

    expect(output.sessionTier).toBe("anonymous");
    expect(agentMocks.bootstrap).toHaveBeenCalledTimes(1);
  });

  it("exposes agent.sendMessage", async () => {
    const caller = appRouter.createCaller(createContext());

    const output = await caller.agent.sendMessage({
      message: "What should I read first?",
      routeContext: { path: "/", routeType: "home" },
    });

    expect(output.status).toBe("blocked");
    expect(agentMocks.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("exposes conversation history endpoints", async () => {
    const caller = appRouter.createCaller(createContext());

    const list = await caller.agent.listConversations();
    const detail = await caller.agent.getConversation({
      conversationId: "11111111-1111-4111-8111-111111111111",
    });

    expect(list).toHaveLength(1);
    expect(detail.messages[0].content).toBe("Explain harness engines");
    expect(agentMocks.listConversations).toHaveBeenCalledTimes(1);
    expect(agentMocks.getConversation).toHaveBeenCalledTimes(1);
  });

  it("exposes agent.addContext for pasted text and markdown uploads", async () => {
    const caller = appRouter.createCaller(createContext());

    const output = await caller.agent.addContext({
      routeContext: { path: "/", routeType: "home" },
      kind: "pasted_text",
      content: "Context engines should preserve source boundaries.",
    });

    expect(output.status).toBe("completed");
    expect(agentMocks.addContext).toHaveBeenCalledTimes(1);
  });

  it("exposes admin agent operations", async () => {
    const caller = appRouter.createCaller(createContext());

    const debug = await caller.agent.adminDebugRetrieval({
      query: "harness engine",
      routeContext: { path: "/applications", routeType: "track", trackSlug: "ai-applications" },
    });
    const evals = await caller.agent.adminRunEvals({
      questions: ["What is a harness engine?"],
      routeContext: { path: "/applications", routeType: "track", trackSlug: "ai-applications" },
    });
    const ideas = await caller.agent.adminExtractArticleIdeas({
      conversationId: "11111111-1111-4111-8111-111111111111",
    });

    expect(debug.sourceIds).toEqual(["post:agent-harness:1"]);
    expect(evals.items[0].passed).toBe(true);
    expect(ideas.ideas[0].proposedTitle).toContain("failure modes");
  });
});
