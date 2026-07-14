import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function collectRuntimeTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectRuntimeTypeScriptFiles(path);
    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts")) return [];
    return [path];
  });
}

describe("Vercel routing guardrails", () => {
  it("routes unmatched browser paths through the app shell function", () => {
    const configPath = join(process.cwd(), "vercel.json");
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };
    const rewrites = config.rewrites ?? [];

    expect(rewrites.at(-1)).toEqual({
      source: "/:path*",
      destination: "/api/index",
    });
    expect(rewrites.find(rewrite => rewrite.source === "/api/:path*")).toEqual({
      source: "/api/:path*",
      destination: "/api/index",
    });
  });

  it("routes known browser pages through the app shell function for route metadata", () => {
    const configPath = join(process.cwd(), "vercel.json");
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };
    const rewrites = config.rewrites ?? [];
    const browserRoutes = [
      "/",
      "/algorithms",
      "/applications",
      "/archive",
      "/search",
      "/about",
      "/login",
      "/manage",
      "/manage/agent",
      "/write",
      "/write/:slug",
      "/tags/:slug",
      "/categories/:slug",
      "/404",
    ];

    for (const source of browserRoutes) {
      expect(rewrites.find(rewrite => rewrite.source === source)).toEqual({
        source,
        destination: "/api/index",
      });
    }
  });

  it("keeps serverless runtime imports independent from TypeScript path aliases", () => {
    const runtimeFiles = [
      ...collectRuntimeTypeScriptFiles(join(process.cwd(), "api")),
      ...collectRuntimeTypeScriptFiles(join(process.cwd(), "server")),
    ];
    const aliasedImports = runtimeFiles.flatMap(file => {
      const source = readFileSync(file, "utf8");
      return /(?:from\s+|import\()\s*["'](?:@shared\/|@\/)/.test(source)
        ? [file]
        : [];
    });

    expect(aliasedImports).toEqual([]);
  });
});
