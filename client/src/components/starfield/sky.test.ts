import { describe, expect, it } from "vitest";
import {
  NEBULA_DEPTH,
  SKY_MARGIN,
  SKY_STARS,
  bandWarp,
  buildSky,
  panThrough,
  skyShare,
  skyTile,
} from "./sky";

/** Distance from the band's spine, in band units (0 on it, 0.5 farthest). */
const offBand = (x: number, y: number) => {
  const t = x + y + bandWarp(x, y);
  return Math.abs(t - Math.round(t));
};

describe("deep sky", () => {
  it("wraps the band's wander with the tile", () => {
    for (const [x, y] of [
      [0.13, 0.71],
      [0.5, 0.02],
      [0.91, 0.44],
    ])
      expect(bandWarp(x + 1, y - 1)).toBeCloseTo(bandWarp(x, y), 10);
  });

  it("is the same sky every time", () => {
    const a = buildSky(500);
    const b = buildSky(500);
    expect(Array.from(a.param)).toEqual(Array.from(b.param));
    expect(a.count).toBe(500);
  });

  it("gathers band stars onto the band and keeps everything in the tile", () => {
    const sky = buildSky(4000);
    let banded = 0;
    let near = 0;
    for (let i = 0; i < sky.count; i++) {
      const [x, y, depth, band] = sky.param.subarray(i * 4, i * 4 + 4);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(1);
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThanOrEqual(1);
      if (band) {
        banded++;
        if (offBand(x, y) < 0.15) near++;
      }
    }
    expect(banded).toBeGreaterThan(sky.count * 0.3);
    expect(near / banded).toBeGreaterThan(0.9);
  });

  it("sizes the tile past the viewport and draws stars by its area", () => {
    for (const [w, h] of [
      [390, 844],
      [1440, 900],
      [3840, 2160],
    ]) {
      const tile = skyTile(w, h);
      expect(tile).toBeGreaterThanOrEqual(Math.max(w, h) + 2 * SKY_MARGIN);
      expect(skyShare(tile)).toBeLessThanOrEqual(SKY_STARS);
    }
    expect(skyShare(skyTile(390, 844))).toBeLessThan(
      skyShare(skyTile(1440, 900))
    );
  });

  it("pans the band through the point a page asks for, the short way", () => {
    const tile = skyTile(1440, 900);
    const from = { x: 0, y: 0 };
    const pan = panThrough(1050, 430, 120, tile, from);
    const x = (1050 + SKY_MARGIN + pan.x * NEBULA_DEPTH) / tile;
    const y = (430 + SKY_MARGIN + pan.y * NEBULA_DEPTH) / tile;
    expect(offBand(x, y)).toBeLessThan(1e-3);
    // The slide along the band is kept as asked.
    expect((pan.x - pan.y) / 2).toBeCloseTo(120, 6);
    // A nearby point needs only a small move from there.
    const next = panThrough(1100, 400, 120, tile, pan);
    expect(Math.hypot(next.x - pan.x, next.y - pan.y)).toBeLessThan(200);
  });
});
