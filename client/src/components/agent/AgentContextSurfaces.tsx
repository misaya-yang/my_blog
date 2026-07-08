import React from "react";
import { Check, FileText, Loader2, Paperclip, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function AgentContextDock({
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

  return (
    <div className="agent-context-dock border-t border-slate-800 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="agent-context-toggle inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-slate-400 transition hover:text-slate-100 sm:min-h-0 sm:px-1.5 sm:py-1"
        >
          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{t("agent.context.title")}</span>
          {count > 0 && (
            <span className="rounded-full border border-slate-600/50 bg-slate-900 px-1.5 text-[0.68rem] text-slate-300">
              {t("agent.context.count", { count })}
            </span>
          )}
        </button>
        {count > 0 && (
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-slate-400">
            <Check className="h-3.5 w-3.5" />
            {t("agent.context.active")}
          </span>
        )}
      </div>

      {open && (
        <div className="agent-context-editor mt-2 rounded-md border border-slate-700 bg-slate-950/45 p-2">
          <p className="mb-2 text-xs leading-5 text-slate-400">
            {t("agent.context.supported")}
          </p>
          <Textarea
            value={value}
            onChange={event => onChange(event.target.value)}
            disabled={disabled}
            placeholder={t("agent.context.placeholder")}
            rows={3}
            className="max-h-28 min-h-20 resize-none border-0 bg-transparent text-xs leading-5 text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPickFile}
              disabled={attaching || disabled}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-700 bg-white/[0.025] px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100 disabled:opacity-50 sm:min-h-0 sm:px-2.5 sm:py-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("agent.context.file")}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={!value.trim() || attaching || disabled}
              onClick={onAttach}
              className="h-11 rounded-md bg-slate-100 px-3 text-xs text-slate-950 hover:bg-white sm:h-8"
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
        </div>
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
        "agent-trust-boundary min-w-0 rounded-md border px-2.5 py-1",
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
      </summary>
      <p className="mt-1 pl-5 text-xs leading-5 text-slate-500">
        {t(contextKey)}
      </p>
    </details>
  );
}
