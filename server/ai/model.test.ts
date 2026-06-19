import { describe, expect, it } from "vitest";
import {
  createSourceMarkerStreamFilter,
  createSourceGroundedFallbackAnswer,
  createNoPublicSourceAnswer,
  createNoPublicSourceAnswerForInput,
  normalizeAgentAnswer,
  parseMarkdownAnswerWithSourceMarker,
  buildSourceCards,
} from "./model";
import type { KnowledgeSearchResult } from "./knowledge";
import type { AgentSourceCard } from "./types";

const harnessSource: AgentSourceCard = {
  sourceId: "agent-harness-engine:3",
  postTitle:
    "Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context",
  postSlug: "agent-harness-engine-evaluating-tool-using-agents",
  categorySlug: "ai-applications",
  tagSlugs: ["harness-engine", "agent-systems"],
  heading: "Harness Architecture",
  excerpt:
    "A minimal harness engine can be modeled as a loop around a typed task contract.",
  relevanceReason: "Matched harness architecture terms.",
};

const isohcKnowledgeSource: KnowledgeSearchResult = {
  chunkType: "post_chunk",
  postId: 2,
  postSlug: "isohc-fixed-vector-isometric-residual-mixing",
  postTitle: "IsoHC: Fixed-Vector Isometric Residual Mixing",
  categorySlug: "ai-algorithms",
  tagSlugs: ["isohc", "residual-stability"],
  statusSnapshot: "published",
  visibilitySnapshot: "public",
  locale: "zh",
  chunkIndex: 1,
  heading: "Residual Stability",
  sectionPath: "Residual Stability",
  content:
    "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold.",
  summary: null,
  keywords: ["isohc", "residual", "stability"],
  contentHash: "isohc-hash",
  tokenEstimate: 24,
  sourceId: "post:isohc-fixed-vector-isometric-residual-mixing:1",
  score: 12,
  excerpt:
    "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold.",
  relevanceReason: "Current public article context.",
};

const isohcMetadataSource: KnowledgeSearchResult = {
  ...isohcKnowledgeSource,
  chunkIndex: 0,
  heading: "Metadata",
  sectionPath: "Metadata",
  sourceId: "post:isohc-fixed-vector-isometric-residual-mixing:0",
  excerpt:
    "Title: IsoHC: Fixed-Vector Isometric Residual Mixing Slug: isohc-fixed-vector-isometric-residual-mixing",
};

