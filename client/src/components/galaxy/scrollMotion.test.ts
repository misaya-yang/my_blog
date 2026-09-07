import { describe, expect, it } from "vitest";
import { getScrollMotion } from "./scrollMotion";

describe("hero scroll sequence", () => {
  it("keeps the initial composition intact and reveals the articles only after unfolding", () => {
    expect(getScrollMotion(0)).toEqual({
      approach: 0,
      expansion: 0,
      copyOpacity: 1,
      copyY: -0,
      split: 0,
    });
    expect(getScrollMotion(0.1).expansion).toBe(0);
    expect(getScrollMotion(0.5).copyOpacity).toBe(1);
    expect(getScrollMotion(0.5).split).toBeGreaterThan(0);
    expect(getScrollMotion(1, 1).split).toBe(0);
    expect(getScrollMotion(1, 0.5).split).toBeCloseTo(0.5);
    expect(getScrollMotion(1)).toEqual({
      approach: 1,
      expansion: 1,
      copyOpacity: 0,
      copyY: -32,
      split: 1,
    });
  });

  it("has no directional state, overshoot, or discontinuity at a phase boundary", () => {
    const forward = [0, 0.08, 0.15, 0.35, 0.42, 0.65, 0.95, 1].map(p =>
      getScrollMotion(p)
    );
    const reverse = [1, 0.95, 0.65, 0.42, 0.35, 0.15, 0.08, 0]
      .map(p => getScrollMotion(p))
      .reverse();
    expect(reverse).toEqual(forward);
    expect(getScrollMotion(-1)).toEqual(getScrollMotion(0));
    expect(getScrollMotion(2)).toEqual(getScrollMotion(1));
    for (const p of [0.08, 0.15, 0.35, 0.42, 0.65, 0.95]) {
      const before = getScrollMotion(p - 0.0001),
        after = getScrollMotion(p + 0.0001);
      expect(Math.abs(after.expansion - before.expansion)).toBeLessThan(0.001);
      expect(Math.abs(after.split - before.split)).toBeLessThan(0.001);
    }
  });
});
