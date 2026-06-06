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
          input.onAnswerDelta(delta.content);
        }
      }
    );

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
  currentPageContextInjected: boolean
) {
  return [
    buildGroundingContext(
      message,
      routeContext,
      sources,
      contextSources,
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
  currentPageContextInjected: boolean
) {
  return [
    buildGroundingContext(
      message,
      routeContext,
      sources,
      contextSources,
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
