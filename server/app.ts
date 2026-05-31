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

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

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
