import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth.js";
import { appRouter } from "./routers.js";
import { createContext } from "./_core/context.js";
import { registerSeoRoutes } from "./seo.js";
import { registerClientRenderRoutes } from "./client-render.js";
import { registerAgentStreamRoute } from "./ai/streamRoute.js";

type CreateAppOptions = {
  clientFallback?: boolean;
};

const AGENT_STREAM_MAX_BODY_BYTES = 64 * 1024;

type PayloadLimitRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

type PayloadLimitResponse = {
  status: (code: number) => { json: (body: unknown) => void };
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use("/api/agent/stream", (...args: unknown[]) => {
    const [req, res, next] = args as [
      PayloadLimitRequest,
      PayloadLimitResponse,
      () => void,
    ];
    const contentLengthHeader = req.headers?.["content-length"];
    const contentLengthValue = Array.isArray(contentLengthHeader)
      ? contentLengthHeader[0]
      : contentLengthHeader;
    const contentLength = Number.parseInt(
      contentLengthValue || "",
      10
    );
    if (
      Number.isFinite(contentLength) &&
      contentLength > AGENT_STREAM_MAX_BODY_BYTES
    ) {
      res.status(413).json({ error: "agent_stream_payload_too_large" });
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  registerSeoRoutes(app);
  registerAgentStreamRoute(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (options.clientFallback) {
    registerClientRenderRoutes(app);
  }

  return app;
}
