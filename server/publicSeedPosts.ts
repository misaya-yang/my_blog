import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Category, Post, Tag } from "../drizzle/schema.js";

type PublicSeedPost = {
  title: string;
  slug: string;
  contentPath: string;
  category: Pick<Category, "id" | "name" | "slug" | "description">;
  publishedAt: string;
  featuredRank: number;
  pinnedTrack: "algorithms" | "applications";
  excerpt: string;
  tags: Array<Pick<Tag, "id" | "name" | "slug">>;
};

type PublicSeedArticle = Post & {
  category: Category;
  tags: Tag[];
};

const createdAt = new Date("2026-05-31T00:00:00.000Z");

const categories = {
  algorithms: {
    id: 1,
    name: "AI Algorithms",
    slug: "ai-algorithms",
    description: "Model mechanisms, architecture, and long-context behavior.",
  },
  applications: {
    id: 2,
    name: "AI Applications",
    slug: "ai-applications",
    description: "Agent systems, RAG, tooling, and evaluation loops.",
  },
} satisfies Record<string, Pick<Category, "id" | "name" | "slug" | "description">>;

const publicSeedPosts: PublicSeedPost[] = [
  {
    title: "IsoHC: Fixed-Vector Isometric Residual Mixing",
    slug: "isohc-fixed-vector-isometric-residual-mixing",
    contentPath: "isohc_blog.md",
    category: categories.algorithms,
    publishedAt: "2026-05-31T00:00:00.000Z",
    featuredRank: 4,
    pinnedTrack: "algorithms",
    excerpt:
      "从多 stream 残差混合里的一个稳定性疑问出发：如果平均方向不能漂，残差能量也不能漏，混合矩阵应该长什么样？",
    tags: [
      { id: 1, name: "IsoHC", slug: "isohc" },
      { id: 2, name: "Hyper-Connections", slug: "hyper-connections" },
      { id: 3, name: "Residual Stability", slug: "residual-stability" },
      { id: 4, name: "Orthogonal Projection", slug: "orthogonal-projection" },
      { id: 5, name: "Transformer", slug: "transformer" },
      { id: 6, name: "GNN", slug: "gnn" },
    ],
  },
  {
    title: "Gated FFN: Transformer 里的乘法通道",
    slug: "gated-ffn-multiplicative-channel-control",
    contentPath: "gated_ffn_blog.md",
    category: categories.algorithms,
    publishedAt: "2026-06-06T00:00:00.000Z",
    featuredRank: 5,
    pinnedTrack: "algorithms",
    excerpt:
      "从普通 FFN 推到 GLU、GEGLU 和 SwiGLU：门控 FFN 如何把逐 token MLP 变成输入依赖的通道控制器。",
    tags: [
      { id: 7, name: "Gated FFN", slug: "gated-ffn" },
      { id: 8, name: "SwiGLU", slug: "swiglu" },
      { id: 9, name: "GEGLU", slug: "geglu" },
      { id: 10, name: "Feed-Forward Network", slug: "feed-forward-network" },
      { id: 5, name: "Transformer", slug: "transformer" },
      { id: 11, name: "Channel Mixing", slug: "channel-mixing" },
      { id: 12, name: "MLP", slug: "mlp" },
    ],
  },
  {
    title:
      "Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context",
    slug: "agent-harness-engine-evaluating-tool-using-agents",
    contentPath: "agent_harness_engine_blog.md",
    category: categories.applications,
    publishedAt: "2026-05-31T00:10:00.000Z",
    featuredRank: 3,
    pinnedTrack: "applications",
    excerpt:
      "从一次难以复盘的 Agent trace 开始，拆出 task spec、context builder、tool sandbox、trace store 与 evaluator。",
    tags: [
      { id: 13, name: "Agent Systems", slug: "agent-systems" },
      { id: 14, name: "Harness Engine", slug: "harness-engine" },
      { id: 15, name: "RAG", slug: "rag" },
      { id: 16, name: "Context Engineering", slug: "context-engineering" },
      { id: 17, name: "Fine-tuning", slug: "fine-tuning" },
      { id: 18, name: "Evaluation", slug: "evaluation" },
      { id: 19, name: "Observability", slug: "observability" },
      { id: 20, name: "Tool Use", slug: "tool-use" },
    ],
  },
  {
    title: "Evidence Packet: Agentic RAG 的上下文编译接口",
    slug: "rag-evidence-packet-context-compiler",
    contentPath: "rag_evidence_packet_context_compiler.md",
    category: categories.applications,
    publishedAt: "2026-05-31T00:20:00.000Z",
    featuredRank: 2,
    pinnedTrack: "applications",
    excerpt:
      "RAG 的难点不止是找几个 chunk，而是让检索结果在进入 Agent 前变成可引用、可裁剪、可复盘的证据包。",
    tags: [
      { id: 13, name: "Agent Systems", slug: "agent-systems" },
      { id: 21, name: "Agentic RAG", slug: "agentic-rag" },
      { id: 15, name: "RAG", slug: "rag" },
      { id: 22, name: "Knowledge Base", slug: "knowledge-base" },
      { id: 23, name: "Context Compiler", slug: "context-compiler" },
      { id: 16, name: "Context Engineering", slug: "context-engineering" },
      { id: 24, name: "Hybrid Search", slug: "hybrid-search" },
      { id: 18, name: "Evaluation", slug: "evaluation" },
      { id: 19, name: "Observability", slug: "observability" },
    ],
  },
  {
    title: "Agent Loop: 从 ReAct 模式到可观测运行时",
    slug: "agent-loop-observable-tool-using-agents",
    contentPath: "agent_loop_blog.md",
    category: categories.applications,
    publishedAt: "2026-05-31T00:30:00.000Z",
    featuredRank: 1,
    pinnedTrack: "applications",
    excerpt:
      "从一段看似简单的 while-loop 伪代码出发，拆开状态、工具、预算、检查点和 trace 如何共同约束 Agent 行动。",
    tags: [
      { id: 13, name: "Agent Systems", slug: "agent-systems" },
      { id: 25, name: "AgentLoop", slug: "agent-loop" },
      { id: 20, name: "Tool Use", slug: "tool-use" },
      { id: 16, name: "Context Engineering", slug: "context-engineering" },
      { id: 26, name: "Session Management", slug: "session-management" },
      { id: 27, name: "Rate Limiting", slug: "rate-limiting" },
      { id: 28, name: "Guardrails", slug: "guardrails" },
      { id: 18, name: "Evaluation", slug: "evaluation" },
      { id: 19, name: "Observability", slug: "observability" },
    ],
  },
  {
    title: "Goal Harness: 让 Codex / Claude Code 持续完整工作的工程协议",
    slug: "goal-harness-agent-phase-protocol",
    contentPath: "goal_harness_agent_phase_protocol.md",
    category: categories.applications,
    publishedAt: "2026-05-31T00:40:00.000Z",
    featuredRank: 0,
    pinnedTrack: "applications",
    excerpt:
      "一次“看起来跑完了”的 Coding Agent 失败复盘：PRD 如何被编译成 phase、验收闸门和证据报告。",
    tags: [
      { id: 13, name: "Agent Systems", slug: "agent-systems" },
      { id: 29, name: "Goal Harness", slug: "goal-harness" },
      { id: 30, name: "Codex", slug: "codex" },
      { id: 31, name: "Claude Code", slug: "claude-code" },
      { id: 16, name: "Context Engineering", slug: "context-engineering" },
      { id: 18, name: "Evaluation", slug: "evaluation" },
      { id: 19, name: "Observability", slug: "observability" },
      { id: 20, name: "Tool Use", slug: "tool-use" },
    ],
  },
];

export async function getPublicSeedArticleBySlug(
  slug: string
): Promise<PublicSeedArticle | null> {
  const seed = publicSeedPosts.find(post => post.slug === slug);
  if (!seed) return null;

  const content = await readFile(path.resolve(process.cwd(), seed.contentPath), "utf-8").catch(
    () => null
  );
  if (!content) return null;

  const publishedAt = new Date(seed.publishedAt);
  const post: Post = {
    id: -publicSeedPosts.indexOf(seed) - 1,
    title: seed.title,
    slug: seed.slug,
    content,
    excerpt: seed.excerpt,
    coverImage: null,
    status: "published",
    visibility: "public",
    categoryId: seed.category.id,
    authorId: 1,
    seriesSlug: null,
    seriesTitle: null,
    seriesOrder: null,
    featuredRank: seed.featuredRank,
    pinnedTrack: seed.pinnedTrack,
    viewCount: 0,
    publishedAt,
    createdAt,
    updatedAt: publishedAt,
  };

  return {
    ...post,
    category: {
      ...seed.category,
      createdAt,
      updatedAt: createdAt,
    },
    tags: seed.tags.map(tag => ({ ...tag, createdAt })),
  };
}
