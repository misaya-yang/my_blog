import { describe, expect, it, vi } from "vitest";
import {
  HalfFloatType,
  LinearFilter,
  ClampToEdgeWrapping,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
  ShaderMaterial,
} from "three";
import { BloomPyramidPass } from "@/components/galaxy/bloomPyramid";
import { evaluateIntroConvergence } from "@/components/galaxy/galaxyScene";

/**
 * Exact mathematical replication of GLSL applyIntro(p, original) from galaxyScene.ts:
 *
 * vec3 applyIntro(vec3 p, vec3 original) {
 *   if (uIntro >= 1.0) { gIntroT = 1.0; gTravelT = 1.0; return p; }
 *   vec3 iseed = fract(sin(vec3(
 *     dot(original.xy, vec2(12.9898, 78.233)),
 *     dot(original.xy, vec2(39.346, 11.135)),
 *     dot(original.yx, vec2(73.156, 52.235))) ) * 43758.5453);
 *   float angle = iseed.y * 6.2831853;
 *   float scatterR = sqrt(iseed.z) * uScatterRadius;
 *   vec3 scattered = vec3(
 *     cos(angle) * scatterR * 1.3,
 *     sin(angle) * scatterR * 0.85,
 *     (iseed.x - 0.5) * 0.8);
 *   float seen = clamp((uIntro - iseed.z*0.14) / 0.22, 0.0, 1.0);
 *   float rim = 1.0 - smoothstep(0.72, 1.0, scatterR / max(uScatterRadius, 0.001));
 *   float delay = iseed.x * 0.22 + iseed.y * 0.08;
 *   float t = clamp((uIntro - delay - 0.10) / 0.55, 0.0, 1.0);
 *   float local = 1.0;
 *   if (t < 1.0) {
 *     local = t*t*t*(t*(t*6.0-15.0)+10.0);
 *     local = mix(local, sin(local*1.5707963), 0.5);
 *   }
 *   float fieldFade = seen*seen*(3.0-2.0*seen) * rim;
 *   gIntroT = mix(fieldFade, 1.0, local);
 *   float arc = sin(local*3.14159265) * (0.5 + iseed.z*0.35);
 *   float c = cos(arc), s = sin(arc);
 *   vec3 orbiting = vec3(
 *     scattered.x*c - scattered.y*s,
 *     scattered.x*s + scattered.y*c,
 *     scattered.z);
 *   gTravelT = local;
 *   return mix(orbiting, p, local);
 * }
 */
export function simulateGlslApplyIntro(
  p: [number, number, number],
  iseed: [number, number, number],
  uIntro: number,
  uScatterRadius = 2.5
): {
  position: [number, number, number];
  gIntroT: number;
  gTravelT: number;
  t: number;
  local: number;
} {
  if (uIntro >= 1.0) {
    return {
      position: [p[0], p[1], p[2]],
      gIntroT: 1.0,
      gTravelT: 1.0,
      t: 1.0,
      local: 1.0,
    };
  }

  const angle = iseed[1] * 6.2831853;
  const scatterR = Math.sqrt(Math.max(0, iseed[2])) * uScatterRadius;
  const scattered: [number, number, number] = [
    Math.cos(angle) * scatterR * 1.3,
    Math.sin(angle) * scatterR * 0.85,
    (iseed[0] - 0.5) * 0.8,
  ];

  const seen = Math.min(1, Math.max(0, (uIntro - iseed[2] * 0.14) / 0.22));

  const safeScatterRadius = Math.max(uScatterRadius, 0.001);
  const rNorm = scatterR / safeScatterRadius;
  // smoothstep(0.72, 1.0, rNorm)
  const ssEdge = Math.min(1, Math.max(0, (rNorm - 0.72) / (1.0 - 0.72)));
  const smoothstepVal = ssEdge * ssEdge * (3.0 - 2.0 * ssEdge);
  const rim = 1.0 - smoothstepVal;

  const delay = iseed[0] * 0.22 + iseed[1] * 0.08;
  const rawT = (uIntro - delay - 0.1) / 0.55;
  const t = Math.min(1, Math.max(0, rawT));

  let local = 1.0;
  if (t < 1.0) {
    local = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    local = 0.5 * (local + Math.sin(local * 1.5707963));
  }

  const fieldFade = seen * seen * (3.0 - 2.0 * seen) * rim;
  const gIntroT = fieldFade + (1.0 - fieldFade) * local;

  const arc = Math.sin(local * Math.PI) * (0.5 + iseed[2] * 0.35);
  const c = Math.cos(arc);
  const s = Math.sin(arc);
  const orbiting: [number, number, number] = [
    scattered[0] * c - scattered[1] * s,
    scattered[0] * s + scattered[1] * c,
    scattered[2],
  ];

  const gTravelT = local;
  const position: [number, number, number] = [
    orbiting[0] * (1.0 - local) + p[0] * local,
    orbiting[1] * (1.0 - local) + p[1] * local,
    orbiting[2] * (1.0 - local) + p[2] * local,
  ];

  return { position, gIntroT, gTravelT, t, local };
}

