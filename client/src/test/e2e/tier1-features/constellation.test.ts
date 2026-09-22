import { describe, expect, it } from "vitest";
import {
  AMBIENT_ENDPOINT_FADE,
  AMBIENT_ROWS,
  bakeAmbientTracks,
  getAmbientProfile,
} from "@/components/galaxy/ambientScene";
import { getPageScene } from "@/components/galaxy/pageScene";
import { TRACK_SAMPLES } from "@/components/galaxy/roseTracks";
import { samplePackedTrack } from "@/components/galaxy/sampleParticleBase";

describe("Tier 1: Feature Coverage - Deterministic Constellations & Morphing (F12, F13)", () => {
  it("generates deterministic FNV-1a hash seeds insensitive to URL query and hash fragments", () => {
    const p1 = getAmbientProfile("/post/distributed-systems");
    const p2 = getAmbientProfile(
      "/post/distributed-systems?source=feed&ref=banner"
    );
    const p3 = getAmbientProfile("/post/distributed-systems#section-2");

    expect(p1.family).toBe(p2.family);
    expect(p1.family).toBe(p3.family);
    expect(p1.driftX).toBe(p2.driftX);
    expect(p1.driftY).toBe(p3.driftY);
    expect(p1.glow).toBe(p2.glow);
    expect(p1.rows[0].points[0][0]).toBe(p2.rows[0].points[0][0]);
  });

  it("produces distinct artistic constellation motifs across article slugs", () => {
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
    const motifs = new Set(profiles.map(p => p.motif));

    // Must exhibit diversity across available families
    expect(motifs.size).toBeGreaterThanOrEqual(3);
    for (const p of profiles) {
      expect(p.family).toBe("constellation");
      expect(["leo", "centaur", "lyre", "cygnus", "crown"]).toContain(p.motif);
    }
  });

  it("ensures all generated contour coordinates are strictly finite without NaNs or infinities", () => {
    const testPaths = [
      "/post/a",
      "/post/b",
      "/archive",
      "/tags/webgl",
      "/about",
    ];

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

  it("preserves six rows with family-specific topology and continuous closed seams", () => {
    const profiles = [
      "/algorithms",
      "/applications",
      "/archive",
      "/series/agents",
    ].map(getAmbientProfile);
    expect(new Set(profiles.map(profile => profile.family)).size).toBe(4);
    for (const profile of profiles) {
      expect(profile.rows).toHaveLength(AMBIENT_ROWS);
      profile.rows.forEach((row, index) => {
        const open = profile.family === "ribbon" && index < 4;
        expect(row.closed).toBe(!open);
        expect(row.endpointFade).toBe(open ? AMBIENT_ENDPOINT_FADE : 0);
        expect(row.length).toBeGreaterThan(0);
        if (open) {
          const first = row.points[0],
            last = row.points.at(-1)!;
          expect(
            Math.hypot(...first.map((v, axis) => v - last[axis]))
          ).toBeGreaterThan(5);
        } else {
          expect(row.points.at(-1)).toEqual(row.points[0]);
          const incoming = row.points
            .at(-1)!
            .map((v, axis) => v - row.points.at(-2)![axis]);
          const outgoing = row.points[1].map(
            (v, axis) => v - row.points[0][axis]
          );
          const dot = incoming.reduce(
            (sum, v, axis) => sum + v * outgoing[axis],
            0
          );
          expect(
            dot / (Math.hypot(...incoming) * Math.hypot(...outgoing))
          ).toBeGreaterThan(0.995);
        }
        if (index >= 4)
          for (const [, , z] of row.points)
            expect(Math.abs(z + 0.9)).toBeLessThanOrEqual(0.121);
      });
    }
  });

  it("bakes ambient contours into exact (513 x 6 x 4) float buffer for GPU upload", () => {
    const profile = getAmbientProfile("/post/shader-art");
    const buffer = bakeAmbientTracks(profile);

    const expectedLength = (TRACK_SAMPLES + 1) * 6 * 4; // 513 * 6 * 4 = 12312
    expect(buffer).toBeInstanceOf(Float32Array);
    expect(buffer.length).toBe(expectedLength);

    // RGBA packs xyz + width. Closed/open topology belongs to row metadata.
    profile.rows.forEach((row, rowIndex) => {
      row.points.forEach((point, index) => {
        const offset = (rowIndex * (TRACK_SAMPLES + 1) + index) * 4;
        expect(buffer[offset + 3]).toBe(1);
        point.forEach((v, axis) =>
          expect(buffer[offset + axis]).toBeCloseTo(v, 5)
        );
      });
    });
  });

  it("interpolates actual packed track texels continuously in the CPU sampling path", () => {
    const packed = bakeAmbientTracks(getAmbientProfile("/archive"));
    for (let row = 0; row < AMBIENT_ROWS; row++) {
      const a = samplePackedTrack(packed, row, 100 / TRACK_SAMPLES);
      const b = samplePackedTrack(packed, row, 101 / TRACK_SAMPLES);
      const middle = samplePackedTrack(packed, row, 100.5 / TRACK_SAMPLES);
      for (let axis = 0; axis < 4; axis++)
        expect(middle[axis]).toBeCloseTo((a[axis] + b[axis]) / 2, 5);
      expect(samplePackedTrack(packed, row, 0)).toEqual(
        samplePackedTrack(packed, row, 1)
      );
    }
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
