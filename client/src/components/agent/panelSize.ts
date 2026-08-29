export interface AgentPanelSize {
  width: number;
  height: number;
}

export interface AgentPanelSizeBounds {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export const DEFAULT_AGENT_PANEL_SIZE: AgentPanelSize = {
  width: 392,
  height: 640,
};

export const MIN_AGENT_PANEL_SIZE: AgentPanelSize = {
  width: 340,
  height: 420,
};

export const AGENT_PANEL_STORAGE_KEY = "misaya-agent-panel-size-v1";

const PANEL_VIEWPORT_GAP = 24;
const DEFAULT_HEADER_HEIGHT = 72;

export function getAgentPanelSizeBounds(
  viewportWidth: number,
  viewportHeight: number,
  headerHeight = DEFAULT_HEADER_HEIGHT
): AgentPanelSizeBounds {
  const safeViewportWidth = positiveFiniteOr(
    viewportWidth,
    DEFAULT_AGENT_PANEL_SIZE.width + PANEL_VIEWPORT_GAP
  );
  const safeViewportHeight = positiveFiniteOr(
    viewportHeight,
    DEFAULT_AGENT_PANEL_SIZE.height + DEFAULT_HEADER_HEIGHT + PANEL_VIEWPORT_GAP
  );
  const safeHeaderHeight = nonNegativeFiniteOr(
    headerHeight,
    DEFAULT_HEADER_HEIGHT
  );
  const maxWidth = Math.max(1, safeViewportWidth - PANEL_VIEWPORT_GAP);
  const maxHeight = Math.max(
    1,
    safeViewportHeight - safeHeaderHeight - PANEL_VIEWPORT_GAP
  );

  return {
    minWidth: Math.min(MIN_AGENT_PANEL_SIZE.width, maxWidth),
    maxWidth,
    minHeight: Math.min(MIN_AGENT_PANEL_SIZE.height, maxHeight),
    maxHeight,
  };
}

export function clampAgentPanelSize(
  size: Partial<AgentPanelSize> | null | undefined,
  bounds: AgentPanelSizeBounds
): AgentPanelSize {
  return {
    width: clamp(
      finiteOr(size?.width, DEFAULT_AGENT_PANEL_SIZE.width),
      bounds.minWidth,
      bounds.maxWidth
    ),
    height: clamp(
      finiteOr(size?.height, DEFAULT_AGENT_PANEL_SIZE.height),
      bounds.minHeight,
      bounds.maxHeight
    ),
  };
}

export function parseStoredAgentPanelSize(
  storedValue: string | null,
  bounds: AgentPanelSizeBounds
): AgentPanelSize {
  if (!storedValue) return clampAgentPanelSize(null, bounds);

  try {
    const parsed = JSON.parse(storedValue);
    if (!isPanelSizeRecord(parsed)) {
      return clampAgentPanelSize(null, bounds);
    }
    return clampAgentPanelSize(parsed, bounds);
  } catch {
    return clampAgentPanelSize(null, bounds);
  }
}

export function getAgentPanelKeyboardDelta(
  key: string,
  step = 16
): AgentPanelSize | null {
  const safeStep = positiveFiniteOr(step, 16);

  if (key === "ArrowLeft") return { width: safeStep, height: 0 };
  if (key === "ArrowRight") return { width: -safeStep, height: 0 };
  if (key === "ArrowUp") return { width: 0, height: safeStep };
  if (key === "ArrowDown") return { width: 0, height: -safeStep };
  return null;
}

export function resizeAgentPanelFromTopLeft(
  startSize: AgentPanelSize,
  movementX: number,
  movementY: number,
  bounds: AgentPanelSizeBounds
): AgentPanelSize {
  return clampAgentPanelSize(
    {
      width: startSize.width - finiteOr(movementX, 0),
      height: startSize.height - finiteOr(movementY, 0),
    },
    bounds
  );
}

export function agentPanelSizesEqual(
  left: AgentPanelSize,
  right: AgentPanelSize
) {
  return left.width === right.width && left.height === right.height;
}

function isPanelSizeRecord(value: unknown): value is AgentPanelSize {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AgentPanelSize>;
  return (
    typeof candidate.width === "number" &&
    Number.isFinite(candidate.width) &&
    typeof candidate.height === "number" &&
    Number.isFinite(candidate.height)
  );
}

function finiteOr(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function positiveFiniteOr(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeFiniteOr(value: number, fallback: number) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
