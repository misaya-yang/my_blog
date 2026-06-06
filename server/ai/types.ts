import type { BlogSession } from "../auth.js";
import type { KnowledgeSearchResult } from "./knowledge.js";

export type AgentIdentityType = "anonymous" | "visitor" | "admin";
export type AgentScopeType = "site" | "post" | "category" | "tag" | "track";
export type AgentMessageRole = "user" | "assistant" | "system";
export type AgentMessageStatus = "created" | "completed" | "failed" | "blocked";
export type AgentRunStatus = "started" | "completed" | "failed" | "blocked";
export type AgentUsageActionType =
  | "assistant_message"
  | "retrieval_query"
  | "tool_call"
  | "file_upload"
  | "file_parse";
export type AgentContextSourceKind =
  | "pasted_text"
  | "text_file"
  | "markdown_file";

export type AgentIdentity = {
  type: AgentIdentityType;
  key: string;
  tier: AgentIdentityType;
  displayName: string | null;
};

export type AgentRouteContext = {
  path: string;
  routeType?:
    | "home"
    | "post"
    | "category"
    | "tag"
    | "search"
    | "track"
    | "archive"
    | "public";
  postSlug?: string;
  postTitle?: string;
  categorySlug?: string;
  tagSlug?: string;
  trackSlug?: "ai-algorithms" | "ai-applications";
  locale?: "en" | "zh";
};

export type AgentScope = {
  type: AgentScopeType;
  value?: string;
};

export type AgentQuota = {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetAt: Date;
  tier: AgentIdentityType;
};

export type AgentAnswer = {
  answerType:
    | "direct"
    | "explanation"
    | "comparison"
    | "reading_path"
    | "refusal";
  answerMarkdown: string;
  sourceIds: string[];
  sourceCards: AgentSourceCard[];
  relatedQuestions: string[];
  confidence: "high" | "medium" | "low";
  refusalReason?:
    | "no_public_source"
    | "hidden_or_unavailable"
    | "outside_blog_scope"
    | "unsafe_or_forbidden";
};

export type AgentSourceCard = {
  sourceId: string;
  sourceType?: "blog" | "user_context";
  postTitle: string;
  postSlug: string;
  categorySlug?: string;
  tagSlugs: string[];
  heading?: string;
  excerpt: string;
  relevanceReason: string;
};

export type AgentContextSourceRecord = {
  id: string;
  conversationId: string;
  ownerType: AgentIdentityType;
  ownerKey: string;
  kind: AgentContextSourceKind;
  status: "ready" | "deleted" | "rejected";
  filename: string | null;
  mimeType: string | null;
  content: string;
  contentHash: string;
  tokenEstimate: number;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  sourceId: string;
  sourceType: "user_context";
  excerpt: string;
};

export type AgentConversationRecord = {
  id: string;
  ownerType: AgentIdentityType;
  ownerKey: string;
  title: string | null;
  scopeType: AgentScopeType;
  scopeValue: string | null;
  updatedAt?: Date;
  lastMessageAt?: Date | null;
};

export type AgentMessageRecord = {
  id: string;
  conversationId: string;
  role: AgentMessageRole;
  status: AgentMessageStatus;
  content: string;
  sourceJson?: Record<string, unknown> | null;
  usageJson?: Record<string, unknown> | null;
  errorCode?: string | null;
  createdAt?: Date;
};

export type AgentRunRecord = {
  id: string;
  conversationId?: string | null;
  status?: AgentRunStatus;
  model?: string | null;
  question?: string | null;
  scopeType?: AgentScopeType;
  scopeValue?: string | null;
  retrievalStrategy?: string | null;
  retrievedChunkIds?: string[];
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number | null;
  errorCode?: string | null;
  createdAt?: Date;
  completedAt?: Date | null;
};

export type AgentBootstrapInput = {
  routeContext: AgentRouteContext;
  scope?: AgentScope;
};

export type AgentBootstrapOutput = {
  sessionTier: AgentIdentityType;
  quota: Omit<AgentQuota, "allowed">;
  currentScope: AgentScope;
  suggestedPrompts: string[];
};

export type AgentConversationDetail = {
  conversation: AgentConversationRecord;
  messages: AgentMessageRecord[];
  contextSources?: AgentContextSourceRecord[];
};

export type AgentRetrievalDebugOutput = {
  query: string;
  scope: AgentScope;
  sourceIds: string[];
  sources: AgentSourceCard[];
  diagnostics: {
    status: "ready" | "no_sources";
    terms: string[];
    expandedTerms: string[];
    aliasExpansions: Array<{
      term: string;
      expansions: string[];
    }>;
    missingTerms: string[];
    currentPageContextInjected: boolean;
    failureReason?: "retrieval_failure" | "wrong_source" | "refusal_boundary";
    notes: string[];
    suggestions: string[];
  };
};

export type AgentEvalRunOutput = {
  summary: {
    total: number;
    passed: number;
    failed: number;
    successCases: number;
    refusalCases: number;
    runAt: Date;
    retrievalStrategy: string;
    modelProvider: string;
  };
  items: Array<{
    question: string;
    expectedBehavior: "sources" | "refusal";
    category: string;
    passed: boolean;
    sourceCount: number;
    topSourceTitle: string | null;
    sourceIds: string[];
    expectedSourceSlugs: string[];
    missingSourceSlugs: string[];
    failureReason?: "retrieval_failure" | "wrong_source" | "refusal_boundary";
    notes: string[];
  }>;
};

