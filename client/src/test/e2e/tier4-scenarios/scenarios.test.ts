import { describe, expect, it } from "vitest";
import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
import {
  bakeAmbientTracks,
  getAmbientProfile,
} from "@/components/galaxy/ambientScene";
import { getPageScene } from "@/components/galaxy/pageScene";
import { RotationMotion } from "@/components/galaxy/rotationMotion";
import { BloomPyramidPass } from "@/components/galaxy/bloomPyramid";
import { evaluateIntroConvergence } from "@/components/galaxy/galaxyScene";
import {
  bakeTracks,
  createRoseTracks,
  sampleTrack,
} from "@/components/galaxy/roseTracks";
import {
  sampleParticleBases,
  type ParticleBaseOptions,
} from "@/components/galaxy/sampleParticleBase";
import { RenderQuality } from "@/components/galaxy/renderQuality";
import { projectTrackball } from "@/components/galaxy/trackball";

function readingInput(path: string): ParticleBaseOptions {
  const rose = createRoseTracks();
  const tracks = bakeTracks(rose);
  for (let i = 3; i < tracks.length; i += 4) tracks[i] = 1;
  const profile = getAmbientProfile(path);
  const ambient = bakeAmbientTracks(profile);
  const metadata = new Float32Array(
    profile.rows.flatMap(row => [
      row.closed ? 1 : 0,
      row.length,
      row.endpointFade,
      0,
    ])
  );
  return {
    positions: new Float32Array(
      rose.flatMap(track => sampleTrack(track, 0.3125).toArray())
    ),
    orbits: new Float32Array(
      rose.flatMap((track, row) => [row, 0.3125, 1 / track.period, 0])
    ),
    tracks,
    ambientFrom: ambient,
    ambientTo: ambient,
    ambientMetaFrom: metadata,
    ambientMetaTo: metadata,
    ambientMorph: 1,
    ambientBlend: 1,
    time: 0,
    intro: 1,
    scatterRadius: 11,
    viewMatrix: new Matrix4().makeTranslation(0, 0, -10),
    split: 1,
    disperse: 0,
    pagePose: new Vector3(),
    sideX: 5,
    aspect: 16 / 9,
    ambientDrift: new Vector3(
      profile.driftX,
      profile.driftY,
      profile.driftSpeed
    ),
  };
}

