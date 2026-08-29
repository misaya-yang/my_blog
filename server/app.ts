import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
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

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(
    "/api/agent/stream",
    express.json({ limit: AGENT_STREAM_MAX_BODY_BYTES })
  );
  app.use(
    "/api/agent/stream",
    (error: unknown, _req: Request, res: Response, next: NextFunction) => {
      if (isPayloadTooLargeError(error)) {
        res.status(413).json({ error: "agent_stream_payload_too_large" });
        return;
      }
      next(error);
    }
  );

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

function isPayloadTooLargeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "type" in error &&
    error.type === "entity.too.large"
  );
}
