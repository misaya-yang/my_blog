import { describe, expect, it } from "vitest";
import {
  createPhaseSampler,
  ribbonDensity,
  ribbonWidth,
} from "./particleDistribution";

describe("irregular particle ribbons", () => {
  it("has continuous seams and both thin and broad stretches without losing the contour", () => {
    for (let track = 0; track < 4; track++) {
      expect(ribbonDensity(track, 0)).toBeCloseTo(ribbonDensity(track, 1));
      expect(ribbonWidth(track, 0)).toBeCloseTo(ribbonWidth(track, 1));
      const widths = Array.from({ length: 512 }, (_, i) =>
        ribbonWidth(track, i / 512)
      );
      expect(Math.min(...widths)).toBeGreaterThan(0.4);
      expect(Math.max(...widths) / Math.min(...widths)).toBeGreaterThan(2.5);
    }
  });
  it("allocates actual particles unevenly without empty sections or repeated identical rings", () => {
    const distributions = [];
    for (let track = 0; track < 4; track++) {
      const sample = createPhaseSampler(track);
      const bins = new Array(16).fill(0);
      let previous = 0;
      for (let i = 0; i < 16000; i++) {
        const phase = sample((i + 0.5) / 16000);
        expect(phase).toBeGreaterThanOrEqual(previous);
        bins[Math.floor(phase * 16)]++;
        previous = phase;
      }
      expect(Math.min(...bins)).toBeGreaterThan(150);
      expect(Math.max(...bins) / Math.min(...bins)).toBeGreaterThan(2.5);
      distributions.push(bins);
    }
    expect(distributions[0]).not.toEqual(distributions[1]);
  });
});
