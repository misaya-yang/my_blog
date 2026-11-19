import { describe, expect, it } from "vitest";
import { SkyFlight, flightDuration, pageLevel } from "./flight";

/** Runs a flight at 60 fps; returns positions and speeds per frame. */
function fly(flight: SkyFlight, from: number, ms: number) {
  const frames: { x: number; y: number; speed: number }[] = [];
  for (let now = from; now <= from + ms; now += 1000 / 60) {
    flight.advance(now);
    frames.push({ x: flight.x, y: flight.y, speed: flight.speed });
  }
  return frames;
}

describe("SkyFlight", () => {
  it("leaves gently, arrives at rest, and never overshoots", () => {
    const flight = new SkyFlight();
    flight.jump(0, 0);
    flight.aim(800, -400, 0);
    const frames = fly(flight, 0, 2400);
    const distance = Math.hypot(800, 400);
    // The first frame barely moves: no jolt.
    expect(Math.hypot(frames[1].x, frames[1].y)).toBeLessThan(distance * 0.002);
    // Monotonic along the way, ending exactly on target.
    for (let i = 1; i < frames.length; i++)
      expect(frames[i].x).toBeGreaterThanOrEqual(frames[i - 1].x - 1e-9);
    expect(flight.active).toBe(false);
    expect(flight.x).toBe(800);
    expect(flight.y).toBe(-400);
    // Its top speed comes before halfway: a long, soft arrival.
    const peak = frames.reduce(
      (best, frame, i) => (frame.speed > frames[best].speed ? i : best),
      0
    );
    const duration = flightDuration(distance);
    expect((peak * 1000) / 60).toBeLessThan(duration / 2);
  });

  it("re-aims mid-flight without a kink in position or speed", () => {
    const flight = new SkyFlight();
    flight.jump(0, 0);
    flight.aim(1000, 0, 0);
    fly(flight, 0, 500);
    const before = { x: flight.x, vx: flight.vx };
    flight.aim(0, 600, 500 + 1000 / 60);
    flight.advance(500 + 1000 / 60 + 1);
    expect(Math.abs(flight.x - before.x)).toBeLessThan(before.vx * 0.02 + 1);
    expect(Math.abs(flight.vx - before.vx)).toBeLessThan(before.vx * 0.05);
  });

  it("folds a scroll jump into the frame without moving the view", () => {
    const flight = new SkyFlight();
    flight.jump(10, 10);
    flight.aim(400, 10, 0);
    flight.advance(300);
    const x = flight.x;
    flight.shift(0, 250);
    expect(flight.x).toBe(x);
    expect(flight.targetY).toBe(260);
    fly(flight, 300, 2500);
    expect(flight.y).toBe(260);
  });

  it("only nudges the end of a flight for a small change of target", () => {
    const flight = new SkyFlight();
    flight.jump(0, 0);
    flight.aim(600, 0, 0);
    flight.advance(400);
    const x = flight.x;
    flight.aim(610, 0, 400);
    flight.advance(400);
    expect(Math.abs(flight.x - x)).toBeLessThan(6);
    fly(flight, 400, 2500);
    expect(flight.x).toBe(610);
  });

  it("scales its duration with distance, within bounds", () => {
    expect(flightDuration(0)).toBe(1050);
    expect(flightDuration(600)).toBeGreaterThan(flightDuration(200));
    expect(flightDuration(1e6)).toBe(1900);
  });
});

describe("pageLevel", () => {
  it("orders home, indexes, notes", () => {
    expect(pageLevel("/")).toBe(0);
    expect(pageLevel("/archive")).toBe(1);
    expect(pageLevel("/post/x")).toBe(2);
  });
});
