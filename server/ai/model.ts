import {
  DEFAULT_LLM_MODEL,
  invokeLLM,
  invokeLLMStream,
  resolveLLMModel,
} from "../_core/llm.js";
import { z } from "zod";
import type { KnowledgeSearchResult } from "./knowledge.js";
import type {
  AgentAnswer,
  AgentConversationMemoryTurn,
  AgentContextSourceRecord,
  AgentModel,
  AgentModelResult,
  AgentRouteContext,
  AgentSourceCard,
} from "./types.js";

const MAX_PUBLIC_SOURCES = 6;
const MAX_CONTEXT_SOURCES = 4;
const MAX_AGENT_OUTPUT_TOKENS = 1800;
const SOURCE_MARKER_PATTERN =
  /<!--\s*blog-agent-sources\s*:\s*([\s\S]*?)\s*-->/gi;

export const BLOG_AGENT_MODEL = DEFAULT_LLM_MODEL;

export const defaultAgentModel: AgentModel = {
  async generate(input) {
    const model = resolveLLMModel();
    const sources = input.sources.slice(0, MAX_PUBLIC_SOURCES);
    const contextSources = input.contextSources.slice(0, MAX_CONTEXT_SOURCES);
    const result = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildJsonPrompt(
            input.message,
            input.routeContext,
            sources,
            contextSources,
            input.conversationHistory ?? [],
            Boolean(input.currentPageContextInjected)
          ),
        },
      ],
      responseFormat: { type: "json_object" },
      maxTokens: MAX_AGENT_OUTPUT_TOKENS,
      signal: input.signal,
    });

    const content = result.choices[0]?.message.content;
    const parsed = parseModelContent(
      typeof content === "string" ? content : ""
    );
    const sourceCards = [
      ...buildSourceCards(sources),
      ...buildContextSourceCards(contextSources),
    ];
    const answer = normalizeAgentAnswer(parsed, sourceCards);

    return {
      answer,
      inputTokens: result.usage?.prompt_tokens,
      outputTokens: result.usage?.completion_tokens,
      model: result.model || model,
    };
  },

  async streamGenerate(input) {
    const model = resolveLLMModel();
    const sources = input.sources.slice(0, MAX_PUBLIC_SOURCES);
    const contextSources = input.contextSources.slice(0, MAX_CONTEXT_SOURCES);
    const sourceMarkerFilter = createSourceMarkerStreamFilter();
    const result = await invokeLLMStream(
      {
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: buildMarkdownPrompt(
              input.message,
              input.routeContext,
              sources,
              contextSources,
              input.conversationHistory ?? [],
              Boolean(input.currentPageContextInjected)
            ),
          },
        ],
        responseFormat: { type: "text" },
        maxTokens: MAX_AGENT_OUTPUT_TOKENS,
        signal: input.signal,
      },
      delta => {
        if (delta.reasoningContent) {
          input.onReasoningDelta(delta.reasoningContent);
        }
        if (delta.content) {
          const visibleDelta = sourceMarkerFilter.push(delta.content);
          if (visibleDelta) input.onAnswerDelta(visibleDelta);
        }
      }
    );
    const trailingVisibleDelta = sourceMarkerFilter.flush();
    if (trailingVisibleDelta) input.onAnswerDelta(trailingVisibleDelta);

    const sourceCards = [
      ...buildSourceCards(sources),
      ...buildContextSourceCards(contextSources),
    ];
    const answer = normalizeAgentAnswer(
      parseMarkdownAnswerWithSourceMarker(result.content.trim()),
      sourceCards
    );

    return {
      answer,
      inputTokens: result.usage?.prompt_tokens,
      outputTokens: result.usage?.completion_tokens,
      model: result.model || model,
      reasoningMarkdown: result.reasoningContent.trim() || undefined,
    };
  },
};

