import { describe, expect, it } from "vitest";
import { Quaternion } from "three";
import { fitRose } from "./roseFit";
import { createRoseTracks, PETAL_TRACKS, sampleTrack } from "./roseTracks";
import { RotationMotion } from "./rotationMotion";

const home = RotationMotion.defaultHomeQuaternion();

function points(orientation: Quaternion) {
  const tracks = createRoseTracks().slice(0, PETAL_TRACKS);
  const out = new Float32Array(tracks.length * 48 * 3);
  tracks.forEach((track, row) => {
    for (let i = 0; i < 48; i++)
      sampleTrack(track, i / 48)
        .applyQuaternion(orientation)
        .toArray(out, (row * 48 + i) * 3);
  });
  return out;
}

/** Same projection as the scene: camera on +Z looking at the origin plane. */
function projectedBox(
  pts: Float32Array,
  fit: { scale: number; x: number; y: number },
  width: number,
  height: number
) {
  const f = 1 / Math.tan((42 * Math.PI) / 360);
  const aspect = width / height;
  let left = Infinity,
    right = -Infinity,
    top = Infinity,
    bottom = -Infinity;
  for (let i = 0; i < pts.length; i += 3) {
    const depth = 10.4 - fit.scale * pts[i + 2];
    const x = ((fit.x + fit.scale * pts[i]) * f) / (aspect * depth);
    const y = ((fit.y + fit.scale * pts[i + 1]) * f) / depth;
    left = Math.min(left, ((x + 1) / 2) * width);
    right = Math.max(right, ((x + 1) / 2) * width);
    top = Math.min(top, ((1 - y) / 2) * height);
    bottom = Math.max(bottom, ((1 - y) / 2) * height);
  }
  return { left, right, top, bottom };
}

describe("projected rose fit", () => {
  const pts = points(home);
  it.each([
    [1440, 900],
    [1440, 734],
    [1920, 1080],
    [1024, 768],
  ])("keeps the rose inside the first screen at %ix%i", (width, height) => {
    const rect = {
      left: width * 0.45,
      right: width - 40,
      top: 90,
      bottom: height * 0.86 - 40,
    };
    const fit = fitRose(
      pts,
      { width, height, fov: 42, distance: 10.4 },
      rect,
      1.2
    );
    const box = projectedBox(pts, fit, width, height);
    expect(box.left).toBeGreaterThanOrEqual(rect.left - 1);
    expect(box.right).toBeLessThanOrEqual(rect.right + 1);
    expect(box.top).toBeGreaterThanOrEqual(rect.top - 1);
    expect(box.bottom).toBeLessThanOrEqual(rect.bottom + 1);
    // Fills the limiting dimension rather than floating small inside it.
    const filled = Math.max(
      (box.right - box.left) / (rect.right - rect.left),
      (box.bottom - box.top) / (rect.bottom - rect.top)
    );
    expect(filled).toBeGreaterThan(0.98);
  });

  it("never grows beyond the maximum scale on very large screens", () => {
    const fit = fitRose(
      pts,
      { width: 3840, height: 2160, fov: 42, distance: 10.4 },
      { left: 1700, right: 3800, top: 100, bottom: 2000 },
      1
    );
    expect(fit.scale).toBeLessThanOrEqual(1);
  });
});
