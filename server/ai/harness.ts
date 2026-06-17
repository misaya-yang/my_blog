import { TRPCError } from "@trpc/server";
import {
  AGENT_GUEST_COOKIE,
  buildAgentGuestCookie,
  createAgentGuestId,
  readCookie,
  resolveBlogSession,
} from "../auth.js";
import { appendSetCookieHeader } from "../httpRequest.js";
import {
  normalizeContextSourceInput,
  PostgresContextSourceStore,
  type ContextSourceStore,
} from "./contextSources.js";
import { AGENT_GOLDEN_QUESTIONS, getGoldenQuestionsForInput } from "./evals.js";
import {
  getKnowledgeIndexStatus,
  searchPublicKnowledgeChunkSources,
} from "./knowledgeDb.js";
import {
  analyzeKnowledgeQuery,
  isUnavailableContentQuery,
  type KnowledgeSearchResult,
} from "./knowledge.js";
import {
  PostgresConversationStore,
  type ConversationStore,
} from "./conversations.js";
import {
  getFileUploadQuotaLimit,
  getQuotaLimit,
  resolveAgentIdentity,
} from "./identity.js";
import {
  buildSourceCards,
  createFindPostAnswerForInput,
  createNoPublicSourceAnswerForInput,
  createPublicInventoryAnswerForInput,
  createSourceGroundedFallbackAnswer,
  defaultAgentModel,
} from "./model.js";
import { PostgresQuotaStore, type QuotaStore } from "./quota.js";
import type {
  AgentAddContextInput,
  AgentAddContextOutput,
  AgentAnswer,
  AgentArticleIdeaOutput,
  AgentBootstrapInput,
  AgentBootstrapOutput,
  AgentConversationDetail,
  AgentConversationRecord,
  AgentConversationMemoryTurn,
  AgentEvalRunOutput,
  AgentContext,
  AgentContextSourceRecord,
  AgentIdentity,
  AgentKnowledgeIndexStatusOutput,
  AgentModel,
  AgentQuota,
  AgentQuestionRadarOutput,
  AgentRetrievalDebugOutput,
  AgentRunRecord,
  AgentScope,
  AgentSendMessageInput,
  AgentSendMessageOutput,
  AgentStreamEvent,
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
    routeContext?: AgentBootstrapInput["routeContext"];
  }) => Promise<KnowledgeSearchResult[]>;
  getKnowledgeStatus: () => Promise<AgentKnowledgeIndexStatusOutput>;
  now?: () => Date;
};

export type AgentService = {
  bootstrap(
    ctx: AgentContext,
    input: AgentBootstrapInput
  ): Promise<AgentBootstrapOutput>;
  listConversations(ctx: AgentContext): Promise<AgentConversationRecord[]>;
  getConversation(
    ctx: AgentContext,
    input: { conversationId: string }
  ): Promise<AgentConversationDetail>;
  addContext(
    ctx: AgentContext,
    input: AgentAddContextInput
  ): Promise<AgentAddContextOutput>;
  adminDebugRetrieval(
    ctx: AgentContext,
    input: {
      query: string;
      routeContext: AgentBootstrapInput["routeContext"];
      scope?: AgentScope;
      limit?: number;
    }
  ): Promise<AgentRetrievalDebugOutput>;
  adminRunEvals(
    ctx: AgentContext,
    input: {
      questions?: string[];
      routeContext: AgentBootstrapInput["routeContext"];
      scope?: AgentScope;
    }
  ): Promise<AgentEvalRunOutput>;
  adminKnowledgeStatus(
    ctx: AgentContext
  ): Promise<AgentKnowledgeIndexStatusOutput>;
  adminExtractArticleIdeas(
    ctx: AgentContext,
    input: { conversationId: string }
  ): Promise<AgentArticleIdeaOutput>;
  adminQuestionRadar(
    ctx: AgentContext,
    input: { limit?: number }
  ): Promise<AgentQuestionRadarOutput>;
  adminListRuns(
    ctx: AgentContext,
    input: { limit?: number }
  ): Promise<AgentRunRecord[]>;
  sendMessage(
    ctx: AgentContext,
    input: AgentSendMessageInput
  ): Promise<AgentSendMessageOutput>;
  streamMessage(
    ctx: AgentContext,
    input: AgentSendMessageInput,
    emit: (event: AgentStreamEvent) => void,
    options?: { signal?: AbortSignal }
  ): Promise<AgentSendMessageOutput>;
};

