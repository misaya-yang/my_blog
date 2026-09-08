import { describe, expect, it } from "vitest";
import { createContourFlow } from "./contourFlow";

describe("contour flow", () => {
  it("moves along the signature stroke instead of rotating it about the rose", () => {
    const points = Array.from({ length: 11 }, (_, i) => [
      0.2,
      (i - 5) * 0.025,
    ]).flat();
    const flow = createContourFlow(points);
    for (let i = 0; i < flow.length; i += 2) {
      expect(Math.abs(flow[i])).toBeLessThan(0.00001);
      expect(flow[i + 1]).toBeCloseTo(0.045);
    }
  });
  it("keeps petal motion bounded and leaves isolated stars alone", () => {
    const points = Array.from({ length: 11 }, (_, i) => [
      1 + i * 0.025,
      2,
    ]).flat();
    points.push(10, 10);
    const flow = createContourFlow(points);
    for (let i = 0; i < flow.length - 2; i += 2) {
      expect(Math.abs(flow[i])).toBeCloseTo(0.08);
      expect(Math.abs(flow[i + 1])).toBeLessThan(0.00001);
    }
    expect(Array.from(flow.slice(-2))).toEqual([0, 0]);
  });
});
