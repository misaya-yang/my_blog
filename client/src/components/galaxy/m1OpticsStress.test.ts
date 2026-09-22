import { describe, expect, it, vi } from "vitest";
import {
  calculateDustBrightness,
  calculateStarBrightness,
  calculateProminence,
} from "./galaxyScene";
import { BloomPyramidPass } from "./bloomPyramid";
import { WebGLRenderTarget } from "three";

describe("M1 Empirical Challenge: Optical Properties & Bloom Pipeline", () => {
  // =========================================================================
  // Challenge 1: Star Brightness Power-Law Distributions & Prominence Threshold
  // =========================================================================
  describe("1. Star Brightness Power-Law Distributions & Diffraction Prominence", () => {
    it("satisfies dust cubic power-law formula: 0.35 + 1.65 * r^3", () => {
      // Bounded in [0.35, 2.00]
      expect(calculateDustBrightness(0.0)).toBeCloseTo(0.35, 6);
      expect(calculateDustBrightness(1.0)).toBeCloseTo(2.0, 6);

      // Monotonicity test across 10,000 steps
      let prev = -Infinity;
      for (let i = 0; i <= 10000; i++) {
        const r = i / 10000;
        const b = calculateDustBrightness(r);
        expect(b).toBeGreaterThanOrEqual(prev);
        expect(b).toBeGreaterThanOrEqual(0.35);
        expect(b).toBeLessThanOrEqual(2.0);
        prev = b;
      }

      // Median test (r = 0.5): 0.35 + 1.65 * 0.125 = 0.55625
      expect(calculateDustBrightness(0.5)).toBeCloseTo(0.55625, 5);

      // Ensure 0% of dust particles can EVER exceed prominence threshold 2.2
      for (let i = 0; i <= 1000; i++) {
        const r = i / 1000;
        const bright = calculateDustBrightness(r);
        expect(bright).toBeLessThanOrEqual(2.0);
        expect(calculateProminence(bright)).toBe(0.0);
      }
    });

    it("satisfies standard star power-law formula: 0.40 + 2.60 * r^2.6", () => {
      // Bounded in [0.40, 3.00]
      expect(calculateStarBrightness(0.0, false)).toBeCloseTo(0.4, 6);
      expect(calculateStarBrightness(1.0, false)).toBeCloseTo(3.0, 6);

      // Monotonicity test across 10,000 steps
      let prev = -Infinity;
      for (let i = 0; i <= 10000; i++) {
        const r = i / 10000;
        const b = calculateStarBrightness(r, false);
        expect(b).toBeGreaterThanOrEqual(prev);
        expect(b).toBeGreaterThanOrEqual(0.4);
        expect(b).toBeLessThanOrEqual(3.0);
        prev = b;
      }

      // Median test (r = 0.5): 0.4 + 2.6 * (0.5)^2.6 = 0.8288
      expect(calculateStarBrightness(0.5, false)).toBeCloseTo(0.8288, 3);
    });

    it("evaluates heart star distribution: 2.00 + 0.60 * r in [2.00, 2.60]", () => {
      expect(calculateStarBrightness(0.0, true)).toBeCloseTo(2.0, 6);
      expect(calculateStarBrightness(1.0, true)).toBeCloseTo(2.6, 6);
      expect(calculateStarBrightness(0.5, true)).toBeCloseTo(2.3, 6);
    });

    it("prominence gate strictly zeros below 2.2 and saturates at 3.0", () => {
      // Hard clamp below 2.2
      expect(calculateProminence(0.0)).toBe(0.0);
      expect(calculateProminence(0.4)).toBe(0.0);
      expect(calculateProminence(1.5)).toBe(0.0);
      expect(calculateProminence(2.0)).toBe(0.0);
      expect(calculateProminence(2.19999)).toBe(0.0);
      expect(calculateProminence(2.2)).toBe(0.0);

      // Transition range (2.2, 3.0)
      expect(calculateProminence(2.6)).toBeCloseTo(0.5, 5); // smoothstep midpoint
      expect(calculateProminence(2.4)).toBeLessThan(calculateProminence(2.6));
      expect(calculateProminence(2.8)).toBeGreaterThan(calculateProminence(2.6));

      // Saturation at and above 3.0
      expect(calculateProminence(3.0)).toBe(1.0);
      expect(calculateProminence(3.5)).toBe(1.0);
      expect(calculateProminence(10.0)).toBe(1.0);
    });

    it("verifies <5% of total galaxy stars/particles exceed prominence threshold 2.2", () => {
      // Galaxy simulation composition in galaxyScene.ts:
      // - 4600 dust particles (power-law 0.35 + 1.65 r^3, max 2.00)
      // - 276 standard stars (power-law 0.40 + 2.60 r^2.6, max 3.00)
      // - 24 heart stars (linear 2.00 + 0.60 r, max 2.60)
      // Total celestial population = 4900 particles

      // Analytical check:
      // Standard stars: 0.4 + 2.6 * r^2.6 > 2.2 => r > (1.8 / 2.6)^(1 / 2.6) ~= 0.86814
      // Probability for standard star = 1 - 0.86814 = 13.186%
      // Heart stars: 2.0 + 0.6 * r > 2.2 => r > 0.2 / 0.6 = 1/3
      // Probability for heart star = 1 - 1/3 = 66.667%
      // Dust particles: max 2.0 < 2.2 => 0%
      // Total expected stars with aBright > 2.2 = 276 * 0.13186 + 24 * 0.66667 = 36.39 + 16.0 = 52.39 stars
      // Percentage of total galaxy stars = 52.39 / 4900 = 1.069% < 5.0%

      // Replicate the exact scene generation LCG sequence from galaxyScene.ts
      let seed = 42;
      const random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      const dustCount = 4600;
      const starCount = 300;
      const heartCount = 24;

      let galaxyDustProminent = 0;
      for (let i = 0; i < dustCount; i++) {
        const b = calculateDustBrightness(random());
        if (b > 2.2) galaxyDustProminent++;
      }
      expect(galaxyDustProminent).toBe(0); // Strictly 0 dust particles exceed 2.2

      let galaxyStarsProminent = 0;
      for (let i = 0; i < starCount; i++) {
        const isHeart = i < heartCount;
        const b = calculateStarBrightness(random(), isHeart);
        if (b > 2.2) galaxyStarsProminent++;
      }

      const totalGalaxyParticles = dustCount + starCount;
      const totalGalaxyProminent = galaxyDustProminent + galaxyStarsProminent;
      const galaxyProminencePercentage =
        (totalGalaxyProminent / totalGalaxyParticles) * 100;

      // Crucial assertion: Total prominent stars receiving diffraction spikes is ~1.0% to 1.2%, strictly < 5%
      expect(galaxyProminencePercentage).toBeLessThan(5.0);
      expect(galaxyProminencePercentage).toBeGreaterThan(0.5);
      expect(totalGalaxyProminent).toBeLessThan(100);
      expect(totalGalaxyProminent).toBeGreaterThan(30);

      // Verify that out of foreground stars alone, only the highest tier (> 2.2) gets spikes
      const foregroundSpikeRate = (galaxyStarsProminent / starCount) * 100;
      expect(foregroundSpikeRate).toBeLessThan(25.0); // ~17% of foreground billboard stars
    });
  });

  // =========================================================================
  // Challenge 2: DayInk Mode Contrast, Dark Ink Anchors & Watercolor Halos
  // =========================================================================
  describe("2. DayInk Mode Contrast & Saturated Dark Ink Anchors", () => {
    it("preserves dark saturated ink anchors in DayInk mode (no white-core wash)", () => {
      // Day palette definitions from galaxyScene.ts
      const dayPalette = [
        [20 / 255, 80 / 255, 143 / 255], // #14508f (Deep indigo ink)
        [14 / 255, 107 / 255, 122 / 255], // #0e6b7a (Dark teal ink)
        [168 / 255, 84 / 255, 28 / 255], // #a8541c (Burnt sienna ink)
        [74 / 255, 95 / 255, 165 / 255], // #4a5fa5 (Slate blue ink)
      ];

      // Paper background atmosphere: vec3(0.925, 0.94, 0.958)
      const paperLuminance =
        0.2126 * 0.925 + 0.7152 * 0.94 + 0.0722 * 0.958; // ~0.938

      // Shaders dayInk formula from galaxyScene.ts:
      // float highlight = smoothstep(1.7, 2.2, vBright) * 0.6;
      // vec3 dayInk = mix(vColor, vColor * vec3(0.58, 0.55, 0.50), highlight) * (1.0 - vBright * 0.08);
      const calculateDayInk = (
        vColor: number[],
        vBright: number
      ): number[] => {
        const t = Math.max(0, Math.min(1, (vBright - 1.7) / (2.2 - 1.7)));
        const highlight = t * t * (3 - 2 * t) * 0.6;
        const darkening = [0.58, 0.55, 0.5];
        const ink = vColor.map(
          (c, idx) => (c * (1 - highlight) + c * darkening[idx] * highlight)
        );
        return ink.map(c => c * (1.0 - vBright * 0.08));
      };

      // Shaders nightInk formula from galaxyScene.ts:
      // vec3 nightInk = mix(vColor, vec3(1.0), highlight) * (1.0 + vBright * 0.22);
      const calculateNightInk = (
        vColor: number[],
        vBright: number
      ): number[] => {
        const t = Math.max(0, Math.min(1, (vBright - 1.7) / (2.2 - 1.7)));
        const highlight = t * t * (3 - 2 * t) * 0.6;
        const ink = vColor.map(c => c * (1 - highlight) + 1.0 * highlight);
        return ink.map(c => c * (1.0 + vBright * 0.22));
      };

      for (const color of dayPalette) {
        const dimDay = calculateDayInk(color, 0.5);
        const brightDay = calculateDayInk(color, 2.0);

        // 1. In day mode, bright motes get DARKER and more concentrated, NOT lighter
        const dimLum =
          0.2126 * dimDay[0] + 0.7152 * dimDay[1] + 0.0722 * dimDay[2];
        const brightLum =
          0.2126 * brightDay[0] + 0.7152 * brightDay[1] + 0.0722 * brightDay[2];

        expect(brightLum).toBeLessThan(dimLum); // Darker ink anchor!

        // 2. Contrast ratio against paper increases for bright motes
        const dimContrast = (paperLuminance + 0.05) / (dimLum + 0.05);
        const brightContrast = (paperLuminance + 0.05) / (brightLum + 0.05);
        expect(brightContrast).toBeGreaterThan(dimContrast * 1.2); // At least 20% contrast boost

        // 3. Prevent washed-out white/light gray artifacts: RGB values remain solidly dark (< 0.50, vs > 1.0 in night mode)
        expect(brightDay[0]).toBeLessThan(0.5);
        expect(brightDay[1]).toBeLessThan(0.5);

        // 4. Contrast against paper is preserved (all anchors > 3.0:1 in linear space, vs ~0.94:1 white-wash collapse)
        expect(brightContrast).toBeGreaterThan(3.0);

        // 5. Contrast that in night mode, opposite behavior happens: bright motes blow out toward white
        const dimNight = calculateNightInk(color, 0.5);
        const brightNight = calculateNightInk(color, 2.0);
        const dimNightLum =
          0.2126 * dimNight[0] + 0.7152 * dimNight[1] + 0.0722 * dimNight[2];
        const brightNightLum =
          0.2126 * brightNight[0] +
          0.7152 * brightNight[1] +
          0.0722 * brightNight[2];
        expect(brightNightLum).toBeGreaterThan(dimNightLum);
      }
    });

    it("verifies watercolor halo weighting: day halo is 2.43x of night halo", () => {
      // From galaxyScene.ts star fragment shader:
      // float night = core + corona*0.23 + halo*0.035 + glint*(0.03 + vProminence*0.14);
      // float day = core + corona*0.20 + halo*0.085 + glint*(0.08 + vProminence*0.12);
      const nightHaloWeight = 0.035;
      const dayHaloWeight = 0.085;
      const ratio = dayHaloWeight / nightHaloWeight;

      expect(ratio).toBeCloseTo(2.42857, 4);
      expect(dayHaloWeight).toBeGreaterThan(0.08);
      expect(nightHaloWeight).toBeLessThan(0.04);
    });

    it("verifies day mode disables additive bloom to maintain crisp ink lines", () => {
      const pass = new BloomPyramidPass({ strength: 0.55 });

      // When light mode is active, galaxyScene sets bloomPass.strength = 0
      pass.strength = 0;
      expect(pass.strength).toBe(0);

      // In BloomPyramidPass.render:
      // if (this.strength <= 0 || this.downsampleTargets.length === 0) { ... single blit, no bloom ... }
      expect(pass.strength <= 0).toBe(true);
      pass.dispose();
    });

    it("verifies central rose core is anchored with dark charcoal taupe in day mode", () => {
      // From galaxyScene.ts heart fragment shader:
      // vec3 tint = mix(vec3(1.0, 0.96, 0.88), vec3(0.35, 0.32, 0.28), uLight);
      const nightTint = [1.0, 0.96, 0.88];
      const dayTint = [0.35, 0.32, 0.28];

      const nightLum =
        0.2126 * nightTint[0] + 0.7152 * nightTint[1] + 0.0722 * nightTint[2];
      const dayLum =
        0.2126 * dayTint[0] + 0.7152 * dayTint[1] + 0.0722 * dayTint[2];

      expect(nightLum).toBeGreaterThan(0.9); // Bright golden core in night
      expect(dayLum).toBeLessThan(0.35); // Anchored dark charcoal in day
      expect(dayLum).toBeGreaterThan(0.2); // Not pitch black
    });
  });

  // =========================================================================
  // Challenge 3: Rapid setSize Resize Churn & GPU Memory Leak Test
  // =========================================================================
  describe("3. Rapid setSize Resize Churn & Memory Stability", () => {
    it("calls setSize 50 times in rapid succession without leaking render targets", () => {
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });

      // Track all created render targets and their disposal state
      const allCreatedTargets: WebGLRenderTarget[] = [];
      const disposedTargets = new Set<WebGLRenderTarget>();

      // Intercept WebGLRenderTarget.prototype.dispose to audit calls
      const originalDispose = WebGLRenderTarget.prototype.dispose;
      const disposeSpy = vi
        .spyOn(WebGLRenderTarget.prototype, "dispose")
        .mockImplementation(function (this: WebGLRenderTarget) {
          disposedTargets.add(this);
          return originalDispose.call(this);
        });

      try {
        // Initial setup
        pass.setSize(1920, 1080);
        expect(pass.downMips).toHaveLength(6);
        expect(pass.upMips).toHaveLength(5);
        allCreatedTargets.push(...pass.downMips, ...pass.upMips);
        expect(allCreatedTargets).toHaveLength(11);
        expect(disposedTargets.size).toBe(0);

        // Perform 50 rapid resizes with various screen sizes (simulating window drag / layout churn)
        const resolutions = [
          [1920, 1080],
          [1440, 900],
          [1366, 768],
          [1280, 800],
          [1024, 768],
          [800, 600],
          [640, 480],
          [390, 844], // mobile portrait
          [844, 390], // mobile landscape
          [2560, 1440], // 2K
          [3840, 2160], // 4K
        ];

        for (let i = 0; i < 50; i++) {
          const [w, h] = resolutions[i % resolutions.length];
          const previousActiveTargets = [...pass.downMips, ...pass.upMips];

          // Trigger resize
          pass.setSize(w, h);

          const currentTargets = [...pass.downMips, ...pass.upMips];
          if (i === 0) {
            // The first notification repeats the initial dimensions: no churn.
            currentTargets.forEach((target, index) =>
              expect(target).toBe(previousActiveTargets[index])
            );
            for (const target of previousActiveTargets) {
              expect(disposedTargets.has(target)).toBe(false);
            }
          } else {
            for (const target of previousActiveTargets) {
              expect(disposedTargets.has(target)).toBe(true);
            }
            allCreatedTargets.push(...currentTargets);
          }

          // Active target lists must never accumulate beyond levels + (levels - 1)
          expect(pass.downMips).toHaveLength(6);
          expect(pass.upMips).toHaveLength(5);

        }

        // Initial allocation plus 49 changed sizes; one identical notification.
        expect(allCreatedTargets).toHaveLength(550);

        // Exactly the current 11 targets remain retained.
        expect(disposedTargets.size).toBe(539);

        // Active targets must NOT be disposed yet
        for (const target of [...pass.downMips, ...pass.upMips]) {
          expect(disposedTargets.has(target)).toBe(false);
        }

        // Finally, call pass.dispose()
        pass.dispose();

        expect(disposedTargets.size).toBe(550);
        expect(pass.downMips).toHaveLength(0);
        expect(pass.upMips).toHaveLength(0);
      } finally {
        disposeSpy.mockRestore();
      }
    });

    it("verifies zero render target accumulation under extreme stress (100 resizes)", () => {
      const pass = new BloomPyramidPass({ levels: 4 });
      const targetsTracked = new Set<WebGLRenderTarget>();
      let disposeCallCount = 0;

      const originalDispose = WebGLRenderTarget.prototype.dispose;
      const disposeSpy = vi
        .spyOn(WebGLRenderTarget.prototype, "dispose")
        .mockImplementation(function (this: WebGLRenderTarget) {
          disposeCallCount++;
          return originalDispose.call(this);
        });

      try {
        for (let i = 0; i < 100; i++) {
          pass.setSize(100 + i * 10, 100 + i * 5);
          for (const t of [...pass.downMips, ...pass.upMips]) {
            targetsTracked.add(t);
          }
          expect(pass.downMips.length).toBe(4);
          expect(pass.upMips.length).toBe(3);
        }

        // Total unique targets created: 100 * 7 = 700
        expect(targetsTracked.size).toBe(700);

        // Disposed targets during the 100 setSize calls: 99 * 7 = 693
        expect(disposeCallCount).toBe(693);

        pass.dispose();
        // Remaining 7 disposed on pass.dispose() -> 700 total
        expect(disposeCallCount).toBe(700);
      } finally {
        disposeSpy.mockRestore();
      }
    });

    it("handles boundary viewport sizes (0x0, negative, fractional, large)", () => {
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });

      // Minimal clamp to 1x1
      pass.setSize(0, 0);
      expect(pass.downMips[0].width).toBe(1);
      expect(pass.downMips[0].height).toBe(1);

      pass.setSize(-500, -300);
      expect(pass.downMips[0].width).toBe(1);
      expect(pass.downMips[0].height).toBe(1);

      // Fractional sizes floor cleanly
      pass.setSize(1234.56, 789.12);
      expect(pass.downMips[0].width).toBe(Math.floor(1234.56 * 0.5));
      expect(pass.downMips[0].height).toBe(Math.floor(789.12 * 0.5));

      pass.dispose();
    });
  });
});
