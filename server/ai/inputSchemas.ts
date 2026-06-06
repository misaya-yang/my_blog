import { z } from "zod";

export const agentRouteContextInput = z.object({
  path: z.string().trim().min(1).max(500),
  routeType: z
    .enum([
      "home",
      "post",
      "category",
      "tag",
      "search",
      "track",
      "archive",
      "public",
    ])
    .optional(),
  postSlug: z.string().trim().max(200).optional(),
  postTitle: z.string().trim().max(300).optional(),
  categorySlug: z.string().trim().max(160).optional(),
  tagSlug: z.string().trim().max(160).optional(),
  trackSlug: z.enum(["ai-algorithms", "ai-applications"]).optional(),
  locale: z.enum(["en", "zh"]).optional(),
});

export const agentScopeInput = z.object({
  type: z.enum(["site", "post", "category", "tag", "track"]),
  value: z.string().trim().max(200).optional(),
});

export const agentAnswerModeInput = z.enum([
  "summary",
  "deep",
  "compare",
  "reading_path",
]);

export const agentSendMessageInput = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
  routeContext: agentRouteContextInput,
  scope: agentScopeInput.optional(),
  answerMode: agentAnswerModeInput.optional(),
});