// These are production-function/CPU scenarios. They do not render WebGL,
// exercise browser layout or establish final composited text contrast.
describe("Tier 4: CPU application subsystem scenarios", () => {
  const canonicalHomeQuat = RotationMotion.defaultHomeQuaternion();

  // Scenario 1: Initial User Landing on Home Route
  describe("Scenario 1: Initial User Landing on Home Route", () => {
    it("converges the production intro evaluator while preserving the canonical idle pose", () => {
      // 1. Initial page load on '/'
      const pageScene = getPageScene("/");
      expect(pageScene.mode).toBe("home");

      const motion = new RotationMotion(canonicalHomeQuat);
      expect(motion.orientation.angleTo(canonicalHomeQuat)).toBeCloseTo(0, 5);

      for (const seed of [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 },
      ]) {
        let previous = 0;
        for (let frame = 0; frame <= 100; frame++) {
          const state = evaluateIntroConvergence(frame / 100, seed);
          expect(state.local).toBeGreaterThanOrEqual(previous);
          expect(state.local).toBeLessThanOrEqual(1);
          previous = state.local;
        }
        expect(evaluateIntroConvergence(0, seed).introT).toBe(0);
        expect(evaluateIntroConvergence(0.95, seed).isFullyConverged).toBe(
          true
        );
      }
      expect(motion.phase).toBe("idle");
      expect(motion.orientation.angleTo(canonicalHomeQuat)).toBeCloseTo(0, 5);
    });
  });

  describe("Scenario 2: Reading an Article with Side-Bank Particle Placement", () => {
    it("uses deterministic open article motifs and places sampled particles outside the central reading band", () => {
      const articlePath = "/post/flow";
      const scene = getPageScene(articlePath);
      expect(scene.mode).toBe("reading");

      // Constellation generation
      const profile = getAmbientProfile(articlePath);
      expect(profile.rows).toHaveLength(6);
      expect(profile).toEqual(
        getAmbientProfile(`${articlePath}?source=archive`)
      );
      expect(profile.family).toBe("constellation");
      expect(profile.motif).toBeDefined();
      for (const row of profile.rows) {
        expect(row.closed).toBe(false);
        expect(row.points.at(-1)).not.toEqual(row.points[0]);
        expect(row.endpointFade).toBeGreaterThan(0);
      }
      const input = readingInput(articlePath);
      const field = sampleParticleBases(input);
      const camera = new PerspectiveCamera(42, input.aspect, 0.1, 40);
      for (let i = 0; i < field.length; i += 4) {
        const projected = new Vector3(
          field[i],
          field[i + 1],
          field[i + 2]
        ).applyMatrix4(camera.projectionMatrix);
        expect(Math.abs(projected.x)).toBeGreaterThan(0.65);
        expect(Math.abs(projected.x)).toBeLessThan(1);
        expect(field[i + 3]).toBeGreaterThan(0);
      }
    });
  });

  // Scenario 3: Reader to Archive Navigation & Cross-Fade
  describe("Scenario 3: Reader to Archive Navigation & Cross-Fade", () => {
    it("interpolates CPU particle fields from the frozen frame, including interrupted navigation", () => {
      // Step 1: Start at /post/flow
      const startPath = "/post/flow";
      const startProfile = getAmbientProfile(startPath);
      const currentMode = getPageScene(startPath).mode;
      expect(currentMode).toBe("reading");

      // Step 2: User clicks navigation to /archive
      const targetPath = "/archive";
      const targetProfile = getAmbientProfile(targetPath);
      const targetMode = getPageScene(targetPath).mode;
      expect(targetMode).toBe("reading");

      expect(startProfile.rows).toHaveLength(6);
      expect(targetProfile.rows).toHaveLength(6);
      const frozen = sampleParticleBases(readingInput(startPath));
      const targetInput = readingInput(targetPath);
      const target = sampleParticleBases(targetInput);
      expect(target).not.toEqual(frozen);
      expect(
        sampleParticleBases({
          ...targetInput,
          navigationFrom: frozen,
          navigationProgress: 0,
        })
      ).toEqual(frozen);
      const halfway = sampleParticleBases({
        ...targetInput,
        navigationFrom: frozen,
        navigationProgress: 0.5,
      });
      for (let i = 0; i < target.length; i++)
        expect(halfway[i]).toBeCloseTo((frozen[i] + target[i]) / 2, 5);
      expect(
        sampleParticleBases({
          ...readingInput("/about"),
          navigationFrom: halfway,
          navigationProgress: 0,
        })
      ).toEqual(halfway);
    });
  });

  // Scenario 4: DayInk / Night Mode Theme Switching Across Routes
  describe("Scenario 4: DayInk / Night Mode Theme Switching Across Routes", () => {
    it("supports light-mode bloom disabling and restores the pass strength configuration", () => {
      const bloomPass = new BloomPyramidPass({ strength: 0.55 });

      // 1. Dark mode on Home
      expect(bloomPass.strength).toBe(0.55);

      // 2. User toggles to Day mode
      bloomPass.strength = 0.0; // Day mode suppresses bloom
      expect(bloomPass.strength).toBe(0.0);

      const quality = new RenderQuality();
      const profile = {
        devicePixelRatio: 2,
        mobile: false,
        coarsePointer: false,
        starCount: 300,
      };
      expect(quality.apply({ ...profile, light: true }).bloomEnabled).toBe(
        false
      );
      expect(quality.apply({ ...profile, light: false }).bloomEnabled).toBe(
        true
      );

      // 4. User toggles back to Dark mode on article route
      bloomPass.strength = 0.55;
      expect(bloomPass.strength).toBe(0.55);

      bloomPass.dispose();
    });
  });

  // Scenario 5: Mobile Interaction Under Coarse Pointer Constraints
  describe("Scenario 5: Mobile Interaction Under Coarse Pointer Constraints", () => {
    it("advances the CPU drag state machine to home using a 390px trackball fixture", () => {
      const mobileWidth = 390;
      const mobileHeight = 844;
      const coarsePointer = true;

      // Particle and DPR budget constraints
      const quality = new RenderQuality().apply({
        devicePixelRatio: 3,
        mobile: true,
        coarsePointer,
        light: false,
        starCount: 128,
      });
      expect(quality.dpr).toBe(1.25);

      // User performs touch drag on trackball
      const motion = new RotationMotion(canonicalHomeQuat);
      motion.begin();
      expect(motion.phase).toBe("dragging");

      const pStart = projectTrackball(
        mobileWidth / 2,
        mobileHeight / 2,
        mobileWidth,
        mobileHeight
      );
      const pDrag = projectTrackball(
        mobileWidth / 2 + 80,
        mobileHeight / 2 + 50,
        mobileWidth,
        mobileHeight
      );
      const dragDelta = new Quaternion().setFromUnitVectors(pStart, pDrag);

      motion.move(dragDelta, 0.033); // 30fps mobile tick (~33ms)
      expect(motion.orientation.angleTo(canonicalHomeQuat)).toBeGreaterThan(
        0.1
      );

      // Release into coast
      motion.release();
      expect(motion.phase).toBe("inertia");

      // Advance at 30fps (dt = 0.033s) until settled
      let elapsed = 0;
      while (motion.phase !== "idle" && elapsed < 6.0) {
        motion.advance(0.033);
        elapsed += 0.033;
      }

      // Settled within ~3.5s
      expect(elapsed).toBeGreaterThan(2.0);
      expect(elapsed).toBeLessThan(4.5);
      expect(motion.phase).toBe("idle");
      expect(motion.orientation.angleTo(canonicalHomeQuat)).toBeCloseTo(0, 5);
    });
  });
});
