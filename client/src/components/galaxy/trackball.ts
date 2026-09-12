import { Quaternion, Vector3 } from "three";

/** Project the pointer onto a sphere with a continuous hyperbolic rim. */
export function projectTrackball(
  x: number,
  y: number,
  width: number,
  height: number,
  target?: Vector3
): Vector3 {
  const radius = Math.min(width, height) * 0.48;
  const point = target ?? new Vector3();
  point.set(
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
export function trackballDelta(
  from: Vector3,
  to: Vector3,
  target?: Quaternion
): Quaternion {
  const q = target ?? new Quaternion();
  return q.setFromUnitVectors(from, to);
}
