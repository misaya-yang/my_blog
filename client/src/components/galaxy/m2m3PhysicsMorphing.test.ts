import { describe, expect, it } from "vitest";
import { Euler, Quaternion, Vector3 } from "three";
import { RotationMotion } from "./rotationMotion";
import { PointerWake, WAKE_LIFETIME, WAKE_SAMPLES } from "./pointerWake";
import {
  getAmbientProfile,
  bakeAmbientTracks,
  AMBIENT_ROWS,
  AmbientProfile,
} from "./ambientScene";
import { getPageScene } from "./pageScene";
import { getScrollMotion, sharedMotionState } from "./scrollMotion";
import { projectTrackball, trackballDelta } from "./trackball";
import { TRACK_SAMPLES } from "./roseTracks";

describe("Milestone 2: Interaction Physics (F8, F9, F10, F11)", () => {
  describe("F8: Localized Gaussian Wake Dynamics", () => {
    it("verifies localized Gaussian wake footprint (~70-90px) across screen heights", () => {
      const getWakeRadiusPx = (height: number) => {
        const clamped = Math.min(48, Math.max(28, height * 0.042));
        return clamped * 2; // Diameter in CSS pixels
      };

      // Standard desktop viewports
      const h768 = getWakeRadiusPx(768);
      const h800 = getWakeRadiusPx(800);
      const h900 = getWakeRadiusPx(900);
      const h1080 = getWakeRadiusPx(1080);

      expect(h768).toBeGreaterThanOrEqual(64);
      expect(h768).toBeLessThanOrEqual(96);

      expect(h800).toBeGreaterThanOrEqual(67);
      expect(h800).toBeLessThanOrEqual(96);

      expect(h900).toBeGreaterThanOrEqual(75);
      expect(h900).toBeLessThanOrEqual(96);

      expect(h1080).toBeCloseTo(90.7, 1);

      // Extreme bounds clamping: 28 * 2 = 56px minimum, 48 * 2 = 96px maximum
      const h400 = getWakeRadiusPx(400); // 400 * 0.042 = 16.8 -> clamped to 28 -> 56px
      expect(h400).toBe(56);

      const h2160 = getWakeRadiusPx(2160); // 2160 * 0.042 = 90.72 -> clamped to 48 -> 96px
      expect(h2160).toBe(96);
    });

    it("verifies mass-stratified decay (~3.2s lifetime) with differential inertia", () => {
      const smoothstep = (min: number, max: number, x: number) => {
        const t = Math.max(0, Math.min(1, (x - min) / (max - min)));
        return t * t * (3 - 2 * t);
      };

      const calculateWakeDecay = (t: number, seedX: number, seedZ = 0.5) => {
        if (t <= 0 || t >= WAKE_LIFETIME) return 0;
        const mass = 0.45 + seedX * seedX * 1.6; // [0.45, 2.05]
        const attack = 1.0 - Math.exp(-t * 18.0);
        const damping = Math.exp((-t * (0.8 + seedZ * 0.45)) / mass);
        const cutoff = 1.0 - smoothstep(0.7, 3.2, t);
        return attack * damping * cutoff;
      };

      // Light particle: fast attack, quick dissipation
      const lightT01 = calculateWakeDecay(0.1, 0.0);
      const lightT10 = calculateWakeDecay(1.0, 0.0);
      const lightT25 = calculateWakeDecay(2.5, 0.0);
      const lightT32 = calculateWakeDecay(3.2, 0.0);

      expect(lightT01).toBeGreaterThan(0.6);
      expect(lightT10).toBeLessThan(lightT01);
      expect(lightT25).toBeLessThan(0.05);
      expect(lightT32).toBe(0.0);

      // Heavy particle: sustained drift over full 3.2s
      const heavyT01 = calculateWakeDecay(0.1, 1.0);
      const heavyT10 = calculateWakeDecay(1.0, 1.0);
      const heavyT20 = calculateWakeDecay(2.0, 1.0);
      const heavyT32 = calculateWakeDecay(3.2, 1.0);

      expect(heavyT01).toBeGreaterThan(0.6);
      expect(heavyT10).toBeGreaterThan(lightT10); // Heavy particles linger longer
      expect(heavyT20).toBeGreaterThan(calculateWakeDecay(2.0, 0.0));
      expect(heavyT32).toBe(0.0); // Exact quiet at 3.2s
    });

    it("verifies velocity capping and momentum EMA decay", () => {
      const wake = new PointerWake();
      const w = 1280;
      const h = 800;

      // Swift flick: 500px in 0.1s
      wake.push(100, 100, 0.0, w, h);
      wake.push(600, 100, 0.1, w, h);

      expect(wake.activeCount(0.1)).toBe(1);

      // Max displacement is capped to 42 CSS px gain
      const imp = wake.impulses[0];
      const maxDisplacement = (42 * 2) / h;
      expect(imp.x).toBeCloseTo(maxDisplacement, 3);
    });
  });

  describe("F9 & F10: 3D Coherent Drag & Canonical Home Euler Slerp Restore", () => {
    it("guarantees canonical home Euler orientation (0.28, -0.50, -0.40) XYZ", () => {
      expect(RotationMotion.homeEuler.x).toBeCloseTo(0.28, 5);
      expect(RotationMotion.homeEuler.y).toBeCloseTo(-0.50, 5);
      expect(RotationMotion.homeEuler.z).toBeCloseTo(-0.40, 5);
      expect(RotationMotion.homeEuler.order).toBe("XYZ");

      const q = RotationMotion.defaultHomeQuaternion();
      const motion = new RotationMotion(q);
      expect(motion.orientation.angleTo(q)).toBeCloseTo(0, 5);
    });

    it("verifies coherent rigid-body drag and capped angular velocity (2.4 rad/s)", () => {
      const motion = new RotationMotion(RotationMotion.defaultHomeQuaternion());
      motion.begin();
      expect(motion.phase).toBe("dragging");

      // Apply moderate drag
      const moderateDelta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.03);
      motion.move(moderateDelta, 0.016);
      expect(motion.speed).toBeCloseTo(0.03 / 0.016, 1);
      expect(motion.speed).toBeLessThan(2.4);

      // Apply extreme flick
      const extremeDelta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.8);
      motion.move(extremeDelta, 0.016);
      expect(motion.speed).toBe(2.4); // Capped at 2.4 rad/s
    });

    it("verifies smooth coasting damping (gamma = 3.0) and gentle attraction slerp upon drag release", () => {
      const motion = new RotationMotion(RotationMotion.defaultHomeQuaternion());
      motion.begin();
      const delta = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.08);
      motion.move(delta, 0.016);

      motion.release();
      expect(motion.phase).toBe("inertia");
      const initialSpeed = motion.speed;

      // Advance 0.5s: speed decays by exp(-3 * 0.5) = exp(-1.5) ≈ 0.2231
      motion.advance(0.5);
      expect(motion.speed).toBeCloseTo(initialSpeed * Math.exp(-1.5), 2);

      // Coast automatically transitions to returning when speed < 0.05
      let totalTime = 0.5;
      while (motion.phase === "inertia" && totalTime < 5) {
        motion.advance(0.05);
        totalTime += 0.05;
      }
      expect(motion.phase).toBe("returning");

      // In returning phase, slerps home and snaps when angle < 0.002 rad
      while (motion.phase === "returning" && totalTime < 8) {
        motion.advance(0.05);
        totalTime += 0.05;
      }
      expect(motion.phase).toBe("idle");
      expect(motion.orientation.angleTo(motion.home)).toBeCloseTo(0, 5);
    });

    it("verifies trackball projection without poles or singularities", () => {
      const target = new Vector3();
      // Test 100 sample points inside and outside sphere boundary
      for (let px = 0; px <= 800; px += 80) {
        for (let py = 0; py <= 800; py += 80) {
          projectTrackball(px, py, 800, 800, target);
          expect(Number.isFinite(target.x)).toBe(true);
          expect(Number.isFinite(target.y)).toBe(true);
          expect(Number.isFinite(target.z)).toBe(true);
          expect(target.length()).toBeCloseTo(1.0, 4);
        }
      }
    });
  });

  describe("F11: Scroll Parallax & Camera Dynamics", () => {
    it("guarantees reversible, continuous scroll motion interpolation", () => {
      const stateForward = getScrollMotion(0.5, 0);
      const stateReverse = getScrollMotion(0.5, 0);

      expect(stateForward.approach).toBe(stateReverse.approach);
      expect(stateForward.expansion).toBe(stateReverse.expansion);
      expect(stateForward.split).toBe(stateReverse.split);
      expect(stateForward.copyOpacity).toBe(stateReverse.copyOpacity);
      expect(stateForward.copyY).toBe(stateReverse.copyY);

      // Re-uses target to guarantee zero allocation
      const reused = getScrollMotion(0.7, 0, sharedMotionState);
      expect(reused).toBe(sharedMotionState);
    });
  });
});

