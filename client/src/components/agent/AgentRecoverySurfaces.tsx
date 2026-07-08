import React from "react";
import { AlertCircle, Loader2, LogIn, RotateCcw } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import type { ChatMessage, ChatMessageState } from "./types";

export function AgentNotice({
  tone,
  message,
}: {
  tone: "warning" | "error";
  message: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-6",
        tone === "error"
          ? "border-red-300/25 bg-red-950/30 text-red-100"
          : "border-slate-700 bg-slate-950/45 text-slate-300"
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AgentBootstrapUnavailable({
  retrying,
  onRetry,
}: {
  retrying: boolean;
  onRetry: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid min-h-full place-items-center py-8">
      <div className="w-full rounded-md border border-red-300/25 bg-red-950/20 p-4 text-sm leading-6 text-red-100">
        <div className="mb-3 flex items-start gap-2.5">
          <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{t("agent.bootstrap.unavailable")}</p>
            <p className="mt-1 text-red-100/75">{t("agent.error.bootstrap")}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={retrying}
          onClick={onRetry}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200/25 bg-red-100/10 px-3 py-2 text-xs font-semibold text-red-50 transition hover:bg-red-100/15 disabled:opacity-60"
        >
          {retrying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          {t("agent.bootstrap.retry")}
        </button>
      </div>
    </div>
  );
}

export function AgentMessageRecovery({
  message,
  disabled,
  visitorLoading,
  onRetry,
  onContinueAsVisitor,
}: {
  message: ChatMessage;
  disabled: boolean;
  visitorLoading: boolean;
  onRetry: (message: string) => void;
  onContinueAsVisitor: (recoveryPrompt?: string) => void;
}) {
  const { t } = useLanguage();
  const state = message.state;
  if (!state) return null;

  const canRetry =
    Boolean(message.recoveryPrompt) &&
    (state === "cancelled" || state === "failed" || state === "timeout");
  const canUseVisitor =
    state === "quota_blocked" && message.quotaTier === "anonymous";

  return (
    <div className="not-prose mt-3 rounded-md border border-slate-700 bg-slate-950/45 px-3 py-2 text-xs leading-5 text-slate-300">
      {message.recoveryMessage && (
        <p className="font-medium text-slate-200">{message.recoveryMessage}</p>
      )}
      <p className={message.recoveryMessage ? "mt-1 text-slate-400" : ""}>
        {t(getRecoveryMessageKey(state))}
      </p>
      {(canRetry || canUseVisitor) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {canRetry && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRetry(message.recoveryPrompt ?? "")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-600 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-white disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("agent.input.retry")}
            </button>
          )}
          {canUseVisitor && (
            <button
              type="button"
              disabled={visitorLoading}
              onClick={() => onContinueAsVisitor(message.recoveryPrompt)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-600 bg-white/[0.025] px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-900 disabled:opacity-60"
            >
              {visitorLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogIn className="h-3.5 w-3.5" />
              )}
              {t("agent.quota.continueAsVisitor")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function getRecoveryMessageKey(state: ChatMessageState) {
  if (state === "cancelled") return "agent.recovery.cancelled";
  if (state === "timeout") return "agent.recovery.timeout";
  if (state === "quota_blocked") return "agent.recovery.quota";
  if (state === "no_source") return "agent.recovery.noSource";
  return "agent.recovery.failed";
}
