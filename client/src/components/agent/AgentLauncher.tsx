import React, { type RefObject } from "react";
import { BookOpen, X } from "lucide-react";

export function AgentLauncher({
  buttonRef,
  open,
  lowQuota,
  label,
  tooltip,
  controls,
  onClick,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  lowQuota: boolean;
  label: string;
  tooltip: string;
  controls: string;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      title={tooltip}
      onClick={onClick}
      className="agent-liquid-launcher fixed bottom-5 right-5 z-[60] inline-flex h-11 items-center gap-2.5 rounded-[0.82rem] border border-transparent px-3 text-sm font-semibold transition sm:bottom-6 sm:right-6 sm:px-4"
    >
      <span className="agent-launcher-orb grid h-8 w-8 place-items-center rounded-[0.62rem]">
        {open ? <X className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
      </span>
      <span className="hidden sm:inline">{label}</span>
      {lowQuota && (
        <span
          className="h-2 w-2 rounded-full bg-slate-400"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
