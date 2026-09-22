import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import {
  bakeTracks,
  createRoseTracks,
  regularizePetalContour,
  sampleTrack,
  TRACK_SAMPLES,
} from "./roseTracks";

describe("continuous rose tracks", () => {
  const tracks = createRoseTracks();
  it("softens isolated XY corners without translating the contour or changing depth anchors", () => {
    const original = [
      new Vector3(-2, -1, -0.8),
      new Vector3(0, -1.2, -0.3),
      new Vector3(0.1, -1.9, 0.4),
      new Vector3(2, -0.7, 0.7),
      new Vector3(1.7, 1.5, 0.2),
      new Vector3(-1.6, 1.3, -0.6),
    ];
    const before = original.map(point => point.clone());
    const softened = regularizePetalContour(original);
    const center = (points: Vector3[]) =>
      points
        .reduce((sum, point) => sum.add(point), new Vector3())
        .divideScalar(points.length);
    const roughness = (points: Vector3[]) =>
      points.reduce((sum, point, i) => {
        const previous = points[(i + points.length - 1) % points.length];
        const next = points[(i + 1) % points.length];
        return (
          sum +
          (previous.x + next.x - 2 * point.x) ** 2 +
          (previous.y + next.y - 2 * point.y) ** 2
        );
      }, 0);
    expect(softened).toHaveLength(original.length);
    expect(center(softened).distanceTo(center(original))).toBeLessThan(1e-12);
    expect(softened.map(point => point.z)).toEqual(
      original.map(point => point.z)
    );
    expect(roughness(softened)).toBeLessThan(roughness(original));
    expect(original).toEqual(before);
  });

  it("retains the four traced layers, offsets, heart space and unchanged signature", () => {
    // Measurements of the original traced contours, before the single XY pass.
    const baseline = [
      {
        length: 22.4634020514473,
        count: 33,
        x: -0.26527272727272727,
        y: 0.2014545454545454,
      },
      {
        length: 15.98027507597594,
        count: 29,
        x: 0.012620689655172494,
        y: 0.024206896551724158,
      },
      {
        length: 11.174668043737796,
        count: 23,
        x: 0.1126956521739129,
        y: 0.1674782608695653,
      },
      { length: 7.014789851072507, count: 16, x: -0.077625, y: -0.123 },
    ];
    expect(tracks.filter(track => track.closed)).toHaveLength(4);
    baseline.forEach((original, row) => {
      const track = tracks[row];
      expect(track.curve.points).toHaveLength(original.count);
      const center = track.curve.points
        .reduce((sum, point) => sum.add(point), new Vector3())
        .divideScalar(original.count);
      expect(center.x).toBeCloseTo(original.x, 12);
      expect(center.y).toBeCloseTo(original.y, 12);
      expect(track.length / original.length).toBeGreaterThan(0.95);
      expect(track.length / original.length).toBeLessThan(1);
      expect(track.length / track.period).toBeCloseTo(0.24, 12);
    });
    const heartRadius = Math.min(
      ...Array.from({ length: 512 }, (_, i) => {
        const p = sampleTrack(tracks[3], i / 512);
        return Math.hypot(p.x, p.y);
      })
    );
    expect(heartRadius).toBeGreaterThan(0.82);
    expect(tracks[4].length).toBeCloseTo(2.8441526812634637, 12);
    expect(tracks[5].length).toBeCloseTo(2.750395058716414, 12);
    expect(
      tracks.slice(4).every(track => track.signature && !track.closed)
    ).toBe(true);
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
