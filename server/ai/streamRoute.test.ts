import { describe, expect, it, vi } from "vitest";
import { registerAgentStreamRoute } from "./streamRoute";

describe("agent stream route", () => {
  it("returns a terminal SSE error for invalid stream input", async () => {
    let handler: ((req: unknown, res: unknown) => void | Promise<void>) | null =
      null;
    registerAgentStreamRoute({
      post: (_path, routeHandler) => {
        handler = routeHandler as typeof handler;
      },
    });

    const chunks: string[] = [];
    const closeHandlers: Array<() => void> = [];
    const res = {
      status: vi.fn(),
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn((_event: "close", callback: () => void) => {
        closeHandlers.push(callback);
      }),
      write: vi.fn((chunk: string) => {
        chunks.push(chunk);
      }),
      end: vi.fn(),
      writableEnded: false,
    };

    await Promise.resolve(
      handler?.(
        {
          body: { message: "" },
          headers: {},
          socket: { remoteAddress: "203.0.113.61" },
        },
        res
      )
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith(
      "content-type",
      "text/event-stream; charset=utf-8"
    );
    expect(chunks.join("")).toContain("event: error");
    expect(chunks.join("")).toContain('"code":"invalid_agent_stream_input"');
    expect(chunks.join("")).toContain('"terminal":true');
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(closeHandlers).toHaveLength(1);
  });
});
