import type { ChatMessage, ChatMessageState, SourceCard } from "./types";

export function markAssistantMessageRecoverable(
  messages: ChatMessage[],
  assistantMessageId: string,
  input: {
    content: string;
    state: ChatMessageState;
    recoveryPrompt: string;
    retryUserMessageId?: string;
    messageId?: string;
    quotaTier?: string;
    finalElapsedMs?: number;
  }
) {
  return messages.map(message =>
    message.id === assistantMessageId
      ? {
          ...message,
          id: input.messageId ?? message.id,
          content: message.content || input.content,
          streaming: false,
          state: input.state,
          recoveryMessage: input.content,
          recoveryPrompt: input.recoveryPrompt,
          retryUserMessageId: input.retryUserMessageId,
          quotaTier: input.quotaTier,
          finalElapsedMs: input.finalElapsedMs ?? message.finalElapsedMs,
        }
      : message
  );
}

export function toChatMessage(message: {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sourceJson?: Record<string, unknown> | null;
}): ChatMessage {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    sourceCards: extractSourceCards(message.sourceJson),
    relatedQuestions: extractRelatedQuestions(message.sourceJson),
    finalElapsedMs: extractLatencyMs(message.sourceJson),
  };
}

function extractLatencyMs(
  sourceJson: Record<string, unknown> | null | undefined
) {
  const latencyMs = sourceJson?.latencyMs;
  return typeof latencyMs === "number" && Number.isFinite(latencyMs)
    ? latencyMs
    : undefined;
}

function extractRelatedQuestions(
  sourceJson: Record<string, unknown> | null | undefined
): string[] | undefined {
  const relatedQuestions = sourceJson?.relatedQuestions;
  if (!Array.isArray(relatedQuestions)) return undefined;
  const normalized = relatedQuestions.filter(
    (question): question is string =>
      typeof question === "string" && question.trim().length > 0
  );
  return normalized.length > 0 ? normalized : undefined;
}

function extractSourceCards(
  sourceJson: Record<string, unknown> | null | undefined
): SourceCard[] | undefined {
  const cards = sourceJson?.sourceCards;
  if (!Array.isArray(cards)) return undefined;
  const normalized = cards
    .map(card => normalizeSourceCard(card))
    .filter((card): card is SourceCard => Boolean(card));
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeSourceCard(value: unknown): SourceCard | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.sourceId !== "string" ||
    typeof record.postTitle !== "string"
  )
    return null;
  return {
    sourceId: record.sourceId,
    sourceType: record.sourceType === "user_context" ? "user_context" : "blog",
    postTitle: record.postTitle,
    postSlug: typeof record.postSlug === "string" ? record.postSlug : "",
    categorySlug:
      typeof record.categorySlug === "string" ? record.categorySlug : undefined,
    tagSlugs: Array.isArray(record.tagSlugs)
      ? record.tagSlugs.filter((tag): tag is string => typeof tag === "string")
      : [],
    heading: typeof record.heading === "string" ? record.heading : undefined,
    anchorId: typeof record.anchorId === "string" ? record.anchorId : undefined,
    excerpt: typeof record.excerpt === "string" ? record.excerpt : "",
    compactExcerpt:
      typeof record.compactExcerpt === "string"
        ? record.compactExcerpt
        : undefined,
    sectionTitle:
      typeof record.sectionTitle === "string" ? record.sectionTitle : undefined,
    isCurrentPage:
      typeof record.isCurrentPage === "boolean"
        ? record.isCurrentPage
        : undefined,
    relevanceReason:
      typeof record.relevanceReason === "string" ? record.relevanceReason : "",
  };
}
