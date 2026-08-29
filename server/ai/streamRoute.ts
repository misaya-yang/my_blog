import { z } from "zod";
import { buildAgentContext, defaultAgentService } from "./harness.js";
import { agentSendMessageInput } from "./inputSchemas.js";
import type {
  AgentSendMessageInput,
  AgentStreamEvent,
  RequestLike,
} from "./types.js";

type RouteRegistrar = {
  post: (path: string, handler: (...args: unknown[]) => void) => void;
};

type StreamRequest = RequestLike & {
  body: unknown;
};

type StreamResponse = {
  status: (code: number) => void;
  setHeader: (name: string, value: string) => void;
  flushHeaders?: () => void;
  on: (event: "close", handler: () => void) => void;
  write: (chunk: string) => void;
  end: () => void;
  writableEnded: boolean;
};

export function registerAgentStreamRoute(app: RouteRegistrar) {
  app.post("/api/agent/stream", async (...args: unknown[]) => {
    const [req, res] = args as [StreamRequest, StreamResponse];
    let responsePrepared = false;

    let closed = false;
    const streamAbortController = new AbortController();
    res.on("close", () => {
      closed = true;
      if (!streamAbortController.signal.aborted) {
        const error = new Error("Agent stream closed by client");
        error.name = "AbortError";
        streamAbortController.abort(error);
      }
    });

    const emit = (event: AgentStreamEvent) => {
      if (closed) return;
      if (!responsePrepared) {
        prepareSseResponse(res);
        responsePrepared = true;
      }
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const input = agentSendMessageInput.parse(
        req.body
      ) as AgentSendMessageInput;
      const ctx = await buildAgentContext(req, res);
      prepareSseResponse(res);
      responsePrepared = true;
      await defaultAgentService.streamMessage(ctx, input, emit, {
        signal: streamAbortController.signal,
      });
    } catch (error) {
      const code = normalizeStreamError(error);
      emit({
        type: "error",
        message: code,
        code,
        terminal: true,
        elapsedMs: 0,
      });
    } finally {
      if (!closed && !res.writableEnded) res.end();
    }
  });
}

function prepareSseResponse(res: StreamResponse) {
  res.status(200);
  res.setHeader("content-type", "text/event-stream; charset=utf-8");
  res.setHeader("cache-control", "no-cache, no-transform");
  res.setHeader("connection", "keep-alive");
  res.flushHeaders?.();
}

export function normalizeStreamError(error: unknown) {
  if (error instanceof z.ZodError) return "invalid_agent_stream_input";
  if (error instanceof Error && error.name === "AbortError") {
    return "agent_stream_aborted";
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return "agent_stream_timeout";
  }
  return "agent_stream_failed";
}