describe("Milestone 1 Empirical Stress Test", () => {
  describe("Target 1: 10,000 Particle Seeds applyIntro Stress Verification", () => {
    it("empirically verifies 10,000 randomized particle seeds: 0 NaN/Inf, 0 discontinuity at uIntro=1.0, 100% finished before uIntro=0.98", () => {
      // Deterministic PRNG (Linear Congruential Generator) for reproducible 10,000 seeds
      let lcgState = 123456789;
      function nextRandom(): number {
        lcgState = (1103515245 * lcgState + 12345) & 0x7fffffff;
        return lcgState / 0x7fffffff;
      }

      const PARTICLE_COUNT = 10000;
      let maxCompletionIntro = 0;
      let nanCount = 0;
      let infCount = 0;
      let maxDiscontinuityDelta = 0;

      const testUIntroValues = [
        0.0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 0.94, 0.95, 0.96, 0.97,
        0.979, 0.98, 0.985, 0.99, 0.999, 0.9999, 0.999999,
      ];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Uniform random seed in [0, 1)
        const iseed: [number, number, number] = [
          nextRandom(),
          nextRandom(),
          nextRandom(),
        ];

        // Arbitrary canonical position p for particle in rose galaxy
        const p: [number, number, number] = [
          (nextRandom() - 0.5) * 4.0,
          (nextRandom() - 0.5) * 4.0,
          (nextRandom() - 0.5) * 1.5,
        ];

        // 1. Check for NaN/Inf across all sample points of uIntro
        let previousLocal = 0;
        let particleFinishU = 1.0;
        let finishedFound = false;

        for (const u of testUIntroValues) {
          const res = simulateGlslApplyIntro(p, iseed, u);

          // Check for NaN or Inf
          for (const coord of res.position) {
            if (Number.isNaN(coord)) nanCount++;
            if (!Number.isFinite(coord)) infCount++;
          }
          if (Number.isNaN(res.gIntroT) || !Number.isFinite(res.gIntroT))
            nanCount++;
          if (Number.isNaN(res.gTravelT) || !Number.isFinite(res.gTravelT))
            nanCount++;
          if (Number.isNaN(res.local) || !Number.isFinite(res.local))
            nanCount++;

          // Monotonicity check
          expect(res.local).toBeGreaterThanOrEqual(previousLocal - 1e-12);
          previousLocal = res.local;

          // Track earliest finish (where local reaches 1.0)
          if (!finishedFound && res.local >= 1.0 - 1e-12) {
            particleFinishU = u;
            finishedFound = true;
          }
        }

        if (particleFinishU > maxCompletionIntro) {
          maxCompletionIntro = particleFinishU;
        }

        // 2. Discontinuity / snap jump check when uIntro transitions to 1.0:
        // Compare state at uIntro = 0.999999 vs uIntro = 1.0 (the early-return branch)
        const justBefore = simulateGlslApplyIntro(p, iseed, 0.999999);
        const atOne = simulateGlslApplyIntro(p, iseed, 1.0);

        const dx = justBefore.position[0] - atOne.position[0];
        const dy = justBefore.position[1] - atOne.position[1];
        const dz = justBefore.position[2] - atOne.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > maxDiscontinuityDelta) {
          maxDiscontinuityDelta = dist;
        }

        // Also verify exported evaluateIntroConvergence TypeScript helper
        const helperJustBefore = evaluateIntroConvergence(0.999999, {
          x: iseed[0],
          y: iseed[1],
          z: iseed[2],
        });
        const helperAtOne = evaluateIntroConvergence(1.0, {
          x: iseed[0],
          y: iseed[1],
          z: iseed[2],
        });

        expect(helperJustBefore.isFullyConverged).toBe(true);
        expect(helperAtOne.isFullyConverged).toBe(true);
        expect(helperJustBefore.local).toBe(1.0);
        expect(helperAtOne.local).toBe(1.0);
        expect(helperJustBefore.introT).toBe(1.0);
        expect(helperAtOne.introT).toBe(1.0);
      }

      // Assertions
      expect(nanCount).toBe(0);
      expect(infCount).toBe(0);
      expect(maxDiscontinuityDelta).toBeLessThan(1e-10); // Absolute zero discontinuity
      expect(maxCompletionIntro).toBeLessThanOrEqual(0.95); // All finished at or before 0.95
      expect(maxCompletionIntro).toBeLessThan(0.98); // Strictly less than 0.98 requirement
    });

    it("verifies corner boundary edge cases and extreme values", () => {
      const boundarySeeds: [number, number, number][] = [
        [0.0, 0.0, 0.0],
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
        [1.0, 1.0, 0.0],
        [1.0, 0.0, 1.0],
        [0.0, 1.0, 1.0],
        [1.0, 1.0, 1.0],
        [1e-9, 1e-9, 1e-9],
        [1 - 1e-9, 1 - 1e-9, 1 - 1e-9],
      ];

      const testPositions: [number, number, number][] = [
        [0, 0, 0],
        [1e3, -1e3, 500],
        [-0.001, 0.002, -0.003],
      ];

      for (const seed of boundarySeeds) {
        for (const p of testPositions) {
          // At uIntro = 0.95, particles are within machine precision of settled (local >= 1.0 - 1e-10)
          const res95 = simulateGlslApplyIntro(p, seed, 0.95);
          expect(res95.local).toBeGreaterThanOrEqual(1.0 - 1e-10);
          expect(res95.position[0]).toBeCloseTo(p[0], 6);
          expect(res95.position[1]).toBeCloseTo(p[1], 6);
          expect(res95.position[2]).toBeCloseTo(p[2], 6);

          // By uIntro = 0.951 (and certainly by 0.98), every particle is strictly 100% finished
          const res951 = simulateGlslApplyIntro(p, seed, 0.951);
          expect(res951.local).toBe(1.0);
          expect(res951.t).toBe(1.0);
          expect(res951.position[0]).toBe(p[0]);
          expect(res951.position[1]).toBe(p[1]);
          expect(res951.position[2]).toBe(p[2]);

          const res98 = simulateGlslApplyIntro(p, seed, 0.98);
          expect(res98.local).toBe(1.0);
          expect(res98.t).toBe(1.0);
          expect(res98.position[0]).toBe(p[0]);
          expect(res98.position[1]).toBe(p[1]);
          expect(res98.position[2]).toBe(p[2]);

          const res1 = simulateGlslApplyIntro(p, seed, 1.0);
          expect(res1.position[0]).toBe(p[0]);
          expect(res1.position[1]).toBe(p[1]);
          expect(res1.position[2]).toBe(p[2]);
        }
      }
    });

    it("verifies smooth trajectory continuity on high-resolution continuous sweep", () => {
      // Seed with worst-case maximum delay: iseed.x = 1.0, iseed.y = 1.0
      const worstCaseSeed: [number, number, number] = [1.0, 1.0, 1.0];
      const p: [number, number, number] = [1.5, -2.0, 0.5];

      let prevPos = simulateGlslApplyIntro(p, worstCaseSeed, 0.0).position;

      // Fine sweep from 0 to 1.0 with 2000 steps (step = 0.0005)
      for (let step = 1; step <= 2000; step++) {
        const u = step / 2000;
        const current = simulateGlslApplyIntro(p, worstCaseSeed, u);

        const delta = Math.sqrt(
          (current.position[0] - prevPos[0]) ** 2 +
            (current.position[1] - prevPos[1]) ** 2 +
            (current.position[2] - prevPos[2]) ** 2
        );

        // Movement per 0.0005 step should be gentle and bounded, no explosive jumps
        expect(delta).toBeLessThan(0.05);

        if (u >= 0.951) {
          // Exactly settled
          expect(current.local).toBe(1.0);
          expect(current.position[0]).toBe(p[0]);
          expect(current.position[1]).toBe(p[1]);
          expect(current.position[2]).toBe(p[2]);
        }

        prevPos = current.position;
      }
    });
  });

  describe("Target 2: BloomPyramidPass Viewport Aspect Ratios & Allocations & Feedback Loops", () => {
    const createFeedbackAuditRenderer = () => {
      let currentTarget: WebGLRenderTarget | null = null;
      let renderCallCount = 0;
      const feedbackViolations: Array<{
        passIndex: number;
        target: WebGLRenderTarget | null;
        violationType: string;
      }> = [];

      const renderer = {
        autoClear: true,
        getRenderTarget: vi.fn(() => currentTarget),
        setRenderTarget: vi.fn((target: WebGLRenderTarget | null) => {
          currentTarget = target;
        }),
        render: vi.fn((scene: any) => {
          renderCallCount++;
          const quadMesh = scene?.children?.[0] ?? scene;
          const mat = (quadMesh?.material ?? {}) as ShaderMaterial;
          const targetTex = currentTarget?.texture;

          if (targetTex && mat.uniforms) {
            // Check for WebGL feedback loop: active render target texture bound as input uniform
            if (mat.uniforms.inputBuffer?.value === targetTex) {
              feedbackViolations.push({
                passIndex: renderCallCount,
                target: currentTarget,
                violationType: "inputBuffer matches active target",
              });
            }
            if (mat.uniforms.supportBuffer?.value === targetTex) {
              feedbackViolations.push({
                passIndex: renderCallCount,
                target: currentTarget,
                violationType: "supportBuffer matches active target",
              });
            }
            if (mat.uniforms.scene?.value === targetTex) {
              feedbackViolations.push({
                passIndex: renderCallCount,
                target: currentTarget,
                violationType: "scene matches active target",
              });
            }
            if (mat.uniforms.bloom?.value === targetTex) {
              feedbackViolations.push({
                passIndex: renderCallCount,
                target: currentTarget,
                violationType: "bloom matches active target",
              });
            }
          }
        }),
      } as unknown as WebGLRenderer;

      return {
        renderer,
        getFeedbackViolations: () => feedbackViolations,
        getRenderCallCount: () => renderCallCount,
      };
    };

    const VIEWPORT_TEST_MATRIX = [
      { name: "Ultrawide 21:9 (2560x1080)", width: 2560, height: 1080 },
      { name: "Ultrawide 21:9 (3440x1440)", width: 3440, height: 1440 },
      { name: "Mobile 9:19.5 (390x844)", width: 390, height: 844 },
      { name: "Mobile 9:19.5 (430x932)", width: 430, height: 932 },
      { name: "Square Tiny (100x100)", width: 100, height: 100 },
      { name: "Extreme Square Tiny (10x10)", width: 10, height: 10 },
      { name: "Standard 4K (3840x2160)", width: 3840, height: 2160 },
      { name: "DCI 4K (4096x2160)", width: 4096, height: 2160 },
      { name: "Extreme Tall Ribbon (50x1200)", width: 50, height: 1200 },
      { name: "Extreme Wide Banner (1920x80)", width: 1920, height: 80 },
    ];

    it.each(VIEWPORT_TEST_MATRIX)(
      "renders smoothly across viewport $name without feedback loops",
      ({ width, height }) => {
        const { renderer, getFeedbackViolations } =
          createFeedbackAuditRenderer();
        const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });
        pass.setSize(width, height);

        const readBuffer = new WebGLRenderTarget(width, height);
        const writeBuffer = new WebGLRenderTarget(width, height);

        // Render pass
        pass.render(renderer, writeBuffer, readBuffer);

        // Feedback loop check
        const violations = getFeedbackViolations();
        expect(violations).toEqual([]);

        // Ensure all mips have valid dimensions >= 1
        for (const mip of pass.downMips) {
          expect(mip.width).toBeGreaterThanOrEqual(1);
          expect(mip.height).toBeGreaterThanOrEqual(1);
          expect(Number.isFinite(mip.width)).toBe(true);
          expect(Number.isFinite(mip.height)).toBe(true);
        }
        for (const mip of pass.upMips) {
          expect(mip.width).toBeGreaterThanOrEqual(1);
          expect(mip.height).toBeGreaterThanOrEqual(1);
          expect(Number.isFinite(mip.width)).toBe(true);
          expect(Number.isFinite(mip.height)).toBe(true);
        }

        pass.dispose();
        readBuffer.dispose();
        writeBuffer.dispose();
      }
    );

    it("verifies ZERO buffer reallocation across 100 consecutive render frames", () => {
      const { renderer } = createFeedbackAuditRenderer();
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });
      const WIDTH = 1920;
      const HEIGHT = 1080;

      pass.setSize(WIDTH, HEIGHT);

      const readBuffer = new WebGLRenderTarget(WIDTH, HEIGHT);
      const writeBuffer = new WebGLRenderTarget(WIDTH, HEIGHT);

      // Snapshot target references
      const initialDownMips = [...pass.downMips];
      const initialUpMips = [...pass.upMips];

      // Spy on dispose methods to ensure no internal teardown during render loop
      const disposeSpies = [
        ...initialDownMips.map(m => vi.spyOn(m, "dispose")),
        ...initialUpMips.map(m => vi.spyOn(m, "dispose")),
      ];

      // Render 100 frames (representing 100 animation frames at 60fps)
      for (let frame = 0; frame < 100; frame++) {
        pass.render(renderer, writeBuffer, readBuffer);

        // Target references must never change
        expect(pass.downMips.length).toBe(6);
        expect(pass.upMips.length).toBe(5);

        for (let i = 0; i < pass.downMips.length; i++) {
          expect(pass.downMips[i]).toBe(initialDownMips[i]);
        }
        for (let i = 0; i < pass.upMips.length; i++) {
          expect(pass.upMips[i]).toBe(initialUpMips[i]);
        }
      }

      // No buffers were disposed or reallocated during the render loop
      for (const spy of disposeSpies) {
        expect(spy).not.toHaveBeenCalled();
      }

      // Cleanup
      pass.dispose();
      readBuffer.dispose();
      writeBuffer.dispose();

      // After explicit dispose(), all buffers should be disposed exactly once
      for (const spy of disposeSpies) {
        expect(spy).toHaveBeenCalledTimes(1);
      }
    });

    it("verifies aspect ratio parameter calculation across all viewports", () => {
      const pass = new BloomPyramidPass();

      for (const vp of VIEWPORT_TEST_MATRIX) {
        pass.setSize(vp.width, vp.height);
        const expectedAspect = vp.width / vp.height;

        const { renderer } = createFeedbackAuditRenderer();
        const readBuffer = new WebGLRenderTarget(vp.width, vp.height);
        const writeBuffer = new WebGLRenderTarget(vp.width, vp.height);

        pass.render(renderer, writeBuffer, readBuffer);

        // Access internal composite material uniform
        const compMat = (pass as any).compositeMaterial as ShaderMaterial;
        expect(compMat.uniforms.uAspect.value).toBeCloseTo(expectedAspect, 5);
        expect(Number.isFinite(compMat.uniforms.uAspect.value)).toBe(true);

        readBuffer.dispose();
        writeBuffer.dispose();
      }

      pass.dispose();
    });

    it("verifies clean buffer reallocation and zero leaks during dynamic viewport resizing across aspect ratios", () => {
      const { renderer, getFeedbackViolations } =
        createFeedbackAuditRenderer();
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });

      // Sequence of dynamic viewport resizing (e.g. window resizing, orientation flip, split-screen)
      const dynamicResizeSequence = [
        { width: 3840, height: 2160 }, // 4K
        { width: 100, height: 100 },   // Tiny
        { width: 2560, height: 1080 }, // Ultrawide 21:9
        { width: 390, height: 844 },   // Mobile 9:19.5
        { width: 1920, height: 1080 }, // Standard 16:9
        { width: 430, height: 932 },   // Mobile Max
      ];

      for (const res of dynamicResizeSequence) {
        const prevDownMips = [...pass.downMips];
        const prevUpMips = [...pass.upMips];
        const prevSpies = [
          ...prevDownMips.map(m => vi.spyOn(m, "dispose")),
          ...prevUpMips.map(m => vi.spyOn(m, "dispose")),
        ];

        // Call setSize for new resolution
        pass.setSize(res.width, res.height);

        // Verify previous render targets were all disposed
        for (const spy of prevSpies) {
          expect(spy).toHaveBeenCalledTimes(1);
        }

        // Render at new resolution
        const readBuffer = new WebGLRenderTarget(res.width, res.height);
        const writeBuffer = new WebGLRenderTarget(res.width, res.height);

        pass.render(renderer, writeBuffer, readBuffer);

        expect(getFeedbackViolations()).toEqual([]);
        expect(pass.downMips).toHaveLength(6);
        expect(pass.upMips).toHaveLength(5);

        readBuffer.dispose();
        writeBuffer.dispose();
      }

      pass.dispose();
    });
  });

  describe("Target 1 (Hardware Emulation): IEEE-754 Float32 (single precision) applyIntro", () => {
    // Exact GLSL highp float emulation using Math.fround
    function simulateGlslApplyIntroF32(
      p: [number, number, number],
      iseed: [number, number, number],
      uIntro: number,
      uScatterRadius = 2.5
    ): {
      position: [number, number, number];
      gIntroT: number;
      gTravelT: number;
      local: number;
      finished: boolean;
    } {
      const uF = Math.fround(uIntro);
      if (uF >= Math.fround(1.0)) {
        return {
          position: [Math.fround(p[0]), Math.fround(p[1]), Math.fround(p[2])],
          gIntroT: Math.fround(1.0),
          gTravelT: Math.fround(1.0),
          local: Math.fround(1.0),
          finished: true,
        };
      }

      const iseed0 = Math.fround(iseed[0]);
      const iseed1 = Math.fround(iseed[1]);
      const iseed2 = Math.fround(iseed[2]);
      const scatterRad = Math.fround(uScatterRadius);

      const angle = Math.fround(iseed1 * Math.fround(6.2831853));
      const scatterR = Math.fround(
        Math.fround(Math.sqrt(Math.max(0, iseed2))) * scatterRad
      );
      const scattered: [number, number, number] = [
        Math.fround(Math.fround(Math.cos(angle)) * Math.fround(scatterR * Math.fround(1.3))),
        Math.fround(Math.fround(Math.sin(angle)) * Math.fround(scatterR * Math.fround(0.85))),
        Math.fround(Math.fround(iseed0 - Math.fround(0.5)) * Math.fround(0.8)),
      ];

      const seen = Math.min(
        Math.fround(1.0),
        Math.max(Math.fround(0.0), Math.fround(Math.fround(uF - Math.fround(iseed2 * Math.fround(0.14))) / Math.fround(0.22)))
      );

      const safeScatterRadius = Math.max(scatterRad, Math.fround(0.001));
      const rNorm = Math.fround(scatterR / safeScatterRadius);
      const ssEdge = Math.min(
        Math.fround(1.0),
        Math.max(Math.fround(0.0), Math.fround(Math.fround(rNorm - Math.fround(0.72)) / Math.fround(1.0 - 0.72)))
      );
      const smoothstepVal = Math.fround(
        Math.fround(ssEdge * ssEdge) * Math.fround(Math.fround(3.0) - Math.fround(Math.fround(2.0) * ssEdge))
      );
      const rim = Math.fround(Math.fround(1.0) - smoothstepVal);

      const delay = Math.fround(
        Math.fround(iseed0 * Math.fround(0.22)) + Math.fround(iseed1 * Math.fround(0.08))
      );
      const rawT = Math.fround(
        Math.fround(Math.fround(uF - delay) - Math.fround(0.10)) / Math.fround(0.55)
      );
      const t = Math.min(Math.fround(1.0), Math.max(Math.fround(0.0), rawT));

      let local = Math.fround(1.0);
      if (t < Math.fround(1.0)) {
        // local = t*t*t*(t*(t*6.0-15.0)+10.0);
        const polyInner = Math.fround(
          Math.fround(t * Math.fround(Math.fround(t * Math.fround(6.0)) - Math.fround(15.0))) + Math.fround(10.0)
        );
        const poly = Math.fround(Math.fround(Math.fround(t * t) * t) * polyInner);
        const sinPart = Math.fround(Math.sin(Math.fround(poly * Math.fround(1.5707963))));
        local = Math.fround(Math.fround(poly + sinPart) * Math.fround(0.5));
      }

      const fieldFade = Math.fround(
        Math.fround(Math.fround(seen * seen) * Math.fround(Math.fround(3.0) - Math.fround(Math.fround(2.0) * seen))) * rim
      );
      const gIntroT = Math.fround(
        Math.fround(fieldFade * Math.fround(Math.fround(1.0) - local)) + local
      );

      const arc = Math.fround(
        Math.fround(Math.sin(Math.fround(local * Math.fround(Math.PI)))) *
        Math.fround(Math.fround(0.5) + Math.fround(iseed2 * Math.fround(0.35)))
      );
      const c = Math.fround(Math.cos(arc));
      const s = Math.fround(Math.sin(arc));
      const orbiting: [number, number, number] = [
        Math.fround(Math.fround(scattered[0] * c) - Math.fround(scattered[1] * s)),
        Math.fround(Math.fround(scattered[0] * s) + Math.fround(scattered[1] * c)),
        scattered[2],
      ];

      const gTravelT = local;
      const position: [number, number, number] = [
        Math.fround(Math.fround(orbiting[0] * Math.fround(Math.fround(1.0) - local)) + Math.fround(Math.fround(p[0]) * local)),
        Math.fround(Math.fround(orbiting[1] * Math.fround(Math.fround(1.0) - local)) + Math.fround(Math.fround(p[1]) * local)),
        Math.fround(Math.fround(orbiting[2] * Math.fround(Math.fround(1.0) - local)) + Math.fround(Math.fround(p[2]) * local)),
      ];

      return {
        position,
        gIntroT,
        gTravelT,
        local,
        finished: local >= Math.fround(1.0),
      };
    }

    it("verifies 10,000 seeds under strict WebGL 32-bit float hardware emulation", () => {
      let lcgState = 987654321;
      function nextRandom(): number {
        lcgState = (1103515245 * lcgState + 12345) & 0x7fffffff;
        return lcgState / 0x7fffffff;
      }

      let maxFinishU = 0;
      let nanCount = 0;
      let infCount = 0;

      for (let i = 0; i < 10000; i++) {
        const iseed: [number, number, number] = [nextRandom(), nextRandom(), nextRandom()];
        const p: [number, number, number] = [
          (nextRandom() - 0.5) * 5.0,
          (nextRandom() - 0.5) * 5.0,
          (nextRandom() - 0.5) * 2.0,
        ];

        // At uIntro = 0.98, all particles must be finished
        const res98 = simulateGlslApplyIntroF32(p, iseed, 0.98);
        expect(res98.finished).toBe(true);
        expect(res98.local).toBe(Math.fround(1.0));

        // Check for NaN / Inf
        for (const coord of res98.position) {
          if (Number.isNaN(coord)) nanCount++;
          if (!Number.isFinite(coord)) infCount++;
        }

        // Test transition from 0.999999 to 1.0
        const preEnd = simulateGlslApplyIntroF32(p, iseed, 0.999999);
        const atEnd = simulateGlslApplyIntroF32(p, iseed, 1.0);

        const delta = Math.sqrt(
          (preEnd.position[0] - atEnd.position[0]) ** 2 +
            (preEnd.position[1] - atEnd.position[1]) ** 2 +
            (preEnd.position[2] - atEnd.position[2]) ** 2
        );
        expect(delta).toBeLessThan(1e-5);
      }

      expect(nanCount).toBe(0);
      expect(infCount).toBe(0);
    });
  });
});