describe("agent answer quality normalization", () => {
  it("normalizes invalid answer types and preserves real source cards", () => {
    const answer = normalizeAgentAnswer(
      {
        answerType: "grounded" as any,
        answerMarkdown: "Harness engines make agent evaluation repeatable.",
        sourceIds: ["hallucinated", harnessSource.sourceId],
        relatedQuestions: ["How does the context builder work?"],
        confidence: "high",
      },
      [harnessSource]
    );

    expect(answer.answerType).toBe("explanation");
    expect(answer.sourceIds).toEqual([harnessSource.sourceId]);
    expect(answer.sourceCards).toEqual([harnessSource]);
    expect(answer.relatedQuestions).toEqual([
      "How does the context builder work?",
    ]);
  });

  it("falls back to all retrieved source ids when the model omits valid ids", () => {
    const answer = normalizeAgentAnswer(
      {
        answerMarkdown: "The article explains the harness boundary.",
        sourceIds: [],
      },
      [harnessSource]
    );

    expect(answer.sourceIds).toEqual([harnessSource.sourceId]);
    expect(answer.relatedQuestions.length).toBeGreaterThan(0);
  });

  it("removes visible model work notes from the answer body", () => {
    const answer = normalizeAgentAnswer(
      {
        answerMarkdown: [
          "我需要用简洁的中文回答，基于这些来源。",
          "这篇文章的核心是把 AgentLoop 写成受控运行时。",
        ].join("\n"),
        sourceIds: [harnessSource.sourceId],
      },
      [harnessSource]
    );

    expect(answer.answerMarkdown).toBe(
      "这篇文章的核心是把 AgentLoop 写成受控运行时。"
    );
  });

  it("shows only the source cards selected by valid model source ids", () => {
    const relatedSource: AgentSourceCard = {
      ...harnessSource,
      sourceId: "agent-loop:1",
      postTitle: "Agent Loop: Observable Tool-Using Agents",
      postSlug: "agent-loop-observable-tool-using-agents",
    };

    const answer = normalizeAgentAnswer(
      {
        answerMarkdown: "AgentLoop is the relevant article for this question.",
        sourceIds: [relatedSource.sourceId],
      },
      [harnessSource, relatedSource]
    );

    expect(answer.sourceIds).toEqual([relatedSource.sourceId]);
    expect(answer.sourceCards).toEqual([relatedSource]);
  });

  it("extracts hidden source markers from streamed Markdown and filters source cards to selected ids", () => {
    const secondHarnessChunk: AgentSourceCard = {
      ...harnessSource,
      sourceId: "agent-harness-engine:7",
      heading: "Failure Modes",
    };
    const parsed = parseMarkdownAnswerWithSourceMarker(
      [
        "Harness engines keep evaluation grounded in traceable context.",
        "",
        "<!-- blog-agent-sources: agent-harness-engine:7, hallucinated-id -->",
      ].join("\n")
    );
    const answer = normalizeAgentAnswer(parsed, [
      harnessSource,
      secondHarnessChunk,
    ]);

    expect(answer.answerMarkdown).toBe(
      "Harness engines keep evaluation grounded in traceable context."
    );
    expect(answer.sourceIds).toEqual([secondHarnessChunk.sourceId]);
    expect(answer.sourceCards).toEqual([secondHarnessChunk]);
  });

  it("falls back safely when streamed Markdown omits a source marker", () => {
    const parsed = parseMarkdownAnswerWithSourceMarker(
      "Harness engines keep evaluation grounded in traceable context."
    );
    const answer = normalizeAgentAnswer(parsed, [harnessSource]);

    expect(parsed.sourceIds).toEqual([]);
    expect(answer.sourceIds).toEqual([harnessSource.sourceId]);
  });

  it("filters hidden source markers from streamed answer deltas", () => {
    const filter = createSourceMarkerStreamFilter();
    const chunks = [
      "Answer with math $H^\\top H=I$.",
      "\n\n<!",
      "-- blog-agent-sources: ",
      "agent-harness-engine:3",
      " -->",
    ];
    const visible =
      chunks.map(chunk => filter.push(chunk)).join("") + filter.flush();

    expect(visible).toBe("Answer with math $H^\\top H=I$.\n\n");
    expect(visible).not.toContain("blog-agent-sources");
  });

  it("falls back to section-level article cards instead of site overview noise", () => {
    const secondHarnessChunk: AgentSourceCard = {
      ...harnessSource,
      sourceId: "agent-harness-engine:7",
      heading: "Failure Modes",
    };
    const siteOverview: AgentSourceCard = {
      sourceId: "site_overview_chunk:0",
      postTitle: "Public blog overview",
      postSlug: "",
      tagSlugs: ["agent-systems"],
      heading: "Public blog map",
      excerpt: "Public posts include Agent Harness and Agent Loop.",
      relevanceReason: "Matched public blog context.",
    };

    const answer = normalizeAgentAnswer(
      {
        answerMarkdown: "The harness article is the relevant source.",
        sourceIds: [],
      },
      [harnessSource, secondHarnessChunk, siteOverview]
    );

    expect(answer.sourceIds).toEqual([
      harnessSource.sourceId,
      secondHarnessChunk.sourceId,
    ]);
    expect(answer.sourceCards).toEqual([harnessSource, secondHarnessChunk]);
  });

  it("returns a public-source refusal without exposing unavailable material", () => {
    const answer = createNoPublicSourceAnswer();

    expect(answer.answerType).toBe("refusal");
    expect(answer.refusalReason).toBe("no_public_source");
    expect(answer.sourceCards).toEqual([]);
    expect(answer.answerMarkdown).not.toContain("EVQ");
  });

  it("localizes public-source refusal for Chinese reader questions", () => {
    const answer = createNoPublicSourceAnswerForInput({
      message: "这个博客都有哪几篇文章？",
      routeContext: {
        path: "/",
        routeType: "home",
        locale: "zh",
      },
    });

    expect(answer.answerType).toBe("refusal");
    expect(answer.answerMarkdown).toContain("公开文章");
    expect(answer.answerMarkdown).not.toContain("I can only answer");
    expect(answer.relatedQuestions[0]).toContain("公开文章");
  });

  it("builds a source-grounded fallback answer when the production model is not configured", () => {
    const answer = createSourceGroundedFallbackAnswer({
      message: "解释这篇文章里的核心抽象。",
      routeContext: {
        path: "/post/isohc-fixed-vector-isometric-residual-mixing",
        routeType: "post",
        postSlug: "isohc-fixed-vector-isometric-residual-mixing",
        postTitle: "IsoHC: Fixed-Vector Isometric Residual Mixing",
        locale: "zh",
      },
      sources: [isohcMetadataSource, isohcKnowledgeSource],
      contextSources: [],
      currentPageContextInjected: true,
      errorCode: "model_not_configured",
    });

    expect(answer.answerType).toBe("explanation");
    expect(answer.confidence).toBe("low");
    expect(answer.answerMarkdown).toContain("模型服务暂时未配置");
    expect(answer.answerMarkdown).toContain("当前文章上下文已接入");
    expect(answer.answerMarkdown).toContain("Residual Stability");
    expect(answer.sourceIds).toEqual([isohcKnowledgeSource.sourceId]);
    expect(answer.sourceIds).not.toContain(isohcMetadataSource.sourceId);
    expect(answer.sourceCards[0]).toMatchObject({
      postSlug: "isohc-fixed-vector-isometric-residual-mixing",
      sourceType: "blog",
      anchorId: "residual-stability",
    });
  });

  it("builds source-card anchors only from semantic section text", () => {
    const [headingCard, emptyHeadingCard] = buildSourceCards([
      {
        ...isohcKnowledgeSource,
        heading: "2. Runtime Stack",
        sectionPath: "2. Runtime Stack",
        sourceId: "post:isohc-fixed-vector-isometric-residual-mixing:2",
      },
      {
        ...isohcKnowledgeSource,
        heading: "",
        sectionPath: "",
        sourceId: "post:isohc-fixed-vector-isometric-residual-mixing:3",
      },
    ]);

    expect(headingCard.anchorId).toBe("2-runtime-stack");
    expect(emptyHeadingCard.anchorId).toBeUndefined();
  });
});
