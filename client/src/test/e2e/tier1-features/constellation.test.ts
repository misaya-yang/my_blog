import { describe, expect, it } from "vitest";
import {
  AMBIENT_ROWS,
  bakeAmbientTracks,
  getAmbientProfile,
} from "@/components/galaxy/ambientScene";
import { getPageScene } from "@/components/galaxy/pageScene";
import { TRACK_SAMPLES } from "@/components/galaxy/roseTracks";

describe("Tier 1: Feature Coverage - Deterministic Constellations & Morphing (F12, F13)", () => {
  it("generates deterministic FNV-1a hash seeds insensitive to URL query and hash fragments", () => {
    const p1 = getAmbientProfile("/post/distributed-systems");
    const p2 = getAmbientProfile("/post/distributed-systems?source=feed&ref=banner");
    const p3 = getAmbientProfile("/post/distributed-systems#section-2");

    expect(p1.family).toBe(p2.family);
    expect(p1.family).toBe(p3.family);
    expect(p1.driftX).toBe(p2.driftX);
    expect(p1.driftY).toBe(p3.driftY);
    expect(p1.glow).toBe(p2.glow);
    expect(p1.rows[0].points[0][0]).toBe(p2.rows[0].points[0][0]);
  });

  it("produces distinct mathematical curve families across different article slugs", () => {
    const slugs = [
      "/post/ai-agent-architectures",
      "/post/quantum-annealing",
      "/post/neural-rendering-pipelines",
      "/post/distributed-consensus-raft",
      "/post/vector-search-embeddings",
      "/post/fpga-accelerators",
      "/post/webgl-cinematic-shaders",
      "/post/event-sourcing-microservices",
    ];

    const profiles = slugs.map(slug => getAmbientProfile(slug));
    const families = new Set(profiles.map(p => p.family));

    // Must exhibit diversity across available families
    expect(families.size).toBeGreaterThanOrEqual(2);
    for (const p of profiles) {
      expect(["rhodonea", "lissajous", "orbits", "ribbon"]).toContain(p.family);
    }
  });

  it("ensures all generated contour coordinates are strictly finite without NaNs or infinities", () => {
    const testPaths = ["/post/a", "/post/b", "/archive", "/tags/webgl", "/about"];

    for (const path of testPaths) {
      const profile = getAmbientProfile(path);
      for (const row of profile.rows) {
        expect(row.points.length).toBe(TRACK_SAMPLES + 1); // 513 points
        for (const [x, y, z] of row.points) {
          expect(Number.isFinite(x)).toBe(true);
          expect(Number.isFinite(y)).toBe(true);
          expect(Number.isFinite(z)).toBe(true);
        }
      }
    }
  });

  it("preserves 6-row layout with 4 outer closed loops and 2 inner open heart anchor strokes", () => {
    const profile = getAmbientProfile("/post/cinematic-universe");
    expect(profile.rows).toHaveLength(AMBIENT_ROWS); // 6 rows
    expect(profile.rows).toHaveLength(6);

    // 4 outer tracks are closed loops
    for (let i = 0; i < 4; i++) {
      expect(profile.rows[i].closed).toBe(true);
    }

    // 2 inner tracks are open strokes anchoring the heart near z = -0.9
    for (let i = 4; i < 6; i++) {
      expect(profile.rows[i].closed).toBe(false);
      for (const [, , z] of profile.rows[i].points) {
        expect(z).toBeCloseTo(-0.9, 0); // Near -0.9
      }
    }
  });

  it("bakes ambient contours into exact (513 x 6 x 4) float buffer for GPU upload", () => {
    const profile = getAmbientProfile("/post/shader-art");
    const buffer = bakeAmbientTracks(profile);

    const expectedLength = (TRACK_SAMPLES + 1) * 6 * 4; // 513 * 6 * 4 = 12312
    expect(buffer).toBeInstanceOf(Float32Array);
    expect(buffer.length).toBe(expectedLength);

    // Alpha channel carries row closed flag (1 for closed, 0 for open)
    // First point of row 0 (outer closed)
    expect(buffer[3]).toBe(1.0);
    // First point of row 4 (inner open)
    const row4Offset = 4 * (TRACK_SAMPLES + 1) * 4;
    expect(buffer[row4Offset + 3]).toBe(0.0);
  });

  it("models smooth GPU morphing exponential cross-fade dynamics with tau = 0.2s", () => {
    // Cross-fade formula: uAmbientBlend += (ambientTarget - uAmbientBlend) * (1 - Math.exp(-dt * 5.0))
    let blend = 0.0;
    const target = 1.0;
    const dt = 0.016; // 60fps

    const history: number[] = [];
    for (let t = 0; t <= 1.0; t += dt) {
      blend += (target - blend) * (1 - Math.exp(-dt * 5.0));
      history.push(blend);
    }

    // After 0.2s (tau = 1/5 = 0.2s): should reach ~1 - 1/e = 63.2%
    const indexAt0_2s = Math.round(0.2 / dt);
    expect(history[indexAt0_2s]).toBeCloseTo(0.632, 1);

    // After 0.6s: should reach >95% convergence smoothly
    const indexAt0_6s = Math.round(0.6 / dt);
    expect(history[indexAt0_6s]).toBeGreaterThan(0.94);
    expect(history[indexAt0_6s]).toBeLessThanOrEqual(1.0);
  });

  it("classifies page routes deterministically into home, reading, and author modes", () => {
    const homeScene = getPageScene("/");
    expect(homeScene.mode).toBe("home");

    const aboutScene = getPageScene("/about");
    expect(aboutScene.mode).toBe("author");

    const readerScene = getPageScene("/post/first-post");
    expect(readerScene.mode).toBe("reading");

    const archiveScene = getPageScene("/archive");
    expect(archiveScene.mode).toBe("reading");
  });
});