export function createAgentService(deps: AgentServiceDeps): AgentService {
  const now = deps.now ?? (() => new Date());

  async function completeAssistantAnswer(input: {
    conversationId: string;
    runId: string;
    quota: AgentQuota;
    answer: AgentAnswer;
    sourceCards?: AgentAnswer["sourceCards"];
    latencyMs: number;
    retrievedChunkIds: string[];
    model: string | null;
  }): Promise<Extract<AgentSendMessageOutput, { status: "completed" }>> {
    const sourceCards = input.sourceCards ?? input.answer.sourceCards;
    const assistantMessage = await deps.conversationStore.addMessage({
      conversationId: input.conversationId,
      role: "assistant",
      status: "completed",
      content: input.answer.answerMarkdown,
      sourceJson: { sourceCards },
      usageJson: {
        inputTokens: 0,
        outputTokens: 0,
        model: input.model,
      },
    });

    await deps.conversationStore.finishRun({
      runId: input.runId,
      assistantMessageId: assistantMessage.id,
      status: "completed",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: input.latencyMs,
      retrievedChunkIds: input.retrievedChunkIds,
    });

    return {
      status: "completed",
      conversationId: input.conversationId,
      messageId: assistantMessage.id,
      answer: input.answer,
      sourceCards,
      relatedQuestions: input.answer.relatedQuestions,
      quota: input.quota,
      runStatus: "completed",
    };
  }

  return {
    async bootstrap(ctx, input) {
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      const limit = getQuotaLimit(identity.type);
      const quota = await deps.quotaStore.getDailyMessageQuota(
        identity,
        limit,
        now()
      );
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
      const quota = await deps.quotaStore.reserveDailyAction(
        identity,
        "file_upload",
        limit,
        now()
      );
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
        routeContext: input.routeContext,
      });
      const sourceCards = buildSourceCards(sources);
      return {
        query: input.query,
        scope,
        sourceIds: sources.map(source => source.sourceId),
        sources: sourceCards,
        diagnostics: buildRetrievalDiagnostics(input.query, sources),
      };
    },

    async adminRunEvals(ctx, input) {
      assertAdminContext(ctx);
      const scope = input.scope ?? inferScope(input.routeContext);
      const questions = getGoldenQuestionsForInput(
        input.questions ?? defaultEvalQuestions(scope)
      );
      const items = [];
      for (const golden of questions) {
        const itemScope = golden.scope ?? scope;
        const sources = await deps.retrieve({
          query: golden.question,
          scope: itemScope,
          limit: 6,
          routeContext: input.routeContext,
        });
        const sourceSlugs = new Set(
          sources
            .map(source => source.postSlug)
            .filter((slug): slug is string => Boolean(slug))
        );
        const missingSourceSlugs = golden.expectedSourceSlugs.filter(
          slug => !sourceSlugs.has(slug)
        );
        const failureReason = buildEvalFailureReason(
          golden.expectedBehavior,
          sources.length,
          missingSourceSlugs
        );
        const passed =
          golden.expectedBehavior === "refusal"
            ? sources.length === 0
            : sources.length > 0 && missingSourceSlugs.length === 0;
        items.push({
          question: golden.question,
          expectedBehavior: golden.expectedBehavior,
          category: golden.category,
          passed,
          sourceCount: sources.length,
          topSourceTitle: sources[0]?.postTitle ?? null,
          sourceIds: sources.map(source => source.sourceId),
          expectedSourceSlugs: golden.expectedSourceSlugs,
          missingSourceSlugs,
          failureReason: passed ? undefined : failureReason,
          notes: [
            ...golden.notes,
            ...(passed
              ? []
              : buildEvalFailureNotes(
                  golden.expectedBehavior,
                  sources.length,
                  missingSourceSlugs
                )),
          ],
        });
      }
      const passed = items.filter(item => item.passed).length;
      return {
        summary: {
          total: items.length,
          passed,
          failed: items.length - passed,
          successCases: items.filter(
            item => item.expectedBehavior === "sources"
          ).length,
          refusalCases: items.filter(
            item => item.expectedBehavior === "refusal"
          ).length,
          runAt: now(),
          retrievalStrategy: "supabase_keyword",
          modelProvider: "retrieval-only",
        },
        items,
      };
    },

    async adminKnowledgeStatus(ctx) {
      assertAdminContext(ctx);
      return deps.getKnowledgeStatus();
    },

    async adminExtractArticleIdeas(ctx, input) {
      assertAdminContext(ctx);
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      const conversation = await deps.conversationStore.getConversation({
        conversationId: input.conversationId,
        identity,
        allowAdminGlobal: true,
      });
      const messages = await deps.conversationStore.getMessages({
        conversationId: input.conversationId,
        identity,
        allowAdminGlobal: true,
      });
      const userMessages = messages.filter(message => message.role === "user");
      const seedQuestions = userMessages
        .map(message => message.content)
        .slice(-4);
      const primary =
        seedQuestions[seedQuestions.length - 1] ||
        conversation.title ||
        "Blog agent conversation";

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

    async adminQuestionRadar(ctx, input) {
      assertAdminContext(ctx);
      const runs = await deps.conversationStore.listRuns({
        limit: Math.min(Math.max(input.limit ?? 50, 1), 100),
      });
      return buildQuestionRadar(runs);
    },

    async adminListRuns(ctx, input) {
      assertAdminContext(ctx);
      return deps.conversationStore.listRuns({
        limit: Math.min(Math.max(input.limit ?? 20, 1), 50),
      });
    },

    async sendMessage(ctx, input) {
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      const requestedScope = input.scope ?? inferScope(input.routeContext);
      const existingConversation = input.conversationId
        ? await deps.conversationStore.createOrLoadConversation({
            conversationId: input.conversationId,
            identity,
            scope: requestedScope,
            title: buildConversationTitle(input.message),
          })
        : null;
      const scope = existingConversation
        ? scopeFromConversation(existingConversation)
        : requestedScope;
      const limit = getQuotaLimit(identity.type);
      const quota = await deps.quotaStore.reserveDailyMessage(
        identity,
        limit,
        now()
      );

      if (!quota.allowed) {
        return {
          status: "blocked",
          reason: "quota",
          quota,
        };
      }

      const conversation =
        existingConversation ??
        (await deps.conversationStore.createOrLoadConversation({
          identity,
          scope,
          title: buildConversationTitle(input.message),
        }));
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
      let sources: KnowledgeSearchResult[] = [];
      let contextSources: AgentContextSourceRecord[] = [];
      let conversationHistory: AgentConversationMemoryTurn[] = [];
      let currentPageContextInjected = false;

      try {
        if (isUnavailableContentQuery(input.message)) {
          const answer = createNoPublicSourceAnswerForInput({
            message: input.message,
            routeContext: input.routeContext,
          });

          return completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer,
            sourceCards: [],
            latencyMs: now().getTime() - startedAt.getTime(),
            retrievedChunkIds: [],
            model: null,
          });
        }
        sources = await deps.retrieve({
          query: input.message,
          scope,
          limit: input.answerMode === "deep" ? 8 : 5,
          routeContext: input.routeContext,
        });
        contextSources = await deps.contextSourceStore.listSources({
          conversationId: conversation.id,
          identity,
          now: now(),
        });
        conversationHistory = await loadConversationMemory({
          conversationStore: deps.conversationStore,
          conversationId: conversation.id,
          identity,
          currentUserMessageId: userMessage.id,
        });
        currentPageContextInjected = hasCurrentPageContext(sources);
        if (sources.length === 0 && contextSources.length === 0) {
          const answer = createNoPublicSourceAnswerForInput({
            message: input.message,
            routeContext: input.routeContext,
          });

          return completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer,
            sourceCards: [],
            latencyMs: now().getTime() - startedAt.getTime(),
            retrievedChunkIds: [],
            model: null,
          });
        }
        const inventoryAnswer = createPublicInventoryAnswerForInput({
          message: input.message,
          routeContext: input.routeContext,
          sources,
        });
        if (inventoryAnswer) {
          return completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer: inventoryAnswer,
            latencyMs: now().getTime() - startedAt.getTime(),
            retrievedChunkIds: sources.map(source => source.sourceId),
            model: "deterministic_inventory",
          });
        }
        const findPostAnswer = createFindPostAnswerForInput({
          message: input.message,
          routeContext: input.routeContext,
          sources,
        });
        if (findPostAnswer) {
          return completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer: findPostAnswer,
            latencyMs: now().getTime() - startedAt.getTime(),
            retrievedChunkIds: sources.map(source => source.sourceId),
            model: "deterministic_find_post",
          });
        }
        const modelResult = await deps.model.generate({
          message: input.message,
          scope,
          routeContext: input.routeContext,
          sources,
          contextSources,
          conversationHistory,
          currentPageContextInjected,
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
            ...sources.map(source => source.sourceId),
            ...contextSources.map(source => source.sourceId),
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
        if (shouldReturnSourceFallback(errorCode, sources, contextSources)) {
          const answer = createSourceGroundedFallbackAnswer({
            message: input.message,
            routeContext: input.routeContext,
            sources,
            contextSources,
            currentPageContextInjected,
            errorCode,
          });
          const assistantMessage = await deps.conversationStore.addMessage({
            conversationId: conversation.id,
            role: "assistant",
            status: "completed",
            content: answer.answerMarkdown,
            sourceJson: {
              sourceCards: answer.sourceCards,
              fallbackReason: errorCode,
            },
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
            retrievedChunkIds: [
              ...sources.map(source => source.sourceId),
              ...contextSources.map(source => source.sourceId),
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
        }

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

    async streamMessage(ctx, input, emit, options = {}) {
      const startedAt = now();
      const elapsedMs = () => now().getTime() - startedAt.getTime();
      const identity = resolveAgentIdentity(ctx.session, ctx.req);
      const requestedScope = input.scope ?? inferScope(input.routeContext);
      const existingConversation = input.conversationId
        ? await deps.conversationStore.createOrLoadConversation({
            conversationId: input.conversationId,
            identity,
            scope: requestedScope,
            title: buildConversationTitle(input.message),
          })
        : null;
      const scope = existingConversation
        ? scopeFromConversation(existingConversation)
        : requestedScope;
      const limit = getQuotaLimit(identity.type);
      const quota = await deps.quotaStore.reserveDailyMessage(
        identity,
        limit,
        now()
      );

      if (!quota.allowed) {
        const output: AgentSendMessageOutput = {
          status: "blocked",
          reason: "quota",
          quota,
        };
        emit({ type: "final", output, elapsedMs: elapsedMs() });
        return output;
      }

      emit({ type: "status", stage: "understanding", elapsedMs: elapsedMs() });

      const conversation =
        existingConversation ??
        (await deps.conversationStore.createOrLoadConversation({
          identity,
          scope,
          title: buildConversationTitle(input.message),
        }));
      const userMessage = await deps.conversationStore.addMessage({
        conversationId: conversation.id,
        role: "user",
        status: "completed",
        content: input.message,
      });
      const run = await deps.conversationStore.startRun({
        conversationId: conversation.id,
        userMessageId: userMessage.id,
        identity,
        scope,
      });
      let sources: KnowledgeSearchResult[] = [];
      let contextSources: AgentContextSourceRecord[] = [];
      let conversationHistory: AgentConversationMemoryTurn[] = [];
      let currentPageContextInjected = false;
      let answerStarted = false;

      try {
        if (isUnavailableContentQuery(input.message)) {
          const answer = createNoPublicSourceAnswerForInput({
            message: input.message,
            routeContext: input.routeContext,
          });
          emit({ type: "status", stage: "answer", elapsedMs: elapsedMs() });
          emit({
            type: "answer_delta",
            delta: answer.answerMarkdown,
            elapsedMs: elapsedMs(),
          });
          emit({ type: "status", stage: "saving", elapsedMs: elapsedMs() });

          const output = await completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer,
            sourceCards: [],
            latencyMs: elapsedMs(),
            retrievedChunkIds: [],
            model: null,
          });
          emit({ type: "final", output, elapsedMs: elapsedMs() });
          return output;
        }
        emit({ type: "status", stage: "retrieval", elapsedMs: elapsedMs() });
        sources = await deps.retrieve({
          query: input.message,
          scope,
          limit: input.answerMode === "deep" ? 8 : 5,
          routeContext: input.routeContext,
        });
        contextSources = await deps.contextSourceStore.listSources({
          conversationId: conversation.id,
          identity,
          now: now(),
        });
        conversationHistory = await loadConversationMemory({
          conversationStore: deps.conversationStore,
          conversationId: conversation.id,
          identity,
          currentUserMessageId: userMessage.id,
        });
        currentPageContextInjected = hasCurrentPageContext(sources);
        emit({
          type: "status",
          stage: "sources",
          elapsedMs: elapsedMs(),
          sourceCount: sources.length + contextSources.length,
          currentPageContextInjected,
        });

        if (sources.length === 0 && contextSources.length === 0) {
          const answer = createNoPublicSourceAnswerForInput({
            message: input.message,
            routeContext: input.routeContext,
          });

          const output = await completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer,
            sourceCards: [],
            latencyMs: elapsedMs(),
            retrievedChunkIds: [],
            model: null,
          });
          emit({
            type: "answer_delta",
            delta: answer.answerMarkdown,
            elapsedMs: elapsedMs(),
          });
          emit({ type: "final", output, elapsedMs: elapsedMs() });
          return output;
        }
        const inventoryAnswer = createPublicInventoryAnswerForInput({
          message: input.message,
          routeContext: input.routeContext,
          sources,
        });
        if (inventoryAnswer) {
          emit({ type: "status", stage: "answer", elapsedMs: elapsedMs() });
          emit({
            type: "answer_delta",
            delta: inventoryAnswer.answerMarkdown,
            elapsedMs: elapsedMs(),
          });
          emit({ type: "status", stage: "saving", elapsedMs: elapsedMs() });

          const output = await completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer: inventoryAnswer,
            latencyMs: elapsedMs(),
            retrievedChunkIds: sources.map(source => source.sourceId),
            model: "deterministic_inventory",
          });
          emit({ type: "final", output, elapsedMs: elapsedMs() });
          return output;
        }
        const findPostAnswer = createFindPostAnswerForInput({
          message: input.message,
          routeContext: input.routeContext,
          sources,
        });
        if (findPostAnswer) {
          emit({ type: "status", stage: "answer", elapsedMs: elapsedMs() });
          emit({
            type: "answer_delta",
            delta: findPostAnswer.answerMarkdown,
            elapsedMs: elapsedMs(),
          });
          emit({ type: "status", stage: "saving", elapsedMs: elapsedMs() });

          const output = await completeAssistantAnswer({
            conversationId: conversation.id,
            runId: run.id,
            quota,
            answer: findPostAnswer,
            latencyMs: elapsedMs(),
            retrievedChunkIds: sources.map(source => source.sourceId),
            model: "deterministic_find_post",
          });
          emit({ type: "final", output, elapsedMs: elapsedMs() });
          return output;
        }

        throwIfAborted(options.signal);
        emit({ type: "status", stage: "reasoning", elapsedMs: elapsedMs() });
        const modelResult = deps.model.streamGenerate
          ? await deps.model.streamGenerate({
              message: input.message,
              scope,
              routeContext: input.routeContext,
              sources,
              contextSources,
              conversationHistory,
              currentPageContextInjected,
              signal: options.signal,
              onAnswerDelta: delta => {
                if (!answerStarted) {
                  answerStarted = true;
                  emit({
                    type: "status",
                    stage: "answer",
                    elapsedMs: elapsedMs(),
                  });
                }
                emit({ type: "answer_delta", delta, elapsedMs: elapsedMs() });
              },
              onReasoningDelta: () => {},
            })
          : await deps.model.generate({
              message: input.message,
              scope,
              routeContext: input.routeContext,
              sources,
              contextSources,
              conversationHistory,
              currentPageContextInjected,
              signal: options.signal,
            });
        if (!deps.model.streamGenerate) {
          emit({ type: "status", stage: "answer", elapsedMs: elapsedMs() });
          emit({
            type: "answer_delta",
            delta: modelResult.answer.answerMarkdown,
            elapsedMs: elapsedMs(),
          });
        }

        throwIfAborted(options.signal);
        emit({ type: "status", stage: "saving", elapsedMs: elapsedMs() });
        const answer = modelResult.answer;
        const assistantMessage = await deps.conversationStore.addMessage({
          conversationId: conversation.id,
          role: "assistant",
          status: "completed",
          content: answer.answerMarkdown,
          sourceJson: {
            sourceCards: answer.sourceCards,
          },
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
          latencyMs: elapsedMs(),
          retrievedChunkIds: [
            ...sources.map(source => source.sourceId),
            ...contextSources.map(source => source.sourceId),
          ],
        });

        const output: AgentSendMessageOutput = {
          status: "completed",
          conversationId: conversation.id,
          messageId: assistantMessage.id,
          answer,
          sourceCards: answer.sourceCards,
          relatedQuestions: answer.relatedQuestions,
          quota,
          runStatus: "completed",
        };
        emit({
          type: "final",
          output,
          elapsedMs: elapsedMs(),
        });
        return output;
      } catch (error) {
        const errorCode = normalizeErrorCode(error);
        if (
          !answerStarted &&
          shouldReturnSourceFallback(errorCode, sources, contextSources)
        ) {
          const answer = createSourceGroundedFallbackAnswer({
            message: input.message,
            routeContext: input.routeContext,
            sources,
            contextSources,
            currentPageContextInjected,
            errorCode,
          });

          emit({ type: "status", stage: "answer", elapsedMs: elapsedMs() });
          emit({
            type: "answer_delta",
            delta: answer.answerMarkdown,
            elapsedMs: elapsedMs(),
          });
          emit({ type: "status", stage: "saving", elapsedMs: elapsedMs() });

          const assistantMessage = await deps.conversationStore.addMessage({
            conversationId: conversation.id,
            role: "assistant",
            status: "completed",
            content: answer.answerMarkdown,
            sourceJson: {
              sourceCards: answer.sourceCards,
              fallbackReason: errorCode,
            },
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
            latencyMs: elapsedMs(),
            retrievedChunkIds: [
              ...sources.map(source => source.sourceId),
              ...contextSources.map(source => source.sourceId),
            ],
          });

          const output: AgentSendMessageOutput = {
            status: "completed",
            conversationId: conversation.id,
            messageId: assistantMessage.id,
            answer,
            sourceCards: answer.sourceCards,
            relatedQuestions: answer.relatedQuestions,
            quota,
            runStatus: "completed",
          };
          emit({ type: "final", output, elapsedMs: elapsedMs() });
          return output;
        }

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
          latencyMs: elapsedMs(),
          errorCode,
        });

        const output: AgentSendMessageOutput = {
          status: "failed",
          conversationId: conversation.id,
          messageId: failedMessage.id,
          quota,
          runStatus: "failed",
          errorCode,
        };
        emit({ type: "error", message: errorCode, elapsedMs: elapsedMs() });
        emit({ type: "final", output, elapsedMs: elapsedMs() });
        return output;
      }
    },
  };
}

