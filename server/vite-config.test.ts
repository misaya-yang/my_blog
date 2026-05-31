import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config";
import { resolveViteConfigForDev } from "./_core/vite";

describe("development Vite config resolution", () => {
  it("resolves function-style Vite config before creating middleware", async () => {
    const config = await resolveViteConfigForDev(viteConfig);

    expect(config.root).toContain("client");
    expect(config.resolve?.alias).toBeTruthy();
  });
});

describe("production chunking guardrails", () => {
  it("does not split lucide-react into a separate icons chunk that can cycle with React", async () => {
    const config = typeof viteConfig === "function" ? await viteConfig({ mode: "production", command: "build" }) : viteConfig;
    const manualChunks = config.build?.rollupOptions?.output?.manualChunks;

    expect(typeof manualChunks).toBe("function");
    if (typeof manualChunks === "function") {
      expect(manualChunks("/repo/node_modules/lucide-react/dist/esm/icons/book-open.js", {})).not.toBe("icons");
    }
  });
});
