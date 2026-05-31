import type { Express, Response } from "express";
import { z } from "zod";
import { buildAgentContext, defaultAgentService } from "./harness.js";
import type { AgentSendMessageInput, AgentStreamEvent } from "./types.js";

const routeContextSchema = z.object({
  path: z.string().min(1),
  routeType: z
    .enum(["home", "post", "category", "tag", "search", "track", "archive", "public"])
    .optional(),
  postSlug: z.string().optional(),
  postTitle: z.string().optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  trackSlug: z.enum(["ai-algorithms", "ai-applications"]).optional(),
  locale: z.enum(["en", "zh"]).optional(),
});

const scopeSchema = z.object({
  type: z.enum(["site", "post", "category", "tag", "track"]),
  value: z.string().optional(),
});

const streamInputSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
  routeContext: routeContextSchema,
  scope: scopeSchema.optional(),
  answerMode: z.enum(["summary", "deep", "compare", "reading_path"]).optional(),
});

export function registerAgentStreamRoute(app: Express) {
  app.post("/api/agent/stream", async (req, res) => {
    prepareSseResponse(res);

    let closed = false;
    res.on("close", () => {
      closed = true;
    });

    const emit = (event: AgentStreamEvent) => {
      if (closed) return;
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const input = streamInputSchema.parse(req.body) as AgentSendMessageInput;
      const ctx = await buildAgentContext(req);
      await defaultAgentService.streamMessage(ctx, input, emit);
    } catch (error) {
      emit({
        type: "error",
        message: normalizeStreamError(error),
        elapsedMs: 0,
      });
    } finally {
      if (!closed && !res.writableEnded) res.end();
    }
  });
}

function prepareSseResponse(res: Response) {
  res.status(200);
  res.setHeader("content-type", "text/event-stream; charset=utf-8");
  res.setHeader("cache-control", "no-cache, no-transform");
  res.setHeader("connection", "keep-alive");
  res.flushHeaders?.();
}

function normalizeStreamError(error: unknown) {
  if (error instanceof z.ZodError) return "invalid_agent_stream_input";
  if (error instanceof Error) return error.message;
  return "agent_stream_failed";
}
