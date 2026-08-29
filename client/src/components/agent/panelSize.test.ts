import { describe, expect, it } from "vitest";
import {
  DEFAULT_AGENT_PANEL_SIZE,
  clampAgentPanelSize,
  getAgentPanelKeyboardDelta,
  getAgentPanelSizeBounds,
  parseStoredAgentPanelSize,
  resizeAgentPanelFromTopLeft,
} from "./panelSize";

describe("Agent panel sizing", () => {
  const bounds = getAgentPanelSizeBounds(768, 800, 72);

  it("clamps user sizes to the minimum and available viewport", () => {
    expect(bounds).toEqual({
      minWidth: 340,
      maxWidth: 744,
      minHeight: 420,
      maxHeight: 704,
    });
    expect(clampAgentPanelSize({ width: 120, height: 160 }, bounds)).toEqual({
      width: 340,
      height: 420,
    });
    expect(clampAgentPanelSize({ width: 900, height: 900 }, bounds)).toEqual({
      width: 744,
      height: 704,
    });
    expect(getAgentPanelSizeBounds(768, 900, 72).maxHeight).toBe(804);
  });

  it("loads valid stored sizes and safely falls back from invalid values", () => {
    expect(
      parseStoredAgentPanelSize('{"width":460,"height":560}', bounds)
    ).toEqual({ width: 460, height: 560 });
    expect(
      parseStoredAgentPanelSize('{"width":900,"height":100}', bounds)
    ).toEqual({ width: 744, height: 420 });
    expect(parseStoredAgentPanelSize("not-json", bounds)).toEqual(
      DEFAULT_AGENT_PANEL_SIZE
    );
    expect(
      parseStoredAgentPanelSize('{"width":"wide","height":500}', bounds)
    ).toEqual(DEFAULT_AGENT_PANEL_SIZE);
  });

  it("maps arrow keys to the same top-left resize directions as dragging", () => {
    expect(getAgentPanelKeyboardDelta("ArrowLeft")).toEqual({
      width: 16,
      height: 0,
    });
    expect(getAgentPanelKeyboardDelta("ArrowRight", 32)).toEqual({
      width: -32,
      height: 0,
    });
    expect(getAgentPanelKeyboardDelta("ArrowUp")).toEqual({
      width: 0,
      height: 16,
    });
    expect(getAgentPanelKeyboardDelta("ArrowDown")).toEqual({
      width: 0,
      height: -16,
    });
    expect(getAgentPanelKeyboardDelta("Enter")).toBeNull();
  });

  it("grows when the top-left handle moves left or up", () => {
    expect(
      resizeAgentPanelFromTopLeft({ width: 392, height: 640 }, -24, -32, bounds)
    ).toEqual({ width: 416, height: 672 });
  });
});
