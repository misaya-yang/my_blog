import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import { buildAgentContext, defaultAgentService } from "./harness.js";
import {
  agentRouteContextInput,
  agentScopeInput,
  agentSendMessageInput,
} from "./inputSchemas.js";

export const agentRouter = router({
  bootstrap: publicProcedure
    .input(
      z.object({
        routeContext: agentRouteContextInput,
        scope: agentScopeInput.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.bootstrap(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  listConversations: publicProcedure.query(async ({ ctx }) => {
    return defaultAgentService.listConversations(
      await buildAgentContext(ctx.req, ctx.res)
    );
  }),

  getConversation: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.getConversation(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  addContext: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid().optional(),
        routeContext: agentRouteContextInput,
        scope: agentScopeInput.optional(),
        kind: z.enum(["pasted_text", "text_file", "markdown_file"]),
        filename: z.string().trim().max(255).optional(),
        mimeType: z.string().trim().max(120).optional(),
        content: z.string().trim().min(1).max(20000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return defaultAgentService.addContext(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  adminDebugRetrieval: publicProcedure
    .input(
      z.object({
        query: z.string().trim().min(1).max(1000),
        routeContext: agentRouteContextInput,
        scope: agentScopeInput.optional(),
        limit: z.number().int().min(1).max(12).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.adminDebugRetrieval(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  adminRunEvals: publicProcedure
    .input(
      z.object({
        questions: z
          .array(z.string().trim().min(1).max(1000))
          .max(20)
          .optional(),
        routeContext: agentRouteContextInput,
        scope: agentScopeInput.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return defaultAgentService.adminRunEvals(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  adminKnowledgeStatus: publicProcedure.query(async ({ ctx }) => {
    return defaultAgentService.adminKnowledgeStatus(
      await buildAgentContext(ctx.req, ctx.res)
    );
  }),

  adminExtractArticleIdeas: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.adminExtractArticleIdeas(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  adminQuestionRadar: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.adminQuestionRadar(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  adminListRuns: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.adminListRuns(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),

  sendMessage: publicProcedure
    .input(agentSendMessageInput)
    .mutation(async ({ ctx, input }) => {
      return defaultAgentService.sendMessage(
        await buildAgentContext(ctx.req, ctx.res),
        input
      );
    }),
});
