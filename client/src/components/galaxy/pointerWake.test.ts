import { describe, expect, it } from "vitest";
import { PointerWake, WAKE_LIFETIME } from "./pointerWake";

describe("local pointer wake", () => {
  it("does not disturb the resting scene, and expires after the pointer leaves", () => {
    const wake = new PointerWake();
    wake.push(100, 100, 0, 1000, 800);
    wake.push(100, 100, 0.06, 1000, 800);
    expect(wake.activeCount(0.06)).toBe(0);
    wake.push(145, 100, 0.12, 1000, 800);
    expect(wake.activeCount(0.12)).toBe(1);
    wake.release();
    expect(wake.activeCount(0.12 + WAKE_LIFETIME + 0.01)).toBe(0);
  });
  it("follows the sweep direction but caps the input impulse at 42 CSS pixels", () => {
    for (const [width, height] of [
      [1600, 900],
      [390, 844],
    ]) {
      const wake = new PointerWake();
      wake.push(50, 50, 0, width, height);
      wake.push(350, 200, 0.06, width, height);
      const impulse = wake.impulses[0];
      expect(impulse.x).toBeGreaterThan(0);
      expect(impulse.y).toBeLessThan(0);
      expect((Math.hypot(impulse.x, impulse.y) * height) / 2).toBeCloseTo(42);
    }
  });
  it("does not connect entry after an idle gap, and clears history on reset", () => {
    const wake = new PointerWake();
    wake.push(0, 0, 0, 1000, 800);
    wake.push(100, 100, 0.06, 1000, 800);
    wake.push(900, 700, WAKE_LIFETIME + 0.4, 1000, 800);
    expect(wake.activeCount(WAKE_LIFETIME + 0.4)).toBe(0);
    wake.push(920, 710, WAKE_LIFETIME + 0.46, 1000, 800);
    expect(wake.activeCount(WAKE_LIFETIME + 0.46)).toBe(1);
    wake.clear();
    expect(wake.activeCount(WAKE_LIFETIME + 0.46)).toBe(0);
  });
});
