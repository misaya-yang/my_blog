import React, {
  useEffect,
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
    window.localStorage.setItem(AGENT_FRAME_STORAGE_KEY, JSON.stringify(frame));
  }, [frame, frameReady, isMobile]);

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
      <div className="fixed inset-x-3 bottom-20 z-[59] h-[min(720px,calc(100dvh-6rem))]">
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
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", cleanup, { once: true });
    window.addEventListener("pointercancel", cleanup, { once: true });
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
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
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", cleanup, { once: true });
    window.addEventListener("pointercancel", cleanup, { once: true });
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
            title={t("agent.frame.resize")}
            onPointerDown={startResize}
            className="agent-frame-resize-handle"
          >
            <Grip className="h-3.5 w-3.5" />
          </button>
        ),
      })}
    </div>
  );
}