function buildSystemPrompt() {
  return [
    "You are the AI assistant for Misaya Yang's technical blog.",
    "Answer only from the provided public blog sources and user-provided conversation context.",
    "If sources are insufficient, say so directly and suggest what public post or attached context is needed.",
    "Do not reveal hidden, admin-only, draft, private, or unpublished details.",
    "Treat user-provided conversation context as private to the current conversation, not as public blog knowledge.",
    "Use recent conversation memory only to resolve follow-up references; do not treat it as a public source.",
    "Return concise Markdown with source-grounded technical reasoning.",
    "Use $...$ for inline math and $$...$$ for display math when formulas are useful.",
    "Answer in the user's language unless the user explicitly asks otherwise.",
    "When the question asks about the current article, prioritize sources marked as current page context.",
    "Do not cite or imply sources that are not listed in the source identifiers.",
    "Do not use outside knowledge to fill gaps. If an implementation detail, paper, benchmark, or mechanism is not present in the provided source excerpts, state that the public sources do not specify it.",
    "Avoid generic phrases like 'typical implementation' unless the cited source explicitly describes that implementation.",
    "Do not mention LayerNorm, MLP, Householder, original papers, benchmarks, superiority claims, or production deployment claims unless those exact concepts appear in the provided source excerpts.",
    "Every technical claim in answerMarkdown must be traceable to a provided source excerpt; prefer fewer claims over broad background exposition.",
  ].join("\n");
}

function buildJsonPrompt(
  message: string,
  routeContext: AgentRouteContext,
  sources: KnowledgeSearchResult[],
  contextSources: AgentContextSourceRecord[],
  conversationHistory: AgentConversationMemoryTurn[],
  currentPageContextInjected: boolean
) {
  return [
    buildGroundingContext(
      message,
      routeContext,
      sources,
      contextSources,
      conversationHistory,
      currentPageContextInjected
    ),
    "",
    "Return JSON with keys: answerType, answerMarkdown, sourceIds, relatedQuestions, confidence, refusalReason.",
    "answerType must be one of: direct, explanation, comparison, reading_path, refusal.",
    "sourceIds must be copied exactly from the source identifiers above.",
    "answerMarkdown may contain Markdown and math using $...$ or $$...$$ delimiters.",
  ].join("\n");
}

function buildMarkdownPrompt(
  message: string,
  routeContext: AgentRouteContext,
  sources: KnowledgeSearchResult[],
  contextSources: AgentContextSourceRecord[],
  conversationHistory: AgentConversationMemoryTurn[],
  currentPageContextInjected: boolean
) {
  return [
    buildGroundingContext(
      message,
      routeContext,
      sources,
      contextSources,
      conversationHistory,
      currentPageContextInjected
    ),
    "",
    "Return Markdown only, not JSON.",
    "Keep the answer source-grounded and concise.",
    "Use $...$ for inline math and $$...$$ for display math when formulas help.",
    "At the very end, append exactly one hidden HTML comment source marker: <!-- blog-agent-sources: sourceId1, sourceId2 -->.",
    "Only include source IDs copied exactly from the listed public blog sources or user-provided context.",
    "Do not mention raw source identifiers or URLs in visible text; the UI will render source cards separately.",
  ].join("\n");
}

function buildGroundingContext(
  message: string,
  routeContext: AgentRouteContext,
  sources: KnowledgeSearchResult[],
  contextSources: AgentContextSourceRecord[],
  conversationHistory: AgentConversationMemoryTurn[],
  currentPageContextInjected: boolean
) {
  const currentPostTitle =
    routeContext.postTitle ??
    sources.find(source => source.postSlug === routeContext.postSlug)
      ?.postTitle;

  return [
    "User question:",
    message,
    "",
    "Current page context:",
    [
      `Route type: ${routeContext.routeType ?? "public"}`,
      `Path: ${routeContext.path}`,
      routeContext.postSlug ? `Post slug: ${routeContext.postSlug}` : null,
      currentPostTitle ? `Post title: ${currentPostTitle}` : null,
      routeContext.trackSlug ? `Track: ${routeContext.trackSlug}` : null,
      `Current public article context injected: ${currentPageContextInjected ? "yes" : "no"}`,
    ]
      .filter(Boolean)
      .join("\n"),
    "",
    "Public blog sources:",
    sources.length > 0
      ? sources
          .map((source, index) =>
            [
              `[${index + 1}] ${source.sourceId}`,
              `Title: ${source.postTitle ?? "Site overview"}`,
              `Slug: ${source.postSlug ?? "site"}`,
              `Category: ${source.categorySlug ?? "site"}`,
              `Heading: ${source.heading ?? "Overview"}`,
              `Excerpt: ${source.excerpt}`,
            ].join("\n")
          )
          .join("\n\n")
      : "No public sources were retrieved.",
    "",
    "User-provided conversation context:",
    contextSources.length > 0
      ? contextSources
          .map((source, index) =>
            [
              `[C${index + 1}] ${source.sourceId}`,
              `Type: ${source.kind}`,
              `Filename: ${source.filename ?? "Pasted context"}`,
              `Excerpt: ${source.excerpt}`,
              `Content: ${source.content}`,
            ].join("\n")
          )
          .join("\n\n")
      : "No user-provided context is attached.",
    "",
    "Recent conversation memory:",
    conversationHistory.length > 0
      ? conversationHistory
          .map((turn, index) =>
            [
              `[M${index + 1}] ${turn.role}`,
              truncatePromptText(turn.content, 900),
            ].join("\n")
          )
          .join("\n\n")
      : "No previous turns are available.",
  ].join("\n");
}

