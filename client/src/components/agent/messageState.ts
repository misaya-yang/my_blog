import type { AgentTraceEntry, ChatMessage, SourceCard } from "./types";

export function upsertTraceEntry(
  entries: AgentTraceEntry[] | undefined,
  next: AgentTraceEntry
) {
  const current = entries ?? [];
  const index = current.findIndex(entry => entry.stage === next.stage);
  if (index === -1) return [...current, next];
  return current.map((entry, entryIndex) =>
    entryIndex === index ? { ...entry, ...next } : entry
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
  };
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
