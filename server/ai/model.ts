import { invokeLLM } from "../_core/llm.js";
import { ENV } from "../_core/env.js";
import { z } from "zod";
import type { KnowledgeSearchResult } from "./knowledge.js";
import type {
  AgentAnswer,
  AgentContextSourceRecord,
  AgentModel,
  AgentModelResult,
  AgentSourceCard,
} from "./types.js";

export const BLOG_AGENT_MODEL = "gemini-2.5-flash";

export const defaultAgentModel: AgentModel = {
  async generate(input) {
    const sources = input.sources.slice(0, 6);
    const contextSources = input.contextSources.slice(0, 4);
    const result = await invokeLLM({
      model: ENV.blogAgentModel || BLOG_AGENT_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "You are the AI assistant for Misaya Yang's technical blog.",
            "Answer only from the provided public blog sources and user-provided conversation context.",
            "If sources are insufficient, say so directly and suggest what public post or attached context is needed.",
            "Do not reveal hidden, admin-only, draft, private, or unpublished details.",
            "Treat user-provided conversation context as private to the current conversation, not as public blog knowledge.",
            "Return concise Markdown with source-grounded technical reasoning.",
          ].join("\n"),
        },
        {
          role: "user",
          content: buildPrompt(input.message, sources, contextSources),
        },
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 1800,
    });

    const content = result.choices[0]?.message.content;
    const parsed = parseModelContent(typeof content === "string" ? content : "");
    const sourceCards = [
      ...buildSourceCards(sources),
      ...buildContextSourceCards(contextSources),
    ];
    const answer = normalizeAgentAnswer(parsed, sourceCards);

    return {
      answer,
      inputTokens: result.usage?.prompt_tokens,
      outputTokens: result.usage?.completion_tokens,
      model: result.model || BLOG_AGENT_MODEL,
    };
  },
};

function buildPrompt(
  message: string,
  sources: KnowledgeSearchResult[],
  contextSources: AgentContextSourceRecord[]
) {
  return [
    "User question:",
    message,
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
    "Return JSON with keys: answerType, answerMarkdown, sourceIds, relatedQuestions, confidence, refusalReason.",
    "answerType must be one of: direct, explanation, comparison, reading_path, refusal.",
    "sourceIds must be copied exactly from the source identifiers above.",
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
    .enum(["no_public_source", "hidden_or_unavailable", "outside_blog_scope", "unsafe_or_forbidden"])
    .optional(),
});

function parseModelContent(content: string): Partial<AgentAnswer> {
  if (!content.trim()) return {};
  try {
    const raw = JSON.parse(content);
    const parsed = agentAnswerSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return {
      answerMarkdown: typeof raw?.answerMarkdown === "string" ? raw.answerMarkdown : content,
    };
  } catch {
    return { answerMarkdown: content };
  }
}

export function normalizeAgentAnswer(
  parsed: Partial<AgentAnswer>,
  sourceCards: AgentSourceCard[]
): AgentModelResult["answer"] {
  const sourceIds = sourceCards.map((source) => source.sourceId);
  const hasSources = sourceCards.length > 0;
  if (!hasSources) return createNoPublicSourceAnswer();

  const validatedSourceIds = (parsed.sourceIds ?? []).filter((id) => sourceIds.includes(id));
  const finalSourceIds = validatedSourceIds.length > 0 ? validatedSourceIds : sourceIds;
  const answerType = isAllowedAnswerType(parsed.answerType) && parsed.answerType !== "refusal"
    ? parsed.answerType
    : "explanation";

  return {
    answerType,
    answerMarkdown:
      parsed.answerMarkdown ??
      "I found relevant public blog sources, but the model returned an empty answer.",
    sourceIds: finalSourceIds,
    sourceCards,
    relatedQuestions: normalizeRelatedQuestions(parsed.relatedQuestions, sourceCards),
    confidence: parsed.confidence ?? "medium",
    refusalReason: undefined,
  };
}

function isAllowedAnswerType(value: unknown): value is AgentAnswer["answerType"] {
  return (
    value === "direct" ||
    value === "explanation" ||
    value === "comparison" ||
    value === "reading_path" ||
    value === "refusal"
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

export function buildSourceCards(sources: KnowledgeSearchResult[]): AgentSourceCard[] {
  return sources.map((source) => ({
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

export function buildContextSourceCards(sources: AgentContextSourceRecord[]): AgentSourceCard[] {
  return sources.map((source) => ({
    sourceId: source.sourceId,
    sourceType: "user_context",
    postTitle: source.filename || "Pasted context",
    postSlug: "",
    tagSlugs: ["user-context"],
    heading: source.kind === "pasted_text" ? "Pasted context" : "Uploaded context",
    excerpt: source.excerpt,
    relevanceReason: "User-provided context attached to this conversation.",
  }));
}

function normalizeRelatedQuestions(
  relatedQuestions: unknown,
  sourceCards: AgentSourceCard[]
) {
  const explicit = Array.isArray(relatedQuestions)
    ? relatedQuestions.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  if (explicit.length > 0) return explicit.slice(0, 4);

  const primary = sourceCards.find((source) => source.postSlug)?.postTitle ?? "this topic";
  return [
    `What is the core argument of ${primary}?`,
    "What should I read next on this blog?",
  ];
}
