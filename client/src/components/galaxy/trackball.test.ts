import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { projectTrackball, trackballDelta } from "./trackball";

describe("free spatial rotation", () => {
  it("passes the pole and completes a full turn on either drag axis", () => {
    for (const axis of [new Vector3(1, 0, 0), new Vector3(0, 1, 0)]) {
      const from = new Vector3(0, 0, 1);
      const to = from.clone().applyAxisAngle(axis, Math.PI / 3);
      const step = trackballDelta(from, to);
      const orientation = new Quaternion();
      for (let i = 0; i < 3; i++) orientation.premultiply(step);
      expect(from.clone().applyQuaternion(orientation).z).toBeCloseTo(-1);
      for (let i = 0; i < 3; i++) orientation.premultiply(step);
      expect(orientation.angleTo(new Quaternion())).toBeCloseTo(0);
    }
  });

  it("rotates around the viewing axis on the rim and stays finite outside it", () => {
    const from = projectTrackball(500, 40, 1000, 600);
    const to = projectTrackball(760, 300, 1000, 600);
    expect(Math.abs(trackballDelta(from, to).z)).toBeGreaterThan(0.3);
    const outside = projectTrackball(1600, -600, 1000, 600);
    expect(outside.toArray().every(Number.isFinite)).toBe(true);
    expect(outside.length()).toBeCloseTo(1);
  });
});
