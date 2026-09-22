import { describe, expect, it } from "vitest";
import {
  calculateConstellationLayout,
  CONSTELLATION_LOCAL_RADIUS,
  retainConstellationParticle,
} from "./constellationLayout";

describe("article constellation layout", () => {
  it.each([
    { width: 390, height: 844, leftGutter: 12, rightGutter: 18 },
    { width: 768, height: 1024, leftGutter: 48, rightGutter: 32 },
    { width: 1440, height: 900, leftGutter: 220, rightGutter: 180 },
    { width: 2560, height: 1080, leftGutter: 650, rightGutter: 450 },
  ])("keeps motifs circular in CSS pixels at $width × $height", input => {
    const layout = calculateConstellationLayout(input);
    layout.forEach((motif, side) => {
      const gutter = side === 0 ? input.leftGutter : input.rightGutter;
      const radius = Math.max(60, Math.min(150, gutter * 0.42));
      const centerX = ((motif.x + 1) * input.width) / 2;
      expect(centerX).toBeCloseTo(
        side === 0 ? gutter / 2 : input.width - gutter / 2,
        8
      );
      const xRadius = (motif.z * CONSTELLATION_LOCAL_RADIUS * input.width) / 2;
      const yRadius = (motif.w * CONSTELLATION_LOCAL_RADIUS * input.height) / 2;
      expect(xRadius).toBeCloseTo(radius, 8);
      expect(yRadius).toBeCloseTo(radius, 8);
      if (gutter >= 120) {
        expect(centerX - radius).toBeGreaterThanOrEqual(
          side === 0 ? 0 : input.width - gutter
        );
        expect(centerX + radius).toBeLessThanOrEqual(
          side === 0 ? gutter : input.width
        );
      } else {
        expect(
          side === 0 ? centerX - radius : input.width - centerX - radius
        ).toBeLessThan(0);
      }
    });
  });

  it("keeps seeded vertical offsets bounded and stable across whole turns", () => {
    const input = {
      width: 1440,
      height: 900,
      leftGutter: 220,
      rightGutter: 180,
    };
    for (const seedPhase of [0, 0.25, 0.5, 0.75]) {
      const layout = calculateConstellationLayout({ ...input, seedPhase });
      const nextTurn = calculateConstellationLayout({
        ...input,
        seedPhase: seedPhase + 1,
      });
      expect(Math.abs(layout[0].y - 0.18)).toBeLessThanOrEqual(0.060000001);
      expect(Math.abs(layout[1].y + 0.2)).toBeLessThanOrEqual(0.050000001);
      expect(layout.map(item => item.toArray())).toEqual(
        nextTurn.map(item => item.toArray())
      );
    }
  });

  it("keeps exactly 24% of each full ID bucket independent of particle tier", () => {
    for (let row = 0; row < 6; row++) {
      let retained = 0;
      for (let id = 0; id < 10000; id++)
        retained += retainConstellationParticle(row, id / 65536);
      expect(retained).toBe(2400);
    }
  });

  it("matches Float32 shader selection at phase quantization boundaries", () => {
    for (let row = 0; row < 6; row++) {
      for (let id = 0; id <= 65536; id += 7) {
        for (const delta of [-0.00001, 0, 0.00001]) {
          const phase = Math.fround((id + delta) / 65536);
          const integer = Math.floor(
            Math.fround(Math.max(0, Math.min(1, phase)) * 65536)
          );
          const shaderHash =
            Math.fround(Math.fround(integer * 37) + Math.floor(row) * 17) % 100;
          expect(retainConstellationParticle(row, phase)).toBe(
            shaderHash < 24 ? 1 : 0
          );
        }
      }
    }
  });
});
