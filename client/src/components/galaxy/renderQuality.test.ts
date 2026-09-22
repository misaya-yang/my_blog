import { describe, expect, it } from "vitest";
import { RenderQuality, type RenderQualityInput } from "./renderQuality";

const desktop: RenderQualityInput = {
  devicePixelRatio: 2,
  mobile: false,
  coarsePointer: false,
  light: false,
  starCount: 300,
};

describe("scene render quality", () => {
  it("uses the viewport budget without increasing the device pixel ratio", () => {
    const quality = new RenderQuality();
    expect(quality.apply(desktop)).toEqual({
      tier: 0,
      dpr: 1.5,
      bloomEnabled: true,
      trailCount: 300,
    });
    expect(quality.apply({ ...desktop, mobile: true }).dpr).toBe(1.5);
    expect(
      quality.apply({ ...desktop, mobile: true, coarsePointer: true }).dpr
    ).toBe(1.25);
    expect(quality.apply({ ...desktop, devicePixelRatio: 0.8 }).dpr).toBe(0.8);
  });

  it("retains a degradation across viewport, theme, and repeated reapplication", () => {
    const quality = new RenderQuality();
    expect(quality.degrade()).toBe(true);
    const reduced = quality.apply(desktop);
    expect(reduced).toEqual({
      tier: 1,
      dpr: 1,
      bloomEnabled: true,
      trailCount: 150,
    });
    const mobile = {
      ...desktop,
      mobile: true,
      coarsePointer: true,
      starCount: 128,
    };
    expect(quality.apply(mobile).trailCount).toBe(64);
    expect(quality.apply({ ...mobile, light: true }).bloomEnabled).toBe(false);
    // Counts are derived from the viewport budget, never halved a second time.
    expect(quality.apply(desktop)).toEqual(reduced);
    expect(quality.apply(desktop)).toEqual(reduced);
  });

  it("keeps the lowest tier without bloom or trails after resize and theme changes", () => {
    const quality = new RenderQuality();
    quality.degrade();
    quality.degrade();
    expect(quality.degrade()).toBe(false);
    for (const light of [true, false, true, false]) {
      for (const mobile of [true, false]) {
        expect(quality.apply({ ...desktop, light, mobile })).toEqual({
          tier: 2,
          dpr: 1,
          bloomEnabled: false,
          trailCount: 0,
        });
      }
    }
    expect(quality.tier).toBe(2);
  });
});
