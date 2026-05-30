import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import { buildAgentContext, defaultAgentService } from "./harness.js";

const routeContextInput = z.object({
  path: z.string().trim().max(500),
  routeType: z.enum(["home", "post", "category", "tag", "search", "track", "archive", "public"]).optional(),
  postSlug: z.string().trim().max(200).optional(),
  postTitle: z.string().trim().max(300).optional(),
  categorySlug: z.string().trim().max(160).optional(),
  tagSlug: z.string().trim().max(160).optional(),
  trackSlug: z.enum(["ai-algorithms", "ai-applications"]).optional(),
  locale: z.enum(["en", "zh"]).optional(),
});

const scopeInput = z.object({
  type: z.enum(["site", "post", "category", "tag", "track"]),
  value: z.string().trim().max(200).optional(),
});

export const agentRouter = router({
  bootstrap: publicProcedure
    .input(
      z.object({
        routeContext: routeContextInput,
        scope: scopeInput.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.bootstrap(await buildAgentContext(ctx.req), input);
    }),

  listConversations: publicProcedure.query(async ({ ctx }) => {
    return defaultAgentService.listConversations(await buildAgentContext(ctx.req));
  }),

  getConversation: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.getConversation(await buildAgentContext(ctx.req), input);
    }),

  addContext: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid().optional(),
        routeContext: routeContextInput,
        scope: scopeInput.optional(),
        kind: z.enum(["pasted_text", "text_file", "markdown_file"]),
        filename: z.string().trim().max(255).optional(),
        mimeType: z.string().trim().max(120).optional(),
        content: z.string().trim().min(1).max(20000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return defaultAgentService.addContext(await buildAgentContext(ctx.req), input);
    }),

  adminDebugRetrieval: publicProcedure
    .input(
      z.object({
        query: z.string().trim().min(1).max(1000),
        routeContext: routeContextInput,
        scope: scopeInput.optional(),
        limit: z.number().int().min(1).max(12).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.adminDebugRetrieval(await buildAgentContext(ctx.req), input);
    }),

  adminRunEvals: publicProcedure
    .input(
      z.object({
        questions: z.array(z.string().trim().min(1).max(1000)).max(20).optional(),
        routeContext: routeContextInput,
        scope: scopeInput.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return defaultAgentService.adminRunEvals(await buildAgentContext(ctx.req), input);
    }),

  adminExtractArticleIdeas: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.adminExtractArticleIdeas(await buildAgentContext(ctx.req), input);
    }),

  adminListRuns: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return defaultAgentService.adminListRuns(await buildAgentContext(ctx.req), input);
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid().optional(),
        message: z.string().trim().min(1).max(4000),
        routeContext: routeContextInput,
        scope: scopeInput.optional(),
        answerMode: z.enum(["summary", "deep", "compare", "reading_path"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return defaultAgentService.sendMessage(await buildAgentContext(ctx.req), input);
    }),
});
