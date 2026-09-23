import { describe, expect, it } from "vitest";
import { Euler, Quaternion, Vector3 } from "three";
import { RotationMotion } from "@/components/galaxy/rotationMotion";
import { projectTrackball } from "@/components/galaxy/trackball";

describe("Tier 1: Feature Coverage - 3D Trackball Drag & Canonical Home Pose (F9, F10)", () => {
  const homeEuler = new Euler(0.28, -0.5, -0.4, "XYZ");
  const homeQuat = new Quaternion().setFromEuler(homeEuler);

  it("initializes RotationMotion directly at canonical home Euler pose (0.28, -0.50, -0.40)", () => {
    const motion = new RotationMotion(homeQuat);
    expect(motion.orientation.angleTo(homeQuat)).toBeCloseTo(0, 5);
    expect(motion.phase).toBe("idle");
    expect(motion.speed).toBe(0);
  });

  it("projects trackball coords on sphere interior and hyperbolic rim without singularities", () => {
    const width = 800;
    const height = 800;
    const radius = Math.min(width, height) * 0.48; // 384px

    // Center of screen
    const pCenter = projectTrackball(width / 2, height / 2, width, height);
    expect(pCenter.x).toBeCloseTo(0, 4);
    expect(pCenter.y).toBeCloseTo(0, 4);
    expect(pCenter.z).toBeCloseTo(1.0, 4); // Apex of hemisphere

    // Mid-radius: point.x = 0.6 -> offset = 0.6 * radius
    const pMid = projectTrackball(width / 2 + 0.6 * radius, height / 2, width, height);
    expect(pMid.x).toBeGreaterThan(0.5);
    expect(pMid.y).toBeCloseTo(0, 4);
    expect(pMid.z).toBeGreaterThan(0.6);

    // Exterior hyperbolic rim: point.x = 1.0 -> offset = 1.0 * radius
    const pRim = projectTrackball(width / 2 + 1.0 * radius, height / 2, width, height);
    expect(pRim.x).toBeGreaterThan(0.8);
    expect(pRim.y).toBeCloseTo(0, 4);
    expect(pRim.z).toBeGreaterThan(0.3);

    // Vector is strictly normalized
    expect(pCenter.length()).toBeCloseTo(1.0, 4);
    expect(pMid.length()).toBeCloseTo(1.0, 4);
    expect(pRim.length()).toBeCloseTo(1.0, 4);
  });

  it("turns the target with the drag and eases the rose after it", () => {
    const motion = new RotationMotion(homeQuat);
    motion.begin();
    expect(motion.phase).toBe("dragging");

    motion.drag(40, 0);
    expect(motion.target.y).toBeCloseTo(0.2, 6);
    // The visible pose follows over the next frames, not in one jump.
    motion.advance(0.016);
    const first = motion.orientation.angleTo(homeQuat);
    expect(first).toBeGreaterThan(0.02);
    expect(first).toBeLessThan(0.2);
    for (let i = 0; i < 60; i++) motion.advance(0.016);
    expect(motion.orientation.angleTo(homeQuat)).toBeCloseTo(0.2, 3);
    expect(Number.isFinite(motion.speed)).toBe(true);
  });

  it("returns home on release with no coast in the drag direction", () => {
    const motion = new RotationMotion(homeQuat);
    motion.begin();
    motion.turn(0, 0.5);
    for (let i = 0; i < 30; i++) motion.advance(0.016);
    const held = motion.spin.y;
    motion.release();
    expect(motion.phase).toBe("returning");
    motion.advance(0.016);
    expect(motion.spin.y).toBeLessThan(held);
  });

  it("snaps cleanly to canonical home pose once every layer has settled", () => {
    const motion = new RotationMotion(homeQuat);
    motion.begin();
    motion.turn(0, 0.0005);
    motion.release();
    expect(motion.phase).toBe("returning");
    motion.advance(0.016);
    expect(motion.phase).toBe("idle");
    expect(motion.orientation.angleTo(homeQuat)).toBeCloseTo(0, 5);
  });

  it("maintains consistent settle dynamics across 30Hz, 60Hz, and 120Hz display refresh rates", () => {
    const simulateSettle = (dt: number) => {
      const motion = new RotationMotion(homeQuat);
      motion.begin();
      motion.turn(0, 0.8);
      for (let t = 0; t < 0.5; t += dt) motion.advance(dt);
      motion.release();

      let elapsed = 0;
      while (motion.phase !== "idle" && elapsed < 10) {
        motion.advance(dt);
        elapsed += dt;
      }
      return elapsed;
    };

    const settleTime30 = simulateSettle(1 / 30);
    const settleTime60 = simulateSettle(1 / 60);
    const settleTime120 = simulateSettle(1 / 120);

    // Home again in about three seconds: calm, not lingering.
    expect(settleTime30).toBeGreaterThan(2);
    expect(settleTime30).toBeLessThan(4);
    expect(settleTime60).toBeCloseTo(settleTime30, 0);
    expect(settleTime120).toBeCloseTo(settleTime60, 0);
  });
});
