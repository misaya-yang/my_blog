import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel routing guardrails", () => {
  it("keeps the function deadline above the client Agent stream timeout", () => {
    const configPath = join(process.cwd(), "vercel.json");
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      functions?: Record<string, { maxDuration?: number }>;
    };

    expect(config.functions?.["api/index.ts"]?.maxDuration).toBeGreaterThan(45);
  });

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
});
