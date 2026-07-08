import React from "react";
import { Loader2 } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

import {
  getAgentDisplayElapsedMs,
  getTraceStageDurations,
} from "./agentElapsed";
import type { AgentTraceEntry, ChatMessage } from "./types";

export function AgentReasoningTrace({ message }: { message: ChatMessage }) {
  const { t } = useLanguage();
  if (message.role !== "assistant") return null;

  const traceEntries = message.traceEntries ?? [];
  const hasTrace = message.streaming || traceEntries.length > 0;
  if (!hasTrace) return null;

  const elapsedMs = getAgentDisplayElapsedMs(message);
  const stageDurations = getTraceStageDurations(traceEntries);
  const summaryKey = message.streaming
    ? "agent.trace.thinking"
    : "agent.trace.done";

  return (
    <details
      open={message.streaming}
      className="not-prose mb-3 rounded-md border border-slate-700 bg-slate-950/45"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-slate-300">
        <span>
          {t(summaryKey)}
          {elapsedMs > 0 && (
            <span className="ml-1 text-slate-500">
              {t("agent.trace.elapsed", {
                seconds: formatElapsedSeconds(elapsedMs),
              })}
            </span>
          )}
        </span>
        {message.streaming && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
        )}
      </summary>
      <div className="border-t border-slate-800 px-3 py-2">
        {traceEntries.length > 0 && (
          <ol className="grid gap-1.5 text-xs leading-5 text-slate-400">
            {stageDurations.map(entry => (
              <li
                key={entry.stage}
                className="flex items-center justify-between gap-3"
              >
                <span>{traceStageLabel(entry, t)}</span>
                <span className="shrink-0 text-slate-600">
                  {formatElapsedSeconds(entry.durationMs)}s
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

function traceStageLabel(
  entry: AgentTraceEntry,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  if (entry.stage === "sources") {
    return t("agent.trace.stage.sources", {
      count: entry.sourceCount ?? 0,
      current:
        entry.currentPageContextInjected === true
          ? t("agent.trace.currentPage")
          : "",
    });
  }
  return t(`agent.trace.stage.${entry.stage}`);
}

function formatElapsedSeconds(elapsedMs: number) {
  return (elapsedMs / 1000).toFixed(elapsedMs < 10_000 ? 1 : 0);
}
