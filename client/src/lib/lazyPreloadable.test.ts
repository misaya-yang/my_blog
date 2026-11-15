import { describe, expect, it, vi } from "vitest";
import { lazyPreloadable } from "./lazyPreloadable";

const Page = () => null;

describe("lazyPreloadable", () => {
  it("fetches the module once however often it is asked for", async () => {
    const load = vi.fn(async () => ({ default: Page }));
    const Lazy = lazyPreloadable(load);
    const [first, second] = await Promise.all([Lazy.preload(), Lazy.preload()]);
    await Lazy.preload();
    expect(load).toHaveBeenCalledTimes(1);
    expect(first).toBe(Page);
    expect(second).toBe(Page);
  });

  it("asks again after a failed fetch", async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Page }>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ default: Page });
    const Lazy = lazyPreloadable(load);
    await expect(Lazy.preload()).rejects.toThrow("offline");
    await expect(Lazy.preload()).resolves.toBe(Page);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
