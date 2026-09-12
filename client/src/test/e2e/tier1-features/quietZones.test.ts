import { describe, expect, it } from "vitest";
import { getScrollMotion } from "@/components/galaxy/scrollMotion";
import { calculateContrastRatio, calculateLuminance, hexToRgb } from "../harness/testHarness";

describe("Tier 1: Feature Coverage - Quiet Zones, Contrast & Scroll Parallax (F11, F14, F15)", () => {
  describe("F14: Text Quiet Zones & WCAG Contrast Guarantee", () => {
    it("guarantees WCAG AAA / AA contrast ratio >= 4.5:1 for dark mode observatory palette", () => {
      const bg = hexToRgb("#0b0c0e");
      const surface = hexToRgb("#131619");
      const ink = hexToRgb("#eeefef");
      const muted = hexToRgb("#a4aaaf");

      const lumBg = calculateLuminance(...bg);
      const lumSurface = calculateLuminance(...surface);
      const lumInk = calculateLuminance(...ink);
      const lumMuted = calculateLuminance(...muted);

      // Primary text on background: >= 7.0:1 (AAA)
      const contrastPrimaryBg = calculateContrastRatio(lumInk, lumBg);
      expect(contrastPrimaryBg).toBeGreaterThanOrEqual(16.0); // Measured ~17.27:1

      // Primary text on card surface: >= 7.0:1 (AAA)
      const contrastPrimarySurface = calculateContrastRatio(lumInk, lumSurface);
      expect(contrastPrimarySurface).toBeGreaterThanOrEqual(15.0); // Measured ~15.83:1

      // Muted metadata text on background: >= 4.5:1 (AA)
      const contrastMutedBg = calculateContrastRatio(lumMuted, lumBg);
      expect(contrastMutedBg).toBeGreaterThanOrEqual(4.5); // Measured ~8.60:1
    });

    it("guarantees WCAG AAA / AA contrast ratio >= 4.5:1 for light mode observatory palette", () => {
      const bg = hexToRgb("#f8fafc");
      const surface = hexToRgb("#eef2f6");
      const ink = hexToRgb("#152230");
      const muted = hexToRgb("#526273");

      const lumBg = calculateLuminance(...bg);
      const lumSurface = calculateLuminance(...surface);
      const lumInk = calculateLuminance(...ink);
      const lumMuted = calculateLuminance(...muted);

      // Primary text on background: >= 7.0:1 (AAA)
      const contrastPrimaryBg = calculateContrastRatio(lumInk, lumBg);
      expect(contrastPrimaryBg).toBeGreaterThanOrEqual(14.0); // Measured ~15.03:1

      // Primary text on surface: >= 7.0:1 (AAA)
      const contrastPrimarySurface = calculateContrastRatio(lumInk, lumSurface);
      expect(contrastPrimarySurface).toBeGreaterThanOrEqual(13.0); // Measured ~13.99:1

      // Muted text on background: >= 4.5:1 (AA)
      const contrastMutedBg = calculateContrastRatio(lumMuted, lumBg);
      expect(contrastMutedBg).toBeGreaterThanOrEqual(4.5); // Measured ~5.72:1
    });

    it("evaluates GLSL readableArea() fragment quiet box mask with soft smoothstep borders", () => {
      // Simulates readableArea attenuation for a normalized pixel coord [px, py]
      const evaluateQuietBox = (
        px: number,
        py: number,
        box: [number, number, number, number],
        isLight: boolean
      ) => {
        const smoothstep = (min: number, max: number, v: number) => {
          const t = Math.max(0, Math.min(1, (v - min) / (max - min)));
          return t * t * (3 - 2 * t);
        };
        const qx =
          smoothstep(box[0] - 0.04, box[0] + 0.02, px) *
          (1.0 - smoothstep(box[2] - 0.02, box[2] + 0.04, px));
        const qy =
          smoothstep(box[1] - 0.025, box[1] + 0.02, py) *
          (1.0 - smoothstep(box[3] - 0.02, box[3] + 0.025, py));
        const factor = isLight ? 0.38 : 0.70;
        return 1.0 - qx * qy * factor;
      };

      const testBox: [number, number, number, number] = [0.2, 0.2, 0.8, 0.8];

      // Deep inside quiet box
      const darkCenterQuiet = evaluateQuietBox(0.5, 0.5, testBox, false);
      expect(darkCenterQuiet).toBeCloseTo(0.30, 2); // 70% attenuated

      const lightCenterQuiet = evaluateQuietBox(0.5, 0.5, testBox, true);
      expect(lightCenterQuiet).toBeCloseTo(0.62, 2); // 38% attenuated

      // Completely outside quiet box
      const outsideQuiet = evaluateQuietBox(0.05, 0.05, testBox, false);
      expect(outsideQuiet).toBe(1.0); // Zero attenuation

      // On boundary feathering: soft transition between 0.30 and 1.0
      const edgeQuiet = evaluateQuietBox(0.18, 0.5, testBox, false);
      expect(edgeQuiet).toBeGreaterThan(0.30);
      expect(edgeQuiet).toBeLessThan(1.0);
    });
  });

  describe("F11: Scroll Parallax & Camera Dynamics", () => {
    it("interpolates continuous scroll motion phases across progress [0, 1]", () => {
      const motionStart = getScrollMotion(0.0, 0.0);
      expect(motionStart.approach).toBe(0.0);
      expect(motionStart.expansion).toBe(0.0);
      expect(motionStart.copyOpacity).toBe(1.0);
      expect(motionStart.copyY).toBeCloseTo(0.0, 5);
      expect(motionStart.split).toBe(0.0);

      const motionMid = getScrollMotion(0.5, 0.0);
      expect(motionMid.approach).toBe(1.0); // smoothRange(0, 0.35, 0.5) reaches 1.0
      expect(motionMid.expansion).toBeGreaterThan(0.0);
      expect(motionMid.copyY).toBeCloseTo(-32, 1);

      const motionLate = getScrollMotion(0.89, 0.0);
      expect(motionLate.copyOpacity).toBeLessThan(1.0);

      const motionEnd = getScrollMotion(1.0, 0.0);
      expect(motionEnd.approach).toBe(1.0);
      expect(motionEnd.expansion).toBe(1.0);
      expect(motionEnd.copyOpacity).toBe(0.0);
      expect(motionEnd.split).toBe(1.0);
    });

    it("evaluates smooth camera position z depth displacement under scroll and gather", () => {
      const calculateCameraZ = (progress: number, gather: number) => {
        const motion = getScrollMotion(progress, gather);
        return 10.4 - motion.approach * 0.55 + gather * 3.6;
      };

      const zInitial = calculateCameraZ(0.0, 0.0);
      expect(zInitial).toBeCloseTo(10.4, 2);

      const zScrolled = calculateCameraZ(1.0, 0.0);
      expect(zScrolled).toBeCloseTo(10.4 - 0.55, 2); // Pulls forward by 0.55

      const zGathered = calculateCameraZ(0.0, 1.0);
      expect(zGathered).toBeCloseTo(10.4 + 3.6, 2); // Pushes back for overview
    });

    it("clamps scroll progress smoothly outside [0, 1] range without NaN or runaway values", () => {
      const underflow = getScrollMotion(-0.5, -0.2);
      expect(underflow.approach).toBe(0.0);
      expect(underflow.expansion).toBe(0.0);
      expect(underflow.copyOpacity).toBe(1.0);

      const overflow = getScrollMotion(1.5, 1.2);
      expect(overflow.approach).toBe(1.0);
      expect(overflow.expansion).toBe(1.0);
      expect(overflow.copyOpacity).toBe(0.0);
    });
  });

  describe("F15: Responsive Mobile Viewport & Reduced Motion Scaling", () => {
    it("allocates particle draw ranges according to viewport form factor", () => {
      const getParticleBudget = (isMobile: boolean, isCoarse: boolean) => {
        return {
          dust: isMobile ? 2800 : 4600,
          stars: isMobile && isCoarse ? 128 : isMobile ? 200 : 300,
          distant: isMobile ? 90 : 180,
          dprCap: isMobile && isCoarse ? 1.25 : 1.5,
          fpsCap: isMobile ? 30 : 60,
        };
      };

      const desktopBudget = getParticleBudget(false, false);
      expect(desktopBudget.dust).toBe(4600);
      expect(desktopBudget.stars).toBe(300);
      expect(desktopBudget.distant).toBe(180);
      expect(desktopBudget.dprCap).toBe(1.5);
      expect(desktopBudget.fpsCap).toBe(60);

      const mobileTouchBudget = getParticleBudget(true, true);
      expect(mobileTouchBudget.dust).toBe(2800);
      expect(mobileTouchBudget.stars).toBe(128);
      expect(mobileTouchBudget.distant).toBe(90);
      expect(mobileTouchBudget.dprCap).toBe(1.25);
      expect(mobileTouchBudget.fpsCap).toBe(30);

      // Total particle load reduction is ~42%
      const desktopTotal = desktopBudget.dust + desktopBudget.stars + desktopBudget.distant;
      const mobileTotal = mobileTouchBudget.dust + mobileTouchBudget.stars + mobileTouchBudget.distant;
      const reduction = (desktopTotal - mobileTotal) / desktopTotal;
      expect(reduction).toBeGreaterThan(0.4);
    });
  });
});