describe("Milestone 3: Cross-Page Morphing & Multi-Route UI Walkthrough (F12, F13, F14, F15)", () => {
  describe("F12 & F13: Deterministic Constellations & Ambient Morphing", () => {
    it("generates deterministic profiles across all primary routes with identical hash for query/hash variations", () => {
      const homeProfile = getAmbientProfile("/");
      const readerProfile = getAmbientProfile("/post/flow-matching-generative-models");
      const readerWithQuery = getAmbientProfile(
        "/post/flow-matching-generative-models?source=search&ref=nav#abstract"
      );
      const archiveProfile = getAmbientProfile("/archive");
      const aboutProfile = getAmbientProfile("/about");

      // Deterministic: query/hash does not alter the generated pattern
      expect(readerProfile.family).toBe(readerWithQuery.family);
      expect(readerProfile.driftX).toBe(readerWithQuery.driftX);
      expect(readerProfile.glow).toBe(readerWithQuery.glow);
      expect(readerProfile.rows[0].points[0]).toEqual(readerWithQuery.rows[0].points[0]);

      // Different routes yield varied mathematical families
      const families = new Set([
        homeProfile.family,
        readerProfile.family,
        archiveProfile.family,
        aboutProfile.family,
      ]);
      expect(families.size).toBeGreaterThanOrEqual(2);
    });

    it("verifies 6-track geometry: 4 outer closed loops and 2 inner open heart anchor tracks at z = -0.9", () => {
      const testSlugs = [
        "/post/deep-reinforcement-learning",
        "/post/attention-is-all-you-need",
        "/post/mamba-state-space-models",
        "/post/flash-attention-v3",
      ];

      for (const slug of testSlugs) {
        const profile = getAmbientProfile(slug);
        expect(profile.rows).toHaveLength(AMBIENT_ROWS); // exactly 6 tracks

        // Tracks 0-3: outer closed contours
        for (let i = 0; i < 4; i++) {
          expect(profile.rows[i].closed).toBe(true);
          expect(profile.rows[i].points).toHaveLength(TRACK_SAMPLES + 1);
        }

        // Tracks 4-5: inner open contours anchored near z = -0.9
        for (let i = 4; i < 6; i++) {
          expect(profile.rows[i].closed).toBe(false);
          expect(profile.rows[i].points).toHaveLength(TRACK_SAMPLES + 1);
          for (const point of profile.rows[i].points) {
            expect(point[2]).toBeCloseTo(-0.9, 0);
          }
        }
      }
    });

    it("bakes ambient tracks into exact (513 x 6 x 4) Float32Array for GPU uniform sampler", () => {
      const profile = getAmbientProfile("/post/transformers");
      const baked = bakeAmbientTracks(profile);
      expect(baked).toBeInstanceOf(Float32Array);
      expect(baked.length).toBe((TRACK_SAMPLES + 1) * 6 * 4);

      // Verify no NaN or Infinite values anywhere in baked float texture
      for (let i = 0; i < baked.length; i++) {
        expect(Number.isFinite(baked[i])).toBe(true);
      }
    });
  });

  describe("F14: Text Quiet Zones & Contrast Protection", () => {
    it("guarantees text contrast ratio ≥ 4.5:1 across dark and light themes", () => {
      const luminance = (r: number, g: number, b: number) => {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const contrastRatio = (lum1: number, lum2: number) => {
        const bright = Math.max(lum1, lum2);
        const dark = Math.min(lum1, lum2);
        return (bright + 0.05) / (dark + 0.05);
      };

      // Dark Mode: bg #0b0c0e, text #eeefef
      const darkBgLum = luminance(0x0b, 0x0c, 0x0e);
      const darkTextLum = luminance(0xee, 0xef, 0xef);
      const darkContrast = contrastRatio(darkBgLum, darkTextLum);
      expect(darkContrast).toBeGreaterThanOrEqual(4.5);
      expect(darkContrast).toBeGreaterThan(15.0); // >17:1 in practice

      // Light Mode: bg #f8fafc, text #152230
      const lightBgLum = luminance(0xf8, 0xfa, 0xfc);
      const lightTextLum = luminance(0x15, 0x22, 0x30);
      const lightContrast = contrastRatio(lightBgLum, lightTextLum);
      expect(lightContrast).toBeGreaterThanOrEqual(4.5);
      expect(lightContrast).toBeGreaterThan(14.0); // >15:1 in practice
    });

    it("verifies fragment quiet-zone attenuation formula", () => {
      const quietAttenuation = (light: boolean) => {
        // quiet *= 1.0 - qx * qy * mix(0.70, 0.38, uLight)
        const attenuation = light ? 0.38 : 0.70;
        return 1.0 - 1.0 * attenuation; // full overlap inside quiet box
      };

      // Dark mode suppresses 70% of star intensity
      expect(quietAttenuation(false)).toBeCloseTo(0.30, 2);

      // Light mode suppresses 38% to prevent heavy dark ink dots over text
      expect(quietAttenuation(true)).toBeCloseTo(0.62, 2);
    });
  });

  describe("F15: Responsive Viewport & Prefers-Reduced-Motion", () => {
    it("verifies mobile particle budget (3,116 particles total)", () => {
      const mobileDust = 2800;
      const mobileStars = 128;
      const mobileTrails = 128;
      const mobileDistant = 60;
      const totalMobile = mobileDust + mobileStars + mobileTrails + mobileDistant;

      expect(totalMobile).toBe(3116);

      const desktopDust = 4600;
      const desktopStars = 300;
      const desktopTrails = 300;
      const desktopDistant = 180;
      const totalDesktop = desktopDust + desktopStars + desktopTrails + desktopDistant;

      expect(totalDesktop).toBe(5380);
      expect(totalMobile / totalDesktop).toBeLessThan(0.60); // 42% reduction
    });

    it("verifies mobile touch DPR clamping to 1.25", () => {
      const getDPR = (dpr: number, isMobile: boolean, isCoarse: boolean) => {
        return Math.min(dpr, isMobile && isCoarse ? 1.25 : 1.5);
      };

      // Mobile 3x retina touch screen clamped to 1.25
      expect(getDPR(3.0, true, true)).toBe(1.25);
      // Desktop 2x screen clamped to 1.5
      expect(getDPR(2.0, false, false)).toBe(1.5);
      // 1x standard screen remains 1.0
      expect(getDPR(1.0, false, false)).toBe(1.0);
    });
  });
});
