import { Vector4 } from "three";

export const WAKE_SAMPLES = 16;
export const WAKE_LIFETIME = 3.2;

/** A short, bounded screen-space flow left by the pointer, independent of rotation. */
export class PointerWake {
  readonly segments = Array.from({ length: WAKE_SAMPLES }, () => new Vector4());
  readonly impulses = Array.from(
    { length: WAKE_SAMPLES },
    () => new Vector4(0, 0, -10, 0)
  );
  // Pre-allocated previous pointer state to guarantee zero heap allocations in push()
  private prevX = 0;
  private prevY = 0;
  private prevTime = 0;
  private hasPrevious = false;
  private slot = 0;

  push(x: number, y: number, time: number, width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    if (
      !this.hasPrevious ||
      time - this.prevTime > 1.2 ||
      time < this.prevTime
    ) {
      this.prevX = x;
      this.prevY = y;
      this.prevTime = time;
      this.hasPrevious = true;
      return;
    }
    if (time - this.prevTime < 0.05) return;
    const dx = x - this.prevX;
    const dy = y - this.prevY;
    const px = this.prevX;
    const py = this.prevY;

    this.prevX = x;
    this.prevY = y;
    this.prevTime = time;

    const distance = Math.hypot(dx, dy);
    if (distance < 1) return;

    // Coordinates use viewport height for BOTH axes, keeping a circular brush.
    // Zero closures or object instantiations: direct arithmetic.
    const invH = 1 / height;
    const x0 = (2 * px - width) * invH;
    const y0 = 1 - 2 * py * invH;
    const x1 = (2 * x - width) * invH;
    const y1 = 1 - 2 * y * invH;

    this.segments[this.slot].set(x0, y0, x1, y1);

    const gain = Math.min(1.6, 42 / distance);
    const impulseScale = gain * 2 * invH;
    this.impulses[this.slot].set(
      dx * impulseScale,
      -dy * impulseScale,
      time,
      1
    );
    this.slot = (this.slot + 1) % WAKE_SAMPLES;
  }

  release() {
    this.hasPrevious = false;
  }

  clear() {
    this.release();
    for (let i = 0; i < WAKE_SAMPLES; i++) {
      this.impulses[i].set(0, 0, -10, 0);
    }
    this.slot = 0;
  }

  activeCount(time: number): number {
    let count = 0;
    for (let i = 0; i < WAKE_SAMPLES; i++) {
      const impulse = this.impulses[i];
      if (
        impulse.w > 0 &&
        time >= impulse.z &&
        time - impulse.z < WAKE_LIFETIME
      ) {
        count++;
      }
    }
    return count;
  }
}
