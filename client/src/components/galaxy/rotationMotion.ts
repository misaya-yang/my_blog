import { Euler, Quaternion, Vector2 } from "three";
import { PETAL_TRACKS } from "./roseTracks";

export type RotationPhase = "idle" | "dragging" | "gliding" | "returning";

/** The rose follows the hand quickly, and eases home more slowly. */
const FOLLOW_RATE = 14;
const RETURN_RATE = 5.5;
/** How much slower the outer petal layers follow than the heart. */
const LAYER_LAG = 0.68;
/** The hand's velocity is averaged over ~50ms of frames. */
const VELOCITY_WINDOW = 0.05;
/**
 * A flick glides on and slows with a ~0.45s time constant, up to about four
 * radians further; a hand that stopped before letting go gives no glide.
 */
const GLIDE_DECAY = 2.2;
const GLIDE_MAX_SPEED = 9;
const GLIDE_MIN_SPEED = 0.3;
const GLIDE_END_SPEED = 0.12;
/** Once the glide has slowed, the rose rests briefly before turning home. */
const GLIDE_REST = 0.35;
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
 * something soft rather than a rigid plate. Let go mid-flick, it glides on
 * and slows; then it turns back to face the reader, every layer on its own
 * delay.
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
  /**
   * Petal layers, outermost first; the outer ones follow later. Astra's
   * per-orbit lag, 0.18 + 0.17·i: the heart-most layer barely trails and the
   * outermost trails by 0.69, so the rose stays one body while it turns.
   */
  readonly layers: Layer[] = Array.from({ length: PETAL_TRACKS }, (_, row) => ({
    spin: new Vector2(),
    lag: 0.18 + 0.17 * (PETAL_TRACKS - 1 - row),
  }));
  phase: RotationPhase = "idle";
  /** Angular speed of the heart, rad/s. */
  speed = 0;
  /** The hand's turn rate while dragging, then the glide's, rad/s. */
  readonly velocity = new Vector2();
  private readonly lastTarget = new Vector2();
  private returnDelay = 0;

  constructor(readonly home: Quaternion) {
    this.orientation = home.clone();
  }

  /** Takes hold of the rose where it is, target and all. */
  begin() {
    this.phase = "dragging";
    this.returnDelay = 0;
    this.velocity.set(0, 0);
    this.lastTarget.copy(this.target);
  }

  /** Turns the target by a screen-space drag, in pixels (y down). */
  drag(deltaX: number, deltaY: number, radiansPerPixel = 0.005) {
    this.turn(deltaY * radiansPerPixel, deltaX * radiansPerPixel);
  }

  /** Turns the target by x (tip) and y (sideways) radians. */
  turn(x: number, y: number) {
    if (this.phase !== "dragging") return;
    this.target.set(clampTurn(this.target.x + x), clampTurn(this.target.y + y));
  }

  /**
   * Lets go. With `glide`, a hand still moving sends the rose gliding on
   * first; otherwise, after `delay` seconds, it turns back to face the reader.
   */
  release(delay = 0, glide = false) {
    if (this.phase !== "dragging") return;
    if (glide && this.velocity.length() > GLIDE_MIN_SPEED) {
      this.velocity.clampLength(0, GLIDE_MAX_SPEED);
      this.phase = "gliding";
      return;
    }
    this.velocity.set(0, 0);
    this.startReturn(delay);
  }

  private startReturn(delay: number) {
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
    this.velocity.set(0, 0);
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
    if (this.phase === "dragging") {
      // Averaged over a short window, so one late pointer event can't decide
      // the glide, and a hand at rest lets its velocity fade.
      const instantX = (this.target.x - this.lastTarget.x) / dt;
      const instantY = (this.target.y - this.lastTarget.y) / dt;
      const blend = 1 - Math.exp(-dt / VELOCITY_WINDOW);
      this.velocity.x += (instantX - this.velocity.x) * blend;
      this.velocity.y += (instantY - this.velocity.y) * blend;
      this.lastTarget.copy(this.target);
    } else if (this.phase === "gliding") {
      // Exact exponential integration: the same glide at 30, 60 or 120 Hz.
      const decay = Math.exp(-dt * GLIDE_DECAY);
      const travel = (1 - decay) / GLIDE_DECAY;
      this.target.set(
        clampTurn(this.target.x + this.velocity.x * travel),
        clampTurn(this.target.y + this.velocity.y * travel)
      );
      this.velocity.multiplyScalar(decay);
      if (this.velocity.length() < GLIDE_END_SPEED) {
        this.velocity.set(0, 0);
        this.startReturn(GLIDE_REST);
      }
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
