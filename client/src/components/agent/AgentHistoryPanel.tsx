import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import type { ConversationItem } from "./types";

export function AgentHistoryPanel({
  id,
  conversations,
  loading,
  activeConversationId,
  onLoadConversation,
}: {
  id: string;
  conversations: ConversationItem[];
  loading: boolean;
  activeConversationId?: string;
  onLoadConversation: (conversationId: string) => void;
}) {
  const { t } = useLanguage();
  const visible = conversations.slice(0, 8);
  const titleId = `${id}-title`;
  const panelRef = useRef<HTMLElement | null>(null);
  const firstRowRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      (firstRowRef.current ?? panelRef.current)?.focus({ preventScroll: true });
    });
  }, []);

  return (
    <section
      ref={panelRef}
      id={id}
      aria-labelledby={titleId}
      aria-busy={loading}
      tabIndex={-1}
      className="agent-history-panel rounded-md border p-2.5"
    >
      <div className="mb-1.5 flex items-center justify-between gap-3 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <h3 id={titleId}>{t("agent.history.title")}</h3>
        {loading && (
          <Loader2
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin text-slate-400"
          />
        )}
      </div>
      {visible.length > 0 ? (
        <div className="agent-history-list grid max-h-52 gap-0.5 overflow-y-auto">
          {visible.map(conversation => {
            const active = conversation.id === activeConversationId;
            return (
              <button
                ref={conversation === visible[0] ? firstRowRef : undefined}
                key={conversation.id}
                type="button"
                onClick={() => onLoadConversation(conversation.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "agent-history-row grid grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2.5 py-2 text-left text-xs leading-5 text-slate-300",
                  active && "agent-history-row-active text-slate-100"
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
        <div className="px-1 py-2 text-xs text-slate-600">
          {t("agent.history.empty")}
        </div>
      )}
    </section>
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
