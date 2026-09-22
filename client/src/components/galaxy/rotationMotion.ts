import { Euler, Quaternion, Vector3 } from "three";

export type RotationPhase = "idle" | "dragging" | "inertia" | "returning";

export class RotationMotion {
  /** Front-facing curled petals keep the negative spaces and recessed script readable. */
  static readonly homeEuler = new Euler(0.52, -0.16, -0.3, "XYZ");

  /** Produces the default home orientation quaternion from homeEuler. */
  static defaultHomeQuaternion(): Quaternion {
    return new Quaternion().setFromEuler(RotationMotion.homeEuler);
  }

  readonly orientation: Quaternion;
  readonly axis = new Vector3(0, 1, 0);
  phase: RotationPhase = "idle";
  speed = 0;
  private age = 0;
  private increment = new Quaternion();

  constructor(readonly home: Quaternion) {
    this.orientation = home.clone();
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
    this.speed = 0;
    this.age = 0;
  }

  move(delta: Quaternion, dt: number) {
    if (this.phase !== "dragging") return;
    this.orientation.premultiply(delta).normalize();
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
    this.speed = 0;
    this.age = 0;
    this.phase = "idle";
  }

  advance(dt: number) {
    if (this.phase === "idle" || this.phase === "dragging") return;
    this.age += dt;
    if (this.phase === "inertia") {
      // Exact exponential integration gives the same coast at 30/60/120 Hz.
      // A long, low-damped glide keeps the gesture alive after release.
      this.increment.setFromAxisAngle(
        this.axis,
        (this.speed * (1 - Math.exp(-dt * 3))) / 3
      );
      this.orientation.premultiply(this.increment).normalize();
      this.speed *= Math.exp(-dt * 3);
      // Gentle home attraction runs through the coast so the settle reads as
      // one continuous motion instead of a coast that suddenly snaps back.
      this.orientation.slerp(this.home, 1 - Math.exp(-dt * 0.8));
      if (this.speed < 0.05) this.phase = "returning";
    } else {
      // The unhurried ease home: ~0.5s time constant, so a small pull lingers
      // for a couple of seconds before the rose is whole again.
      this.orientation.slerp(this.home, 1 - Math.exp(-dt * 2.0));
      this.speed = 0;
      if (this.orientation.angleTo(this.home) < 0.002) this.reset();
    }
  }
}
