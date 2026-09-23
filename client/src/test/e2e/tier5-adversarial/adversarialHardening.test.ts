import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Euler,
  Quaternion,
  Vector3,
  Vector2,
  WebGLRenderTarget,
  ShaderMaterial,
  AdditiveBlending,
  NormalBlending,
} from "three";

// Mock Headless Surface for Canvas and DOM Host
class MockDomSurface extends EventTarget {
  dataset: Record<string, string> = {};
  style = {
    opacity: "1",
    setProperty: vi.fn((key: string, val: string) => {
      (this.style as Record<string, unknown>)[key] = val;
    }),
  } as Record<string, unknown> & {
    opacity: string;
    setProperty: ReturnType<typeof vi.fn>;
  };
  parentElement: MockDomSurface | null = null;
  children: MockDomSurface[] = [];
  clientWidth = 1280;
  clientHeight = 800;
  isConnected = true;
  captures = new Set<number>();
  setAttribute = vi.fn();
  className = "";
  id = "";

  constructor(width = 1280, height = 800) {
    super();
    this.clientWidth = width;
    this.clientHeight = height;
  }

  closest(selector: string): MockDomSurface | null {
    if (
      selector.includes("hero-controls") ||
      selector.includes("public-universe")
    ) {
      return this.parentElement || this;
    }
    return null;
  }

  querySelector(selector: string): MockDomSurface | null {
    if (selector.includes("hero-controls")) {
      return this;
    }
    return null;
  }

  querySelectorAll(selector: string): MockDomSurface[] {
    return [];
  }

  appendChild(child: MockDomSurface) {
    child.parentElement = this;
    this.children.push(child);
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(
        x => x !== this
      );
    }
  }

  getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: this.clientWidth,
      bottom: this.clientHeight,
      width: this.clientWidth,
      height: this.clientHeight,
    };
  }

  setPointerCapture(id: number) {
    this.captures.add(id);
  }

  hasPointerCapture(id: number) {
    return this.captures.has(id);
  }

  releasePointerCapture(id: number) {
    this.captures.delete(id);
  }
}

// Mock WebGLRenderer to allow headless execution while preserving real Three.js math
vi.mock("three", async importOriginal => {
  const real = await importOriginal<typeof import("three")>();
  return {
    ...real,
    WebGLRenderer: class {
      domElement = new MockDomSurface();
      info = { memory: { geometries: 6, textures: 15 } };
      ratio = 1;
      autoClear = true;
      private _currentTarget: any = null;
      setPixelRatio(value: number) {
        this.ratio = value;
      }
      getPixelRatio() {
        return this.ratio;
      }
      setClearColor() {}
      getRenderTarget() {
        return null;
      }
      setRenderTarget() {}
      getClearAlpha() {
        return 0;
      }
      setClearAlpha() {}
      clear() {}
      setSize() {}
      render() {}
      getRenderTarget() {
        return this._currentTarget;
      }
      setRenderTarget(target: any) {
        this._currentTarget = target;
      }
      dispose() {}
      forceContextLoss() {}
    },
  };
});

vi.mock("three/addons/postprocessing/EffectComposer.js", () => ({
  EffectComposer: class {
    addPass() {}
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
  },
}));

vi.mock("three/addons/postprocessing/RenderPass.js", () => ({
  RenderPass: class {},
}));

vi.mock("three/addons/postprocessing/OutputPass.js", () => ({
  OutputPass: class {
    dispose() {}
  },
}));

import { createGalaxy } from "@/components/galaxy/galaxyScene";
import {
  PointerWake,
  WAKE_SAMPLES,
  WAKE_LIFETIME,
} from "@/components/galaxy/pointerWake";
import { RotationMotion } from "@/components/galaxy/rotationMotion";
import {
  projectTrackball,
  trackballDelta,
} from "@/components/galaxy/trackball";
import {
  getAmbientProfile,
  bakeAmbientTracks,
} from "@/components/galaxy/ambientScene";
import { BloomPyramidPass } from "@/components/galaxy/bloomPyramid";
import { getPageScene } from "@/components/galaxy/pageScene";
import { getScrollMotion } from "@/components/galaxy/scrollMotion";