export const defaultAgentService = createAgentService({
  quotaStore: new PostgresQuotaStore(),
  conversationStore: new PostgresConversationStore(),
  contextSourceStore: new PostgresContextSourceStore(),
  model: defaultAgentModel,
  getKnowledgeStatus: getKnowledgeIndexStatus,
  retrieve: ({ query, scope, limit }) =>
    searchPublicKnowledgeChunkSources({
      query,
      limit,
      scope,
    }),
});

export async function buildAgentContext(
  req: AgentContext["req"],
  res?: unknown
): Promise<AgentContext> {
  const session = await resolveBlogSession(req);
  if (session.role === "anonymous") ensureAgentGuestCookie(req, res);

  return {
    req,
    session,
  };
}

function ensureAgentGuestCookie(req: AgentContext["req"], res?: unknown) {
  if (readCookie(req, AGENT_GUEST_COOKIE)) return;

  const guestId = createAgentGuestId();
  appendRequestCookie(req, AGENT_GUEST_COOKIE, guestId);
  if (res) appendSetCookieHeader(res, buildAgentGuestCookie(req, guestId));
}

function appendRequestCookie(
  req: AgentContext["req"],
  name: string,
  value: string
) {
  const headerValue = `${name}=${encodeURIComponent(value)}`;
  req.headers ??= {};
  const current = req.headers.cookie;
  if (Array.isArray(current)) {
    req.headers.cookie = [...current, headerValue];
    return;
  }
  req.headers.cookie = current ? `${current}; ${headerValue}` : headerValue;
}

