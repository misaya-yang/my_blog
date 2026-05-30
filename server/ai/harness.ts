import { TRPCError } from "@trpc/server";
import { resolveBlogSession } from "../auth.js";
import {
  normalizeContextSourceInput,
  PostgresContextSourceStore,
  type ContextSourceStore,
} from "./contextSources.js";
import { searchPublicKnowledgeChunkSources } from "./knowledgeDb.js";
import type { KnowledgeSearchResult } from "./knowledge.js";
import { PostgresConversationStore, type ConversationStore } from "./conversations.js";
import { getFileUploadQuotaLimit, getQuotaLimit, resolveAgentIdentity } from "./identity.js";
import { buildSourceCards, createNoPublicSourceAnswer, defaultAgentModel } from "./model.js";
import { PostgresQuotaStore, type QuotaStore } from "./quota.js";
import type {
  AgentAddContextInput,
  AgentAddContextOutput,
  AgentArticleIdeaOutput,
  AgentBootstrapInput,
  AgentBootstrapOutput,
  AgentConversationDetail,
  AgentConversationRecord,
  AgentEvalRunOutput,
  AgentContext,
  AgentModel,
  AgentRetrievalDebugOutput,
  AgentRunRecord,
  AgentScope,
  AgentSendMessageInput,
  AgentSendMessageOutput,
} from "./types.js";

export type AgentServiceDeps = {
  quotaStore: QuotaStore;
  conversationStore: ConversationStore;
  contextSourceStore: ContextSourceStore;
  model: AgentModel;
  retrieve: (input: {
    query: string;
    scope: AgentScope;
    limit: number;
  }) => Promise<KnowledgeSearchResult[]>;
  now?: () => Date;
};

export type AgentService = {
  bootstrap(ctx: AgentContext, input: AgentBootstrapInput): Promise<AgentBootstrapOutput>;
  listConversations(ctx: AgentContext): Promise<AgentConversationRecord[]>;
  getConversation(ctx: AgentContext, input: { conversationId: string }): Promise<AgentConversationDetail>;
  addContext(ctx: AgentContext, input: AgentAddContextInput): Promise<AgentAddContextOutput>;
  adminDebugRetrieval(
    ctx: AgentContext,
    input: { query: string; routeContext: AgentBootstrapInput["routeContext"]; scope?: AgentScope; limit?: number }
  ): Promise<AgentRetrievalDebugOutput>;
  adminRunEvals(
    ctx: AgentContext,
    input: { questions?: string[]; routeContext: AgentBootstrapInput["routeContext"]; scope?: AgentScope }
  ): Promise<AgentEvalRunOutput>;
  adminExtractArticleIdeas(
    ctx: AgentContext,
    input: { conversationId: string }
  ): Promise<AgentArticleIdeaOutput>;
  adminListRuns(ctx: AgentContext, input: { limit?: number }): Promise<AgentRunRecord[]>;
  sendMessage(ctx: AgentContext, input: AgentSendMessageInput): Promise<AgentSendMessageOutput>;
};

