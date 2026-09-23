import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { limitTilt, RotationMotion, unlimitTilt } from "./rotationMotion";

describe("drag, coast and return", () => {
  const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 1);
  it("stops consuming motion on release and returns home after a soft settle", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.move(delta, 0.1);
    motion.release();
    const released = motion.orientation.clone();
    motion.move(delta, 0.1);
    expect(motion.orientation.angleTo(released)).toBe(0);
    expect(motion.phase).toBe("inertia");
    // The gesture lingers briefly: still visibly displaced after a quarter
    // second, whole again within ~3s.
    for (let i = 0; i < 15; i++) motion.advance(1 / 60);
    expect(motion.orientation.angleTo(motion.home)).toBeGreaterThan(0.05);
    for (let i = 15; i < 180; i++) motion.advance(1 / 60);
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

  it("spins freely about the rose axis but only leans slightly, never into a bowl", () => {
    expect(limitTilt(0.05)).toBe(0.05);
    expect(limitTilt(0.15)).toBeLessThan(0.15);
    expect(limitTilt(10)).toBeLessThanOrEqual(0.19);
    for (const angle of [0.05, 0.1, 0.15, 0.18])
      expect(limitTilt(unlimitTilt(angle))).toBeCloseTo(angle, 6);
    const home = RotationMotion.defaultHomeQuaternion();
    const axis = new Vector3(0, 0, 1).applyQuaternion(home);
    const spin = new RotationMotion(home);
    spin.begin();
    for (let i = 0; i < 10; i++)
      spin.move(new Quaternion().setFromAxisAngle(axis, 0.2), 1 / 60);
    expect(spin.orientation.angleTo(home)).toBeCloseTo(2, 5);
    expect(
      new Vector3(0, 0, 1).applyQuaternion(spin.orientation).angleTo(axis)
    ).toBeLessThan(1e-6);
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    for (let i = 0; i < 20; i++) motion.move(delta, 1 / 60);
    // delta turns about Y, a pure lean for the untilted home pose.
    expect(motion.orientation.angleTo(motion.home)).toBeLessThanOrEqual(0.1901);
    // Picking the limited pose up again does not make it jump.
    motion.release(true);
    const held = motion.orientation.clone();
    motion.begin();
    motion.move(new Quaternion(), 1 / 60);
    expect(motion.orientation.angleTo(held)).toBeLessThan(2e-4);
  });

  it("uses one canonical home orientation for initial pose and recovery", () => {
    expect(RotationMotion.homeEuler.order).toBe("XYZ");

    const quat = RotationMotion.defaultHomeQuaternion();
    const expectedQuat = new Quaternion().setFromEuler(
      RotationMotion.homeEuler
    );
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