export function inferScope(
  routeContext: AgentBootstrapInput["routeContext"]
): AgentScope {
  if (routeContext.postSlug)
    return { type: "post", value: routeContext.postSlug };
  if (routeContext.categorySlug)
    return { type: "category", value: routeContext.categorySlug };
  if (routeContext.tagSlug) return { type: "tag", value: routeContext.tagSlug };
  if (routeContext.trackSlug)
    return { type: "track", value: routeContext.trackSlug };
  return { type: "site" };
}

function scopeFromConversation(
  conversation: AgentConversationRecord
): AgentScope {
  return conversation.scopeValue
    ? { type: conversation.scopeType, value: conversation.scopeValue }
    : { type: conversation.scopeType };
}

function buildConversationTitle(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length > 80
    ? `${normalized.slice(0, 77)}...`
    : normalized || "Blog assistant";
}

function buildContextExpiration(
  identityType: AgentConversationRecord["ownerType"],
  now: Date
) {
  if (identityType === "admin") return null;
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}

async function loadConversationMemory(input: {
  conversationStore: ConversationStore;
  conversationId: string;
  identity: AgentIdentity;
  currentUserMessageId: string;
}): Promise<AgentConversationMemoryTurn[]> {
  const messages = await input.conversationStore.getMessages({
    conversationId: input.conversationId,
    identity: input.identity,
  });

  return messages
    .filter(
      message =>
        message.id !== input.currentUserMessageId &&
        message.status === "completed" &&
        (message.role === "user" || message.role === "assistant")
    )
    .slice(-6)
    .map(message => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: truncateConversationMemory(message.content),
    }));
}

