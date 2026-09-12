import { describe, expect, it } from "vitest";
import { bakeAmbientTracks, getAmbientProfile } from "./ambientScene";
import { TRACK_SAMPLES } from "./roseTracks";

describe("per-article ambient constellation", () => {
  it("is deterministic per article and ignores query strings", () => {
    expect(getAmbientProfile("/post/flow")).toEqual(
      getAmbientProfile("/post/flow")
    );
    expect(getAmbientProfile("/post/flow?x=1#ref")).toEqual(
      getAmbientProfile("/post/flow")
    );
  });

  it("distinguishes articles and covers every section page", () => {
    const a = getAmbientProfile("/post/flow");
    const b = getAmbientProfile("/post/agent");
    const c = getAmbientProfile("/archive");
    expect(a.family).not.toBe(b.family);
    expect(c.family).toBeDefined();
    expect(a.rows).toHaveLength(6);
  });

  it("bakes six rows in the rose track texture layout", () => {
    const data = bakeAmbientTracks(getAmbientProfile("/post/flow"));
    expect(data.length).toBe((TRACK_SAMPLES + 1) * 6 * 4);
    // outer rows closed, inner strokes open — mirrors the rose row semantics
    expect(data[(0 * (TRACK_SAMPLES + 1)) * 4 + 3]).toBe(1);
    expect(data[(5 * (TRACK_SAMPLES + 1) + TRACK_SAMPLES) * 4 + 3]).toBe(0);
    // no NaN geometry — a NaN vertex would vanish the whole figure
    for (const value of data) expect(Number.isFinite(value)).toBe(true);
  });
});
