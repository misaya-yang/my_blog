import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { createClientRenderMiddleware } from "../client-render";

export async function resolveViteConfigForDev(configExport: typeof viteConfig) {
  if (typeof configExport !== "function") return configExport;

  return await configExport({
    command: "serve",
    mode: process.env.NODE_ENV || "development",
    isSsrBuild: false,
    isPreview: false,
  });
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const resolvedViteConfig = await resolveViteConfigForDev(viteConfig);
  const vite = await createViteServer({
    ...resolvedViteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  const clientTemplate = path.resolve(
    import.meta.dirname,
    "../..",
    "client",
    "index.html"
  );

  app.use(
    createClientRenderMiddleware({
      indexHtmlPath: clientTemplate,
      prepareHtml: (html) =>
        html.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        ),
      transformHtml: async (url, html) => {
        try {
          return await vite.transformIndexHtml(url, html);
        } catch (error) {
          vite.ssrFixStacktrace(error as Error);
          throw error;
        }
      },
    })
  );
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  app.use(
    createClientRenderMiddleware({
      indexHtmlPath: path.resolve(distPath, "index.html"),
    })
  );
}
