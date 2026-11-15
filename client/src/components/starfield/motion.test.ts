import { Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { RenderQuality } from "./quality";
import { TurnMotion } from "./turnMotion";

/** Feeds `frames` intervals of `ms`; returns the scales the run passed through. */
function feed(
  quality: RenderQuality,
  clock: { now: number },
  frames: number,
  ms: number
) {
  const seen = new Set<number>();
  for (let i = 0; i < frames; i++) {
    clock.now += ms;
    quality.observe(ms, clock.now);
    seen.add(quality.scale);
  }
  return seen;
}

describe("RenderQuality", () => {
  it("gives the pixels back when fewer of them buy no time", () => {
    // A display paced at 30 fps: slow intervals that resolution cannot fix.
    const quality = new RenderQuality();
    const clock = { now: 0 };
    const seen = feed(quality, clock, 600, 1000 / 30);
    expect(seen.has(0.85)).toBe(true);
    expect(quality.scale).toBe(1);
    // Having learned that, it never trades sharpness again.
    expect([...feed(quality, clock, 2000, 1000 / 30)]).toEqual([1]);
  });

  it("keeps a lower scale that helps, and recovers when there is headroom", () => {
    const quality = new RenderQuality();
    const clock = { now: 0 };
    while (quality.scale === 1 && clock.now < 20000)
      feed(quality, clock, 1, 34);
    expect(quality.scale).toBe(0.85);
    feed(quality, clock, 300, 20);
    expect(quality.scale).toBe(0.85);
    feed(quality, clock, 72 * 7, 16);
    expect(quality.scale).toBe(1);
  });

  it("ignores warm-up frames and stalls", () => {
    const quality = new RenderQuality();
    const clock = { now: 0 };
    expect([...feed(quality, clock, 40, 60)]).toEqual([1]);
    expect([...feed(quality, clock, 400, 400)]).toEqual([1]);
    expect(quality.pixelRatio(3)).toBe(2);
  });
});

describe("TurnMotion", () => {
  const front = () => new Vector3(0, 0, 1);
  const settle = (turn: TurnMotion, seconds: number) => {
    for (let i = 0; i < seconds * 60; i++) turn.advance(1 / 60);
  };

  it("turns the way the hand moves", () => {
    const turn = new TurnMotion();
    turn.begin();
    turn.drag(100, 0);
    settle(turn, 1);
    // Dragging right carries the near side to the right.
    expect(front().applyQuaternion(turn.spin).x).toBeGreaterThan(0.4);
    turn.reset();
    turn.begin();
    turn.drag(0, 100);
    settle(turn, 1);
    // Dragging down tips the near side down (screen y is up in the field).
    expect(front().applyQuaternion(turn.spin).y).toBeLessThan(-0.4);
  });

  it("keeps to the screen's axes whatever the pose", () => {
    const turn = new TurnMotion();
    turn.begin();
    turn.drag(Math.PI / 2 / 0.0055, 0);
    const quarter = turn.target.clone();
    turn.drag(0, 60);
    const step = turn.target.clone().multiply(quarter.invert());
    const angle = 2 * Math.acos(Math.min(1, Math.abs(step.w)));
    const axis = new Vector3(step.x, step.y, step.z).normalize();
    expect(angle).toBeCloseTo(60 * 0.0055, 5);
    expect(Math.abs(axis.x)).toBeCloseTo(1, 5);
  });

  it("glides on from a flick, then turns home", () => {
    const turn = new TurnMotion();
    turn.begin();
    for (let i = 0; i < 12; i++) {
      turn.drag(14, 0);
      turn.advance(1 / 60);
    }
    const atRelease = turn.target.clone();
    turn.release();
    expect(turn.phase).toBe("gliding");
    settle(turn, 1);
    expect(turn.target.angleTo(atRelease)).toBeGreaterThan(0.3);
    settle(turn, 20);
    expect(turn.phase).toBe("idle");
    expect(turn.spin.angleTo(new Quaternion())).toBeLessThan(1e-6);
  });

  it("does not glide when the hand stops before letting go", () => {
    const turn = new TurnMotion();
    turn.begin();
    for (let i = 0; i < 12; i++) {
      turn.drag(14, 0);
      turn.advance(1 / 60);
    }
    settle(turn, 0.5);
    turn.release();
    expect(turn.phase).toBe("returning");
  });
});
