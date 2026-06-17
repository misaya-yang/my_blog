export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceCards?: SourceCard[];
  relatedQuestions?: string[];
  traceEntries?: AgentTraceEntry[];
  streaming?: boolean;
};

export type AgentTraceEntry = {
  stage: AgentTraceStage;
  elapsedMs: number;
  sourceCount?: number;
  currentPageContextInjected?: boolean;
};

export type AgentTraceStage =
  | "understanding"
  | "retrieval"
  | "sources"
  | "reasoning"
  | "answer"
  | "saving";

export type QuotaInfo = {
  limit: number;
  used: number;
  remaining: number;
  tier: string;
};

export type SourceCard = {
  sourceId: string;
  sourceType?: "blog" | "user_context";
  postTitle: string;
  postSlug: string;
  categorySlug?: string;
  tagSlugs: string[];
  heading?: string;
  excerpt: string;
  compactExcerpt?: string;
  sectionTitle?: string;
  isCurrentPage?: boolean;
  relevanceReason: string;
};

export type ConversationItem = {
  id: string;
  ownerType?: "anonymous" | "visitor" | "admin";
  title: string | null;
  scopeType: string;
  scopeValue: string | null;
  updatedAt?: Date | string;
  lastMessageAt?: Date | string | null;
};
