import { Euler, Quaternion, Vector2 } from "three";
import { PETAL_TRACKS } from "./roseTracks";

export type RotationPhase = "idle" | "dragging" | "returning";

/** The rose follows the hand quickly, and eases home more slowly. */
const FOLLOW_RATE = 14;
const RETURN_RATE = 5.5;
/** How much slower the outer petal layers follow than the heart. */
const LAYER_LAG = 0.68;
/** Turns stay bounded, however long the hand keeps going. */
const LIMIT = 4 * Math.PI;
const SETTLED = 1e-3;

const clampTurn = (value: number) =>
  Number.isFinite(value) ? Math.min(LIMIT, Math.max(-LIMIT, value)) : 0;
const euler = new Euler(0, 0, 0, "XYZ");
const inverse = new Quaternion();

type Layer = { spin: Vector2; lag: number };

/**
 * Drag turns the rose freely in 3D, right over if the hand keeps going:
 * horizontal travel turns it about the vertical axis, vertical travel tips
 * it over. The hand sets a target turn; the heart follows it closely and each
 * petal layer follows a little later the further out it lies, so the layers
 * fan apart while the rose turns and gather again when it stops, like
 * something soft rather than a rigid plate. Let go, the rose turns back to
 * face the reader, every layer on its own delay.
 */
export class RotationMotion {
  /** Front-facing curled petals keep the negative spaces and recessed script readable. */
  static readonly homeEuler = new Euler(0.34, -0.12, 0, "XYZ");

  /** Produces the default home orientation quaternion from homeEuler. */
  static defaultHomeQuaternion(): Quaternion {
    return new Quaternion().setFromEuler(RotationMotion.homeEuler);
  }

  /** The heart's pose: the whole rose turns with it. */
  readonly orientation: Quaternion;
  /** Where the hand has turned the rose: x tips it, y turns it sideways. */
  readonly target = new Vector2();
  /** The heart's current turn, easing toward the target. */
  readonly spin = new Vector2();
  /** Petal layers, outermost first; the outer ones follow later. */
  readonly layers: Layer[] = Array.from({ length: PETAL_TRACKS }, (_, row) => ({
    spin: new Vector2(),
    lag: 0.18 + 0.17 * (PETAL_TRACKS - row),
  }));
  phase: RotationPhase = "idle";
  /** Angular speed of the heart, rad/s. */
  speed = 0;
  private returnDelay = 0;

  constructor(readonly home: Quaternion) {
    this.orientation = home.clone();
  }

  /** Takes hold of the rose where it is, target and all. */
  begin() {
    this.phase = "dragging";
    this.returnDelay = 0;
  }

  /** Turns the target by a screen-space drag, in pixels (y down). */
  drag(deltaX: number, deltaY: number, radiansPerPixel = 0.005) {
    this.turn(deltaY * radiansPerPixel, deltaX * radiansPerPixel);
  }

  /** Turns the target by x (tip) and y (sideways) radians. */
  turn(x: number, y: number) {
    if (this.phase !== "dragging") return;
    this.target.set(
      clampTurn(this.target.x + x),
      clampTurn(this.target.y + y)
    );
  }

  /**
   * Lets go: after `delay` seconds the rose turns back to face the reader.
   * A cancelled gesture returns at once.
   */
  release(delay = 0) {
    if (this.phase !== "dragging") return;
    this.phase = "returning";
    this.unwind();
    this.returnDelay = Math.max(0, delay);
    if (this.returnDelay === 0) this.target.set(0, 0);
  }

  /**
   * A whole turn about either axis is the same pose, so drop whole turns
   * before heading home: the rose takes the short way back instead of
   * unwinding every turn the hand gave it.
   */
  private unwind() {
    const turnsX = Math.round(this.spin.x / (2 * Math.PI)) * 2 * Math.PI;
    const turnsY = Math.round(this.spin.y / (2 * Math.PI)) * 2 * Math.PI;
    if (turnsX === 0 && turnsY === 0) return;
    this.target.x -= turnsX;
    this.target.y -= turnsY;
    this.spin.x -= turnsX;
    this.spin.y -= turnsY;
    for (const layer of this.layers) {
      layer.spin.x -= turnsX;
      layer.spin.y -= turnsY;
    }
  }

  reset() {
    this.target.set(0, 0);
    this.spin.set(0, 0);
    for (const layer of this.layers) layer.spin.set(0, 0);
    this.orientation.copy(this.home);
    this.speed = 0;
    this.returnDelay = 0;
    this.phase = "idle";
  }

  /** Pose of one petal layer; any other row turns with the heart. */
  layerOrientation(row: number, out = new Quaternion()) {
    const layer = this.layers[row];
    return layer
      ? RotationMotion.pose(layer.spin, this.home, out)
      : out.copy(this.orientation);
  }

  /**
   * One petal layer's turn relative to the heart, in the rose's own frame:
   * applied to the layer's points before the heart's pose, it gives the
   * layer's own pose.
   */
  layerTwist(row: number, out = new Quaternion()) {
    this.layerOrientation(row, out);
    return out.premultiply(inverse.copy(this.orientation).invert());
  }

  private static pose(spin: Vector2, home: Quaternion, out: Quaternion) {
    euler.set(spin.x, spin.y, 0);
    return out.setFromEuler(euler).multiply(home);
  }

  advance(dt: number) {
    if (this.phase === "idle" || !(dt > 0)) {
      this.speed = 0;
      return;
    }
    if (this.phase === "returning" && this.returnDelay > 0) {
      this.returnDelay -= dt;
      if (this.returnDelay <= 0) this.target.set(0, 0);
    }
    const rate = this.phase === "returning" ? RETURN_RATE : FOLLOW_RATE;
    const beforeX = this.spin.x,
      beforeY = this.spin.y;
    this.spin.lerp(this.target, 1 - Math.exp(-rate * dt));
    this.speed = Math.hypot(this.spin.x - beforeX, this.spin.y - beforeY) / dt;
    let settled =
      this.returnDelay <= 0 && this.spin.distanceTo(this.target) < SETTLED;
    for (const layer of this.layers) {
      layer.spin.lerp(
        this.target,
        1 - Math.exp(-(rate / (1 + layer.lag * LAYER_LAG * 2.5)) * dt)
      );
      if (layer.spin.distanceTo(this.target) >= SETTLED) settled = false;
    }
    RotationMotion.pose(this.spin, this.home, this.orientation);
    if (this.phase === "returning" && settled) this.reset();
  }
}
