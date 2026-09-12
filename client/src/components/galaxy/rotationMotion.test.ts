import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { RotationMotion } from "./rotationMotion";

describe("drag, coast and return", () => {
  const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 1);
  it("stops consuming motion on release and returns home after a long soft settle", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.move(delta, 0.1);
    motion.release();
    const released = motion.orientation.clone();
    motion.move(delta, 0.1);
    expect(motion.orientation.angleTo(released)).toBe(0);
    expect(motion.phase).toBe("inertia");
    // The gesture must linger: still visibly displaced after half a second,
    // whole again within ~4.5s.
    for (let i = 0; i < 30; i++) motion.advance(1 / 60);
    expect(motion.orientation.angleTo(motion.home)).toBeGreaterThan(0.05);
    for (let i = 30; i < 270; i++) motion.advance(1 / 60);
    expect(motion.orientation.angleTo(motion.home)).toBeLessThan(0.003);
  });
  it("re-grabbing interrupts return without snapping; cancellation removes coast", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.move(delta, 0.1);
    motion.release();
    motion.advance(0.2);
    const pose = motion.orientation.clone();
    motion.begin();
    motion.advance(1 / 60);
    expect(motion.orientation.toArray()).toEqual(pose.toArray());
    motion.move(delta, 0.1);
    motion.release(true);
    expect(motion.phase).toBe("returning");
    expect(motion.speed).toBe(0);
  });
  it("has comparable recovery at 30, 60 and 120 Hz", () => {
    const angles = [30, 60, 120].map(hz => {
      const motion = new RotationMotion(new Quaternion());
      motion.begin();
      motion.move(delta, 0.1);
      motion.release();
      for (let i = 0; i < hz; i++) motion.advance(1 / hz);
      return motion.orientation.angleTo(motion.home);
    });
    expect(Math.max(...angles) - Math.min(...angles)).toBeLessThan(0.005);
  });

  it("exports canonical home Euler orientation (0.28, -0.50, -0.40) and defaultHomeQuaternion", () => {
    expect(RotationMotion.homeEuler.x).toBeCloseTo(0.28, 5);
    expect(RotationMotion.homeEuler.y).toBeCloseTo(-0.5, 5);
    expect(RotationMotion.homeEuler.z).toBeCloseTo(-0.4, 5);
    expect(RotationMotion.homeEuler.order).toBe("XYZ");

    const quat = RotationMotion.defaultHomeQuaternion();
    const expectedQuat = new Quaternion().setFromEuler(RotationMotion.homeEuler);
    expect(quat.angleTo(expectedQuat)).toBeCloseTo(0, 5);

    const motion = new RotationMotion(quat);
    expect(motion.orientation.angleTo(expectedQuat)).toBeCloseTo(0, 5);
  });

  it("applies incremental drag displacement via applyDrag and advances via step", () => {
    const motion = new RotationMotion(RotationMotion.defaultHomeQuaternion());
    motion.begin();

    // applyDrag when dragging
    motion.applyDrag(50, 0);
    expect(motion.speed).toBeGreaterThan(0);
    expect(motion.orientation.angleTo(motion.home)).toBeGreaterThan(0.01);

    // applyDrag when not dragging is ignored
    motion.release();
    const releasedAngle = motion.orientation.angleTo(motion.home);
    motion.applyDrag(50, 0);
    expect(motion.orientation.angleTo(motion.home)).toBe(releasedAngle);

    // step(dt) advances the simulation and returns the orientation
    const nextQuat = motion.step(1 / 60);
    expect(nextQuat).toBe(motion.orientation);
  });
});
