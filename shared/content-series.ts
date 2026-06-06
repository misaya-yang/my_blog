export type ResearchTrack = "algorithms" | "applications";

export type ContentSeriesDefinition = {
  slug: string;
  title: string;
  promise: string;
  track: ResearchTrack;
  orderedPostSlugs: string[];
  privatePostSlugs?: string[];
  expectedNext: string[];
  titleKey: string;
  promiseKey: string;
  expectedNextKeys: string[];
  conceptKeys: string[];
};

export const contentSeriesCatalog = [
  {
    slug: "agent-runtime-systems",
    title: "Agent Runtime Systems",
    promise:
      "A practical path from controlled agent evaluation to observable multi-step runtimes.",
    track: "applications",
    orderedPostSlugs: [
      "agent-harness-engine-evaluating-tool-using-agents",
      "rag-evidence-packet-context-compiler",
      "agent-loop-observable-tool-using-agents",
      "goal-harness-agent-phase-protocol",
    ],
    expectedNext: [
      "Tool ABI: typed capabilities for agent runtimes",
      "Context Budget: deciding what enters a model window",
    ],
    titleKey: "series.agentRuntime.title",
    promiseKey: "series.agentRuntime.promise",
    expectedNextKeys: [
      "series.agentRuntime.next1",
      "series.agentRuntime.next2",
    ],
    conceptKeys: [
      "track.topic.agentSystems",
      "track.topic.harnessEngine",
      "track.topic.observability",
    ],
  },
  {
    slug: "agentic-rag-infrastructure",
    title: "Agentic RAG Infrastructure",
    promise:
      "A focused series on turning retrieval output into governed, citable agent context.",
    track: "applications",
    orderedPostSlugs: ["rag-evidence-packet-context-compiler"],
    expectedNext: [
      "Hybrid retrieval as evidence construction",
      "Retrieval evals for citation-grade answers",
    ],
    titleKey: "series.agenticRag.title",
    promiseKey: "series.agenticRag.promise",
    expectedNextKeys: ["series.agenticRag.next1", "series.agenticRag.next2"],
    conceptKeys: [
      "track.topic.ragRetrieval",
      "track.topic.contextEngineering",
      "track.topic.evaluation",
    ],
  },
  {
    slug: "long-context-position-encoding",
    title: "Long Context and Position Encoding",
    promise:
      "Mechanistic notes on RoPE, spectral allocation, and long-context behavior.",
    track: "algorithms",
    orderedPostSlugs: [],
    privatePostSlugs: ["evq-cosh-frequency-allocation"],
    expectedNext: [
      "RoPE spectral budget note, pending publication",
      "Long-context extrapolation failure modes",
    ],
    titleKey: "series.longContext.title",
    promiseKey: "series.longContext.promise",
    expectedNextKeys: ["series.longContext.next1", "series.longContext.next2"],
    conceptKeys: [
      "track.topic.positionEncoding",
      "track.topic.rope",
      "track.topic.longContext",
    ],
  },
  {
    slug: "residual-stability",
    title: "Residual Stability",
    promise:
      "Residual stream mixing, invariants, and stability constraints for deep architectures.",
    track: "algorithms",
    orderedPostSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    expectedNext: [
      "Residual mixing diagnostics",
      "Orthogonal constraints in deep sequence models",
    ],
    titleKey: "series.residualStability.title",
    promiseKey: "series.residualStability.promise",
    expectedNextKeys: [
      "series.residualStability.next1",
      "series.residualStability.next2",
    ],
    conceptKeys: [
      "track.topic.residualMixing",
      "track.topic.stability",
      "track.topic.architecture",
    ],
  },
] satisfies ContentSeriesDefinition[];

export function getContentSeriesBySlug(slug: string) {
  return contentSeriesCatalog.find(series => series.slug === slug) ?? null;
}

export function getContentSeriesForTrack(track: ResearchTrack) {
  return contentSeriesCatalog.filter(series => series.track === track);
}
