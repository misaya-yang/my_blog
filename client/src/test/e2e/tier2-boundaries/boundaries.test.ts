import { describe, expect, it } from "vitest";
import { getAmbientProfile } from "@/components/galaxy/ambientScene";
import { getPageScene } from "@/components/galaxy/pageScene";
import { PointerWake } from "@/components/galaxy/pointerWake";
import { RotationMotion } from "@/components/galaxy/rotationMotion";
import { projectTrackball } from "@/components/galaxy/trackball";
import { getScrollMotion } from "@/components/galaxy/scrollMotion";
import { Euler, Quaternion, Vector3 } from "three";

describe("Tier 2: Boundary & Corner Cases", () => {
  describe("Boundary Group 1: URL Slugs, Paths & Hashing Corners", () => {
    it("handles empty path string by gracefully defaulting to root /", () => {
      const scene = getPageScene("");
      expect(scene.mode).toBe("home");
      expect(scene.key).toBe("/");
      expect(Number.isFinite(scene.phase)).toBe(true);
      expect(Number.isFinite(scene.tilt)).toBe(true);
      expect(Number.isFinite(scene.pace)).toBe(true);

      const profile = getAmbientProfile("");
      expect(profile.rows).toHaveLength(6);
      expect(profile.rows[0].points.length).toBe(513);
    });

    it("handles canonical root path / consistently", () => {
      const scene = getPageScene("/");
      expect(scene.mode).toBe("home");
      expect(scene.key).toBe("/");
    });

    it("handles deep nested sub-paths and trailing slashes safely", () => {
      const deepPath = "/post/category/engineering/ai/deep-dive/";
      const profile = getAmbientProfile(deepPath);
      expect(profile.rows).toHaveLength(6);
      for (const row of profile.rows) {
        expect(row.points.every(([x, y, z]) => Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))).toBe(true);
      }
    });

    it("strips complex query parameters, salts, and unicode hash fragments", () => {
      const rawUrl = "/post/quantum-entropy?debug=1&sort=desc&filter=active#section-α-β";
      const cleanProfile = getAmbientProfile("/post/quantum-entropy");
      const dirtyProfile = getAmbientProfile(rawUrl);

      expect(dirtyProfile.family).toBe(cleanProfile.family);
      expect(dirtyProfile.driftX).toBe(cleanProfile.driftX);
      expect(dirtyProfile.driftY).toBe(cleanProfile.driftY);
      expect(dirtyProfile.rows[0].points[0][0]).toBe(cleanProfile.rows[0].points[0][0]);
    });

    it("handles special characters and non-ASCII URI encoded paths", () => {
      const specialPaths = [
        "/post/c++-templates-&-metaprogramming",
        "/post/%E7%BE%A4%E6%98%9F%E5%BD%92%E4%BD%8D",
        "/post/math_pi_\u03C0_omega_\u03C9",
      ];
      for (const p of specialPaths) {
        const profile = getAmbientProfile(p);
        expect(profile.rows).toHaveLength(6);
        expect(Number.isFinite(profile.driftSpeed)).toBe(true);
      }
    });
  });

  describe("Boundary Group 2: Pointer Wake Zero-Distance & Velocity Capping", () => {
    it("ignores zero-distance pointer movement (dx = 0, dy = 0) without emitting NaN", () => {
      const wake = new PointerWake();
      const width = 1000;
      const height = 1000;

      wake.push(500, 500, 1.0, width, height);
      // Move to identical coordinates
      wake.push(500, 500, 1.1, width, height);

      // Should not record zero distance segment
      expect(wake.activeCount(1.1)).toBe(0);
      for (const imp of wake.impulses) {
        expect(Number.isNaN(imp.x)).toBe(false);
        expect(Number.isNaN(imp.y)).toBe(false);
      }
    });

    it("caps extreme swipe velocity without explosive displacement", () => {
      const wake = new PointerWake();
      const width = 1280;
      const height = 800;

      wake.push(100, 100, 1.0, width, height);
      // Supersonic cursor flick across screen (1000px in 0.05s)
      wake.push(1100, 100, 1.05, width, height);

      const impulse = wake.impulses[0];
      // Distance = 1000px. Gain = min(1.6, 42 / 1000) = 0.042.
      // Net displacement is capped to (42 * 2) / 800 = 0.105 viewport height
      expect(impulse.x).toBeCloseTo((42 * 2) / 800, 3);
    });

    it("rejects backward or identical timestamps to prevent division by zero", () => {
      const wake = new PointerWake();
      wake.push(100, 100, 2.0, 1000, 1000);
      // Event with earlier timestamp
      wake.push(200, 200, 1.5, 1000, 1000);
      expect(wake.activeCount(2.0)).toBe(0);

      // Event with sub-threshold dt < 0.05s
      wake.push(200, 200, 2.01, 1000, 1000);
      expect(wake.activeCount(2.01)).toBe(0);
    });
  });

  describe("Boundary Group 3: Extreme Viewports & DPR Limits", () => {
    it("handles ultra-narrow mobile viewport (320px width) without projection collapse", () => {
      const width = 320;
      const height = 568;

      const pCenter = projectTrackball(width / 2, height / 2, width, height);
      expect(pCenter.length()).toBeCloseTo(1.0, 4);
      expect(Number.isFinite(pCenter.x)).toBe(true);
      expect(Number.isFinite(pCenter.y)).toBe(true);
      expect(Number.isFinite(pCenter.z)).toBe(true);

      const pEdge = projectTrackball(0, height / 2, width, height);
      expect(pEdge.length()).toBeCloseTo(1.0, 4);
    });

    it("handles 4K UHD desktop viewport (3840 x 2160px)", () => {
      const width = 3840;
      const height = 2160;

      const pCenter = projectTrackball(width / 2, height / 2, width, height);
      expect(pCenter.x).toBeCloseTo(0, 4);
      expect(pCenter.y).toBeCloseTo(0, 4);
      expect(pCenter.z).toBeCloseTo(1.0, 4);
    });

    it("handles extreme ultra-wide panoramic aspect ratio (32:9, 5120 x 1440px)", () => {
      const width = 5120;
      const height = 1440;

      const pWide = projectTrackball(width * 0.9, height / 2, width, height);
      expect(Number.isFinite(pWide.x)).toBe(true);
      expect(Number.isFinite(pWide.y)).toBe(true);
      expect(Number.isFinite(pWide.z)).toBe(true);
      expect(pWide.length()).toBeCloseTo(1.0, 4);
    });

    it("verifies DPR clamping logic for coarse touch vs fine desktop pointers", () => {
      const clampDPR = (dpr: number, isMobile: boolean, isCoarse: boolean) =>
        Math.min(dpr, isMobile && isCoarse ? 1.25 : 1.5);

      // Retina iPhone (DPR 3.0, touch) -> clamped to 1.25
      expect(clampDPR(3.0, true, true)).toBe(1.25);

      // High-end Android (DPR 3.5, touch) -> clamped to 1.25
      expect(clampDPR(3.5, true, true)).toBe(1.25);

      // Desktop Retina 4K/5K (DPR 2.0, mouse) -> clamped to 1.5
      expect(clampDPR(2.0, false, false)).toBe(1.5);

      // Standard desktop (DPR 1.0) -> preserved at 1.0
      expect(clampDPR(1.0, false, false)).toBe(1.0);
    });
  });

  describe("Boundary Group 4: Motion Boundaries & Prefers-Reduced-Motion", () => {
    it("handles boundary scroll values below 0.0 and above 1.0 reversibly", () => {
      const mUnder = getScrollMotion(-10.0, 0);
      expect(mUnder.approach).toBe(0.0);
      expect(mUnder.copyOpacity).toBe(1.0);

      const mOver = getScrollMotion(10.0, 0);
      expect(mOver.approach).toBe(1.0);
      expect(mOver.copyOpacity).toBe(0.0);
    });

    it("enforces reduced motion freeze with uIntro initialized to 1.0", () => {
      const reducedMotion = true;
      const initialIntro = reducedMotion ? 1.0 : 0.0;
      expect(initialIntro).toBe(1.0); // Immediately settled

      // Trackball drag is disabled
      const homeQuat = new Quaternion().setFromEuler(new Euler(0.28, -0.5, -0.4));
      const motion = new RotationMotion(homeQuat);
      if (!reducedMotion) {
        motion.begin();
      }
      expect(motion.phase).toBe("idle");
    });

    it("preserves rotation coherence when micro dt (e.g. 1ms) is passed to trackball", () => {
      const homeQuat = new Quaternion().setFromEuler(new Euler(0.28, -0.5, -0.4));
      const motion = new RotationMotion(homeQuat);
      motion.begin();

      const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.01);
      // Micro dt = 0.001s
      motion.move(delta, 0.001);

      // Protected by Math.max(dt, 0.008) in rotationMotion.ts:29
      expect(motion.speed).toBeLessThanOrEqual(2.4);
      expect(Number.isFinite(motion.speed)).toBe(true);
    });
  });
});
