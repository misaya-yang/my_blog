import React, { useEffect, useRef } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Paperclip,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function AgentContextDock({
  panelId,
  open,
  value,
  count,
  attaching,
  disabled,
  onChange,
  onToggle,
  onAttach,
  onPickFile,
}: {
  panelId: string;
  open: boolean;
  value: string;
  count: number;
  attaching: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  onAttach: () => void;
  onPickFile: () => void;
}) {
  const { t } = useLanguage();
  const titleId = `${panelId}-title`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
  }, [open]);

  if (!open && count === 0) return null;

  return (
    <div className="agent-context-dock px-3">
      {!open && (
        <div
          className="agent-context-status flex min-h-9 w-full items-center gap-2 px-2 py-1 text-xs font-medium text-slate-400"
          aria-label={t("agent.context.count", { count })}
        >
          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{t("agent.context.title")}</span>
          <span className="agent-context-count ml-auto inline-flex items-center gap-1 text-[0.7rem] text-slate-400">
            <Check className="h-3.5 w-3.5" />
            {t("agent.context.count", { count })}
          </span>
        </div>
      )}

      {open && (
        <section
          id={panelId}
          aria-labelledby={titleId}
          aria-busy={attaching}
          className="agent-context-editor rounded-md border p-3"
        >
          <div className="agent-context-editor-header mb-2.5 flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 id={titleId} className="text-sm font-semibold text-white">
                  {t("agent.context.title")}
                </h3>
                {count > 0 && (
                  <span className="agent-context-count text-[0.7rem] text-slate-400">
                    {t("agent.context.count", { count })}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">
                {t("agent.context.supported")}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label={t("agent.context.close")}
              className="agent-context-close grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={event => onChange(event.target.value)}
            disabled={disabled}
            aria-label={t("agent.context.inputLabel")}
            placeholder={t("agent.context.placeholder")}
            rows={3}
            className="agent-context-textarea max-h-32 min-h-24 resize-none rounded-md border text-xs leading-5 text-slate-100 shadow-none placeholder:text-slate-500"
          />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPickFile}
              disabled={attaching || disabled}
              aria-label={t("agent.context.fileLabel")}
              className="agent-context-file inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-xs text-slate-300 disabled:opacity-50 sm:min-h-0 sm:px-2.5 sm:py-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("agent.context.file")}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={!value.trim() || attaching || disabled}
              onClick={onAttach}
              aria-label={t("agent.context.attach")}
              className="agent-context-attach h-11 rounded-md border-0 px-3 text-xs shadow-none sm:h-8"
            >
              {attaching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                t("agent.context.attach")
              )}
            </Button>
          </div>
          <p className="mt-2 text-[0.7rem] leading-5 text-slate-500">
            {count > 0
              ? t("agent.context.lifecycle")
              : t("agent.context.limit")}
          </p>
        </section>
      )}
    </div>
  );
}

export function AgentTrustBoundary({
  scopeLabel,
  attachedContextCount,
}: {
  scopeLabel: string;
  attachedContextCount: number;
}) {
  const { t } = useLanguage();
  const contextKey =
    attachedContextCount > 0
      ? "agent.trust.contextAttached"
      : "agent.trust.contextPrivate";
  const hasAttachedContext = attachedContextCount > 0;
  const summaryLabel = hasAttachedContext
    ? `${scopeLabel} · ${t("agent.context.count", {
        count: attachedContextCount,
      })}`
    : scopeLabel;

  return (
    <details
      className={cn(
        "agent-trust-boundary min-w-0 flex-1 rounded-md border px-2.5 py-1",
        hasAttachedContext && "agent-trust-boundary-attached"
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-slate-300">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {t("agent.trust.publicScope", {
            scope: summaryLabel,
          })}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="agent-trust-chevron ml-auto h-3.5 w-3.5 shrink-0"
        />
      </summary>
      <p className="mt-1 pl-5 text-xs leading-5 text-slate-500">
        {t(contextKey)}
      </p>
    </details>
  );
}