export type AgentKnowledgeIndexStatusOutput = {
  chunkCount: number;
  publicPostCount: number;
  indexedPublicPostCount: number;
  hiddenOrDraftExcludedCount: number;
  lastReindexAt: Date | null;
  latestReindexError: string | null;
  reindexCommand: string;
  publishCommand: string;
  stalePublicPostSlugs: string[];
  extraIndexedPostSlugs: string[];
  indexedPostSlugs: string[];
};

export type AgentArticleIdeaOutput = {
  ideas: Array<{
    sourceConversationId: string;
    proposedTitle: string;
    rationale: string;
    seedQuestions: string[];
  }>;
};

export type AgentQuestionRadarOutput = {
  summary: {
    totalRuns: number;
    failedRuns: number;
    noSourceRuns: number;
    uniqueQuestions: number;
  };
  frequentQuestions: Array<{
    question: string;
    count: number;
    scopeType: AgentScopeType;
    scopeValue: string | null;
    lastAskedAt: Date | null;
    runIds: string[];
    signalTypes: Array<"frequent" | "no_source" | "failed">;
  }>;
  noSourceRuns: Array<{
    runId: string;
    question: string | null;
    scopeType: AgentScopeType | null;
    scopeValue: string | null;
    createdAt: Date | null;
  }>;
  failedRuns: Array<{
    runId: string;
    question: string | null;
    errorCode: string | null;
    scopeType: AgentScopeType | null;
    scopeValue: string | null;
    createdAt: Date | null;
  }>;
  scopeBreakdown: Array<{
    scopeType: AgentScopeType | "unknown";
    scopeValue: string | null;
    count: number;
  }>;
  suggestedIdeas: Array<{
    ideaId: string;
    proposedTitle: string;
    rationale: string;
    supportCount: number;
    sourceRunIds: string[];
    status: "new";
  }>;
};

export type AgentAddContextInput = {
  conversationId?: string;
  routeContext: AgentRouteContext;
  scope?: AgentScope;
  kind: AgentContextSourceKind;
  filename?: string;
  mimeType?: string;
  content: string;
};

export type AgentAddContextOutput =
  | {
      status: "blocked";
      reason: "quota";
      quota: AgentQuota;
    }
  | {
      status: "completed";
      conversationId: string;
      contextSource: AgentContextSourceRecord;
      quota: AgentQuota;
    };

export type AgentSendMessageInput = {
  conversationId?: string;
  message: string;
  routeContext: AgentRouteContext;
  scope?: AgentScope;
  answerMode?: "summary" | "deep" | "compare" | "reading_path";
};

export type AgentSendMessageOutput =
  | {
      status: "blocked";
      reason: "quota";
      quota: AgentQuota;
    }
  | {
      status: "completed";
      conversationId: string;
      messageId: string;
      answer: AgentAnswer;
      sourceCards: AgentSourceCard[];
      relatedQuestions: string[];
      quota: AgentQuota;
      runStatus: "completed";
    }
  | {
      status: "failed";
      conversationId: string;
      messageId: string;
      quota: AgentQuota;
      runStatus: "failed";
      errorCode: string;
    };

export type AgentStreamEvent =
  | {
      type: "status";
      stage:
        | "understanding"
        | "retrieval"
        | "sources"
        | "reasoning"
        | "answer"
        | "saving";
      elapsedMs: number;
      sourceCount?: number;
      currentPageContextInjected?: boolean;
    }
  | {
      type: "reasoning_delta";
      delta: string;
      elapsedMs: number;
    }
  | {
      type: "answer_delta";
      delta: string;
      elapsedMs: number;
    }
  | {
      type: "final";
      output: AgentSendMessageOutput;
      elapsedMs: number;
      reasoningMarkdown?: string;
    }
  | {
      type: "error";
      message: string;
      elapsedMs: number;
    };

export type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
};

export type AgentContext = {
  req: RequestLike;
  session: BlogSession;
};

export type AgentModelResult = {
  answer: AgentAnswer;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  reasoningMarkdown?: string;
};

export type AgentConversationMemoryTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AgentModel = {
  generate(input: {
    message: string;
    scope: AgentScope;
    routeContext: AgentRouteContext;
    sources: KnowledgeSearchResult[];
    contextSources: AgentContextSourceRecord[];
    conversationHistory?: AgentConversationMemoryTurn[];
    currentPageContextInjected?: boolean;
    signal?: AbortSignal;
  }): Promise<AgentModelResult>;
  streamGenerate?(input: {
    message: string;
    scope: AgentScope;
    routeContext: AgentRouteContext;
    sources: KnowledgeSearchResult[];
    contextSources: AgentContextSourceRecord[];
    conversationHistory?: AgentConversationMemoryTurn[];
    currentPageContextInjected?: boolean;
    signal?: AbortSignal;
    onAnswerDelta: (delta: string) => void;
    onReasoningDelta: (delta: string) => void;
  }): Promise<AgentModelResult>;
};
