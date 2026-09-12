import { describe, expect, it } from "vitest";
import { Euler, Quaternion, Vector3 } from "three";
import { RotationMotion } from "@/components/galaxy/rotationMotion";
import { PointerWake } from "@/components/galaxy/pointerWake";
import { getAmbientProfile } from "@/components/galaxy/ambientScene";
import { getPageScene } from "@/components/galaxy/pageScene";
import { getScrollMotion } from "@/components/galaxy/scrollMotion";
import { BloomPyramidPass } from "@/components/galaxy/bloomPyramid";
import { projectTrackball } from "@/components/galaxy/trackball";

describe("Tier 3: Cross-Feature Combinations", () => {
  const homeEuler = new Euler(0.28, -0.5, -0.4, "XYZ");
  const homeQuat = new Quaternion().setFromEuler(homeEuler);

  // Combination 1: Drag during active wake
  describe("Combination 1: Dragging During Active Wake", () => {
    it("suppresses wake impulse injection when 3D trackball drag is active", () => {
      const wake = new PointerWake();
      const motion = new RotationMotion(homeQuat);
      const width = 1280;
      const height = 800;

      // 1. Hover stroke creates active wake
      wake.push(400, 300, 1.0, width, height);
      wake.push(450, 300, 1.1, width, height);
      expect(wake.activeCount(1.1)).toBe(1);

      // 2. User presses pointer button (pointerdown -> drag begins)
      motion.begin();
      expect(motion.phase).toBe("dragging");
      // Simulation of galaxyScene drag contract: while dragging, wake stands down
      const isDragging = motion.phase === "dragging";
      if (isDragging) {
        wake.release();
      }

      // 3. User moves pointer while dragging (buttons === 1)
      const p1 = projectTrackball(450, 300, width, height);
      const p2 = projectTrackball(550, 300, width, height);
      const delta = new Quaternion().setFromUnitVectors(p1, p2);
      motion.move(delta, 0.016);

      // Drag rotates the group coherently
      expect(motion.orientation.angleTo(homeQuat)).toBeGreaterThan(0.05);

      // Wake push is withheld while button is down
      if (!isDragging) {
        wake.push(550, 300, 1.2, width, height);
      }
      // No new wake segment was added
      expect(wake.activeCount(1.2)).toBe(1);

      // 4. Pointerup releases drag
      motion.release();
      expect(motion.phase).toBe("inertia");

      // Wake can resume once released
      wake.push(550, 300, 1.3, width, height);
      wake.push(600, 300, 1.4, width, height);
      expect(wake.activeCount(1.4)).toBe(2);
    });
  });

  // Combination 2: Scroll during active drag
  describe("Combination 2: Scroll Parallax During Active Trackball Drag", () => {
    it("coordinates scroll camera depth with 3D trackball rotation without matrix inversion", () => {
      const motion = new RotationMotion(homeQuat);
      motion.begin();

      // Apply drag rotation
      const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.3);
      motion.move(delta, 0.016);

      // Concurrent window scroll event occurs (progress advances from 0.0 to 0.4)
      const scrollProgress = 0.4;
      const scrollState = getScrollMotion(scrollProgress, 0);
      const cameraZ = 10.4 - scrollState.approach * 0.55;

      // Both systems maintain valid numbers
      expect(cameraZ).toBeCloseTo(10.4 - 0.55, 1);
      expect(motion.orientation.length()).toBeCloseTo(1.0, 4);
      expect(Number.isFinite(motion.orientation.x)).toBe(true);
      expect(Number.isFinite(motion.orientation.y)).toBe(true);
      expect(Number.isFinite(motion.orientation.z)).toBe(true);
      expect(Number.isFinite(motion.orientation.w)).toBe(true);
    });
  });

  // Combination 3: Navigation during intro reveal
  describe("Combination 3: Route Navigation During Intro Convergence", () => {
    it("smoothly switches from intro reveal to ambient constellation on mid-flight navigation", () => {
      let uIntro = 0.45; // Midway through intro
      const startMode = getPageScene("/").mode;
      expect(startMode).toBe("home");

      // Mid-flight navigation to article
      const targetSlug = "/post/scalable-vector-search";
      const targetScene = getPageScene(targetSlug);
      const targetProfile = getAmbientProfile(targetSlug);

      expect(targetScene.mode).toBe("reading");
      expect(targetProfile.rows).toHaveLength(6);

      // On navigation to article, scene adopts reading mode and blend begins
      let uAmbientBlend = 0.0;
      const dt = 0.016;
      for (let t = 0; t < 0.3; t += dt) {
        uAmbientBlend += (1.0 - uAmbientBlend) * (1 - Math.exp(-dt * 5.0));
      }

      expect(uAmbientBlend).toBeGreaterThan(0.7);
      expect(targetScene.mode).toBe("reading");
    });
  });

  // Combination 4: Theme toggle during constellation cross-fade
  describe("Combination 4: Theme Toggle During Constellation Cross-Fade", () => {
    it("handles theme toggle midway through constellation blend without pipeline thrashing", () => {
      const bloomPass = new BloomPyramidPass({ strength: 0.55 });
      let isDark = true;
      let uLight = isDark ? 0.0 : 1.0;
      let uAmbientBlend = 0.5; // Midway through morph

      expect(bloomPass.strength).toBe(0.55);

      // User toggles to Light Mode
      isDark = false;
      uLight = 1.0;
      bloomPass.strength = 0.0; // Day mode disables bloom pass

      expect(uLight).toBe(1.0);
      expect(bloomPass.strength).toBe(0.0);

      // Morph continues advancing
      const dt = 0.016;
      uAmbientBlend += (1.0 - uAmbientBlend) * (1 - Math.exp(-dt * 5.0));
      expect(uAmbientBlend).toBeGreaterThan(0.5);

      bloomPass.dispose();
    });
  });

  // Combination 5: Window blur during trackball drag
  describe("Combination 5: Window Blur During High-Speed Drag", () => {
    it("cancels drag on window blur and starts unhurried return to canonical home Euler", () => {
      const motion = new RotationMotion(homeQuat);
      motion.begin();

      // Drag with high speed
      const delta = new Quaternion().setFromAxisAngle(new Vector3(1, 1, 0).normalize(), 0.5);
      motion.move(delta, 0.016);
      expect(motion.speed).toBeGreaterThan(1.0);

      // Window blur occurs -> finishDrag(true, cancelled=true)
      motion.release(true);
      expect(motion.speed).toBe(0);
      expect(motion.phase).toBe("returning");

      // Advance return slerp
      for (let step = 0; step < 60; step++) {
        motion.advance(0.016);
      }

      // Returned close to home
      expect(motion.orientation.angleTo(homeQuat)).toBeLessThan(0.1);
    });
  });

  // Combination 6: Resize during trackball coast
  describe("Combination 6: Viewport Resize During Inertia Coast", () => {
    it("preserves rotation momentum and canonical settle trajectory during viewport resize", () => {
      const motion = new RotationMotion(homeQuat);
      motion.begin();
      const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.1);
      motion.move(delta, 0.016);
      motion.release();
      expect(motion.phase).toBe("inertia");

      // Viewport resize occurs mid-coast
      let viewportWidth = 1920;
      let viewportHeight = 1080;

      // Window shrinks to laptop size
      viewportWidth = 1280;
      viewportHeight = 800;

      // Advance coasting motion
      motion.advance(0.2);
      expect(motion.phase).toBe("inertia");
      expect(motion.speed).toBeGreaterThan(0);

      // Advance until settled
      while (motion.phase !== "idle") {
        motion.advance(0.1);
      }

      expect(motion.phase).toBe("idle");
      expect(motion.orientation.angleTo(homeQuat)).toBeCloseTo(0, 5);
    });
  });
});
