import { describe, expect, it } from "vitest";
import { bakeNebulaGas, bakeNebulaHaze } from "./nebulaGas";
import { createRoseTracks } from "./roseTracks";

const tracks = createRoseTracks();

describe("nebula bake", () => {
  it("is deterministic, so reloads and screenshots match", () => {
    const a = bakeNebulaGas(tracks, 200);
    const b = bakeNebulaGas(tracks, 200);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
    expect(Array.from(a.colors)).toEqual(Array.from(b.colors));
  });

  it("produces finite, bounded attributes for every particle", () => {
    for (const sample of [
      bakeNebulaGas(tracks, 600),
      bakeNebulaHaze(tracks, 2000),
    ]) {
      expect(sample.positions.length).toBe(sample.count * 3);
      for (const value of sample.positions) {
        expect(Number.isFinite(value)).toBe(true);
        expect(Math.abs(value)).toBeLessThan(12);
      }
      for (const value of [...sample.colors, ...sample.dayColors]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
      for (const alpha of sample.alphas) {
        expect(alpha).toBeGreaterThan(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps most haze near the petal ridges rather than filling the flower", () => {
    const haze = bakeNebulaHaze(tracks, 4000);
    // Brightest motes sit on the ridge; the far tail is dimmer on average.
    const sorted = Array.from(haze.alphas).sort((x, y) => x - y);
    const median = sorted[Math.floor(sorted.length / 2)];
    expect(median).toBeLessThan(0.7);
    expect(sorted[sorted.length - 1]).toBeGreaterThan(0.9);
  });
});
