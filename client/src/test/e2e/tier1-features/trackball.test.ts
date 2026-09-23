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

  it("updates orientation coherently during active drag and caps angular speed at 2.4 rad/s", () => {
    const motion = new RotationMotion(homeQuat);
    motion.begin();
    expect(motion.phase).toBe("dragging");

    // Apply incremental drag rotation around Y axis
    const dragDelta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.1);
    motion.move(dragDelta, 0.016);

    expect(motion.orientation.angleTo(homeQuat)).toBeGreaterThan(0.05);
    expect(motion.speed).toBeGreaterThan(0);
    expect(motion.speed).toBeLessThanOrEqual(2.4);

    // Ultra-fast flick with huge delta
    const largeDelta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 1.5);
    motion.move(largeDelta, 0.016);
    expect(motion.speed).toBe(2.4); // Hard cap at 2.4 rad/s
  });

  it("decays coasting speed exponentially with damping factor gamma = 6.0", () => {
    const motion = new RotationMotion(homeQuat);
    motion.begin();
    const dragDelta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.05);
    motion.move(dragDelta, 0.016);
    const initialSpeed = motion.speed;

    motion.release();
    expect(motion.phase).toBe("inertia");

    // Advance 0.25s: speed should decay by exp(-6 * 0.25) = exp(-1.5) = 0.2231
    motion.advance(0.25);
    expect(motion.speed).toBeCloseTo(initialSpeed * Math.exp(-1.5), 2);
  });

  it("transitions from inertia coast to returning phase when speed drops below 0.05 rad/s", () => {
    const motion = new RotationMotion(homeQuat);
    motion.begin();
    const dragDelta = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.02);
    motion.move(dragDelta, 0.016);

    motion.release();
    expect(motion.phase).toBe("inertia");

    // Advance until phase transitions to "returning"
    while (motion.phase === "inertia") {
      motion.advance(0.1);
    }

    expect(motion.phase).toBe("returning");
    expect(motion.speed).toBeLessThan(0.05);

    // Next step in returning phase zeroes speed
    motion.advance(0.1);
    expect(motion.speed).toBe(0);
  });

  it("snaps cleanly to canonical home pose when angular error falls below 0.002 rad", () => {
    const motion = new RotationMotion(homeQuat);
    motion.begin();
    const tinyDelta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.001);
    motion.move(tinyDelta, 0.2); // Low speed: 0.001 / 0.2 = 0.005 <= 0.01
    motion.release();

    // Low speed triggers immediate "returning" phase
    expect(motion.phase).toBe("returning");

    // Advance until snapped
    motion.advance(0.016);
    expect(motion.phase).toBe("idle");
    expect(motion.orientation.angleTo(homeQuat)).toBeCloseTo(0, 5);
  });


  it("maintains consistent settle dynamics across 30Hz, 60Hz, and 120Hz display refresh rates", () => {
    const simulateSettle = (dt: number) => {
      const motion = new RotationMotion(homeQuat);
      motion.begin();
      const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.2);
      motion.move(delta, 0.016);
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

    // All should settle in about two seconds: calm, not lingering.
    expect(settleTime30).toBeGreaterThan(1.5);
    expect(settleTime30).toBeLessThan(3);
    expect(settleTime60).toBeCloseTo(settleTime30, 0);
    expect(settleTime120).toBeCloseTo(settleTime60, 0);
  });
});