export function createAgentService(deps: AgentServiceDeps): AgentService {
  const now = deps.now ?? (() => new Date());

  return {
    async bootstrap(ctx, input) {
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      const limit = getQuotaLimit(identity.type);
      const quota = await deps.quotaStore.getDailyMessageQuota(identity, limit, now());
      const currentScope = input.scope ?? inferScope(input.routeContext);

      return {
        sessionTier: identity.type,
        quota: {
          limit: quota.limit,
          used: quota.used,
          remaining: quota.remaining,
          resetAt: quota.resetAt,
          tier: quota.tier,
        },
        currentScope,
        suggestedPrompts: buildSuggestedPrompts(currentScope),
      };
    },

    async listConversations(ctx) {
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      return deps.conversationStore.listConversations(identity);
    },

    async getConversation(ctx, input) {
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      const conversation = await deps.conversationStore.getConversation({
        conversationId: input.conversationId,
        identity,
      });
      const messages = await deps.conversationStore.getMessages({
        conversationId: input.conversationId,
        identity,
      });
      const contextSources = await deps.contextSourceStore.listSources({
        conversationId: input.conversationId,
        identity,
        now: now(),
      });
      return { conversation, messages, contextSources };
    },

    async addContext(ctx, input) {
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      normalizeContextSourceInput(input);

      const scope = input.scope ?? inferScope(input.routeContext);
      let conversation: AgentConversationRecord | null = null;
      if (input.conversationId) {
        conversation = await deps.conversationStore.createOrLoadConversation({
          conversationId: input.conversationId,
          identity,
          scope,
          title: "Attached context",
        });
      }

      const limit = getFileUploadQuotaLimit(identity.type);
      const quota = await deps.quotaStore.reserveDailyAction(identity, "file_upload", limit, now());
      if (!quota.allowed) {
        return {
          status: "blocked",
          reason: "quota",
          quota,
        };
      }

      if (!conversation) {
        conversation = await deps.conversationStore.createOrLoadConversation({
          identity,
          scope,
          title: buildConversationTitle(input.filename || input.content),
        });
      }

      const contextSource = await deps.contextSourceStore.addSource({
        conversationId: conversation.id,
        identity,
        kind: input.kind,
        filename: input.filename,
        mimeType: input.mimeType,
        content: input.content,
        expiresAt: buildContextExpiration(identity.type, now()),
        now: now(),
      });

      return {
        status: "completed",
        conversationId: conversation.id,
        contextSource,
        quota,
      };
    },

    async adminDebugRetrieval(ctx, input) {
      assertAdminContext(ctx);
      const scope = input.scope ?? inferScope(input.routeContext);
      const sources = await deps.retrieve({
        query: input.query,
        scope,
        limit: Math.min(Math.max(input.limit ?? 8, 1), 12),
      });
      const sourceCards = buildSourceCards(sources);
      return {
        query: input.query,
        scope,
        sourceIds: sources.map((source) => source.sourceId),
        sources: sourceCards,
      };
    },

    async adminRunEvals(ctx, input) {
      assertAdminContext(ctx);
      const scope = input.scope ?? inferScope(input.routeContext);
      const questions = (input.questions?.length ? input.questions : defaultEvalQuestions(scope)).slice(0, 20);
      const items = [];
      for (const question of questions) {
        const sources = await deps.retrieve({ query: question, scope, limit: 5 });
        items.push({
          question,
          passed: sources.length > 0,
          sourceCount: sources.length,
          topSourceTitle: sources[0]?.postTitle ?? null,
          sourceIds: sources.map((source) => source.sourceId),
        });
      }
      return { items };
    },

    async adminExtractArticleIdeas(ctx, input) {
      assertAdminContext(ctx);
      const detail = await this.getConversation(ctx, { conversationId: input.conversationId });
      const userMessages = detail.messages.filter((message) => message.role === "user");
      const seedQuestions = userMessages.map((message) => message.content).slice(-4);
      const primary = seedQuestions[seedQuestions.length - 1] || detail.conversation.title || "Blog agent conversation";

      return {
        ideas: [
          {
            sourceConversationId: input.conversationId,
            proposedTitle: buildArticleIdeaTitle(primary),
            rationale:
              "This conversation surfaced a reader-facing question that can become a technical explainer with explicit assumptions, failure modes, and source-grounded examples.",
            seedQuestions,
          },
        ],
      };
    },

    async adminListRuns(ctx, input) {
      assertAdminContext(ctx);
      return deps.conversationStore.listRuns({
        limit: Math.min(Math.max(input.limit ?? 20, 1), 50),
      });
    },

    async sendMessage(ctx, input) {
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      const limit = getQuotaLimit(identity.type);
      const quota = await deps.quotaStore.reserveDailyMessage(identity, limit, now());

      if (!quota.allowed) {
        return {
          status: "blocked",
          reason: "quota",
          quota,
        };
      }

      const scope = input.scope ?? inferScope(input.routeContext);
      const conversation = await deps.conversationStore.createOrLoadConversation({
        conversationId: input.conversationId,
        identity,
        scope,
        title: buildConversationTitle(input.message),
      });
      const userMessage = await deps.conversationStore.addMessage({
        conversationId: conversation.id,
        role: "user",
        status: "completed",
        content: input.message,
      });
      const startedAt = now();
      const run = await deps.conversationStore.startRun({
        conversationId: conversation.id,
        userMessageId: userMessage.id,
        identity,
        scope,
      });

      try {
        const sources = await deps.retrieve({
          query: input.message,
          scope,
          limit: input.answerMode === "deep" ? 8 : 5,
        });
        const contextSources = await deps.contextSourceStore.listSources({
          conversationId: conversation.id,
          identity,
          now: now(),
        });
        if (sources.length === 0 && contextSources.length === 0) {
          const answer = createNoPublicSourceAnswer();
          const assistantMessage = await deps.conversationStore.addMessage({
            conversationId: conversation.id,
            role: "assistant",
            status: "completed",
            content: answer.answerMarkdown,
            sourceJson: { sourceCards: [] },
            usageJson: {
              inputTokens: 0,
              outputTokens: 0,
              model: null,
            },
          });

          await deps.conversationStore.finishRun({
            runId: run.id,
            assistantMessageId: assistantMessage.id,
            status: "completed",
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: now().getTime() - startedAt.getTime(),
            retrievedChunkIds: [],
          });

          return {
            status: "completed",
            conversationId: conversation.id,
            messageId: assistantMessage.id,
            answer,
            sourceCards: [],
            relatedQuestions: answer.relatedQuestions,
            quota,
            runStatus: "completed",
          };
        }
        const modelResult = await deps.model.generate({
          message: input.message,
          scope,
          routeContext: input.routeContext,
          sources,
          contextSources,
        });
        const answer = modelResult.answer;
        const assistantMessage = await deps.conversationStore.addMessage({
          conversationId: conversation.id,
          role: "assistant",
          status: "completed",
          content: answer.answerMarkdown,
          sourceJson: { sourceCards: answer.sourceCards },
          usageJson: {
            inputTokens: modelResult.inputTokens ?? 0,
            outputTokens: modelResult.outputTokens ?? 0,
            model: modelResult.model ?? null,
          },
        });

        await deps.conversationStore.finishRun({
          runId: run.id,
          assistantMessageId: assistantMessage.id,
          status: "completed",
          inputTokens: modelResult.inputTokens,
          outputTokens: modelResult.outputTokens,
          latencyMs: now().getTime() - startedAt.getTime(),
          retrievedChunkIds: [
            ...sources.map((source) => source.sourceId),
            ...contextSources.map((source) => source.sourceId),
          ],
        });

        return {
          status: "completed",
          conversationId: conversation.id,
          messageId: assistantMessage.id,
          answer,
          sourceCards: answer.sourceCards,
          relatedQuestions: answer.relatedQuestions,
          quota,
          runStatus: "completed",
        };
      } catch (error) {
        const errorCode = normalizeErrorCode(error);
        const failedMessage = await deps.conversationStore.addMessage({
          conversationId: conversation.id,
          role: "assistant",
          status: "failed",
          content: "The assistant could not complete this answer right now.",
          errorCode,
        });
        await deps.conversationStore.finishRun({
          runId: run.id,
          assistantMessageId: failedMessage.id,
          status: "failed",
          latencyMs: now().getTime() - startedAt.getTime(),
          errorCode,
        });

        return {
          status: "failed",
          conversationId: conversation.id,
          messageId: failedMessage.id,
          quota,
          runStatus: "failed",
          errorCode,
        };
      }
    },
  };
}

