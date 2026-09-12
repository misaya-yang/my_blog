import { Vector4 } from "three";

export const WAKE_SAMPLES = 16;
export const WAKE_LIFETIME = 1.35;

/** A short, bounded screen-space flow left by the pointer, independent of rotation. */
export class PointerWake {
  readonly segments = Array.from({ length: WAKE_SAMPLES }, () => new Vector4());
  readonly impulses = Array.from(
    { length: WAKE_SAMPLES },
    () => new Vector4(0, 0, -10, 0)
  );
  private previous: { x: number; y: number; time: number } | null = null;
  private slot = 0;

  push(x: number, y: number, time: number, width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    const previous = this.previous;
    if (!previous || time - previous.time > 0.75 || time < previous.time) {
      this.previous = { x, y, time };
      return;
    }
    if (time - previous.time < 0.05) return;
    const dx = x - previous.x,
      dy = y - previous.y;
    this.previous = { x, y, time };
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return;
    // Coordinates use viewport height for BOTH axes, keeping a circular brush.
    const normalizeX = (value: number) => (2 * value - width) / height;
    const normalizeY = (value: number) => 1 - (2 * value) / height;
    this.segments[this.slot].set(
      normalizeX(previous.x),
      normalizeY(previous.y),
      normalizeX(x),
      normalizeY(y)
    );
    const gain = Math.min(1.6, 58 / distance);
    this.impulses[this.slot].set(
      (dx * gain * 2) / height,
      (-dy * gain * 2) / height,
      time,
      1
    );
    this.slot = (this.slot + 1) % WAKE_SAMPLES;
  }

  release() {
    this.previous = null;
  }

  clear() {
    this.release();
    this.impulses.forEach(impulse => impulse.set(0, 0, -10, 0));
    this.slot = 0;
  }

  activeCount(time: number) {
    return this.impulses.filter(
      impulse =>
        impulse.w > 0 && time >= impulse.z && time - impulse.z < WAKE_LIFETIME
    ).length;
  }
}