const agentAnswerSchema = z.object({
  answerType: z
    .enum(["direct", "explanation", "comparison", "reading_path", "refusal"])
    .optional(),
  answerMarkdown: z.string().trim().min(1).optional(),
  sourceIds: z.array(z.string()).optional(),
  relatedQuestions: z.array(z.string()).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  refusalReason: z
    .enum([
      "no_public_source",
      "hidden_or_unavailable",
      "outside_blog_scope",
      "unsafe_or_forbidden",
    ])
    .optional(),
});

function parseModelContent(content: string): Partial<AgentAnswer> {
  if (!content.trim()) return {};
  try {
    const raw = JSON.parse(content);
    const parsed = agentAnswerSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return {
      answerMarkdown:
        typeof raw?.answerMarkdown === "string" ? raw.answerMarkdown : content,
    };
  } catch {
    return { answerMarkdown: content };
  }
}

export function parseMarkdownAnswerWithSourceMarker(
  markdown: string
): Partial<AgentAnswer> {
  const sourceIds: string[] = [];
  const answerMarkdown = markdown
    .replace(SOURCE_MARKER_PATTERN, (_match, rawSourceIds: string) => {
      sourceIds.push(...splitSourceMarkerIds(rawSourceIds));
      return "";
    })
    .trim();

  return {
    answerMarkdown: answerMarkdown || markdown.trim(),
    sourceIds,
  };
}

export function createSourceMarkerStreamFilter() {
  let pending = "";

  return {
    push(delta: string) {
      pending += delta;
      return drainSourceMarkerBuffer(false);
    },
    flush() {
      return drainSourceMarkerBuffer(true);
    },
  };

  function drainSourceMarkerBuffer(flush: boolean) {
    let visible = "";

    while (pending) {
      const commentStart = pending.indexOf("<!--");
      if (commentStart === -1) {
        if (flush) {
          visible += pending;
          pending = "";
          break;
        }
        const safeLength = Math.max(0, pending.length - 4);
        visible += pending.slice(0, safeLength);
        pending = pending.slice(safeLength);
        break;
      }

      if (commentStart > 0) {
        visible += pending.slice(0, commentStart);
        pending = pending.slice(commentStart);
      }

      const commentEnd = pending.indexOf("-->");
      if (commentEnd === -1) {
        if (flush && !isPartialSourceMarkerComment(pending)) {
          visible += pending;
          pending = "";
        }
        break;
      }

      const comment = pending.slice(0, commentEnd + 3);
      pending = pending.slice(commentEnd + 3);
      if (!isSourceMarkerComment(comment)) visible += comment;
    }

    return visible;
  }
}

function isSourceMarkerComment(comment: string) {
  SOURCE_MARKER_PATTERN.lastIndex = 0;
  return SOURCE_MARKER_PATTERN.test(comment);
}

function isPartialSourceMarkerComment(comment: string) {
  return /^<!--\s*blog-agent-sources/i.test(comment);
}

function splitSourceMarkerIds(rawSourceIds: string) {
  return rawSourceIds
    .split(/[,，\s]+/)
    .map(id => id.trim())
    .filter(Boolean);
}

