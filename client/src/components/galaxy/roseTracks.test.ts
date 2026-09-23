import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import {
  bakeTracks,
  createRoseTracks,
  PETAL_LAYERS,
  petalContour,
  sampleTrack,
  TRACK_SAMPLES,
} from "./roseTracks";

describe("continuous rose tracks", () => {
  const tracks = createRoseTracks();
  it("builds four nested, regular petal layers around the heart", () => {
    const petals = tracks.filter(track => track.closed);
    expect(petals).toHaveLength(4);
    const radii = petals.map(track =>
      Array.from({ length: 512 }, (_, i) => {
        const p = sampleTrack(track, i / 512);
        return Math.hypot(p.x, p.y);
      })
    );
    // Nested: every layer lies inside the one around it.
    for (let row = 1; row < 4; row++)
      expect(Math.max(...radii[row])).toBeLessThan(
        Math.min(...radii[row - 1]) + 0.05
      );
    // Regular: each layer's outline stays within its lobe depth of a circle.
    PETAL_LAYERS.forEach((layer, row) => {
      const spread = Math.max(...radii[row]) - Math.min(...radii[row]);
      expect(spread / layer.radius).toBeLessThan(layer.lobe * 1.8);
      expect(spread / layer.radius).toBeGreaterThan(layer.lobe * 0.8);
    });
    // Each petal is a lobe: the outline swells exactly `petals` times.
    PETAL_LAYERS.forEach(layer => {
      const contour = petalContour(layer, 360).map(p =>
        Math.hypot(p.x - layer.cx, p.y - layer.cy)
      );
      const peaks = contour.filter(
        (r, i) => r > contour[(i + 359) % 360] && r >= contour[(i + 1) % 360]
      );
      expect(peaks).toHaveLength(layer.petals);
    });
    petals.forEach(track =>
      expect(track.length / track.period).toBeCloseTo(0.24, 12)
    );
    // The recessed heart leaves room for the signature.
    expect(Math.min(...radii[3])).toBeGreaterThan(0.82);
    expect(tracks[4].length).toBeCloseTo(2.8441526812634637, 12);
    expect(tracks[5].length).toBeCloseTo(2.750395058716414, 12);
    expect(
      tracks.slice(4).every(track => track.signature && !track.closed)
    ).toBe(true);
  });
  it("cups the petals: outer layers rise toward the viewer above the heart", () => {
    const depth = tracks
      .slice(0, 4)
      .map(
        track =>
          Array.from(
            { length: 64 },
            (_, i) => sampleTrack(track, i / 64).z
          ).reduce((a, b) => a + b) / 64
      );
    for (let row = 1; row < 4; row++)
      expect(depth[row]).toBeLessThan(depth[row - 1]);
    expect(depth[3]).toBeGreaterThan(-1.42);
  });
  it("closes every petal with matching position and tangent, without translating the shape", () => {
    for (const track of tracks.filter(t => t.closed)) {
      expect(sampleTrack(track, 0).distanceTo(sampleTrack(track, 1))).toBe(0);
      expect(
        track.curve.getTangentAt(0).dot(track.curve.getTangentAt(1))
      ).toBeGreaterThan(0.999);
      const points = Array.from({ length: 40 }, (_, i) =>
        sampleTrack(track, i / 40)
      );
      const center = points
        .reduce((sum, p) => sum.add(p), new Vector3())
        .divideScalar(40);
      const nextCenter = Array.from({ length: 40 }, (_, i) =>
        sampleTrack(track, i / 40 + 1)
      )
        .reduce((sum, p) => sum.add(p), new Vector3())
        .divideScalar(40);
      expect(center.distanceTo(nextCenter)).toBeLessThan(1e-8);
    }
  });
  it("travels at even arc-length speed including tight bends", () => {
    for (const track of tracks) {
      const distances = Array.from({ length: 500 }, (_, i) =>
        sampleTrack(track, i / 500).distanceTo(
          sampleTrack(track, (i + 1) / 500)
        )
      );
      const mean = distances.reduce((a, b) => a + b) / distances.length;
      expect(Math.max(...distances) / mean).toBeLessThan(1.05);
      expect(Math.min(...distances) / mean).toBeGreaterThan(0.85);
    }
  });

  it("retains spatial separation when viewed edge-on, not a thin projected sheet", () => {
    const points = tracks.flatMap(track =>
      Array.from({ length: 128 }, (_, i) => sampleTrack(track, i / 128))
    );
    for (const axis of [new Vector3(1, 0, 0), new Vector3(0, 1, 0)]) {
      for (const angle of [
        0,
        Math.PI / 4,
        Math.PI / 2,
        (Math.PI * 3) / 4,
        Math.PI,
      ]) {
        const pose = new Quaternion().setFromAxisAngle(axis, angle);
        const projected = points.map(point =>
          point.clone().applyQuaternion(pose)
        );
        const width =
          Math.max(...projected.map(p => p.x)) -
          Math.min(...projected.map(p => p.x));
        const height =
          Math.max(...projected.map(p => p.y)) -
          Math.min(...projected.map(p => p.y));
        expect(
          Math.min(width, height) / Math.max(width, height)
        ).toBeGreaterThan(0.32);
      }
    }
  });
  it("bakes exact endpoints and keeps signature strokes open in the recessed center", () => {
    const data = bakeTracks(tracks);
    tracks.forEach((track, row) => {
      const start = row * (TRACK_SAMPLES + 1) * 4;
      if (track.closed)
        expect([...data.slice(start, start + 4)]).toEqual([
          ...data.slice(
            start + TRACK_SAMPLES * 4,
            start + TRACK_SAMPLES * 4 + 4
          ),
        ]);
      else {
        expect(track.signature).toBe(true);
        expect(
          sampleTrack(track, 0).distanceTo(sampleTrack(track, 1))
        ).toBeGreaterThan(0.2);
        expect(sampleTrack(track, 0.5).z).toBeCloseTo(-1.42);
      }
    });
  });
});
