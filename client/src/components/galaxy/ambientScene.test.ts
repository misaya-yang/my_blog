import { describe, expect, it } from "vitest";
import {
  AMBIENT_ENDPOINT_FADE,
  bakeAmbientTracks,
  getAmbientProfile,
  getHomeFigureProfile,
} from "./ambientScene";
import { HOME_FIGURE_MOTIFS } from "./articleConstellations";
import { PETAL_TRACKS, TRACK_SAMPLES } from "./roseTracks";

const profiles = [
  "/algorithms",
  "/applications",
  "/archive",
  "/about",
  "/series/agents",
  "/post/flow",
  "/post/agent",
  "/post/flow-matching-generative-models",
].map(getAmbientProfile);
const distance = (a: number[], b: number[]) =>
  Math.hypot(...a.map((value, axis) => value - b[axis]));

describe("per-article ambient constellation", () => {
  it("is deterministic per article and ignores query strings", () => {
    expect(getAmbientProfile("/post/flow")).toEqual(
      getAmbientProfile("/post/flow")
    );
    expect(getAmbientProfile("/post/flow?x=1#ref")).toEqual(
      getAmbientProfile("/post/flow")
    );
  });

  it("distinguishes article motifs and preserves four nonarticle families", () => {
    expect(
      new Set(
        profiles
          .filter(profile => !profile.motif)
          .map(profile => profile.family)
      ).size
    ).toBe(4);
    const a = getAmbientProfile("/post/flow");
    const b = getAmbientProfile("/post/agent");
    const c = getAmbientProfile("/archive");
    expect(a.family).toBe("constellation");
    expect(b.family).toBe("constellation");
    expect(a.motif).not.toBe(b.motif);
    expect(c.family).toBeDefined();
    expect(a.rows).toHaveLength(6);
  });

  it("marks ribbons open with endpoint fades and inner loops with their actual topology", () => {
    for (const profile of profiles) {
      profile.rows.forEach((row, index) => {
        const isOpen =
          profile.family === "constellation" ||
          (profile.family === "ribbon" && index < PETAL_TRACKS);
        expect(row.closed).toBe(!isOpen);
        expect(row.endpointFade).toBe(isOpen ? AMBIENT_ENDPOINT_FADE : 0);
        if (isOpen) {
          expect(distance(row.points[0], row.points.at(-1)!)).toBeGreaterThan(
            profile.family === "constellation" ? 0.5 : 5
          );
          expect(row.endpointFade).toBeGreaterThan(0);
          expect(row.endpointFade).toBeLessThan(0.1);
        }
      });
    }
  });

  it("closes loop positions exactly and aligns the sampled seam tangents", () => {
    for (const profile of profiles) {
      for (const row of profile.rows.filter(row => row.closed)) {
        const points = row.points;
        expect(points.at(-1)).toEqual(points[0]);
        const outgoing = points[1].map((v, axis) => v - points[0][axis]);
        const incoming = points
          .at(-1)!
          .map((v, axis) => v - points.at(-2)![axis]);
        const alignment =
          outgoing.reduce(
            (sum, value, axis) => sum + value * incoming[axis],
            0
          ) /
          (Math.hypot(...incoming) * Math.hypot(...outgoing));
        expect(alignment).toBeGreaterThan(0.995);
      }
    }
  });

  it("resamples every family by arc length without the former parameter-speed surges", () => {
    for (const profile of profiles) {
      for (const row of profile.rows) {
        expect(row.points).toHaveLength(TRACK_SAMPLES + 1);
        const steps = row.points
          .slice(1)
          .map((point, index) => distance(point, row.points[index]));
        const mean = steps.reduce((sum, step) => sum + step, 0) / steps.length;
        expect(row.length).toBeCloseTo(mean * TRACK_SAMPLES, 8);
        expect(row.length).toBeGreaterThan(0);
        // Chords cut across the curve at tight petal turns, so they can be
        // shorter than their arc. Away from those turns the texture steps
        // are uniform, and no step jumps or accelerates across the canvas.
        const ordered = [...steps].sort((a, b) => a - b);
        expect(ordered[Math.floor(steps.length * 0.05)] / mean).toBeGreaterThan(
          0.95
        );
        expect(Math.max(...steps) / mean).toBeLessThan(1.02);
      }
    }
  });

  it("bakes xyz plus width independently of topology and preserves closed seams", () => {
    for (const profile of profiles) {
      const data = bakeAmbientTracks(profile);
      expect(data.length).toBe((TRACK_SAMPLES + 1) * 6 * 4);
      profile.rows.forEach((row, rowIndex) => {
        const start = rowIndex * (TRACK_SAMPLES + 1) * 4;
        for (let i = 0; i <= TRACK_SAMPLES; i++) {
          const offset = start + i * 4;
          expect(data[offset + 3]).toBe(1);
          row.points[i].forEach((value, axis) => {
            expect(Number.isFinite(data[offset + axis])).toBe(true);
            expect(data[offset + axis]).toBeCloseTo(value, 5);
          });
        }
        if (row.closed)
          expect([...data.slice(start, start + 4)]).toEqual([
            ...data.slice(
              start + TRACK_SAMPLES * 4,
              start + TRACK_SAMPLES * 4 + 4
            ),
          ]);
      });
    }
  });
});

describe("home figure", () => {
  it("picks among every home motif, never the one shown last", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed < 400; seed++) {
      const profile = getHomeFigureProfile(seed, "spiral");
      expect(profile.family).toBe("constellation");
      expect(profile.motif).not.toBe("spiral");
      seen.add(profile.motif!);
    }
    expect(seen).toEqual(
      new Set(HOME_FIGURE_MOTIFS.filter(motif => motif !== "spiral"))
    );
    expect(getHomeFigureProfile(7, null, "orion").motif).toBe("orion");
  });

  it("draws one figure twice over rather than a mirrored pair", () => {
    const profile = getHomeFigureProfile(11, null, "cassiopeia");
    // Rows 0/2/4 and 1/3/5 trace the same strokes, a few hundredths apart.
    for (let stroke = 0; stroke < 3; stroke++) {
      const a = profile.rows[stroke * 2].points;
      const b = profile.rows[stroke * 2 + 1].points;
      let gap = 0;
      for (let i = 0; i <= TRACK_SAMPLES; i += 16)
        gap = Math.max(gap, distance(a[i], b[i]));
      expect(gap).toBeLessThan(0.25);
    }
  });
});
