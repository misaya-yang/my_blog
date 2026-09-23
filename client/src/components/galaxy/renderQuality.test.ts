import { describe, expect, it } from "vitest";
import {
  RENDER_SCALES,
  RenderQuality,
  type RenderQualityInput,
} from "./renderQuality";

const desktop: RenderQualityInput = {
  devicePixelRatio: 2,
  mobile: false,
  coarsePointer: false,
  light: false,
  starCount: 300,
};

/** Feeds a steady frame interval for a duration; returns how often it changed. */
function run(
  quality: RenderQuality,
  frameMs: number,
  budgetMs: number,
  from: number,
  durationMs: number
) {
  let changes = 0;
  for (let t = from; t < from + durationMs; t += frameMs) {
    if (quality.observe(frameMs, budgetMs, t)) changes++;
  }
  return changes;
}

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

  it("caps reading pages at 1x and drops trails there", () => {
    const quality = new RenderQuality();
    expect(quality.apply({ ...desktop, reading: true })).toEqual({
      tier: 0,
      dpr: 1,
      bloomEnabled: true,
      trailCount: 0,
    });
  });

  it("keeps bloom in light mode, where it renders the ink bleed", () => {
    expect(
      new RenderQuality().apply({ ...desktop, light: true }).bloomEnabled
    ).toBe(true);
  });

  it("lowers resolution before giving up trails, then bloom", () => {
    const quality = new RenderQuality();
    for (let i = 1; i < RENDER_SCALES.length; i++) {
      expect(quality.degrade()).toBe(true);
      expect(quality.tier).toBe(0);
    }
    expect(quality.scale).toBe(RENDER_SCALES[RENDER_SCALES.length - 1]);
    expect(quality.degrade()).toBe(true);
    expect(quality.apply(desktop)).toMatchObject({
      tier: 1,
      bloomEnabled: true,
      trailCount: 150,
    });
    expect(quality.degrade()).toBe(true);
    expect(quality.degrade()).toBe(false);
    for (const light of [true, false]) {
      for (const mobile of [true, false]) {
        expect(quality.apply({ ...desktop, light, mobile })).toMatchObject({
          tier: 2,
          bloomEnabled: false,
          trailCount: 0,
        });
      }
    }
  });

  it("steps down under sustained overload and recovers with headroom", () => {
    const quality = new RenderQuality();
    // 30 ms frames against a 16.7 ms budget: slow for well over a second.
    expect(run(quality, 30, 1000 / 60, 0, 1500)).toBe(1);
    expect(quality.scale).toBe(RENDER_SCALES[1]);
    // Changes are rate limited even while the load persists.
    expect(run(quality, 30, 1000 / 60, 1500, 400)).toBe(0);
    // Back on budget: the scale returns after the recovery window.
    run(quality, 1000 / 60, 1000 / 60, 1900, 6000);
    expect(quality.scale).toBe(1);
  });

  it("backs off when an upgrade is immediately undone", () => {
    const quality = new RenderQuality();
    let t = 0;
    const phase = (frameMs: number, duration: number) => {
      const changes = run(quality, frameMs, 1000 / 60, t, duration);
      t += duration;
      return changes;
    };
    phase(30, 1500); // down to 0.85
    phase(1000 / 60, 6000); // recovers to 1
    expect(quality.scale).toBe(1);
    phase(30, 1500); // the same load returns right away: down again
    expect(quality.scale).toBe(RENDER_SCALES[1]);
    // The next recovery attempt now waits longer than the base window.
    expect(phase(1000 / 60, 5000)).toBe(0);
    expect(quality.scale).toBe(RENDER_SCALES[1]);
  });

  it("ignores stalls such as tab switches", () => {
    const quality = new RenderQuality();
    expect(quality.observe(5000, 1000 / 60, 0)).toBe(false);
    expect(run(quality, 1000 / 60, 1000 / 60, 10, 3000)).toBe(0);
    expect(quality.scale).toBe(1);
  });

  it("does not act on a slow window that a pause interrupted", () => {
    const quality = new RenderQuality();
    run(quality, 30, 1000 / 60, 0, 600); // slow, but not yet long enough
    // The loop resumes much later; the old window must not count.
    expect(quality.observe(30, 1000 / 60, 10000)).toBe(false);
    expect(quality.scale).toBe(1);
  });
});
