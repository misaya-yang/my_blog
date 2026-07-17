export const AGENT_FRAME_STORAGE_KEY = "misaya:blog-agent-frame:v1";

const AGENT_FRAME_EDGE_GAP = 16;
const AGENT_FRAME_MAX_WIDTH = 400;
const AGENT_FRAME_DEFAULT_SIZE = { width: 400, height: 640 };
const AGENT_FRAME_MIN_SIZE = { width: 340, height: 420 };

export const AGENT_FRAME_PRESETS = {
  compact: { width: 360, height: 540 },
  comfortable: AGENT_FRAME_DEFAULT_SIZE,
  wide: { width: AGENT_FRAME_MAX_WIDTH, height: 720 },
} as const;

export type AgentFramePreset = keyof typeof AGENT_FRAME_PRESETS;

export type AgentFrameState = {
  width: number;
  height: number;
  x: number;
  y: number;
  preset?: AgentFramePreset;
};

type ViewportSize = {
  width: number;
  height: number;
};

function getViewportSize(): ViewportSize {
  if (typeof window === "undefined") {
    return { width: 1280, height: 800 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

export function getDefaultAgentFrameState(
  viewport: ViewportSize = getViewportSize()
): AgentFrameState {
  const width = Math.min(
    AGENT_FRAME_DEFAULT_SIZE.width,
    Math.max(
      AGENT_FRAME_MIN_SIZE.width,
      viewport.width - AGENT_FRAME_EDGE_GAP * 2
    )
  );
  const height = Math.min(
    AGENT_FRAME_DEFAULT_SIZE.height,
    Math.max(
      AGENT_FRAME_MIN_SIZE.height,
      viewport.height - AGENT_FRAME_EDGE_GAP * 2
    )
  );

  return clampAgentFrameState(
    {
      width,
      height,
      x: viewport.width - width - 24,
      y: Math.min(
        96,
        Math.max(AGENT_FRAME_EDGE_GAP, viewport.height - height - 16)
      ),
      preset: "comfortable",
    },
    viewport
  );
}

export function clampAgentFrameState(
  input: AgentFrameState,
  viewport: ViewportSize = getViewportSize()
): AgentFrameState {
  const availableWidth = Math.max(1, viewport.width - AGENT_FRAME_EDGE_GAP * 2);
  const availableHeight = Math.max(
    1,
    viewport.height - AGENT_FRAME_EDGE_GAP * 2
  );
  const minWidth = Math.min(AGENT_FRAME_MIN_SIZE.width, availableWidth);
  const minHeight = Math.min(AGENT_FRAME_MIN_SIZE.height, availableHeight);
  const maxWidth = Math.min(AGENT_FRAME_MAX_WIDTH, availableWidth);
  const maxHeight = availableHeight;
  const width = clamp(input.width, minWidth, maxWidth);
  const height = clamp(input.height, minHeight, maxHeight);
  const maxX = Math.max(
    AGENT_FRAME_EDGE_GAP,
    viewport.width - width - AGENT_FRAME_EDGE_GAP
  );
  const maxY = Math.max(
    AGENT_FRAME_EDGE_GAP,
    viewport.height - height - AGENT_FRAME_EDGE_GAP
  );

  return {
    width,
    height,
    x: clamp(input.x, AGENT_FRAME_EDGE_GAP, maxX),
    y: clamp(input.y, AGENT_FRAME_EDGE_GAP, maxY),
    preset: input.preset,
  };
}

export function readStoredAgentFrameState() {
  try {
    const rawValue = window.localStorage.getItem(AGENT_FRAME_STORAGE_KEY);
    if (!rawValue) return getDefaultAgentFrameState();
    const parsed = JSON.parse(rawValue) as Partial<AgentFrameState>;
    if (
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number" ||
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number"
    ) {
      return getDefaultAgentFrameState();
    }
    return clampAgentFrameState({
      width: parsed.width,
      height: parsed.height,
      x: parsed.x,
      y: parsed.y,
      preset: isAgentFramePreset(parsed.preset) ? parsed.preset : undefined,
    });
  } catch {
    return getDefaultAgentFrameState();
  }
}

export function isAgentFramePreset(value: unknown): value is AgentFramePreset {
  return value === "compact" || value === "comfortable" || value === "wide";
}

export function getAgentFramePresetShortcut(preset: AgentFramePreset) {
  if (preset === "compact") return "S";
  if (preset === "comfortable") return "M";
  return "L";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
