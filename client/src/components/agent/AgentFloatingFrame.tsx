import React, {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Grip } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

import {
  AGENT_FRAME_PRESETS,
  AGENT_FRAME_STORAGE_KEY,
  clampAgentFrameState,
  getDefaultAgentFrameState,
  readStoredAgentFrameState,
  type AgentFramePreset,
  type AgentFrameState,
} from "./agentFrameState";

export type AgentFrameControls = {
  isFloating: boolean;
  dragHandleProps?: {
    title: string;
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  };
  activePreset?: AgentFramePreset;
  resizeHandle?: ReactNode;
  onApplyPreset: (preset: AgentFramePreset) => void;
  onReset: () => void;
};

export function AgentFloatingFrame({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: (controls: AgentFrameControls) => ReactNode;
}) {
  const { t } = useLanguage();
  const [frame, setFrame] = useState<AgentFrameState>(() =>
    getDefaultAgentFrameState()
  );
  const [frameReady, setFrameReady] = useState(false);
  const interactionCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isMobile) {
      setFrameReady(false);
      return;
    }

    setFrame(readStoredAgentFrameState());
    setFrameReady(true);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !frameReady) return;
    try {
      window.localStorage.setItem(
        AGENT_FRAME_STORAGE_KEY,
        JSON.stringify(frame)
      );
    } catch {
      // Frame persistence is optional; interaction must continue when storage
      // is unavailable or full.
    }
  }, [frame, frameReady, isMobile]);

  useEffect(
    () => () => {
      interactionCleanupRef.current?.();
    },
    []
  );

  useEffect(() => {
    if (isMobile) return;
    function handleResize() {
      setFrame(current => clampAgentFrameState(current));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="agent-modal-frame">
        {children({
          isFloating: false,
          onApplyPreset: () => {},
          onReset: () => {},
        })}
      </div>
    );
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    event.preventDefault();
    interactionCleanupRef.current?.();
    const startFrame = frame;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture?.(pointerId);

    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      setFrame(current =>
        clampAgentFrameState({
          ...current,
          x: startFrame.x + moveEvent.clientX - startX,
          y: startFrame.y + moveEvent.clientY - startY,
        })
      );
    }

    function cleanup() {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      if (interactionCleanupRef.current === cleanup) {
        interactionCleanupRef.current = null;
      }
    }

    interactionCleanupRef.current = cleanup;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", cleanup, { once: true });
    window.addEventListener("pointercancel", cleanup, { once: true });
  }

  function startResize(event: ReactPointerEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    interactionCleanupRef.current?.();
    const startFrame = frame;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture?.(pointerId);

    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      setFrame(current =>
        clampAgentFrameState({
          ...current,
          width: startFrame.width + moveEvent.clientX - startX,
          height: startFrame.height + moveEvent.clientY - startY,
          preset: undefined,
        })
      );
    }

    function cleanup() {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      if (interactionCleanupRef.current === cleanup) {
        interactionCleanupRef.current = null;
      }
    }

    interactionCleanupRef.current = cleanup;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", cleanup, { once: true });
    window.addEventListener("pointercancel", cleanup, { once: true });
  }

  function resizeWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 32 : 16;
    const delta = {
      ArrowLeft: { width: -step, height: 0 },
      ArrowRight: { width: step, height: 0 },
      ArrowUp: { width: 0, height: -step },
      ArrowDown: { width: 0, height: step },
    }[event.key];
    if (!delta) return;

    event.preventDefault();
    setFrame(current =>
      clampAgentFrameState({
        ...current,
        width: current.width + delta.width,
        height: current.height + delta.height,
        preset: undefined,
      })
    );
  }

  function applyPreset(preset: AgentFramePreset) {
    const size = AGENT_FRAME_PRESETS[preset];
    setFrame(current =>
      clampAgentFrameState({
        ...current,
        ...size,
        preset,
      })
    );
  }

  function resetFrame() {
    setFrame(getDefaultAgentFrameState());
  }

  return (
    <div
      className="agent-floating-frame fixed z-[59]"
      style={{
        width: frame.width,
        height: frame.height,
        transform: `translate3d(${frame.x}px, ${frame.y}px, 0)`,
      }}
    >
      {children({
        isFloating: true,
        dragHandleProps: {
          title: t("agent.frame.drag"),
          onPointerDown: startDrag,
        },
        activePreset: frame.preset,
        onApplyPreset: applyPreset,
        onReset: resetFrame,
        resizeHandle: (
          <button
            type="button"
            aria-label={t("agent.frame.resize")}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            title={t("agent.frame.resize")}
            onPointerDown={startResize}
            onKeyDown={resizeWithKeyboard}
            className="agent-frame-resize-handle"
          >
            <Grip className="h-3.5 w-3.5" />
          </button>
        ),
      })}
    </div>
  );
}
