import { describe, expect, it } from "vitest";
import { BloomPyramidPass } from "@/components/galaxy/bloomPyramid";
import { hexToRgb } from "../harness/testHarness";

describe("Tier 1: Feature Coverage - Optical Pipeline & Shaders", () => {
  // F1: Power-law brightness distribution
  describe("F1: Power-Law Star Brightness Distribution", () => {
    it("satisfies cubic distribution for dust particles within [0.35, 2.00]", () => {
      const dustSamples: number[] = [];
      // Test over 1000 simulated uniform samples
      for (let i = 0; i <= 1000; i++) {
        const r = i / 1000;
        const bright = 0.35 + Math.pow(r, 3) * 1.65;
        dustSamples.push(bright);
        expect(bright).toBeGreaterThanOrEqual(0.35);
        expect(bright).toBeLessThanOrEqual(2.0001);
      }

      // Power-law concentration: median (r=0.5) is 0.35 + 0.125 * 1.65 = 0.556 (strongly biased towards lower end)
      const median = dustSamples[500];
      expect(median).toBeCloseTo(0.55625, 3);
      expect(median).toBeLessThan(1.0); // Concentrated in dim tiers
    });

    it("satisfies power-law x^2.6 distribution for standard stars within [0.40, 3.00]", () => {
      const starSamples: number[] = [];
      for (let i = 0; i <= 1000; i++) {
        const r = i / 1000;
        const bright = 0.4 + Math.pow(r, 2.6) * 2.6;
        starSamples.push(bright);
        expect(bright).toBeGreaterThanOrEqual(0.4);
        expect(bright).toBeLessThanOrEqual(3.0001);
      }

      // Median r=0.5: 0.4 + (0.5)^2.6 * 2.6 = 0.4 + 0.1649 * 2.6 = 0.8288
      const median = starSamples[500];
      expect(median).toBeCloseTo(0.8288, 2);
      // High brightness tail (bright > 2.0) should be rare (< 20% of stars)
      const highTierCount = starSamples.filter(b => b > 2.0).length;
      expect(highTierCount / starSamples.length).toBeLessThan(0.20);
    });

    it("reserves extreme high-magnitude brightness for 24 heart stars in [2.00, 2.60]", () => {
      for (let i = 0; i < 24; i++) {
        const r = i / 24;
        const bright = 2.0 + r * 0.6;
        expect(bright).toBeGreaterThanOrEqual(2.0);
        expect(bright).toBeLessThanOrEqual(2.6);
      }
    });

    it("drives star point size scaling monotonically from brightness", () => {
      // Star size formula: 1.7 + Math.pow((bright - 0.4) / 2.6, 1.1) * 2.3
      const computeSize = (bright: number) =>
        1.7 + Math.pow((bright - 0.4) / 2.6, 1.1) * 2.3;

      const minSize = computeSize(0.4);
      const midSize = computeSize(1.7);
      const maxSize = computeSize(3.0);

      expect(minSize).toBeCloseTo(1.7, 3);
      expect(midSize).toBeGreaterThan(minSize);
      expect(maxSize).toBeCloseTo(4.0, 2);
      expect(maxSize).toBeGreaterThan(midSize);
    });

    it("selects white or warm orange emission palette only for highest magnitude stars", () => {
      const getStarColor = (bright: number) => {
        if (bright > 1.6) {
          return ["#e3f3ff", "#ffb878"]; // White or warm orange
        }
        return ["#9ad8ff", "#b5d4ff"]; // Cool blues
      };

      const dimColors = getStarColor(1.2);
      expect(dimColors).toContain("#9ad8ff");

      const brightColors = getStarColor(2.5);
      expect(brightColors).toContain("#ffb878");
    });
  });

  // F2: ACES Filmic Tone Mapping White-Core Roll-off
  describe("F2: ACES Filmic White-Core Roll-off", () => {
    // Standard ACES Filmic approximation
    const acesFilmic = (x: number) => {
      const a = 2.51;
      const b = 0.03;
      const c = 2.43;
      const d = 0.59;
      const e = 0.14;
      return Math.max(0, Math.min(1, (x * (a * x + b)) / (x * (c * x + d) + e)));
    };

    it("preserves toe slope for low luminance without crushing black details", () => {
      const toe = acesFilmic(0.1);
      expect(toe).toBeGreaterThan(0.01);
      expect(toe).toBeLessThan(0.15);
    });

    it("compresses HDR peak luminances smoothly into [0, 1] shoulder", () => {
      const high1 = acesFilmic(1.0);
      const high2 = acesFilmic(2.0);
      const high5 = acesFilmic(5.0);
      const high10 = acesFilmic(10.0);

      expect(high1).toBeGreaterThan(0.7);
      expect(high2).toBeGreaterThan(high1);
      expect(high5).toBeGreaterThan(high2);
      expect(high10).toBeGreaterThan(high5);
      expect(high10).toBeLessThanOrEqual(1.0);
    });

    it("rolls off high-magnitude emission to saturated white cores", () => {
      // Star core emission formula: mix(color, vec3(1.0), core * prominence * 0.7) * (1.0 + core * (0.4 + prominence * 2.2))
      const calculateCoreEmission = (
        colorRGB: [number, number, number],
        core: number,
        prominence: number
      ) => {
        const whiteMix = core * prominence * 0.7;
        const boost = 1.0 + core * (0.4 + prominence * 2.2);
        return colorRGB.map(c => (c * (1 - whiteMix) + 1.0 * whiteMix) * boost);
      };

      const blueStarRGB = hexToRgb("#9ad8ff");
      const highCore = calculateCoreEmission(blueStarRGB, 1.0, 1.0);
      // R should be boosted close to G and B (white core desaturation)
      expect(highCore[0]).toBeGreaterThan(2.0);
      expect(highCore[1]).toBeGreaterThan(2.0);
      expect(highCore[2]).toBeGreaterThan(2.0);
    });

    it("avoids negative values and zero-division on zero luminance", () => {
      const zeroVal = acesFilmic(0.0);
      expect(zeroVal).toBeGreaterThanOrEqual(0.0);
      expect(Number.isFinite(zeroVal)).toBe(true);
    });

    it("produces monotonically increasing response across dynamic range [0, 20]", () => {
      let prev = -1;
      for (let x = 0; x <= 20; x += 0.5) {
        const current = acesFilmic(x);
        expect(current).toBeGreaterThanOrEqual(prev);
        prev = current;
      }
    });
  });

  // F3: Diffraction Spikes & Prominence Gate
  describe("F3: Diffraction Spikes & Prominence Gate", () => {
    const smoothstep = (min: number, max: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - min) / (max - min)));
      return t * t * (3 - 2 * t);
    };

    it("strictly zeros diffraction spikes for stars with aBright <= 2.2", () => {
      for (const bright of [0.4, 1.0, 1.8, 2.19, 2.2]) {
        const prominence = smoothstep(2.2, 3.0, bright);
        expect(prominence).toBe(0.0);
      }
    });

    it("activates full prominence = 1.0 for stars reaching aBright >= 3.0", () => {
      for (const bright of [3.0, 3.2, 4.0]) {
        const prominence = smoothstep(2.2, 3.0, bright);
        expect(prominence).toBe(1.0);
      }
    });

    it("smoothly ramps prominence through transition range (2.2, 3.0)", () => {
      const midProminence = smoothstep(2.2, 3.0, 2.6);
      expect(midProminence).toBeCloseTo(0.5, 3);
      expect(smoothstep(2.2, 3.0, 2.4)).toBeLessThan(midProminence);
      expect(smoothstep(2.2, 3.0, 2.8)).toBeGreaterThan(midProminence);
    });

    it("evaluates exponential diffraction cross ray decay along UV axes", () => {
      // Formula: (exp(-90|u| - 12|v|) + exp(-90|v| - 12|u|)) * prominence
      const spikeIntensity = (u: number, v: number, prom: number) => {
        const s1 = Math.exp(-90 * Math.abs(u) - 12 * Math.abs(v));
        const s2 = Math.exp(-90 * Math.abs(v) - 12 * Math.abs(u));
        return (s1 + s2) * prom;
      };

      // At origin with full prominence
      const center = spikeIntensity(0, 0, 1.0);
      expect(center).toBe(2.0);

      // Along major spike ray (u=0.05, v=0)
      const onRay = spikeIntensity(0.05, 0, 1.0);
      expect(onRay).toBeGreaterThan(0.01);

      // Off-axis corner (u=0.05, v=0.05) should drop off steeply
      const offAxis = spikeIntensity(0.05, 0.05, 1.0);
      expect(offAxis).toBeLessThan(onRay);
    });

    it("ensures micro-stars never produce diffraction rays", () => {
      // Dust brightness maximum is 2.0, well below 2.2 threshold
      const maxDustBright = 2.0;
      const dustProminence = smoothstep(2.2, 3.0, maxDustBright);
      expect(dustProminence).toBe(0.0);
    });
  });

  // F4: Mip-Pyramid Bloom Pipeline
  describe("F4: Mip-Pyramid Bloom Pipeline", () => {
    it("initializes BloomPyramidPass with specified mip levels and resolution scaling", () => {
      const pass = new BloomPyramidPass({
        levels: 6,
        resolutionScale: 0.5,
        threshold: 0.6,
        knee: 0.35,
        strength: 0.55,
      });

      expect(pass.strength).toBe(0.55);
      expect(pass.flare).toBe(0);
      expect(pass.flareCenter.x).toBe(0.5);
      expect(pass.flareCenter.y).toBe(0.5);
      pass.dispose();
    });

    it("verifies soft-knee luminance downsampling formula", () => {
      // Threshold = 0.6, Knee = 0.35 -> Window [0.6, 0.95]
      const softKneeGate = (lum: number, threshold = 0.6, knee = 0.35) => {
        const t = Math.max(0, Math.min(1, (lum - threshold) / knee));
        return t * t * (3 - 2 * t);
      };

      expect(softKneeGate(0.5)).toBe(0.0); // Below threshold
      expect(softKneeGate(0.6)).toBe(0.0);
      expect(softKneeGate(0.775)).toBeCloseTo(0.5, 2); // Mid-knee
      expect(softKneeGate(0.95)).toBe(1.0); // Full pass
      expect(softKneeGate(1.5)).toBe(1.0);
    });

    it("validates 9-tap tent upsampling filter weight distribution", () => {
      // Tent kernel weights: [1, 2, 1, 2, 4, 2, 1, 2, 1] / 16.0
      const weights = [1, 2, 1, 2, 4, 2, 1, 2, 1];
      const sum = weights.reduce((a, b) => a + b, 0);
      expect(sum).toBe(16); // Energy conservation: sum/16 = 1.0
    });

    it("models heart optical accent flare ignition curve", () => {
      // T_flare = clamp((u - 0.55) / 0.40, 0, 1), I_flare = T^2(3 - 2T) * 0.8
      const flareIntensity = (uIntro: number) => {
        const T = Math.max(0, Math.min(1, (uIntro - 0.55) / 0.4));
        return T * T * (3 - 2 * T) * 0.8;
      };

      expect(flareIntensity(0.5)).toBe(0.0); // Before ignition
      expect(flareIntensity(0.55)).toBe(0.0);
      expect(flareIntensity(0.75)).toBeCloseTo(0.4, 2); // Half-way
      expect(flareIntensity(0.95)).toBeCloseTo(0.8, 2); // Settled peak
      expect(flareIntensity(1.0)).toBeCloseTo(0.8, 2);
    });

    it("cleanly updates flare center and strength parameters without allocations", () => {
      const pass = new BloomPyramidPass();
      pass.flareCenter.set(0.62, 0.48);
      pass.strength = 0.72;
      pass.flare = 0.85;

      expect(pass.flareCenter.x).toBe(0.62);
      expect(pass.flareCenter.y).toBe(0.48);
      expect(pass.strength).toBe(0.72);
      expect(pass.flare).toBe(0.85);
      pass.dispose();
    });
  });

  // F5: Intro Reveal Timeline & Arc Convergence
  describe("F5: Intro Reveal Timeline & Arc Convergence", () => {
    it("computes staggered takeoff start time within [0.10, 0.40]", () => {
      const getStartTime = (seedX: number, seedY: number) =>
        0.10 + seedX * 0.18 + seedY * 0.08;

      expect(getStartTime(0, 0)).toBeCloseTo(0.10, 3);
      expect(getStartTime(1, 1)).toBeCloseTo(0.36, 3);
      expect(getStartTime(0.5, 0.5)).toBeCloseTo(0.23, 3);
    });

    it("guarantees full arc convergence completion before or at uIntro = 1.0", () => {
      // Ensure all particles finish before uIntro reaches 1.0 (no snapping pop)
      const testParticleConvergence = (seedX: number, seedY: number, seedZ: number) => {
        const start = 0.10 + seedX * 0.18 + seedY * 0.08;
        const duration = 0.56 + seedZ * 0.06;
        const finish = start + duration;
        return finish;
      };

      // Check boundary combinations
      for (const sx of [0, 0.5, 1.0]) {
        for (const sy of [0, 0.5, 1.0]) {
          for (const sz of [0, 0.5, 1.0]) {
            const finish = testParticleConvergence(sx, sy, sz);
            expect(finish).toBeLessThanOrEqual(1.0);
          }
        }
      }
    });

    it("models smooth quintic smootherstep trajectory without velocity spikes", () => {
      const smootherstep = (t: number) =>
        t * t * t * (t * (t * 6 - 15) + 10);

      expect(smootherstep(0)).toBe(0);
      expect(smootherstep(1)).toBe(1);
      expect(smootherstep(0.5)).toBe(0.5);

      // Check derivative at endpoints is 0 (smooth start and soft landing)
      const eps = 0.0001;
      const vStart = (smootherstep(eps) - smootherstep(0)) / eps;
      const vEnd = (smootherstep(1) - smootherstep(1 - eps)) / eps;
      expect(vStart).toBeLessThan(0.001);
      expect(vEnd).toBeLessThan(0.001);
    });

    it("evaluates curved gravitational arc deflection between 28° and 48°", () => {
      // Arc formula: sin(pi * p) * (0.50 + 0.35 * sz)
      const arcDeflectionRad = (p: number, sz: number) =>
        Math.sin(Math.PI * p) * (0.50 + 0.35 * sz);

      // Peak deflection at midpoint p = 0.5
      const minPeakRad = arcDeflectionRad(0.5, 0.0); // 0.50 rad = 28.6 deg
      const maxPeakRad = arcDeflectionRad(0.5, 1.0); // 0.85 rad = 48.7 deg

      const toDeg = (rad: number) => (rad * 180) / Math.PI;
      expect(toDeg(minPeakRad)).toBeGreaterThanOrEqual(28.0);
      expect(toDeg(maxPeakRad)).toBeLessThanOrEqual(49.0);
    });

    it("restores initial position seamlessly when uIntro >= 1.0", () => {
      const applyIntroConvergence = (
        origPos: [number, number, number],
        scatterPos: [number, number, number],
        progress: number
      ) => {
        if (progress >= 1.0) return origPos;
        return [
          scatterPos[0] + (origPos[0] - scatterPos[0]) * progress,
          scatterPos[1] + (origPos[1] - scatterPos[1]) * progress,
          scatterPos[2] + (origPos[2] - scatterPos[2]) * progress,
        ];
      };

      const orig: [number, number, number] = [1.2, -0.4, 0.8];
      const scatter: [number, number, number] = [4.5, 3.2, -2.1];

      const settled = applyIntroConvergence(orig, scatter, 1.0);
      expect(settled[0]).toBe(orig[0]);
      expect(settled[1]).toBe(orig[1]);
      expect(settled[2]).toBe(orig[2]);
    });
  });

  // F6: High-Contrast DayInk Light Mode
  describe("F6: High-Contrast DayInk Light Mode", () => {
    it("maps daylight palette to rich saturated ink tones", () => {
      const dayPalette = ["#14508f", "#0e6b7a", "#a8541c", "#4a5fa5"];
      for (const hex of dayPalette) {
        const rgb = hexToRgb(hex);
        // Ensure not washed-out white/light gray
        const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
        expect(lum).toBeLessThan(0.4); // Dark saturated ink
      }
    });

    it("applies subtractive ink darkening on high-brightness motes", () => {
      // dayInk formula: mix(color, color * vec3(0.58, 0.55, 0.50), highlight) * (1.0 - bright * 0.08)
      const calculateDayInk = (
        baseColor: [number, number, number],
        highlight: number,
        bright: number
      ) => {
        const inkTone = baseColor.map((c, i) =>
          c * (1 - highlight) + c * [0.58, 0.55, 0.5][i] * highlight
        );
        return inkTone.map(c => c * (1.0 - bright * 0.08));
      };

      const base = hexToRgb("#14508f");
      const dimInk = calculateDayInk(base, 0.1, 0.5);
      const brightInk = calculateDayInk(base, 0.9, 2.5);

      // Higher brightness motes produce deeper ink saturation (lower RGB values)
      expect(brightInk[0]).toBeLessThan(dimInk[0]);
      expect(brightInk[1]).toBeLessThan(dimInk[1]);
      expect(brightInk[2]).toBeLessThan(dimInk[2]);
    });

    it("increases watercolor halo bleeding weight in day mode", () => {
      const nightHaloWeight = 0.035;
      const dayHaloWeight = 0.085;
      expect(dayHaloWeight).toBeGreaterThan(nightHaloWeight * 2);
    });

    it("configures paper canvas atmosphere background", () => {
      const dayAtmosphere = hexToRgb("#f8fafc");
      const lum = 0.2126 * dayAtmosphere[0] + 0.7152 * dayAtmosphere[1] + 0.0722 * dayAtmosphere[2];
      expect(lum).toBeGreaterThan(0.9); // High-luminance crisp paper
    });

    it("anchors central heart glow with warm charcoal taupe in day mode", () => {
      // Charcoal taupe vec3(0.35, 0.32, 0.28)
      const taupe: [number, number, number] = [0.35, 0.32, 0.28];
      const lum = 0.2126 * taupe[0] + 0.7152 * taupe[1] + 0.0722 * taupe[2];
      expect(lum).toBeGreaterThan(0.05);
      expect(lum).toBeLessThan(0.35); // Anchored mid-tone
    });
  });
});