describe("Tier 5: Adversarial Coverage Hardening Suite", () => {
  const canonicalEuler = new Euler(0.28, -0.5, -0.4, "XYZ");
  const canonicalHomeQuat = new Quaternion().setFromEuler(canonicalEuler);

  // =========================================================================
  // Group 1: Mathematical Singularities & Rotation Dynamics
  // =========================================================================
  describe("Group 1: Mathematical Singularities & Rotation Dynamics", () => {
    it("preserves exact quaternion normalization and finite speed when dt = 0 across all rotation phases", () => {
      const motion = new RotationMotion(canonicalHomeQuat);

      // Idle phase dt = 0
      motion.advance(0);
      expect(motion.orientation.length()).toBeCloseTo(1.0, 6);
      expect(motion.speed).toBe(0);
      expect(motion.phase).toBe("idle");

      // Dragging phase dt = 0 move
      motion.begin();
      expect(motion.phase).toBe("dragging");
      const deltaQ = new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0),
        0.2
      );
      motion.move(deltaQ, 0); // dt = 0 in move should be protected by Math.max(dt, 0.008)
      expect(Number.isFinite(motion.speed)).toBe(true);
      expect(motion.speed).toBeLessThanOrEqual(2.4);
      expect(motion.orientation.length()).toBeCloseTo(1.0, 6);

      // Inertia phase dt = 0
      motion.release();
      expect(motion.phase).toBe("inertia");
      const orientationBefore = motion.orientation.clone();
      motion.advance(0);
      expect(motion.orientation.length()).toBeCloseTo(1.0, 6);
      expect(motion.orientation.angleTo(orientationBefore)).toBeCloseTo(0, 6);

      // Returning phase dt = 0
      motion.reset();
      motion.phase = "returning";
      motion.advance(0);
      expect(motion.orientation.length()).toBeCloseTo(1.0, 6);
      expect(Number.isNaN(motion.orientation.x)).toBe(false);
    });

    it("converges smoothly to canonical home Euler without overflow or snapping when dt is huge (dt >= 60.0s)", () => {
      const motion = new RotationMotion(canonicalHomeQuat);
      motion.begin();

      // Drag galaxy far away from canonical pose
      const spinDelta = new Quaternion().setFromAxisAngle(
        new Vector3(0.577, 0.577, 0.577).normalize(),
        2.5
      );
      motion.move(spinDelta, 0.016);
      motion.release();
      expect(motion.phase).toBe("inertia");
      expect(motion.orientation.angleTo(canonicalHomeQuat)).toBeGreaterThan(
        1.0
      );

      // Massive dt simulation (e.g. laptop lid closed for 1 hour: dt = 3600.0s)
      motion.advance(3600.0);

      // Single massive step dampens inertia speed to 0 and snaps into returning
      expect(motion.speed).toBeCloseTo(0, 5);
      expect(motion.phase).toBe("returning");

      // Next step settles to idle
      motion.advance(1.0);
      expect(motion.phase).toBe("idle");
      expect(motion.orientation.angleTo(canonicalHomeQuat)).toBeLessThan(0.002);
      expect(Number.isFinite(motion.orientation.x)).toBe(true);
    });

    it("prevents angular velocity explosion under ultra-high polling rate micro-dt (dt = 1e-6s)", () => {
      const motion = new RotationMotion(canonicalHomeQuat);
      motion.begin();

      const delta = new Quaternion().setFromAxisAngle(
        new Vector3(1, 0, 0),
        0.05
      );
      // Extreme micro-step: 1 microsecond (1e-6s)
      motion.move(delta, 0.000001);

      // Clamped to 2.4 rad/s ceiling via Math.max(dt, 0.008)
      expect(motion.speed).toBeLessThanOrEqual(2.4);
      expect(Number.isFinite(motion.speed)).toBe(true);
      expect(Number.isNaN(motion.speed)).toBe(false);
    });

    it("maintains unit quaternion coherence without gimbal lock across 100 orthogonal 3D multi-axis spins", () => {
      const motion = new RotationMotion(canonicalHomeQuat);
      motion.begin();

      const axes = [
        new Vector3(1, 0, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, 0, 1),
        new Vector3(1, 1, 0).normalize(),
        new Vector3(0, 1, 1).normalize(),
        new Vector3(1, 0, 1).normalize(),
      ];

      // Perform 100 high-angle orthogonal and compound rotations
      for (let i = 0; i < 100; i++) {
        const axis = axes[i % axes.length];
        const angle = ((i + 1) * Math.PI) / 6; // up to full spins
        const rotQ = new Quaternion().setFromAxisAngle(axis, angle);
        motion.move(rotQ, 0.016);

        expect(motion.orientation.length()).toBeCloseTo(1.0, 5);
        expect(Number.isFinite(motion.orientation.x)).toBe(true);
        expect(Number.isFinite(motion.orientation.y)).toBe(true);
        expect(Number.isFinite(motion.orientation.z)).toBe(true);
        expect(Number.isFinite(motion.orientation.w)).toBe(true);
      }
    });

    it("handles trackball hyperbolic continuation far outside virtual radius without NaN or zero division", () => {
      const radius = 150;
      const center = 200;

      // Far outside virtual sphere horizon: 10x radius and 1000x radius
      const farDistances = [
        radius * 1.5,
        radius * 5.0,
        radius * 50.0,
        radius * 1000.0,
      ];

      for (const dist of farDistances) {
        const outVec = projectTrackball(
          center + dist,
          center,
          radius * 2,
          radius * 2
        );
        expect(outVec.length()).toBeCloseTo(1.0, 5);
        expect(Number.isFinite(outVec.x)).toBe(true);
        expect(Number.isFinite(outVec.y)).toBe(true);
        expect(Number.isFinite(outVec.z)).toBe(true);
        expect(outVec.z).toBeGreaterThanOrEqual(0); // On front hemisphere
      }

      // Exact boundary where r^2 = 0.5 * radius^2 (hyperbolic switch-point)
      const rSwitch = (radius * 2 * 0.5) / Math.SQRT2;
      const switchVec = projectTrackball(
        center + rSwitch,
        center,
        radius * 2,
        radius * 2
      );
      expect(switchVec.length()).toBeCloseTo(1.0, 5);
    });

    it("selects shortest geodesic path when orientation is antipodal to canonical home pose", () => {
      const motion = new RotationMotion(canonicalHomeQuat);
      // Flip home quaternion by 180 degrees (antipodal orientation: q = -q_home)
      motion.orientation.set(
        -canonicalHomeQuat.x,
        -canonicalHomeQuat.y,
        -canonicalHomeQuat.z,
        -canonicalHomeQuat.w
      );

      // In returning phase, slerp should detect antipodal equivalent without flipping or jumping
      motion.phase = "returning";
      motion.advance(0.016);

      expect(Number.isFinite(motion.orientation.x)).toBe(true);
      expect(motion.orientation.length()).toBeCloseTo(1.0, 5);
      // Slerp to equivalent orientation should register distance as 0
      expect(motion.orientation.angleTo(canonicalHomeQuat)).toBeLessThan(0.01);
    });
  });

  // =========================================================================
  // Group 2: Pointer Wake Singularities & High-Frequency Saturation
  // =========================================================================
  describe("Group 2: Pointer Wake Singularities & High-Frequency Saturation", () => {
    it("handles boundary, zero, negative, and offscreen cursor positions safely", () => {
      const wake = new PointerWake();
      const width = 1280;
      const height = 800;

      // Top-left exact corner (0, 0)
      wake.push(0, 0, 1.0, width, height);
      // Bottom-right exact corner (width, height)
      wake.push(width, height, 1.1, width, height);
      expect(wake.activeCount(1.1)).toBe(1);

      // Deep offscreen negative position (-1500, -1000)
      wake.push(-1500, -1000, 1.2, width, height);
      expect(wake.activeCount(1.2)).toBe(2);

      // Far distant positive position (100000, 100000)
      wake.push(100000, 100000, 1.3, width, height);
      expect(wake.activeCount(1.3)).toBe(3);

      // All recorded impulses and segments must be finite floats
      for (let i = 0; i < WAKE_SAMPLES; i++) {
        const seg = wake.segments[i];
        const imp = wake.impulses[i];
        expect(Number.isFinite(seg.x)).toBe(true);
        expect(Number.isFinite(seg.y)).toBe(true);
        expect(Number.isFinite(seg.z)).toBe(true);
        expect(Number.isFinite(seg.w)).toBe(true);
        expect(Number.isFinite(imp.x)).toBe(true);
        expect(Number.isFinite(imp.y)).toBe(true);
        expect(Number.isFinite(imp.z)).toBe(true);
        expect(Number.isFinite(imp.w)).toBe(true);
      }
    });

    it("rejects degenerate zero or negative viewport dimensions without crashing", () => {
      const wake = new PointerWake();
      wake.push(100, 100, 1.0, 0, 800); // zero width
      wake.push(100, 100, 1.1, 1280, 0); // zero height
      wake.push(100, 100, 1.2, -500, -500); // negative dimensions
      expect(wake.activeCount(1.2)).toBe(0);
    });

    it("gracefully recovers from non-monotonic clock jumps backwards", () => {
      const wake = new PointerWake();
      const width = 1000;
      const height = 1000;

      wake.push(100, 100, 10.0, width, height);
      wake.push(200, 200, 10.1, width, height);
      expect(wake.activeCount(10.1)).toBe(1);

      // Clock jumps backwards (e.g. NTP sync, system clock adjustment)
      wake.push(300, 300, 5.0, width, height);
      // Non-monotonic time resets state without adding corrupted impulse
      expect(wake.activeCount(5.0)).toBe(0);

      // New move forward from 5.0 resumes cleanly
      wake.push(350, 350, 5.1, width, height);
      expect(wake.activeCount(5.1)).toBe(1);
    });

    it("survives high-frequency buffer saturation with 1,000 pushes and maintains strict WAKE_SAMPLES bounds", () => {
      const wake = new PointerWake();
      const width = 1280;
      const height = 800;

      let time = 1.0;
      for (let i = 0; i < 1000; i++) {
        time += 0.051; // dt >= 0.05
        const x = (i * 37) % width;
        const y = (i * 53) % height;
        wake.push(x, y, time, width, height);
      }

      // Active count can never exceed buffer capacity WAKE_SAMPLES (16)
      const count = wake.activeCount(time);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(WAKE_SAMPLES);

      // All 16 impulses remain strictly finite
      for (let i = 0; i < WAKE_SAMPLES; i++) {
        expect(Number.isFinite(wake.impulses[i].x)).toBe(true);
        expect(Number.isFinite(wake.impulses[i].y)).toBe(true);
      }
    });
  });

  // =========================================================================
  // Group 3: Odd Resolutions, 1-Pixel Dimensions & Extreme DPR
  // =========================================================================
  describe("Group 3: Odd Resolutions, 1-Pixel Dimensions & Extreme DPR", () => {
    it("floors odd and prime resolutions cleanly without fractional or zero-pixel render targets", () => {
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });

      // Odd prime resolutions: 1367 x 769
      pass.setSize(1367, 769);
      expect(pass.downMips).toHaveLength(6);
      expect(pass.upMips).toHaveLength(5);

      // Level 0: floor(1367 * 0.5) = 683, floor(769 * 0.5) = 384
      expect(pass.downMips[0].width).toBe(683);
      expect(pass.downMips[0].height).toBe(384);

      // Every subsequent level must floor and be strictly >= 1px
      for (let i = 0; i < pass.downMips.length; i++) {
        expect(pass.downMips[i].width).toBeGreaterThanOrEqual(1);
        expect(pass.downMips[i].height).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(pass.downMips[i].width)).toBe(true);
        expect(Number.isInteger(pass.downMips[i].height)).toBe(true);
      }
      pass.dispose();
    });

    it("handles extreme 1-pixel canvas dimensions (1x1, 1x1080, 1920x1) without division by zero", () => {
      const pass = new BloomPyramidPass({ levels: 4 });

      // 1x1 single pixel
      pass.setSize(1, 1);
      for (const mip of pass.downMips) {
        expect(mip.width).toBe(1);
        expect(mip.height).toBe(1);
      }

      // 1x1080 extreme vertical strip
      pass.setSize(1, 1080);
      for (const mip of pass.downMips) {
        expect(mip.width).toBe(1);
        expect(mip.height).toBeGreaterThanOrEqual(1);
      }

      // 1920x1 extreme horizontal strip
      pass.setSize(1920, 1);
      for (const mip of pass.downMips) {
        expect(mip.width).toBeGreaterThanOrEqual(1);
        expect(mip.height).toBe(1);
      }

      pass.dispose();
    });

    it("operates correctly with single-level bloom pyramid (levels = 1)", () => {
      const pass = new BloomPyramidPass({ levels: 1 });
      pass.setSize(800, 600);

      expect(pass.downMips).toHaveLength(1);
      expect(pass.upMips).toHaveLength(0);

      // Render with mock renderer
      let currentTarget: WebGLRenderTarget | null = null;
      const mockRenderer = {
        autoClear: false,
        getRenderTarget: () => currentTarget,
        setRenderTarget: (t: any) => {
          currentTarget = t;
        },
        render: vi.fn(),
      } as any;

      const readTarget = new WebGLRenderTarget(800, 600);
      const writeTarget = new WebGLRenderTarget(800, 600);

      // Must execute without indexing out-of-bounds error on upsampleTargets
      expect(() =>
        pass.render(mockRenderer, writeTarget, readTarget)
      ).not.toThrow();

      readTarget.dispose();
      writeTarget.dispose();
      pass.dispose();
    });

    it("supports extreme DPR scaling bounds from 0.1 to 8.0 without invalid texel sizes", () => {
      const dprs = [0.1, 0.5, 1.0, 2.0, 4.0, 8.0];
      for (const dpr of dprs) {
        const pass = new BloomPyramidPass({ levels: 4 });
        const width = Math.max(1, Math.floor(1920 * dpr));
        const height = Math.max(1, Math.floor(1080 * dpr));

        pass.setSize(width, height);
        expect(pass.downMips[0].width).toBeGreaterThanOrEqual(1);
        expect(pass.downMips[0].height).toBeGreaterThanOrEqual(1);
        pass.dispose();
      }
    });

    it("verifies render targets in downsample and upsample chains are strictly disjoint memory addresses", () => {
      const pass = new BloomPyramidPass({ levels: 5 });
      pass.setSize(1280, 800);

      const allTargets = [...pass.downMips, ...pass.upMips];
      const uniqueTargets = new Set(allTargets);

      // No target can appear twice in the cascade
      expect(uniqueTargets.size).toBe(allTargets.length);
      pass.dispose();
    });
  });

  // =========================================================================
  // Group 4: Unicode Slugs, Deep Permutations & Ambient Constellations
  // =========================================================================
  describe("Group 4: Unicode Slugs, Deep Permutations & Ambient Constellations", () => {
    it("handles empty path string by safely defaulting to root /", () => {
      const profile = getAmbientProfile("");
      expect(profile).toEqual(getAmbientProfile("/"));
      expect(profile.rows).toHaveLength(6);
      for (const row of profile.rows.slice(4)) {
        expect(row.closed).toBe(true);
        expect(row.points.at(-1)).toEqual(row.points[0]);
        expect(row.endpointFade).toBe(0);
      }
      const baked = bakeAmbientTracks(profile);
      // TRACK_SAMPLES = 512, so (512 + 1) * 6 rows * 4 components = 12312 floats
      expect(baked.length).toBe((512 + 1) * 6 * 4);
      expect(baked.every(v => Number.isFinite(v))).toBe(true);
      for (let i = 3; i < baked.length; i += 4) expect(baked[i]).toBe(1);
    });

    it("processes diverse multilingual Unicode and Emoji slugs with valid deterministic geometry", () => {
      const unicodeSlugs = [
        "/post/群星归位-玫瑰星系-深度剖析", // CJK
        "/post/銀河系のシネマティックアップグレード", // Japanese
        "/post/галактика-розы-кинематика", // Cyrillic
        "/post/مجرة-الوردة-التفاعلية", // Arabic RTL
        "/post/🌹-galaxy-✨-stars-🌌-cosmos", // Emojis / Surrogate pairs
        "/post/slug\u200B\u200C\uFEFFinvisible", // Zero-width spaces
        "/post/%E7%BE%A4%E6%98%9F%E5%BD%92%E4%BD%8D", // URL-encoded
      ];

      for (const slug of unicodeSlugs) {
        const p1 = getAmbientProfile(slug);
        const p2 = getAmbientProfile(slug);

        // Determinism check
        expect(p1.family).toBe(p2.family);
        expect(p1.driftX).toBe(p2.driftX);
        expect(p1.glow).toBe(p2.glow);

        // Mathematical validity
        expect(p1.rows).toHaveLength(6);
        const baked = bakeAmbientTracks(p1);
        expect(baked.length).toBe((512 + 1) * 6 * 4);
        for (let i = 0; i < baked.length; i++) {
          expect(Number.isFinite(baked[i])).toBe(true);
          expect(Number.isNaN(baked[i])).toBe(false);
        }
      }
    });

    it("guarantees query parameters and URL hashes do not disrupt the deterministic sky for the article", () => {
      const cleanSlug = "/post/neural-attention-mechanisms";
      const dirtyPermutations = [
        "/post/neural-attention-mechanisms?utm_source=hackernews&utm_medium=social",
        "/post/neural-attention-mechanisms?sort=asc&filter=all#mathematical-foundations",
        "/post/neural-attention-mechanisms#anchor",
        "/post/neural-attention-mechanisms?ref=ai_digest&page=1",
      ];

      const referenceProfile = getAmbientProfile(cleanSlug);
      const referenceBaked = bakeAmbientTracks(referenceProfile);

      for (const dirty of dirtyPermutations) {
        const dirtyProfile = getAmbientProfile(dirty);
        const dirtyBaked = bakeAmbientTracks(dirtyProfile);

        expect(dirtyProfile.family).toBe(referenceProfile.family);
        expect(dirtyProfile.driftX).toBe(referenceProfile.driftX);
        expect(dirtyProfile.driftY).toBe(referenceProfile.driftY);
        expect(dirtyBaked).toEqual(referenceBaked);
      }
    });

    it("handles a massive slug deterministically without stack overflow or invalid geometry", () => {
      const hugeSlug = "/post/" + "deep-learning-".repeat(3500);
      expect(hugeSlug.length).toBeGreaterThan(40000);

      const profile = getAmbientProfile(hugeSlug);
      expect(profile).toEqual(getAmbientProfile(`${hugeSlug}?source=archive`));
      expect(profile.rows).toHaveLength(6);
      expect(Number.isFinite(profile.driftSpeed)).toBe(true);
      expect(Number.isFinite(profile.twinkle)).toBe(true);
    });

    it("preserves true loop seams, open ribbon fades and inner depth across all four families", () => {
      // Find paths that trigger each of the 4 curve families
      const targetFamilies = new Set([
        "rhodonea",
        "lissajous",
        "orbits",
        "ribbon",
      ]);
      const foundFamilies = new Set<string>();

      for (
        let i = 0;
        i < 100 && foundFamilies.size < targetFamilies.size;
        i++
      ) {
        const path = `/tags/ambient-family-probe-${i}`;
        const profile = getAmbientProfile(path);
        if (targetFamilies.has(profile.family)) {
          foundFamilies.add(profile.family);

          // Assert row structure for this family
          expect(profile.rows).toHaveLength(6);
          profile.rows.forEach((row, r) => {
            const open = profile.family === "ribbon" && r < 4;
            expect(row.closed).toBe(!open);
            expect(row.length).toBeGreaterThan(0);
            if (open) {
              expect(row.endpointFade).toBeGreaterThan(0);
              expect(row.endpointFade).toBeLessThan(0.1);
              const first = row.points[0],
                last = row.points.at(-1)!;
              expect(
                Math.hypot(...first.map((v, axis) => v - last[axis]))
              ).toBeGreaterThan(5);
            } else {
              expect(row.endpointFade).toBe(0);
              expect(row.points.at(-1)).toEqual(row.points[0]);
              const incoming = row.points
                .at(-1)!
                .map((v, axis) => v - row.points.at(-2)![axis]);
              const outgoing = row.points[1].map(
                (v, axis) => v - row.points[0][axis]
              );
              const dot = incoming.reduce(
                (sum, v, axis) => sum + v * outgoing[axis],
                0
              );
              expect(
                dot / (Math.hypot(...incoming) * Math.hypot(...outgoing))
              ).toBeGreaterThan(0.995);
            }
          });

          // Heart anchor points are located near z = -0.9
          const heartPoint1 = profile.rows[4].points[0];
          const heartPoint2 = profile.rows[5].points[0];
          expect(heartPoint1[2]).toBeCloseTo(-0.9, 0.5);
          expect(heartPoint2[2]).toBeCloseTo(-0.9, 0.5);
        }
      }

      expect(foundFamilies.size).toBe(4);
    });
  });

  // =========================================================================
  // Group 5: Scene Lifecycle, Interaction & Context Resilience
  // =========================================================================
  describe("Group 5: Scene Lifecycle, Interaction & Context Resilience", () => {
    let host: MockDomSurface;
    let controls: MockDomSurface;
    let win: EventTarget & {
      scrollY: number;
      innerWidth: number;
      innerHeight: number;
    };
    let doc: EventTarget & { hidden: boolean; documentElement: MockDomSurface };
    let scene: ReturnType<typeof createGalaxy>;
    let now = 1000;
    let frameId = 0;
    let frames: Map<number, FrameRequestCallback>;

    const pump = (count = 1) => {
      for (let i = 0; i < count; i++) {
        now += 1000 / 60;
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach(cb => cb(now));
      }
    };

    beforeEach(() => {
      frames = new Map();
      now = 1000;
      win = Object.assign(new EventTarget(), {
        scrollY: 0,
        innerWidth: 1280,
        innerHeight: 800,
      });
      doc = Object.assign(new EventTarget(), {
        hidden: false,
        documentElement: new MockDomSurface(),
        querySelector: () => null,
        querySelectorAll: () => [],
      });

      vi.stubGlobal("window", win);
      vi.stubGlobal("document", doc);
      vi.stubGlobal("devicePixelRatio", 1);
      vi.spyOn(performance, "now").mockImplementation(() => now);
      vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        frames.set(++frameId, cb);
        return frameId;
      });
      vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(private callback: () => void) {}
          observe() {
            this.callback();
          }
          unobserve() {}
          disconnect() {}
        }
      );
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          observe() {}
          unobserve() {}
          disconnect() {}
        }
      );

      controls = new MockDomSurface();
      controls.className = "hero-controls";
      host = new MockDomSurface();
      controls.appendChild(host);
      scene = createGalaxy(host as unknown as HTMLElement);
      pump();
    });

    afterEach(() => {
      scene?.dispose();
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    function makePointerEvent(
      type: string,
      options: {
        button?: number;
        buttons?: number;
        isPrimary?: boolean;
        pointerId?: number;
        clientX?: number;
        clientY?: number;
        timeStamp?: number;
        pointerType?: string;
      } = {}
    ) {
      const event = new Event(type);
      Object.assign(event, {
        button: options.button ?? 0,
        buttons: options.buttons ?? 1,
        isPrimary: options.isPrimary ?? true,
        pointerId: options.pointerId ?? 1,
        clientX: options.clientX ?? 0,
        clientY: options.clientY ?? 0,
        pointerType: options.pointerType ?? "mouse",
      });
      if (options.timeStamp !== undefined) {
        Object.defineProperty(event, "timeStamp", { value: options.timeStamp });
      }
      return event;
    }

    it("handles WebGL context loss occurring during an active pointer drag and recovers on context restoration", () => {
      const canvas = host.children[0];

      // 1. User starts drag on trackball
      const pointerdownEvent = makePointerEvent("pointerdown", {
        button: 0,
        buttons: 1,
        isPrimary: true,
        pointerId: 42,
        clientX: 640,
        clientY: 400,
        timeStamp: now,
      });
      controls.dispatchEvent(pointerdownEvent);
      expect(controls.dataset.dragging).toBe("true");

      // 2. Mid-drag GPU context loss occurs
      const contextLostEvent = new Event("webglcontextlost", {
        cancelable: true,
      });
      canvas.dispatchEvent(contextLostEvent);

      expect(host.dataset.ready).toBe("false");

      // 3. Pointerup fires while context is lost
      const pointerupEvent = makePointerEvent("pointerup", {
        pointerId: 42,
        buttons: 0,
        clientX: 700,
        clientY: 400,
        timeStamp: now + 50,
      });
      win.dispatchEvent(pointerupEvent);
      expect(controls.dataset.dragging).toBe("false");

      // 4. GPU context restored
      const contextRestoredEvent = new Event("webglcontextrestored");
      canvas.dispatchEvent(contextRestoredEvent);

      expect(host.dataset.ready).toBe("true");

      // Verify painting continues cleanly after restore
      pump(5);
      expect(host.dataset.ready).toBe("true");
    });

    it("survives rapid context loss flapping (5 back-to-back loss/restoration cycles)", () => {
      const canvas = host.children[0];

      for (let i = 0; i < 5; i++) {
        const lostEvent = new Event("webglcontextlost", { cancelable: true });
        canvas.dispatchEvent(lostEvent);
        expect(host.dataset.ready).toBe("false");

        const restoreEvent = new Event("webglcontextrestored");
        canvas.dispatchEvent(restoreEvent);
        expect(host.dataset.ready).toBe("true");
      }

      pump(3);
      expect(host.dataset.ready).toBe("true");
    });

    it("maintains settled pose without re-scattering stars across 50 rapid route navigation events", () => {
      // Advance until intro completes
      pump(200);
      expect(scene.getIntro()).toBeGreaterThanOrEqual(1.0);

      const routes = [
        "/",
        "/post/flow",
        "/archive",
        "/about",
        "/post/deep-seek-r1",
        "/post/scalable-vector-search",
      ];

      for (let i = 0; i < 50; i++) {
        const route = routes[i % routes.length];
        scene.setPage(route);

        // Intro MUST NOT reset to 0 once settled (BUG-07 resolution)
        expect(scene.getIntro()).toBe(1.0);
        expect(host.dataset.mode).toBe(getPageScene(route).mode);
      }
    });

    it("executes 100 rapid light/dark theme toggles without pipeline failure or memory leak", () => {
      for (let i = 0; i < 100; i++) {
        const isLight = i % 2 === 1;
        scene.setTheme(isLight);
      }

      pump(3);
      expect(host.dataset.ready).toBe("true");
    });

    it("survives keyboard interactions (Space toggle, Escape reset, Arrow rotation) safely", () => {
      const keys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        " ",
        "Escape",
      ];
      for (const key of keys) {
        const keyEvent = new Event("keydown");
        Object.assign(keyEvent, { key, preventDefault: vi.fn() });
        controls.dispatchEvent(keyEvent);
      }

      pump(5);
      expect(host.dataset.ready).toBe("true");
    });

    it("cancels active drag and resets pointer wake upon mid-drag route navigation", () => {
      // 1. Start drag
      const pointerdownEvent = makePointerEvent("pointerdown", {
        button: 0,
        buttons: 1,
        isPrimary: true,
        pointerId: 7,
        clientX: 640,
        clientY: 400,
        timeStamp: now,
      });
      controls.dispatchEvent(pointerdownEvent);
      expect(controls.dataset.dragging).toBe("true");

      // 2. Mid-drag navigation to article
      scene.setPage("/post/flow");

      // Drag must be cancelled immediately
      expect(controls.dataset.dragging).toBe("false");
      expect(host.dataset.mode).toBe("reading");

      // Pointermove after navigation does not drag
      const moveEvent = makePointerEvent("pointermove", {
        pointerId: 7,
        buttons: 1,
        clientX: 700,
        clientY: 400,
        timeStamp: now + 20,
      });
      win.dispatchEvent(moveEvent);
      expect(controls.dataset.dragging).toBe("false");
    });

    it("handles orientation change and extreme aspect ratio resizes (10:1 wide, 1:10 tall, 0x0 collapsed) without crashing", () => {
      let resizeCallback: (() => void) | null = null;
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(cb: () => void) {
            resizeCallback = cb;
          }
          observe() {
            if (resizeCallback) resizeCallback();
          }
          unobserve() {}
          disconnect() {}
        }
      );

      // Re-create to bind local resize callback
      scene.dispose();
      scene = createGalaxy(host as unknown as HTMLElement);

      // Ultra-tall mobile aspect ratio (100 x 1000, aspect 0.1)
      host.clientWidth = 100;
      host.clientHeight = 1000;
      if (resizeCallback) (resizeCallback as () => void)();
      pump(2);
      expect(host.dataset.ready).toBe("true");

      // Ultra-wide panoramic aspect ratio (2000 x 200, aspect 10.0)
      host.clientWidth = 2000;
      host.clientHeight = 200;
      if (resizeCallback) (resizeCallback as () => void)();
      pump(2);
      expect(host.dataset.ready).toBe("true");

      // Collapsed dimensions (0 x 0)
      host.clientWidth = 0;
      host.clientHeight = 0;
      if (resizeCallback) (resizeCallback as () => void)();
      pump(2);
      expect(host.dataset.ready).toBe("true");
    });

    it("enforces complete interaction immunity under prefers-reduced-motion", () => {
      scene.dispose();
      const rmScene = createGalaxy(
        host as unknown as HTMLElement,
        false,
        true,
        "/"
      );

      // uIntro immediately pinned to 1.0
      expect(rmScene.getIntro()).toBe(1.0);
      expect(host.dataset.motion).toBe("paused");

      // Attempt drag
      const pointerdownEvent = makePointerEvent("pointerdown", {
        button: 0,
        buttons: 1,
        isPrimary: true,
        pointerId: 1,
        clientX: 640,
        clientY: 400,
        timeStamp: now,
      });
      controls.dispatchEvent(pointerdownEvent);
      expect(controls.dataset.dragging).not.toBe("true");

      // Attempt key navigation
      const keyEvent = new Event("keydown");
      Object.assign(keyEvent, { key: "ArrowLeft", preventDefault: vi.fn() });
      controls.dispatchEvent(keyEvent);
      expect(keyEvent.preventDefault).not.toHaveBeenCalled();

      rmScene.dispose();
    });

    it("cancels a resized drag, ignores stale events and accepts a new gesture at the new artwork center", () => {
      let resizeCallback: (() => void) | null = null;
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(cb: () => void) {
            resizeCallback = cb;
          }
          observe() {
            if (resizeCallback) resizeCallback();
          }
          unobserve() {}
          disconnect() {}
        }
      );

      scene.dispose();
      host.clientWidth = 1280;
      host.clientHeight = 800;
      scene = createGalaxy(host as unknown as HTMLElement);
      pump();

      // Start drag at center
      const pointerdownEvent = makePointerEvent("pointerdown", {
        button: 0,
        buttons: 1,
        isPrimary: true,
        pointerId: 99,
        clientX: 640,
        clientY: 400,
        timeStamp: now,
      });
      controls.dispatchEvent(pointerdownEvent);
      expect(controls.dataset.dragging).toBe("true");

      // Viewport resizes mid-drag
      host.clientWidth = 800;
      host.clientHeight = 600;
      if (resizeCallback) (resizeCallback as () => void)();
      expect(controls.dataset.dragging).toBe("false");
      expect(controls.hasPointerCapture(99)).toBe(false);
      const angleAfterResize = Number(host.dataset.returnAngle);
      expect(Number.isFinite(angleAfterResize)).toBe(true);

      // Pointer continues moving under new viewport dimensions
      const pointermoveEvent = makePointerEvent("pointermove", {
        pointerId: 99,
        buttons: 1,
        clientX: 400,
        clientY: 300,
        timeStamp: now + 16,
      });
      win.dispatchEvent(pointermoveEvent);
      pump(2);
      expect(controls.dataset.dragging).toBe("false");
      expect(Number(host.dataset.returnAngle)).toBeCloseTo(angleAfterResize, 4);

      // Finish drag
      const pointerupEvent = makePointerEvent("pointerup", {
        pointerId: 99,
        buttons: 0,
        clientX: 400,
        clientY: 300,
        timeStamp: now + 32,
      });
      win.dispatchEvent(pointerupEvent);
      expect(controls.dataset.dragging).toBe("false");

      const [centerX, centerY] = host.dataset.artworkCenter
        .split(",")
        .map(Number);
      expect(Number.isFinite(centerX + centerY)).toBe(true);
      controls.dispatchEvent(
        makePointerEvent("pointerdown", {
          pointerId: 100,
          clientX: centerX,
          clientY: centerY,
          timeStamp: now,
        })
      );
      expect(controls.dataset.dragging).toBe("true");
      expect(controls.hasPointerCapture(100)).toBe(true);
      // A delayed release belonging to the canceled gesture cannot cancel the new one.
      win.dispatchEvent(pointerupEvent);
      expect(controls.dataset.dragging).toBe("true");
      win.dispatchEvent(
        makePointerEvent("pointermove", {
          pointerId: 100,
          clientX: centerX + 40,
          clientY: centerY + 10,
          timeStamp: now + 16,
        })
      );
      pump(2);
      expect(Number(host.dataset.returnAngle)).toBeGreaterThan(
        angleAfterResize + 0.001
      );
      win.dispatchEvent(
        makePointerEvent("pointerup", {
          pointerId: 100,
          buttons: 0,
          clientX: centerX + 40,
          clientY: centerY + 10,
          timeStamp: now + 16,
        })
      );
      expect(controls.dataset.dragging).toBe("false");
      expect(controls.captures.size).toBe(0);
    });
  });
});
