import { describe, expect, it } from "vitest";

import {
  clampAgentFrameState,
  getDefaultAgentFrameState,
} from "./agentFrameState";

describe("agentFrameState", () => {
  it("fits the floating panel inside a short desktop viewport", () => {
    const viewport = { width: 1366, height: 420 };
    const frame = getDefaultAgentFrameState(viewport);

    expect(frame.height).toBe(388);
    expect(frame.y).toBe(16);
    expect(frame.y + frame.height).toBeLessThanOrEqual(viewport.height - 16);
  });

  it("clamps a stored tall frame to the currently available height", () => {
    const viewport = { width: 1366, height: 420 };
    const frame = clampAgentFrameState(
      { width: 400, height: 720, x: 942, y: 96, preset: "wide" },
      viewport
    );

    expect(frame.height).toBe(388);
    expect(frame.y).toBe(16);
    expect(frame.x + frame.width).toBeLessThanOrEqual(viewport.width - 16);
  });
});
