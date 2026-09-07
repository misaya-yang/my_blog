import { Quaternion, Vector3 } from "three";

/** Project the pointer onto a sphere with a continuous hyperbolic rim. */
export function projectTrackball(
  x: number,
  y: number,
  width: number,
  height: number
) {
  const radius = Math.min(width, height) * 0.48;
  const point = new Vector3(
    (x - width / 2) / radius,
    (height / 2 - y) / radius,
    0
  );
  const distance = point.x * point.x + point.y * point.y;
  point.z =
    distance <= 0.5 ? Math.sqrt(1 - distance) : 0.5 / Math.sqrt(distance);
  return point.normalize();
}

/** Camera-space increments compose without Euler-angle limits or pole locking. */
export function trackballDelta(from: Vector3, to: Vector3) {
  return new Quaternion().setFromUnitVectors(from, to);
}
