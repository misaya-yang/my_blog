import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
    expect(rewrites.find((rewrite) => rewrite.source === "/api/:path*")).toEqual({
      source: "/api/:path*",
      destination: "/api/index",
    });
  });
});