function truncateConversationMemory(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 900
    ? `${normalized.slice(0, 897).trim()}...`
    : normalized;
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
  if (scope.type === "site") {
    return AGENT_GOLDEN_QUESTIONS.map(item => item.question);
  }
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

function buildRetrievalDiagnostics(
  query: string,
  sources: KnowledgeSearchResult[]
) {
  const analysis = analyzeKnowledgeQuery(query);
  const terms = analysis.terms;
  const haystack = sources
    .map(source =>
      [
        source.postTitle,
        source.postSlug,
        source.heading,
        source.categorySlug,
        ...source.tagSlugs,
        source.excerpt,
        source.relevanceReason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
    )
    .join(" ");
  const missingTerms = terms.filter(term => !haystack.includes(term));
  const hasSources = sources.length > 0;

  return {
    status: hasSources ? ("ready" as const) : ("no_sources" as const),
    terms,
    expandedTerms: analysis.expandedTerms,
    aliasExpansions: analysis.aliasExpansions,
    missingTerms,
    currentPageContextInjected: hasCurrentPageContext(sources),
    failureReason: hasSources ? undefined : ("retrieval_failure" as const),
    notes: hasSources
      ? [
          `Retrieved ${sources.length} public source${sources.length === 1 ? "" : "s"}.`,
        ]
      : [
          "No published/public knowledge chunk matched this query under the current scope.",
        ],
    suggestions: hasSources
      ? [
          "Inspect source slugs and headings before changing retrieval.",
          "If expected posts are missing, run the golden eval set to compare source recall.",
        ]
      : [
          "Check whether the target article is published and public.",
          "Run pnpm ai:reindex after publishing or changing seeded content.",
          "Try the public article title, slug, or primary tag as a debug query.",
        ],
  };
}

function hasCurrentPageContext(sources: KnowledgeSearchResult[]) {
  return sources.some(source =>
    source.relevanceReason
      .toLowerCase()
      .startsWith("current public article context")
  );
}

function buildEvalFailureReason(
  expectedBehavior: "sources" | "refusal",
  sourceCount: number,
  missingSourceSlugs: string[]
) {
  if (expectedBehavior === "refusal" && sourceCount > 0)
    return "refusal_boundary" as const;
  if (sourceCount === 0) return "retrieval_failure" as const;
  if (missingSourceSlugs.length > 0) return "wrong_source" as const;
  return "wrong_source" as const;
}

function buildEvalFailureNotes(
  expectedBehavior: "sources" | "refusal",
  sourceCount: number,
  missingSourceSlugs: string[]
) {
  if (expectedBehavior === "refusal" && sourceCount > 0) {
    return [
      "Expected no public source, but retrieval returned source cards. Review hidden/out-of-scope matching.",
    ];
  }
  if (sourceCount === 0) {
    return [
      "Expected public sources, but retrieval returned none. Reindex or improve query/tag matching.",
    ];
  }
  if (missingSourceSlugs.length > 0) {
    return [
      `Missing expected source slug(s): ${missingSourceSlugs.join(", ")}.`,
    ];
  }
  return ["Eval needs manual review."];
}

function buildArticleIdeaTitle(seed: string) {
  const normalized = seed
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?.!]+$/, "");
  const withoutLead = normalized.replace(
    /^(can you|could you|please|explain|what is|what are)\s+/i,
    ""
  );
  const title = withoutLead.length > 0 ? withoutLead : normalized;
  return title.length > 90 ? `${title.slice(0, 87)}...` : title;
}

