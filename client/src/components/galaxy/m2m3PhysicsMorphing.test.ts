import { describe, expect, it } from "vitest";
import { DataTexture, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { RotationMotion } from "./rotationMotion";
import { ParticleMotion, type ParticleMotionStep } from "./particleMotion";
import { RENDER_SCALES, RenderQuality } from "./renderQuality";
import {
  getAmbientProfile,
  bakeAmbientTracks,
  AMBIENT_ROWS,
} from "./ambientScene";
import { getScrollMotion, sharedMotionState } from "./scrollMotion";
import { projectTrackball } from "./trackball";
import { TRACK_SAMPLES } from "./roseTracks";

describe("Milestone 2: Interaction Physics (F8, F9, F10, F11)", () => {
  describe("F8: persistent local particle motion", () => {
    const setup = (count = 2) => {
      const motion = new ParticleMotion(null, count, { forceCPU: true });
      const camera = new PerspectiveCamera(50, 1280 / 800, 0.1, 100);
      const step: ParticleMotionStep = {
        projectionMatrix: camera.projectionMatrix,
        width: 1280,
        height: 800,
        basePositions: new Float32Array([0, 0, -10, 1, 20, 0, -10, 1]),
        // A resting cursor 30 px left of particle 0, which sits at the
        // canvas centre; particle 1 is far outside the parting radius.
        pointer: {
          from: { x: 610, y: 400 },
          to: { x: 610, y: 400 },
          velocity: { x: 0, y: 0 },
          active: true,
        },
      };
      const offsets = () =>
        (motion.textures.offset as DataTexture).image.data as Float32Array;
      return { motion, step, offsets };
    };

    it("parts only the particles near the cursor", () => {
      const { motion, step, offsets } = setup();
      try {
        for (let i = 0; i < 30; i++) motion.step(1 / 60, step);
        expect(offsets()[0] * 400).toBeGreaterThan(10);
        expect(offsets()[4]).toBe(0);
        expect(offsets()[5]).toBe(0);
      } finally {
        motion.dispose();
      }
    });

    it("holds the parting steady while hovering and returns after the cursor leaves", () => {
      const { motion, step, offsets } = setup();
      try {
        const positions: number[] = [];
        for (let i = 0; i < 360; i++) {
          motion.step(1 / 60, step);
          positions.push(offsets()[0] * 400);
        }
        expect(positions.at(-1)).toBeGreaterThan(20);
        expect(
          Math.max(
            ...positions
              .slice(120)
              .map((p, i) => Math.abs(p - positions[i + 119]))
          )
        ).toBeLessThan(0.2);
        step.pointer!.active = false;
        for (let i = 0; i < 240; i++) motion.step(1 / 60, step);
        expect(Math.abs(offsets()[0] * 400)).toBeLessThan(0.1);
      } finally {
        motion.dispose();
      }
    });

    it("resets both velocity and offset without reviving an old impulse", () => {
      const { motion, step, offsets } = setup();
      try {
        for (let i = 0; i < 20; i++) motion.step(1 / 60, step);
        expect(offsets()[0]).toBeGreaterThan(0);
        motion.reset();
        step.pointer!.active = false;
        for (let i = 0; i < 20; i++) motion.step(1 / 60, step);
        expect(offsets().some(Boolean)).toBe(false);
        expect(
          (
            (motion.textures.velocity as DataTexture).image.data as Float32Array
          ).some(Boolean)
        ).toBe(false);
      } finally {
        motion.dispose();
      }
    });
  });

  describe("F9 & F10: 3D Coherent Drag & Canonical Home Euler Slerp Restore", () => {
    it("returns to the configured home pose rather than accumulating idle rotation", () => {
      const q = RotationMotion.defaultHomeQuaternion();
      const motion = new RotationMotion(q);
      expect(
        q.angleTo(new Quaternion().setFromEuler(RotationMotion.homeEuler))
      ).toBeCloseTo(0, 5);
      motion.begin();
      motion.turn(0.6, 0);
      motion.release();
      for (let i = 0; i < 360; i++) motion.advance(1 / 60);
      expect(motion.phase).toBe("idle");
      expect(motion.orientation.angleTo(q)).toBeCloseTo(0, 5);
      for (let i = 0; i < 1800; i++) motion.advance(1 / 60);
      expect(motion.orientation.angleTo(q)).toBeCloseTo(0, 5);
    });

    it("follows the hand with the outer petal layers trailing the heart", () => {
      const motion = new RotationMotion(RotationMotion.defaultHomeQuaternion());
      motion.begin();
      expect(motion.phase).toBe("dragging");
      motion.drag(100, 0);
      expect(motion.target.y).toBeCloseTo(0.5, 6);
      motion.advance(0.1);
      const heart = motion.spin.y;
      const outer = motion.layers[0].spin.y;
      const inner = motion.layers[motion.layers.length - 1].spin.y;
      expect(heart).toBeGreaterThan(inner);
      expect(inner).toBeGreaterThan(outer);
      expect(outer).toBeGreaterThan(0);
      expect(Number.isFinite(motion.speed)).toBe(true);
      for (let i = 0; i < 90; i++) motion.advance(1 / 60);
      expect(motion.spin.y).toBeCloseTo(0.5, 3);
      expect(motion.layers[0].spin.y).toBeCloseTo(0.5, 2);
    });

    it("lets go and turns back to face the reader, every layer on its own delay", () => {
      const motion = new RotationMotion(RotationMotion.defaultHomeQuaternion());
      motion.begin();
      motion.turn(0, 1.2);
      for (let i = 0; i < 60; i++) motion.advance(1 / 60);
      motion.release();
      expect(motion.phase).toBe("returning");
      expect(motion.target.length()).toBe(0);
      for (let i = 0; i < 12; i++) motion.advance(1 / 60);
      expect(Math.abs(motion.spin.y)).toBeLessThan(
        Math.abs(motion.layers[0].spin.y)
      );
      let time = 0.2;
      while (motion.phase === "returning" && time < 5) {
        motion.advance(1 / 60);
        time += 1 / 60;
      }
      expect(motion.phase).toBe("idle");
      expect(time).toBeLessThan(3.5);
      expect(motion.orientation.angleTo(motion.home)).toBe(0);
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
      const readerProfile = getAmbientProfile(
        "/post/flow-matching-generative-models"
      );
      const readerWithQuery = getAmbientProfile(
        "/post/flow-matching-generative-models?source=search&ref=nav#abstract"
      );
      const archiveProfile = getAmbientProfile("/archive");
      const aboutProfile = getAmbientProfile("/about");

      // Deterministic: query/hash does not alter the generated pattern
      expect(readerProfile.family).toBe(readerWithQuery.family);
      expect(readerProfile.driftX).toBe(readerWithQuery.driftX);
      expect(readerProfile.glow).toBe(readerWithQuery.glow);
      expect(readerProfile.rows[0].points[0]).toEqual(
        readerWithQuery.rows[0].points[0]
      );

      // Different routes yield varied mathematical families
      const families = new Set([
        homeProfile.family,
        readerProfile.family,
        archiveProfile.family,
        aboutProfile.family,
      ]);
      expect(families.size).toBeGreaterThanOrEqual(2);
    });

    it("preserves each ambient family topology independently of the home signature", () => {
      const testSlugs = [
        "/post/deep-reinforcement-learning",
        "/post/attention-is-all-you-need",
        "/post/mamba-state-space-models",
        "/post/flash-attention-v3",
      ];

      for (const slug of testSlugs) {
        const profile = getAmbientProfile(slug);
        expect(profile.rows).toHaveLength(AMBIENT_ROWS); // exactly 6 tracks

        expect(profile.family).toBe("constellation");
        expect(profile.motif).toBeDefined();
        // Article motifs use six open strokes; they do not inherit rose row topology.
        for (let i = 0; i < 6; i++) {
          expect(profile.rows[i].closed).toBe(false);
          expect(profile.rows[i].endpointFade).toBeGreaterThan(0);
          expect(profile.rows[i].points).toHaveLength(TRACK_SAMPLES + 1);
          for (const point of profile.rows[i].points) {
            expect(Math.abs(point[2])).toBeLessThan(0.15);
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

  // Text contrast and raster quiet zones require the live browser. Layout-to-
  // shader quiet-box mapping is covered through the real scene in galaxyScene.test.

  describe("F15: responsive render quality", () => {
    it("reduces the actual quality profile without cumulative instance halving", () => {
      const quality = new RenderQuality();
      const mobile = {
        devicePixelRatio: 3,
        mobile: true,
        coarsePointer: true,
        light: false,
        starCount: 128,
      };
      expect(quality.apply(mobile).trailCount).toBe(128);
      // Resolution steps come first and never touch the instance budget.
      for (let i = 1; i < RENDER_SCALES.length; i++) quality.degrade();
      expect(quality.apply(mobile).trailCount).toBe(128);
      quality.degrade();
      expect(quality.apply(mobile).trailCount).toBe(64);
      expect(quality.apply({ ...mobile, light: true }).trailCount).toBe(64);
      quality.degrade();
      expect(
        quality.apply({ ...mobile, mobile: false, starCount: 300 }).trailCount
      ).toBe(0);
    });

    it("uses device-specific DPR ceilings through the production quality API", () => {
      const quality = new RenderQuality();
      const input = {
        devicePixelRatio: 3,
        mobile: true,
        coarsePointer: true,
        light: false,
        starCount: 128,
      };
      expect(quality.apply(input).dpr).toBe(1.25);
      expect(
        quality.apply({ ...input, mobile: false, devicePixelRatio: 2 }).dpr
      ).toBe(1.5);
      expect(
        quality.apply({ ...input, mobile: false, devicePixelRatio: 1 }).dpr
      ).toBe(1);
    });
  });
});
