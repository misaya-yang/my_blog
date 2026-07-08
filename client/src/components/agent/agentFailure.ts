import { isAbortError, isTimeoutError } from "./streamClient";

import type { ChatMessageState, SourceCard } from "./types";

type Translate = (key: string) => string;

export function getQuotaBlockedNotice(tier: string, t: Translate) {
  return tier === "anonymous"
    ? t("agent.quota.blockedAnonymous")
    : t("agent.quota.blockedVisitor");
}

export function getClientStreamFailure(
  error: unknown,
  t: Translate
): { content: string; state: ChatMessageState } {
  if (isTimeoutError(error)) {
    return { content: t("agent.error.timeout"), state: "timeout" };
  }
  if (isAbortError(error)) {
    return { content: t("agent.error.cancelled"), state: "cancelled" };
  }
  return { content: t("agent.error.send"), state: "failed" };
}

export function getAgentFailureNotice(errorCode: string, t: Translate) {
  if (errorCode === "agent_stream_aborted") return t("agent.error.cancelled");
  if (errorCode === "agent_stream_timeout") return t("agent.error.timeout");
  return errorCode === "model_not_configured"
    ? t("agent.error.modelNotConfigured")
    : t("agent.error.send");
}

export function getAgentFailureState(errorCode: string): ChatMessageState {
  if (errorCode === "agent_stream_aborted") return "cancelled";
  if (errorCode === "agent_stream_timeout") return "timeout";
  return "failed";
}

export function getCompletedMessageState(response: {
  answer: { refusalReason?: string };
  sourceCards: SourceCard[];
}): ChatMessageState | undefined {
  if (
    response.sourceCards.length === 0 &&
    response.answer.refusalReason === "no_public_source"
  ) {
    return "no_source";
  }
  return undefined;
}