export const defaultAgentService = createAgentService({
  quotaStore: new PostgresQuotaStore(),
  conversationStore: new PostgresConversationStore(),
  contextSourceStore: new PostgresContextSourceStore(),
  model: defaultAgentModel,
  retrieve: ({ query, scope, limit }) =>
    searchPublicKnowledgeChunkSources({
      query,
      limit,
      scope,
    }),
});

export async function buildAgentContext(req: AgentContext["req"]): Promise<AgentContext> {
  return {
    req,
    session: await resolveBlogSession(req),
  };
}

export function inferScope(routeContext: AgentBootstrapInput["routeContext"]): AgentScope {
  if (routeContext.postSlug) return { type: "post", value: routeContext.postSlug };
  if (routeContext.categorySlug) return { type: "category", value: routeContext.categorySlug };
  if (routeContext.tagSlug) return { type: "tag", value: routeContext.tagSlug };
  if (routeContext.trackSlug) return { type: "track", value: routeContext.trackSlug };
  return { type: "site" };
}

function buildConversationTitle(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized || "Blog assistant";
}

function buildContextExpiration(identityType: AgentConversationRecord["ownerType"], now: Date) {
  if (identityType === "admin") return null;
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}

function buildSuggestedPrompts(scope: AgentScope) {
  if (scope.type === "post") {
    return [
      "Summarize the core argument of this article.",
      "Explain the key assumptions and failure modes.",
      "What should I read next on this blog?",
    ];
  }

  if (scope.type === "track" && scope.value === "ai-applications") {
    return [
      "What application engineering topics does this blog cover?",
      "How are harness engines and context engines related?",
      "Suggest a reading path for agent evaluation.",
    ];
  }

  return [
    "What are the main research themes on this blog?",
    "Suggest a reading path for long-context models.",
    "Compare the AI Algorithms and AI Applications tracks.",
  ];
}

function assertAdminContext(ctx: AgentContext) {
  const identity = resolveAgentIdentity(ctx.session, ctx.req);
  if (identity.type !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin authentication required",
    });
  }
}

function defaultEvalQuestions(scope: AgentScope) {
  if (scope.type === "track" && scope.value === "ai-applications") {
    return [
      "What is a harness engine?",
      "How should context engines manage source boundaries?",
      "What failure modes matter for tool-using agents?",
    ];
  }
  return [
    "What are the main technical themes on this blog?",
    "Suggest a reading path for long-context models.",
    "How do AI Algorithms and AI Applications differ?",
  ];
}

function buildArticleIdeaTitle(seed: string) {
  const normalized = seed.replace(/\s+/g, " ").trim().replace(/[?.!]+$/, "");
  const withoutLead = normalized.replace(/^(can you|could you|please|explain|what is|what are)\s+/i, "");
  const title = withoutLead.length > 0 ? withoutLead : normalized;
  return title.length > 90 ? `${title.slice(0, 87)}...` : title;
}

function normalizeErrorCode(error: unknown) {
  if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) return "model_not_configured";
  return "agent_generation_failed";
}
