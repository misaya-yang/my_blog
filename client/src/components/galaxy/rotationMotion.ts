import { Euler, Quaternion, Vector3 } from "three";

export type RotationPhase = "idle" | "dragging" | "inertia" | "returning";

/** Tilt away from home that follows the hand one to one. */
const FREE_TILT = 0.28;
/** Asymptotic limit: the rose never turns far enough to read as a flat ring. */
const MAX_TILT = 0.56;
const tmp = new Quaternion();

/** Rubber band: linear up to FREE_TILT, then eases toward MAX_TILT. */
export function limitTilt(angle: number) {
  if (angle <= FREE_TILT) return angle;
  const span = MAX_TILT - FREE_TILT;
  return FREE_TILT + span * Math.tanh((angle - FREE_TILT) / span);
}

/** Inverse of limitTilt, so a limited pose can be picked up again in place. */
export function unlimitTilt(angle: number) {
  if (angle <= FREE_TILT) return angle;
  const span = MAX_TILT - FREE_TILT;
  const t = Math.min(0.999, (angle - FREE_TILT) / span);
  return FREE_TILT + span * Math.atanh(t);
}

export class RotationMotion {
  /** Front-facing curled petals keep the negative spaces and recessed script readable. */
  static readonly homeEuler = new Euler(0.34, -0.12, -0.16, "XYZ");

  /** Produces the default home orientation quaternion from homeEuler. */
  static defaultHomeQuaternion(): Quaternion {
    return new Quaternion().setFromEuler(RotationMotion.homeEuler);
  }

  readonly orientation: Quaternion;
  /** Unlimited pose under the hand; orientation is its rubber-banded image. */
  private readonly raw: Quaternion;
  readonly axis = new Vector3(0, 1, 0);
  phase: RotationPhase = "idle";
  speed = 0;
  private age = 0;
  private increment = new Quaternion();

  constructor(readonly home: Quaternion) {
    this.orientation = home.clone();
    this.raw = home.clone();
  }

  /** Raw pose whose limited image is the current orientation. */
  private unlimit() {
    const angle = this.home.angleTo(this.orientation);
    if (angle < 1e-6) this.raw.copy(this.orientation);
    else
      this.raw
        .copy(this.home)
        .slerp(this.orientation, unlimitTilt(angle) / angle);
  }

  private limit(source: Quaternion) {
    const angle = this.home.angleTo(source);
    if (angle < 1e-6) {
      this.orientation.copy(source);
      return;
    }
    tmp.copy(this.home).slerp(source, limitTilt(angle) / angle);
    this.orientation.copy(tmp);
  }

  /**
   * Applies an incremental drag displacement in screen/surface space.
   * Converts deltaX and deltaY into an incremental rotation quaternion.
   */
  applyDrag(deltaX: number, deltaY: number, sensitivity = 0.005) {
    if (this.phase !== "dragging") return;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < 0.0001) return;
    const angle = distance * sensitivity;
    const axis = new Vector3(-deltaY, deltaX, 0).normalize();
    const deltaQ = new Quaternion().setFromAxisAngle(axis, angle);
    this.move(deltaQ, 0.016);
  }

  /** Advances simulation by dt and returns the updated orientation. */
  step(dt: number): Quaternion {
    this.advance(dt);
    return this.orientation;
  }

  begin() {
    this.phase = "dragging";
    this.unlimit();
    this.speed = 0;
    this.age = 0;
  }

  move(delta: Quaternion, dt: number) {
    if (this.phase !== "dragging") return;
    this.raw.premultiply(delta).normalize();
    this.limit(this.raw);
    const angle = 2 * Math.acos(Math.min(1, Math.abs(delta.w)));
    if (angle > 0.00001) {
      this.axis.set(delta.x, delta.y, delta.z).normalize();
      this.speed = Math.min(2.4, angle / Math.max(dt, 0.008));
    } else this.speed = 0;
  }

  release(cancelled = false) {
    if (this.phase !== "dragging") return;
    if (cancelled) this.speed = 0;
    this.phase = this.speed > 0.01 ? "inertia" : "returning";
    this.age = 0;
  }

  reset() {
    this.orientation.copy(this.home);
    this.raw.copy(this.home);
    this.speed = 0;
    this.age = 0;
    this.phase = "idle";
  }

  advance(dt: number) {
    if (this.phase === "idle" || this.phase === "dragging") return;
    this.age += dt;
    if (this.phase === "inertia") {
      // Exact exponential integration gives the same coast at 30/60/120 Hz.
      // A short glide carries the flick, still inside the tilt limit.
      this.increment.setFromAxisAngle(
        this.axis,
        (this.speed * (1 - Math.exp(-dt * 6))) / 6
      );
      this.unlimit();
      this.raw.premultiply(this.increment).normalize();
      this.limit(this.raw);
      this.speed *= Math.exp(-dt * 6);
      // Home attraction runs through the coast so the settle reads as one
      // continuous motion instead of a coast that suddenly snaps back.
      this.orientation.slerp(this.home, 1 - Math.exp(-dt * 1.6));
      if (this.speed < 0.05) this.phase = "returning";
    } else {
      // Ease home with a ~0.3s time constant: calm, but whole again in ~2s.
      this.orientation.slerp(this.home, 1 - Math.exp(-dt * 3.2));
      this.speed = 0;
      if (this.orientation.angleTo(this.home) < 0.002) this.reset();
    }
  }
}
