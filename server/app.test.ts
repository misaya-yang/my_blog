import { createServer, request, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app";

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close(error => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

describe("agent stream request limits", () => {
  it("rejects oversized chunked JSON bodies before the stream handler", async () => {
    server = createServer(createApp());
    await new Promise<void>(resolve => server?.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not expose a TCP port");
    }

    const response = await postChunkedJson(
      address.port,
      JSON.stringify({
        message: "x".repeat(70 * 1024),
        routeContext: { path: "/" },
      })
    );

    expect(response.statusCode).toBe(413);
    expect(JSON.parse(response.body)).toEqual({
      error: "agent_stream_payload_too_large",
    });
  });
});

function postChunkedJson(
  port: number,
  body: string
): Promise<{ statusCode: number | undefined; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path: "/api/agent/stream",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "transfer-encoding": "chunked",
        },
      },
      res => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", chunk => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body: responseBody });
        });
      }
    );
    req.on("error", reject);
    const midpoint = Math.floor(body.length / 2);
    req.write(body.slice(0, midpoint));
    req.end(body.slice(midpoint));
  });
}