function buildQuestionRadar(runs: AgentRunRecord[]): AgentQuestionRadarOutput {
  const questionGroups = new Map<
    string,
    {
      question: string;
      count: number;
      scopeType: NonNullable<AgentRunRecord["scopeType"]>;
      scopeValue: string | null;
      lastAskedAt: Date | null;
      runIds: string[];
      signalTypes: Set<"frequent" | "no_source" | "failed">;
    }
  >();
  const scopeCounts = new Map<
    string,
    {
      scopeType: AgentQuestionRadarOutput["scopeBreakdown"][number]["scopeType"];
      scopeValue: string | null;
      count: number;
    }
  >();
  const noSourceRuns: AgentQuestionRadarOutput["noSourceRuns"] = [];
  const failedRuns: AgentQuestionRadarOutput["failedRuns"] = [];

  for (const run of runs) {
    const scopeType = run.scopeType ?? "site";
    const scopeValue = run.scopeValue ?? null;
    const scopeKey = `${scopeType}:${scopeValue ?? ""}`;
    const scopeEntry = scopeCounts.get(scopeKey) ?? {
      scopeType,
      scopeValue,
      count: 0,
    };
    scopeEntry.count += 1;
    scopeCounts.set(scopeKey, scopeEntry);

    const noSource =
      (run.retrievedChunkIds ?? []).length === 0 && run.status === "completed";
    const failed = run.status === "failed" || Boolean(run.errorCode);
    const question = sanitizeQuestion(run.question);

    if (noSource) {
      noSourceRuns.push({
        runId: run.id,
        question,
        scopeType: run.scopeType ?? null,
        scopeValue,
        createdAt: run.createdAt ?? null,
      });
    }
    if (failed) {
      failedRuns.push({
        runId: run.id,
        question,
        errorCode: run.errorCode ?? null,
        scopeType: run.scopeType ?? null,
        scopeValue,
        createdAt: run.createdAt ?? null,
      });
    }
    if (!question) continue;

    const key = normalizeQuestionKey(question);
    const entry = questionGroups.get(key) ?? {
      question,
      count: 0,
      scopeType,
      scopeValue,
      lastAskedAt: null,
      runIds: [],
      signalTypes: new Set<"frequent" | "no_source" | "failed">(),
    };
    entry.count += 1;
    entry.runIds.push(run.id);
    if (
      !entry.lastAskedAt ||
      new Date(run.createdAt ?? 0).getTime() > entry.lastAskedAt.getTime()
    ) {
      entry.lastAskedAt = run.createdAt ?? null;
    }
    if (noSource) entry.signalTypes.add("no_source");
    if (failed) entry.signalTypes.add("failed");
    questionGroups.set(key, entry);
  }

  for (const entry of Array.from(questionGroups.values())) {
    if (entry.count > 1) entry.signalTypes.add("frequent");
  }

  const frequentQuestions = Array.from(questionGroups.values())
    .filter(entry => entry.count > 1 || entry.signalTypes.size > 0)
    .sort(
      (a, b) =>
        b.signalTypes.size - a.signalTypes.size ||
        b.count - a.count ||
        new Date(b.lastAskedAt ?? 0).getTime() -
          new Date(a.lastAskedAt ?? 0).getTime()
    )
    .slice(0, 12)
    .map(entry => ({
      question: entry.question,
      count: entry.count,
      scopeType: entry.scopeType,
      scopeValue: entry.scopeValue,
      lastAskedAt: entry.lastAskedAt,
      runIds: entry.runIds.slice(0, 5),
      signalTypes: Array.from(entry.signalTypes),
    }));

  return {
    summary: {
      totalRuns: runs.length,
      failedRuns: failedRuns.length,
      noSourceRuns: noSourceRuns.length,
      uniqueQuestions: questionGroups.size,
    },
    frequentQuestions,
    noSourceRuns: noSourceRuns.slice(0, 12),
    failedRuns: failedRuns.slice(0, 12),
    scopeBreakdown: Array.from(scopeCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    suggestedIdeas: frequentQuestions.slice(0, 6).map(item => ({
      ideaId: buildIdeaId(item.question),
      proposedTitle: buildArticleIdeaTitle(item.question),
      rationale: `Based on ${item.count} Agent signal${item.count === 1 ? "" : "s"} (${item.signalTypes.join(", ") || "question"}).`,
      supportCount: item.count,
      sourceRunIds: item.runIds,
      status: "new" as const,
    })),
  };
}

function sanitizeQuestion(question: string | null | undefined) {
  const normalized = (question ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > 180
    ? `${normalized.slice(0, 177)}...`
    : normalized;
}

function normalizeQuestionKey(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIdeaId(question: string) {
  return `agent-${normalizeQuestionKey(question).replace(/\s+/g, "-").slice(0, 80) || "idea"}`;
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error
    ? signal.reason
    : Object.assign(new Error("Agent stream aborted"), {
        name: "AbortError",
      });
}

function normalizeErrorCode(error: unknown) {
  if (isAbortLikeError(error)) return "agent_stream_aborted";
  if (
    error instanceof Error &&
    (error.message.includes("BUILT_IN_FORGE_API_KEY") ||
      error.message.includes("OPENAI_API_KEY"))
  )
    return "model_not_configured";
  return "agent_generation_failed";
}

function shouldReturnSourceFallback(
  errorCode: string,
  sources: KnowledgeSearchResult[],
  contextSources: AgentContextSourceRecord[]
) {
  return (
    errorCode === "model_not_configured" &&
    (sources.length > 0 || contextSources.length > 0)
  );
}

function isAbortLikeError(error: unknown) {
  if (error instanceof Error) {
    return error.name === "AbortError" || error.name === "TimeoutError";
  }
  return false;
}
