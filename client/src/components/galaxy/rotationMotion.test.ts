import { describe, expect, it } from "vitest";
import { Euler, Quaternion, Vector3 } from "three";
import { RotationMotion } from "./rotationMotion";
import { PETAL_TRACKS } from "./roseTracks";

const run = (motion: RotationMotion, seconds: number, hz = 60) => {
  for (let i = 0; i < Math.round(seconds * hz); i++) motion.advance(1 / hz);
};

describe("drag, follow and return", () => {
  it("turns freely in 3D, right over onto its back", () => {
    const home = RotationMotion.defaultHomeQuaternion();
    const motion = new RotationMotion(home);
    motion.begin();
    motion.drag((Math.PI / 0.005) * 1, 0);
    run(motion, 1.5);
    expect(motion.orientation.angleTo(home)).toBeCloseTo(Math.PI, 2);
    // Keep going and it turns right round, bounded at two full turns.
    motion.drag(1e6, -1e6);
    expect(motion.target.x).toBeCloseTo(-4 * Math.PI, 6);
    expect(motion.target.y).toBeCloseTo(4 * Math.PI, 6);
    expect(motion.phase).toBe("dragging");
  });

  it("maps sideways travel to a turn about the vertical, vertical travel to a tip", () => {
    const home = new Quaternion();
    const motion = new RotationMotion(home);
    motion.begin();
    motion.drag(100, 0);
    run(motion, 1);
    const front = new Vector3(0, 0, 1).applyQuaternion(motion.orientation);
    expect(front.x).toBeGreaterThan(0.4);
    expect(Math.abs(front.y)).toBeLessThan(1e-6);
    motion.reset();
    motion.begin();
    motion.drag(0, 100);
    run(motion, 1);
    const tipped = new Vector3(0, 0, 1).applyQuaternion(motion.orientation);
    expect(tipped.y).toBeLessThan(-0.4);
    expect(Math.abs(tipped.x)).toBeLessThan(1e-6);
  });

  it("eases toward the hand: the heart first, each outer layer a little later", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.turn(0, 1);
    motion.advance(1 / 60);
    expect(motion.spin.y).toBeGreaterThan(0.1);
    expect(motion.spin.y).toBeLessThan(0.3);
    run(motion, 0.1);
    const spins = motion.layers.map(layer => layer.spin.y);
    expect(spins).toHaveLength(PETAL_TRACKS);
    for (let row = 1; row < spins.length; row++)
      expect(spins[row]).toBeGreaterThan(spins[row - 1]);
    expect(motion.spin.y).toBeGreaterThan(spins[spins.length - 1]);
    // Each layer's twist is its pose relative to the heart.
    const twist = motion.layerTwist(0);
    const composed = motion.orientation.clone().multiply(twist);
    expect(composed.angleTo(motion.layerOrientation(0))).toBeLessThan(1e-6);
    run(motion, 1.5);
    for (const layer of motion.layers)
      expect(layer.spin.y).toBeCloseTo(1, 2);
    expect(motion.layerTwist(0).angleTo(new Quaternion())).toBeLessThan(0.01);
  });

  it("lets go and turns back to face the reader, with no fling", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.turn(0.4, 1.5);
    run(motion, 0.5);
    motion.release();
    expect(motion.phase).toBe("returning");
    const released = motion.orientation.angleTo(motion.home);
    motion.turn(1, 1);
    expect(motion.target.length()).toBe(0);
    motion.advance(1 / 60);
    // Heads straight home rather than carrying on in the drag direction.
    expect(motion.orientation.angleTo(motion.home)).toBeLessThan(released);
    run(motion, 4);
    expect(motion.phase).toBe("idle");
    expect(motion.orientation.angleTo(motion.home)).toBe(0);
  });

  it("holds a key turn for a moment before returning", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.turn(0, 0.3);
    motion.release(1.4);
    run(motion, 1);
    expect(motion.spin.y).toBeCloseTo(0.3, 2);
    run(motion, 3);
    expect(motion.phase).toBe("idle");
  });

  it("re-grabbing mid-return takes the rose where it is", () => {
    const motion = new RotationMotion(new Quaternion());
    motion.begin();
    motion.turn(0, 1);
    run(motion, 1);
    motion.release();
    run(motion, 0.1);
    const pose = motion.orientation.clone();
    motion.begin();
    expect(motion.orientation.angleTo(pose)).toBe(0);
    motion.turn(0, 0.2);
    run(motion, 1);
    expect(motion.spin.y).toBeCloseTo(0.2, 3);
  });

  it("moves alike at 30, 60 and 120 Hz", () => {
    const poses = [30, 60, 120].map(hz => {
      const motion = new RotationMotion(new Quaternion());
      motion.begin();
      motion.turn(0.3, 1.2);
      run(motion, 0.4, hz);
      motion.release();
      run(motion, 0.3, hz);
      return motion.layerOrientation(0);
    });
    expect(poses[0].angleTo(poses[2])).toBeLessThan(1e-6);
    expect(poses[1].angleTo(poses[2])).toBeLessThan(1e-6);
  });

  it("uses one canonical home orientation for initial pose and recovery", () => {
    expect(RotationMotion.homeEuler.order).toBe("XYZ");
    const quat = RotationMotion.defaultHomeQuaternion();
    const expectedQuat = new Quaternion().setFromEuler(
      new Euler().copy(RotationMotion.homeEuler)
    );
    expect(quat.angleTo(expectedQuat)).toBeCloseTo(0, 5);
    const motion = new RotationMotion(quat);
    expect(motion.orientation.angleTo(expectedQuat)).toBeCloseTo(0, 5);
  });

  it("ignores non-finite input and zero or negative time steps", () => {
    const motion = new RotationMotion(RotationMotion.defaultHomeQuaternion());
    motion.begin();
    motion.turn(Number.NaN, Number.POSITIVE_INFINITY);
    motion.advance(0);
    motion.advance(-1);
    expect(motion.speed).toBe(0);
    expect(motion.orientation.angleTo(motion.home)).toBe(0);
    motion.turn(0.5, 0);
    motion.advance(60);
    expect(Number.isFinite(motion.speed)).toBe(true);
    expect(motion.spin.x).toBeCloseTo(0.5, 6);
  });
});
