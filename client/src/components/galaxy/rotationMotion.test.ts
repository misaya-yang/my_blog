import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { RotationMotion } from "./rotationMotion";

describe("drag, coast and return", () => {
  const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 1);
  it("stops consuming motion on release and returns home within 1.8 seconds", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.move(delta, 0.1);
    motion.release();
    const released = motion.orientation.clone();
    motion.move(delta, 0.1);
    expect(motion.orientation.angleTo(released)).toBe(0);
    expect(motion.phase).toBe("inertia");
    for (let i = 0; i < 108; i++) motion.advance(1 / 60);
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
});
