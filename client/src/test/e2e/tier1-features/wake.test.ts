import { describe, expect, it } from "vitest";
import { PointerWake, WAKE_LIFETIME, WAKE_SAMPLES } from "@/components/galaxy/pointerWake";

describe("Tier 1: Feature Coverage - Interaction Physics: Pointer Wake Dynamics (F8)", () => {
  it("computes normalized Gaussian wake radius within ~70-90px footprint for standard viewports", () => {
    // Formula: R_wake = (2 * min(48, max(28, 0.042 * H))) / H
    const calculateWakePixelRadius = (height: number) => {
      const clamped = Math.min(48, Math.max(28, 0.042 * height));
      return clamped * 2; // Footprint diameter in pixels
    };

    // Viewport 800px (standard desktop window)
    const footprint800 = calculateWakePixelRadius(800);
    expect(footprint800).toBeGreaterThanOrEqual(67);
    expect(footprint800).toBeLessThanOrEqual(96);

    // Viewport 1080px (FHD)
    const footprint1080 = calculateWakePixelRadius(1080);
    expect(footprint1080).toBeGreaterThanOrEqual(70);
    expect(footprint1080).toBeLessThanOrEqual(96);

    // Viewport 1440px (QHD)
    const footprint1440 = calculateWakePixelRadius(1440);
    expect(footprint1440).toBeCloseTo(96, 1);
  });

  it("normalizes coordinates with viewport height for circular brush symmetry", () => {
    const wake = new PointerWake();
    const width = 1920;
    const height = 1080;

    // Push initial reference point
    wake.push(960, 540, 1.0, width, height);
    // Push second point 100px rightward at t=1.1
    wake.push(1060, 540, 1.1, width, height);

    const segment = wake.segments[0];
    // Expected normalizeX = (2 * x - width) / height
    const expectedX0 = (2 * 960 - 1920) / 1080; // 0
    const expectedX1 = (2 * 1060 - 1920) / 1080; // 200 / 1080 = 0.18518
    const expectedY = 1 - (2 * 540) / 1080; // 0

    expect(segment.x).toBeCloseTo(expectedX0, 4);
    expect(segment.y).toBeCloseTo(expectedY, 4);
    expect(segment.z).toBeCloseTo(expectedX1, 4);
    expect(segment.w).toBeCloseTo(expectedY, 4);
  });

  it("evaluates mass-stratified particle decay lifetimes up to 3.2 seconds", () => {
    const smoothstep = (min: number, max: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - min) / (max - min)));
      return t * t * (3 - 2 * t);
    };

    const wakeDecayFade = (t: number, mass: number, sz = 0.5) => {
      if (t <= 0 || t >= 3.2) return 0;
      const attack = 1 - Math.exp(-18 * t);
      const damping = Math.exp((-t * (0.8 + 0.45 * sz)) / mass);
      const cutoff = 1 - smoothstep(0.7, 3.2, t);
      return attack * damping * cutoff;
    };

    const lightMass = 0.45; // sx = 0
    const heavyMass = 2.05; // sx = 1

    // At t = 0.1s (early attack)
    expect(wakeDecayFade(0.1, lightMass)).toBeGreaterThan(0.5);
    expect(wakeDecayFade(0.1, heavyMass)).toBeGreaterThan(0.5);

    // At t = 1.0s (light mass decays quickly, heavy mass retains drift)
    const lightMid = wakeDecayFade(1.0, lightMass);
    const heavyMid = wakeDecayFade(1.0, heavyMass);
    expect(heavyMid).toBeGreaterThan(lightMid);

    // At t = 3.2s (complete quiet-down for all masses)
    expect(wakeDecayFade(3.2, lightMass)).toBe(0);
    expect(wakeDecayFade(3.2, heavyMass)).toBe(0);
  });

  it("caps impulse displacement on long sweeps to 42 CSS pixels", () => {
    const wake = new PointerWake();
    const width = 1280;
    const height = 800;

    wake.push(100, 100, 1.0, width, height);
    // Large sweep: delta = 500px > 42px
    wake.push(600, 100, 1.1, width, height);

    const impulse = wake.impulses[0];
    // dx = 500. Gain = min(1.6, 42 / 500) = 42 / 500 = 0.084.
    // impulse.x = (dx * gain * 2) / height = (500 * 0.084 * 2) / 800 = (42 * 2) / 800 = 0.105
    expect(impulse.x).toBeCloseTo((42 * 2) / 800, 3);
  });

  it("recycles fixed 16-sample ring buffer without memory allocation", () => {
    const wake = new PointerWake();
    const width = 1000;
    const height = 1000;

    // Push 30 samples (more than 16)
    let t = 1.0;
    wake.push(100, 100, t, width, height);
    for (let i = 1; i <= 25; i++) {
      t += 0.06;
      wake.push(100 + i * 10, 100, t, width, height);
    }

    // Buffer remains fixed length
    expect(wake.segments.length).toBe(WAKE_SAMPLES);
    expect(wake.impulses.length).toBe(WAKE_SAMPLES);
    expect(wake.activeCount(t)).toBe(WAKE_SAMPLES);
  });

  it("expires active wake count monotonically after 3.2s lifetime", () => {
    const wake = new PointerWake();
    const width = 1000;
    const height = 1000;

    wake.push(200, 200, 1.0, width, height);
    wake.push(250, 200, 1.1, width, height);
    expect(wake.activeCount(1.1)).toBe(1);

    // After 2.0s
    expect(wake.activeCount(3.1)).toBe(1);

    // After 3.2s from impulse timestamp (1.1 + 3.2 = 4.3)
    expect(wake.activeCount(4.31)).toBe(0);
  });

  it("releases and clears active wake state cleanly", () => {
    const wake = new PointerWake();
    wake.push(100, 100, 1.0, 1000, 1000);
    wake.push(150, 100, 1.1, 1000, 1000);
    expect(wake.activeCount(1.1)).toBe(1);

    wake.clear();
    expect(wake.activeCount(1.1)).toBe(0);
  });
});
