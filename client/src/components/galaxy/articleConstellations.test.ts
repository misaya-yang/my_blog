import { describe, expect, it } from "vitest";
import {
  ARTICLE_CONSTELLATION_MOTIFS,
  createArticleConstellation,
} from "./articleConstellations";
import {
  AMBIENT_ENDPOINT_FADE,
  bakeAmbientTracks,
  getAmbientProfile,
} from "./ambientScene";
import { TRACK_SAMPLES } from "./roseTracks";

const examples = [0, 1, 2, 4, 6].map(id => `/post/motif-${id}`);
const distance = (a: number[], b: number[]) =>
  Math.hypot(...a.map((v, axis) => v - b[axis]));

describe("article-specific artistic star paths", () => {
  it("covers five visually different motifs, stable across queries and hashes", () => {
    const profiles = examples.map(getAmbientProfile);
    expect(new Set(profiles.map(profile => profile.motif))).toEqual(
      new Set(ARTICLE_CONSTELLATION_MOTIFS)
    );
    profiles.forEach((profile, i) => {
      expect(profile.family).toBe("constellation");
      expect(profile).toEqual(
        getAmbientProfile(`${examples[i]}?utm_source=notes#section`)
      );
    });
    // Different names must also be genuinely different sampled geometry.
    for (let a = 0; a < profiles.length; a++)
      for (let b = a + 1; b < profiles.length; b++) {
        let difference = 0;
        for (let row = 0; row < 6; row++)
          for (let sample = 0; sample <= TRACK_SAMPLES; sample += 32)
            difference += distance(
              profiles[a].rows[row].points[sample],
              profiles[b].rows[row].points[sample]
            );
        expect(difference / (6 * 17)).toBeGreaterThan(0.6);
      }
  });

  it("builds each side from three connected strokes rather than repeated concentric paths", () => {
    ARTICLE_CONSTELLATION_MOTIFS.forEach((name, index) => {
      let first = true;
      const figure = createArticleConstellation(() => {
        if (first) {
          first = false;
          return (index + 0.5) / ARTICLE_CONSTELLATION_MOTIFS.length;
        }
        return 0.37;
      });
      expect(figure.motif).toBe(name);
      for (const parity of [0, 1]) {
        const strokes = [0, 1, 2].map(
          stroke => figure.rows[stroke * 2 + parity]
        );
        const connected = new Set([0]);
        for (let round = 0; round < 3; round++)
          strokes.forEach((stroke, i) => {
            if (
              [...connected].some(j =>
                stroke.some(a => strokes[j].some(b => distance(a, b) < 1e-10))
              )
            )
              connected.add(i);
          });
        expect(connected.size).toBe(3);
        expect(strokes[0]).not.toEqual(strokes[1]);
        expect(strokes[1]).not.toEqual(strokes[2]);
        const points = strokes.flat();
        const width =
          Math.max(...points.map(p => p[0])) -
          Math.min(...points.map(p => p[0]));
        const height =
          Math.max(...points.map(p => p[1])) -
          Math.min(...points.map(p => p[1]));
        expect(width).toBeGreaterThan(3);
        expect(height).toBeGreaterThan(3);
        expect(
          Math.min(width, height) / Math.max(width, height)
        ).toBeGreaterThan(0.55);
      }
    });
  });

  it("keeps all six open paths bounded, arc-length sampled and compatible with xyz-width textures", () => {
    for (const path of examples) {
      const profile = getAmbientProfile(path);
      const packed = bakeAmbientTracks(profile);
      expect(profile.rows).toHaveLength(6);
      expect(packed.length).toBe(6 * (TRACK_SAMPLES + 1) * 4);
      for (let i = 3; i < packed.length; i += 4) expect(packed[i]).toBe(1);
      for (const row of profile.rows) {
        expect(row.closed).toBe(false);
        expect(row.endpointFade).toBe(AMBIENT_ENDPOINT_FADE);
        expect(row.points).toHaveLength(TRACK_SAMPLES + 1);
        expect(distance(row.points[0], row.points.at(-1)!)).toBeGreaterThan(
          0.5
        );
        for (const [x, y, z] of row.points) {
          expect(Math.max(Math.abs(x), Math.abs(y))).toBeLessThan(3.5);
          expect(Math.abs(z)).toBeLessThan(0.15);
        }
        const steps = row.points
          .slice(1)
          .map((point, i) => distance(point, row.points[i]));
        const mean = row.length / TRACK_SAMPLES;
        expect(Math.min(...steps) / mean).toBeGreaterThan(0.9);
        expect(Math.max(...steps) / mean).toBeLessThan(1.01);
      }
    }
  });

  it("limits the new motifs to article routes", () => {
    for (const path of [
      "/",
      "/algorithms",
      "/applications",
      "/archive",
      "/about",
      "/tags/ai",
    ]) {
      const profile = getAmbientProfile(path);
      expect(profile.family).not.toBe("constellation");
      expect(profile.motif).toBeUndefined();
    }
  });
});
