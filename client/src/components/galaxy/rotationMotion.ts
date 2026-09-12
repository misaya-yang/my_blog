import { Quaternion, Vector3 } from "three";

export type RotationPhase = "idle" | "dragging" | "inertia" | "returning";

export class RotationMotion {
  readonly orientation: Quaternion;
  readonly axis = new Vector3(0, 1, 0);
  phase: RotationPhase = "idle";
  speed = 0;
  private age = 0;
  private increment = new Quaternion();

  constructor(readonly home: Quaternion) {
    this.orientation = home.clone();
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
      this.increment.setFromAxisAngle(
        this.axis,
        (this.speed * (1 - Math.exp(-dt * 15))) / 15
      );
      this.orientation.premultiply(this.increment).normalize();
      this.speed *= Math.exp(-dt * 15);
      // Begin home attraction immediately; there is no frozen hand-off frame.
      this.orientation.slerp(this.home, 1 - Math.exp(-dt * 1.2));
      if (this.age >= 0.2) this.phase = "returning";
    } else {
      this.orientation.slerp(this.home, 1 - Math.exp(-dt * 4.5));
      this.speed = 0;
      if (this.orientation.angleTo(this.home) < 0.002) this.reset();
    }
  }
}
