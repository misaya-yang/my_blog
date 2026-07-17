import React from "react";
import { LogIn } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

import type { QuotaInfo } from "./types";

type QuotaStatus = Pick<QuotaInfo, "limit" | "remaining" | "tier">;

export function AgentQuotaBadge({ quota }: { quota: QuotaStatus }) {
  const { t } = useLanguage();
  const key =
    quota.remaining <= 1 ? "agent.quota.low" : "agent.quota.remaining";

  return (
    <span
      className="agent-quota-badge inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-300"
      title={quota.tier ? `${quota.tier} quota` : undefined}
    >
      <LogIn className="h-3.5 w-3.5 text-slate-400" />
      {t(key, { remaining: quota.remaining, limit: quota.limit })}
    </span>
  );
}

export function AgentQuotaCallout({
  quota,
}: {
  quota: Pick<QuotaInfo, "remaining" | "tier">;
}) {
  const { t } = useLanguage();
  const message =
    quota.tier === "admin"
      ? t("agent.quota.adminDetail")
      : t("agent.quota.lowDetail");

  return (
    <div className="agent-quota-callout mt-1.5 rounded-md px-2.5 py-1.5 text-xs leading-5 text-slate-300">
      {message}
    </div>
  );
}

export function shouldShowQuotaCallout(
  quota: Pick<QuotaInfo, "remaining" | "tier">
) {
  return quota.remaining <= 1 || quota.tier === "admin";
}
