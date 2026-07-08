import React from "react";
import { Loader2 } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import type { ConversationItem } from "./types";

export function AgentHistoryPanel({
  conversations,
  loading,
  activeConversationId,
  onLoadConversation,
}: {
  conversations: ConversationItem[];
  loading: boolean;
  activeConversationId?: string;
  onLoadConversation: (conversationId: string) => void;
}) {
  const { t } = useLanguage();
  const visible = conversations.slice(0, 8);

  return (
    <div className="border-b border-slate-800 bg-slate-950/55 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>{t("agent.history.title")}</span>
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        )}
      </div>
      {visible.length > 0 ? (
        <div className="grid max-h-48 gap-2 overflow-y-auto pr-1">
          {visible.map(conversation => {
            const active = conversation.id === activeConversationId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onLoadConversation(conversation.id)}
                className={cn(
                  "grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-left text-xs leading-5 transition",
                  active
                    ? "border-slate-500 bg-slate-900 text-slate-100"
                    : "border-slate-700 bg-white/[0.025] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {conversation.title || t("agent.history.continue")}
                  </span>
                  <span className="block truncate text-slate-500">
                    {conversation.scopeValue || conversation.scopeType}
                    {conversation.ownerType
                      ? ` · ${getConversationOwnerLabel(conversation.ownerType, t)}`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[0.68rem] leading-4 text-slate-500">
                  {formatConversationTime(
                    conversation.lastMessageAt ?? conversation.updatedAt,
                    t
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-slate-600">{t("agent.history.empty")}</div>
      )}
    </div>
  );
}

export function formatConversationTime(
  value: Date | string | null | undefined,
  t: (key: string) => string
) {
  if (!value) return t("agent.history.noTime");
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return t("agent.history.noTime");
  return new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getConversationOwnerLabel(
  ownerType: ConversationItem["ownerType"],
  t: (key: string) => string
) {
  if (ownerType === "admin") return t("agent.history.owner.admin");
  if (ownerType === "visitor") return t("agent.history.owner.visitor");
  return t("agent.history.owner.anonymous");
}