export function normalizeAgentAnswer(
  parsed: Partial<AgentAnswer>,
  sourceCards: AgentSourceCard[]
): AgentModelResult["answer"] {
  const sourceIds = sourceCards.map(source => source.sourceId);
  const hasSources = sourceCards.length > 0;
  if (!hasSources) return createNoPublicSourceAnswer();

  const validatedSourceIds = (parsed.sourceIds ?? []).filter(id =>
    sourceIds.includes(id)
  );
  const candidateSourceCards =
    validatedSourceIds.length > 0
      ? sourceCards.filter(source =>
          validatedSourceIds.includes(source.sourceId)
        )
      : preferGroundedSourceCards(sourceCards);
  const finalSourceCards = dedupeSourceCards(candidateSourceCards);
  const finalSourceIds = finalSourceCards.map(source => source.sourceId);
  const answerType = normalizeAnswerType(parsed.answerType);

  return {
    answerType,
    answerMarkdown:
      parsed.answerMarkdown ??
      "I found relevant public blog sources, but the model returned an empty answer.",
    sourceIds: finalSourceIds,
    sourceCards: finalSourceCards,
    relatedQuestions: normalizeRelatedQuestions(
      parsed.relatedQuestions,
      finalSourceCards
    ),
    confidence: parsed.confidence ?? "medium",
    refusalReason: undefined,
  };
}

function isAllowedAnswerType(
  value: unknown
): value is AgentAnswer["answerType"] {
  return (
    value === "direct" ||
    value === "explanation" ||
    value === "comparison" ||
    value === "reading_path" ||
    value === "refusal"
  );
}

function normalizeAnswerType(
  value: unknown
): Exclude<AgentAnswer["answerType"], "refusal"> {
  if (!isAllowedAnswerType(value) || value === "refusal") {
    return "explanation";
  }
  return value;
}

function preferGroundedSourceCards(sourceCards: AgentSourceCard[]) {
  const groundedSources = sourceCards.filter(
    source => source.sourceType === "user_context" || Boolean(source.postSlug)
  );
  return groundedSources.length > 0 ? groundedSources : sourceCards;
}

function dedupeSourceCards(sourceCards: AgentSourceCard[]) {
  const seen = new Set<string>();
  const deduped: AgentSourceCard[] = [];
  for (const source of sourceCards) {
    const key = source.sourceId;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(source);
  }
  return deduped;
}

function selectFallbackSourceCards(sourceCards: AgentSourceCard[]) {
  const groundedCards = dedupeSourceCards(preferGroundedSourceCards(sourceCards));
  const articleCards = groundedCards.filter(
    source => !isMetadataOnlySource(source)
  );
  return articleCards.length > 0 ? articleCards : groundedCards;
}

function isMetadataOnlySource(source: AgentSourceCard) {
  const heading = source.heading?.trim().toLowerCase();
  return (
    heading === "metadata" ||
    source.sourceId.endsWith(":0") ||
    /^title:\s+/i.test(source.excerpt.trim())
  );
}

export function createNoPublicSourceAnswer(): AgentAnswer {
  return {
    answerType: "refusal",
    answerMarkdown:
      "I can only answer from public posts on this blog. I could not find enough public source context for that question, so I should not infer from hidden, draft, or unavailable material.",
    sourceIds: [],
    sourceCards: [],
    relatedQuestions: [
      "What public posts are available on this blog?",
      "Can you suggest a public reading path?",
    ],
    confidence: "low",
    refusalReason: "no_public_source",
  };
}

