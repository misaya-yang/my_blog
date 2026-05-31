import type { AgentScope } from "./types.js";

export type AgentGoldenQuestion = {
  id: string;
  category: string;
  question: string;
  expectedBehavior: "sources" | "refusal";
  expectedSourceSlugs: string[];
  scope?: AgentScope;
  notes: string[];
};

export const AGENT_GOLDEN_QUESTIONS: AgentGoldenQuestion[] = [
  {
    id: "isohc-core",
    category: "IsoHC",
    question: "What problem does IsoHC solve?",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    notes: ["Should cite the public IsoHC article."],
  },
  {
    id: "isohc-invariants",
    category: "IsoHC",
    question: "What exact invariants does IsoHC preserve?",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    notes: ["Should retrieve a section-level IsoHC source when available."],
  },
  {
    id: "isohc-mixed-zh-latin",
    category: "IsoHC",
    question: "帮我详细讲讲iso",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    notes: ["Mixed Chinese/Latin shorthand should resolve to IsoHC."],
  },
  {
    id: "isohc-mixed-zh-title",
    category: "IsoHC",
    question: "帮我详细讲讲IsoHC",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    notes: ["Mixed Chinese/Latin title mention should resolve to IsoHC."],
  },
  {
    id: "isohc-short-alias",
    category: "IsoHC",
    question: "iso 是什么",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    notes: ["Short non-standard iso alias should resolve to the public IsoHC article."],
  },
  {
    id: "isohc-zh-concepts",
    category: "IsoHC",
    question: "残差稳定性那篇讲了什么",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    notes: ["Chinese residual stability terms should resolve to the IsoHC article."],
  },
  {
    id: "isohc-current-post-core",
    category: "IsoHC",
    question: "这篇文章核心是什么？",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    scope: { type: "post", value: "isohc-fixed-vector-isometric-residual-mixing" },
    notes: ["Vague current-article questions should use current public post context."],
  },
  {
    id: "isohc-current-post-invariants",
    category: "IsoHC",
    question: "这里的不变量是什么？",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["isohc-fixed-vector-isometric-residual-mixing"],
    scope: { type: "post", value: "isohc-fixed-vector-isometric-residual-mixing" },
    notes: ["Current-post deictic questions should use public article context."],
  },
  {
    id: "agent-harness",
    category: "Agent Harness Engine",
    question: "How does Agent Harness differ from a normal chatbot?",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["agent-harness-engine-evaluating-tool-using-agents"],
    notes: ["Should cite the public harness article."],
  },
  {
    id: "evidence-packet",
    category: "Evidence Packet",
    question: "What is the role of an Evidence Packet in agentic RAG?",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["rag-evidence-packet-context-compiler"],
    notes: ["Should cite the public Evidence Packet article."],
  },
  {
    id: "agent-loop",
    category: "AgentLoop",
    question: "How does AgentLoop turn ReAct into an observable runtime?",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["agent-loop-observable-tool-using-agents"],
    notes: ["Should cite the public Agent Loop article."],
  },
  {
    id: "agent-systems-reading-path",
    category: "Reading Path",
    question: "Build me a reading path for agent systems and evaluation.",
    expectedBehavior: "sources",
    expectedSourceSlugs: [
      "agent-harness-engine-evaluating-tool-using-agents",
      "rag-evidence-packet-context-compiler",
      "agent-loop-observable-tool-using-agents",
    ],
    notes: ["Should retrieve multiple AI Applications posts if indexed."],
  },
  {
    id: "agentloop-find-page",
    category: "Reading Path",
    question: "帮我找 AgentLoop 那篇",
    expectedBehavior: "sources",
    expectedSourceSlugs: ["agent-loop-observable-tool-using-agents"],
    notes: ["Find-page intent should retrieve the Agent Loop public post."],
  },
  {
    id: "iso-standard-refusal",
    category: "Refusal",
    question: "ISO 8601 是什么？",
    expectedBehavior: "refusal",
    expectedSourceSlugs: [],
    notes: ["Standards-style ISO questions must not be treated as IsoHC."],
  },
  {
    id: "hidden-evq-refusal",
    category: "Refusal",
    question: "Can you explain EVQ-Cosh hidden details?",
    expectedBehavior: "refusal",
    expectedSourceSlugs: [],
    notes: ["Hidden/admin/draft content must not appear in retrieval results."],
  },
  {
    id: "outside-scope-refusal",
    category: "Refusal",
    question: "What is the weather in Tokyo tomorrow?",
    expectedBehavior: "refusal",
    expectedSourceSlugs: [],
    notes: ["Out-of-blog questions should have no public blog source."],
  },
];

export function getGoldenQuestionsForInput(questions?: string[]) {
  if (!questions?.length) return AGENT_GOLDEN_QUESTIONS;
  return questions.slice(0, 20).map((question, index) => {
    const matched = AGENT_GOLDEN_QUESTIONS.find(
      (item) => item.question.toLowerCase() === question.toLowerCase()
    );
    return matched ?? {
      id: `custom-${index + 1}`,
      category: "Custom",
      question,
      expectedBehavior: "sources" as const,
      expectedSourceSlugs: [],
      notes: ["Custom question: pass requires at least one public source."],
    };
  });
}
