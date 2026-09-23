import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import {
  bakeTracks,
  createRoseTracks,
  HEART_Z,
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
    expect(tracks[4].length).toBeCloseTo(2.6416496215691114, 12);
    expect(tracks[5].length).toBeCloseTo(2.5922345567025737, 12);
    // The "l" stands up: its lean from vertical drops from ~31° in the
    // trace to about 20°, still handwriting rather than print.
    const stroke = tracks[4].curve.points;
    const low = stroke.reduce((a, b) => (b.y < a.y ? b : a));
    const high = stroke.reduce((a, b) => (b.y > a.y ? b : a));
    const lean = Math.atan2(high.x - low.x, high.y - low.y);
    expect(lean).toBeLessThan((22 * Math.PI) / 180);
    expect(lean).toBeGreaterThan((10 * Math.PI) / 180);
    expect(
      tracks.slice(4).every(track => track.signature && !track.closed)
    ).toBe(true);
  });
  it("weaves each layer through the plane, alternating, with no cup to it", () => {
    const layers = tracks.slice(0, 4).map(track =>
      Array.from({ length: 128 }, (_, i) => sampleTrack(track, i / 128))
    );
    const signs = layers.map(points => {
      const zs = points.map(p => p.z);
      const mean = zs.reduce((a, b) => a + b) / zs.length;
      // Each layer passes in front of and behind the plane about equally.
      expect(Math.abs(mean)).toBeLessThan(0.08);
      expect(Math.max(...zs)).toBeGreaterThan(0.15);
      expect(Math.min(...zs)).toBeLessThan(-0.15);
      return Math.sign(PETAL_LAYERS[layers.indexOf(points)].depth);
    });
    for (let row = 1; row < signs.length; row++)
      expect(signs[row]).toBe(-signs[row - 1]);
    // No bowl or dome: depth does not follow distance from the heart.
    const all = layers.flat();
    const radius = all.map(p => Math.hypot(p.x, p.y));
    const meanR = radius.reduce((a, b) => a + b) / all.length;
    const meanZ = all.reduce((a, p) => a + p.z, 0) / all.length;
    let covariance = 0,
      varianceR = 0,
      varianceZ = 0;
    all.forEach((p, i) => {
      covariance += (radius[i] - meanR) * (p.z - meanZ);
      varianceR += (radius[i] - meanR) ** 2;
      varianceZ += (p.z - meanZ) ** 2;
    });
    expect(
      Math.abs(covariance / Math.sqrt(varianceR * varianceZ))
    ).toBeLessThan(0.15);
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

  it("reads as a thin disc edge-on, like a galaxy, but never a flat sheet", () => {
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
        const ratio = Math.min(width, height) / Math.max(width, height);
        expect(ratio).toBeGreaterThan(0.18);
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
        expect(sampleTrack(track, 0.5).z).toBeCloseTo(HEART_Z);
      }
    });
  });
});