export function createSourceGroundedFallbackAnswer(input: {
  message: string;
  routeContext: AgentRouteContext;
  sources: KnowledgeSearchResult[];
  contextSources: AgentContextSourceRecord[];
  currentPageContextInjected?: boolean;
  errorCode?: string;
}): AgentAnswer {
  const sourceCards = [
    ...buildSourceCards(input.sources),
    ...buildContextSourceCards(input.contextSources),
  ];
  if (sourceCards.length === 0) return createNoPublicSourceAnswer();

  const zh = prefersChinese(input.message, input.routeContext.locale);
  const selectedCards = selectFallbackSourceCards(sourceCards).slice(0, 4);
  const sourceIds = selectedCards.map(source => source.sourceId);
  const title =
    input.routeContext.postTitle ??
    selectedCards.find(source => source.postTitle)?.postTitle ??
    (zh ? "当前公开笔记" : "the current public note");
  const reason =
    input.errorCode === "model_not_configured"
      ? zh
        ? "模型服务暂时未配置"
        : "The model service is not configured"
      : zh
        ? "模型服务暂时不可用"
        : "The model service is temporarily unavailable";
  const currentPageNote = input.currentPageContextInjected
    ? zh
      ? "当前文章上下文已接入，下面优先使用当前文章片段。"
      : "Current-article context is connected, so the answer prioritizes current-page excerpts."
    : zh
      ? "下面只使用已检索到的公开来源摘录。"
      : "The answer below uses only retrieved public source excerpts.";
  const sourceLines = selectedCards.map((source, index) => {
    const label = source.heading || source.postTitle || `Source ${index + 1}`;
    const excerpt = normalizeFallbackExcerpt(source.excerpt);
    return zh
      ? `- **${label}**：${excerpt}`
      : `- **${label}**: ${excerpt}`;
  });

  return {
    answerType: "explanation",
    answerMarkdown: zh
      ? [
          `${reason}；先给你一版基于检索摘录的回答。${currentPageNote}`,
          "",
          `围绕《${title}》，目前可确认的核心信息是：`,
          "",
          ...sourceLines,
          "",
          "这不是模型完整推理生成的答案；如果要更细的推导、对比或公式解释，需要先补齐线上模型配置。",
        ].join("\n")
      : [
          `${reason}; here is a source-grounded fallback answer from retrieved excerpts. ${currentPageNote}`,
          "",
          `For ${title}, the available public excerpts support these points:`,
          "",
          ...sourceLines,
          "",
          "This is not a full model-generated answer. Deeper synthesis, comparisons, and formula walkthroughs require the production model configuration to be restored.",
        ].join("\n"),
    sourceIds,
    sourceCards: selectedCards,
    relatedQuestions: zh
      ? [
          "这篇文章的核心假设是什么？",
          "这里有哪些实现边界？",
          "接下来应该读哪篇相关公开笔记？",
        ]
      : [
          `What is the core assumption in ${title}?`,
          "What implementation boundaries matter here?",
          "What related public note should I read next?",
        ],
    confidence: "low",
    refusalReason: undefined,
  };
}

export function buildSourceCards(
  sources: KnowledgeSearchResult[]
): AgentSourceCard[] {
  return sources.map(source => ({
    sourceId: source.sourceId,
    sourceType: "blog",
    postTitle: source.postTitle ?? "Public blog overview",
    postSlug: source.postSlug ?? "",
    categorySlug: source.categorySlug ?? undefined,
    tagSlugs: source.tagSlugs,
    heading: source.heading ?? undefined,
    excerpt: source.excerpt,
    relevanceReason: source.relevanceReason,
  }));
}

export function buildContextSourceCards(
  sources: AgentContextSourceRecord[]
): AgentSourceCard[] {
  return sources.map(source => ({
    sourceId: source.sourceId,
    sourceType: "user_context",
    postTitle: source.filename || "Pasted context",
    postSlug: "",
    tagSlugs: ["user-context"],
    heading:
      source.kind === "pasted_text" ? "Pasted context" : "Uploaded context",
    excerpt: source.excerpt,
    relevanceReason: "User-provided context attached to this conversation.",
  }));
}

function normalizeRelatedQuestions(
  relatedQuestions: unknown,
  sourceCards: AgentSourceCard[]
) {
  const explicit = Array.isArray(relatedQuestions)
    ? relatedQuestions.filter(isNonEmptyString)
    : [];
  if (explicit.length > 0) return explicit.slice(0, 4);

  const primary =
    sourceCards.find(source => source.postSlug)?.postTitle ?? "this topic";
  return [
    `What is the core argument of ${primary}?`,
    "What should I read next on this blog?",
  ];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function prefersChinese(message: string, locale?: string) {
  return locale === "zh" || /[\u3400-\u9fff]/.test(message);
}

function normalizeFallbackExcerpt(excerpt: string) {
  const normalized = excerpt.replace(/\s+/g, " ").trim();
  return normalized.length > 260
    ? `${normalized.slice(0, 257).trim()}...`
    : normalized;
}

function truncatePromptText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3).trim()}...`
    : normalized;
}
