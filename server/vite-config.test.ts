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
