import dotenv from "dotenv";
import fs from "node:fs";
import postgres from "postgres";
import { contentSeriesCatalog } from "./shared/content-series.ts";

dotenv.config({ quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

const seedArgs = new Set(process.argv.slice(2));
const knownArgs = new Set(["--help", "-h", "--validate-only", "--check"]);
const unknownArgs = [...seedArgs].filter(arg => !knownArgs.has(arg));
const validateOnly = seedArgs.has("--validate-only") || seedArgs.has("--check");

if (seedArgs.has("--help") || seedArgs.has("-h")) {
  console.log(`Usage: pnpm db:seed [--validate-only]

Seeds the owner, categories, tags, and canonical research posts.

Options:
  --validate-only, --check  Validate seed metadata without connecting to the database.
  --help, -h                Show this message without writing to the database.`);
  process.exit(0);
}

if (unknownArgs.length > 0) {
  console.error(`Unknown seed option(s): ${unknownArgs.join(", ")}`);
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && !validateOnly) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = DATABASE_URL ? postgres(DATABASE_URL, { prepare: false }) : null;

const categorySeeds = [
  {
    name: "AI Algorithms",
    slug: "ai-algorithms",
    description:
      "Model architecture, Transformers, feed-forward mechanisms, position encoding, long-context behavior, and algorithmic reliability research",
  },
  {
    name: "AI Applications",
    slug: "ai-applications",
    description:
      "Agent systems, RAG, context engineering, evaluation harnesses, fine-tuning, and AI application infrastructure",
  },
];

const seriesSeeds = contentSeriesCatalog;

const posts = [
  {
    title: "EVQ-Cosh: RoPE as a Finite Spectral Budget",
    slug: "evq-cosh-frequency-allocation",
    contentPath: "./dfrope_blog_post.md",
    categorySlug: "ai-algorithms",
    status: "draft",
    visibility: "hidden",
    pinnedTrack: "algorithms",
    excerpt:
      "把 RoPE inverse frequency table 当成有限光谱预算：频率不是默认表，而是一个可以推导、实现和消融的初始化选择。",
    tags: [
      { name: "EVQ-Cosh", slug: "evq-cosh" },
      { name: "RoPE", slug: "rope" },
      { name: "Position Encoding", slug: "position-encoding" },
      { name: "Long Context", slug: "long-context" },
      { name: "Transformer", slug: "transformer" },
    ],
  },
  {
    title: "IsoHC: Fixed-Vector Isometric Residual Mixing",
    slug: "isohc-fixed-vector-isometric-residual-mixing",
    contentPath: "./isohc_blog.md",
    categorySlug: "ai-algorithms",
    status: "published",
    visibility: "public",
    publishedAt: "2026-05-31T00:00:00.000Z",
    featuredRank: 4,
    pinnedTrack: "algorithms",
    excerpt:
      "从多 stream 残差混合里的一个稳定性疑问出发：如果平均方向不能漂，残差能量也不能漏，混合矩阵应该长什么样？",
    tags: [
      { name: "IsoHC", slug: "isohc" },
      { name: "Hyper-Connections", slug: "hyper-connections" },
      { name: "Residual Stability", slug: "residual-stability" },
      { name: "Orthogonal Projection", slug: "orthogonal-projection" },
      { name: "Transformer", slug: "transformer" },
      { name: "GNN", slug: "gnn" },
    ],
  },
  {
    title: "Gated FFN: Transformer 里的乘法通道",
    slug: "gated-ffn-multiplicative-channel-control",
    contentPath: "./gated_ffn_blog.md",
    categorySlug: "ai-algorithms",
    status: "published",
    visibility: "public",
    publishedAt: "2026-06-06T00:00:00.000Z",
    featuredRank: 5,
    pinnedTrack: "algorithms",
    excerpt:
      "从普通 FFN 推到 GLU、GEGLU 和 SwiGLU：门控 FFN 如何把逐 token MLP 变成输入依赖的通道控制器。",
    tags: [
      { name: "Gated FFN", slug: "gated-ffn" },
      { name: "SwiGLU", slug: "swiglu" },
      { name: "GEGLU", slug: "geglu" },
      { name: "Feed-Forward Network", slug: "feed-forward-network" },
      { name: "Transformer", slug: "transformer" },
      { name: "Channel Mixing", slug: "channel-mixing" },
      { name: "MLP", slug: "mlp" },
    ],
  },
  {
    title: "Flow Matching：从扩散噪声到确定性运输",
    slug: "flow-matching-generative-transport",
    contentPath: "./flow_matching_generative_transport.md",
    categorySlug: "ai-algorithms",
    status: "published",
    visibility: "public",
    publishedAt: "2026-06-16T00:00:00.000Z",
    featuredRank: 6,
    pinnedTrack: "algorithms",
    excerpt:
      "把生成模型从反向去噪改写成概率路径、速度场和数值采样的运输问题：Flow Matching 如何连接 Diffusion、CNF、Rectified Flow 与 OT-CFM。",
    tags: [
      { name: "Flow Matching", slug: "flow-matching" },
      { name: "Generative Modeling", slug: "generative-modeling" },
      { name: "Diffusion Models", slug: "diffusion-models" },
      { name: "Rectified Flow", slug: "rectified-flow" },
      { name: "Optimal Transport", slug: "optimal-transport" },
      { name: "Continuous Normalizing Flow", slug: "continuous-normalizing-flow" },
      { name: "Transformer", slug: "transformer" },
    ],
  },
  {
    title: "大模型强化学习：从 RLHF 到可验证奖励的后训练主线",
    slug: "llm-rl-post-training-verifiable-rewards",
    contentPath: "./llm_rl_post_training.md",
    categorySlug: "ai-algorithms",
    status: "published",
    visibility: "public",
    publishedAt: "2026-06-17T00:00:00.000Z",
    featuredRank: 7,
    pinnedTrack: "algorithms",
    excerpt:
      "把后训练看成反馈系统设计：RLHF、DPO、RLAIF、RLVR、GRPO、PRM 与 verifier 分别解决奖励来源、策略更新、可验证反馈和 reward hacking 控制的问题。",
    tags: [
      { name: "RLHF", slug: "rlhf" },
      { name: "Reinforcement Learning", slug: "reinforcement-learning" },
      { name: "Post-training", slug: "post-training" },
      { name: "Preference Optimization", slug: "preference-optimization" },
      { name: "DPO", slug: "dpo" },
      { name: "RLVR", slug: "rlvr" },
      { name: "GRPO", slug: "grpo" },
      { name: "Verifier", slug: "verifier" },
      { name: "Agent RL", slug: "agent-rl" },
    ],
  },
  {
    title:
      "Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context",
    slug: "agent-harness-engine-evaluating-tool-using-agents",
    contentPath: "./agent_harness_engine_blog.md",
    categorySlug: "ai-applications",
    status: "published",
    visibility: "public",
    publishedAt: "2026-05-31T00:10:00.000Z",
    featuredRank: 3,
    pinnedTrack: "applications",
    excerpt:
      "从一次难以复盘的 Agent trace 开始，拆出 task spec、context builder、tool sandbox、trace store 与 evaluator。",
    tags: [
      { name: "Agent Systems", slug: "agent-systems" },
      { name: "Harness Engine", slug: "harness-engine" },
      { name: "RAG", slug: "rag" },
      { name: "Context Engineering", slug: "context-engineering" },
      { name: "Fine-tuning", slug: "fine-tuning" },
      { name: "Evaluation", slug: "evaluation" },
      { name: "Observability", slug: "observability" },
      { name: "Tool Use", slug: "tool-use" },
    ],
  },
  {
    title: "Evidence Packet: Agentic RAG 的上下文编译接口",
    slug: "rag-evidence-packet-context-compiler",
    contentPath: "./rag_evidence_packet_context_compiler.md",
    categorySlug: "ai-applications",
    status: "published",
    visibility: "public",
    publishedAt: "2026-05-31T00:20:00.000Z",
    featuredRank: 2,
    pinnedTrack: "applications",
    excerpt:
      "RAG 的难点不止是找几个 chunk，而是让检索结果在进入 Agent 前变成可引用、可裁剪、可复盘的证据包。",
    tags: [
      { name: "Agent Systems", slug: "agent-systems" },
      { name: "Agentic RAG", slug: "agentic-rag" },
      { name: "RAG", slug: "rag" },
      { name: "Knowledge Base", slug: "knowledge-base" },
      { name: "Context Compiler", slug: "context-compiler" },
      { name: "Context Engineering", slug: "context-engineering" },
      { name: "Hybrid Search", slug: "hybrid-search" },
      { name: "Evaluation", slug: "evaluation" },
      { name: "Observability", slug: "observability" },
    ],
  },
  {
    title: "Agent Loop: 从 ReAct 模式到可观测运行时",
    slug: "agent-loop-observable-tool-using-agents",
    contentPath: "./agent_loop_blog.md",
    categorySlug: "ai-applications",
    status: "published",
    visibility: "public",
    publishedAt: "2026-05-31T00:30:00.000Z",
    featuredRank: 1,
    pinnedTrack: "applications",
    excerpt:
      "从一段看似简单的 while-loop 伪代码出发，拆开状态、工具、预算、检查点和 trace 如何共同约束 Agent 行动。",
    tags: [
      { name: "Agent Systems", slug: "agent-systems" },
      { name: "AgentLoop", slug: "agent-loop" },
      { name: "Tool Use", slug: "tool-use" },
      { name: "Context Engineering", slug: "context-engineering" },
      { name: "Session Management", slug: "session-management" },
      { name: "Rate Limiting", slug: "rate-limiting" },
      { name: "Guardrails", slug: "guardrails" },
      { name: "Evaluation", slug: "evaluation" },
      { name: "Observability", slug: "observability" },
    ],
  },
  {
    title: "Goal Harness: 让 Codex / Claude Code 持续完整工作的工程协议",
    slug: "goal-harness-agent-phase-protocol",
    contentPath: "./goal_harness_agent_phase_protocol.md",
    categorySlug: "ai-applications",
    status: "published",
    visibility: "public",
    publishedAt: "2026-05-31T00:40:00.000Z",
    featuredRank: 0,
    pinnedTrack: "applications",
    excerpt:
      "复盘一次博客 Agent 改造：schema、router、UI 和测试名都在，但文章感知、检索、source card、quota 与 trace 没有闭环。Goal Harness 把这些验收点编译成可交接的 phase、闸门和证据报告。",
    tags: [
      { name: "Agent Systems", slug: "agent-systems" },
      { name: "Goal Harness", slug: "goal-harness" },
      { name: "Codex", slug: "codex" },
      { name: "Claude Code", slug: "claude-code" },
      { name: "Context Engineering", slug: "context-engineering" },
      { name: "Evaluation", slug: "evaluation" },
      { name: "Observability", slug: "observability" },
      { name: "Tool Use", slug: "tool-use" },
    ],
  },
];

const primarySeriesByPostSlug = buildPrimarySeriesByPostSlug(seriesSeeds);

function buildPrimarySeriesByPostSlug(series) {
  const byPostSlug = new Map();

  for (const item of series) {
    const publicSlugs = item.orderedPostSlugs ?? [];
    const privateSlugs = item.privatePostSlugs ?? [];

    [...publicSlugs, ...privateSlugs].forEach((postSlug, index) => {
      if (byPostSlug.has(postSlug)) return;
      byPostSlug.set(postSlug, {
        seriesSlug: item.slug,
        seriesTitle: item.title,
        seriesOrder: index + 1,
      });
    });
  }

  return byPostSlug;
}

function getPostSeriesMetadata(postSeed) {
  return (
    primarySeriesByPostSlug.get(postSeed.slug) ?? {
      seriesSlug: null,
      seriesTitle: null,
      seriesOrder: null,
    }
  );
}

function getCanonicalPublishedAt(postSeed) {
  if (postSeed.status !== "published") return null;
  return new Date(postSeed.publishedAt);
}

function assertValidDate(value, label) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
}

function validateContentSeeds() {
  const postsBySlug = new Map();

  for (const postSeed of posts) {
    if (postsBySlug.has(postSeed.slug)) {
      throw new Error(`Duplicate post slug: ${postSeed.slug}`);
    }
    postsBySlug.set(postSeed.slug, postSeed);

    if (!postSeed.excerpt?.trim()) {
      throw new Error(`Missing excerpt for ${postSeed.slug}`);
    }
    if (!postSeed.tags?.length) {
      throw new Error(`Missing tags for ${postSeed.slug}`);
    }
    if (!fs.existsSync(postSeed.contentPath)) {
      throw new Error(
        `Missing content file for ${postSeed.slug}: ${postSeed.contentPath}`
      );
    }

    if (postSeed.status === "published" && postSeed.visibility === "public") {
      const publishedAt = getCanonicalPublishedAt(postSeed);
      assertValidDate(publishedAt, `publishedAt for ${postSeed.slug}`);
      if (!primarySeriesByPostSlug.has(postSeed.slug)) {
        throw new Error(
          `Missing primary series for public post ${postSeed.slug}`
        );
      }
    }
  }

  for (const seriesSeed of seriesSeeds) {
    if (
      !seriesSeed.slug ||
      !seriesSeed.title ||
      !seriesSeed.promise ||
      !seriesSeed.track
    ) {
      throw new Error(
        `Incomplete series seed: ${seriesSeed.slug || "(missing slug)"}`
      );
    }

    for (const postSlug of seriesSeed.orderedPostSlugs ?? []) {
      const postSeed = postsBySlug.get(postSlug);
      if (!postSeed)
        throw new Error(
          `Unknown post slug in series ${seriesSeed.slug}: ${postSlug}`
        );
      if (postSeed.status !== "published" || postSeed.visibility !== "public") {
        throw new Error(
          `Public series ${seriesSeed.slug} includes non-public post ${postSlug}`
        );
      }
    }

    for (const postSlug of seriesSeed.privatePostSlugs ?? []) {
      const postSeed = postsBySlug.get(postSlug);
      if (!postSeed)
        throw new Error(
          `Unknown private post slug in series ${seriesSeed.slug}: ${postSlug}`
        );
      if (postSeed.status === "published" && postSeed.visibility === "public") {
        throw new Error(
          `Private series association includes public post ${postSlug}`
        );
      }
    }
  }
}

async function upsertTags(tags) {
  if (!sql) throw new Error("Database connection not available");
  const tagIds = [];

  for (const tag of tags) {
    const [createdTag] = await sql`
      INSERT INTO tags (name, slug)
      VALUES (${tag.name}, ${tag.slug})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    tagIds.push(createdTag.id);
  }

  return tagIds;
}

async function seed() {
  console.log("Starting seed...");

  try {
    validateContentSeeds();
    if (validateOnly) {
      console.log("Seed content validation passed.");
      return;
    }
    if (!sql) throw new Error("Database connection not available");

    const ownerOpenId = process.env.OWNER_OPEN_ID;
    if (!ownerOpenId) {
      console.error("OWNER_OPEN_ID not found");
      process.exit(1);
    }

    const [owner] = await sql`
      INSERT INTO users ("openId", name, role, "lastSignedIn")
      VALUES (${ownerOpenId}, ${process.env.OWNER_NAME || "Admin"}, 'admin', now())
      ON CONFLICT ("openId") DO UPDATE SET
        name = EXCLUDED.name,
        role = 'admin',
        "lastSignedIn" = now()
      RETURNING id
    `;

    console.log("User ID:", owner.id);

    await sql`
      UPDATE categories
      SET
        name = ${"AI Algorithms"},
        slug = ${"ai-algorithms"},
        description = ${categorySeeds[0].description},
        updated_at = now()
      WHERE slug = ${"deep-learning"}
      AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = ${"ai-algorithms"})
    `;

    const categoryBySlug = new Map();
    for (const categorySeed of categorySeeds) {
      const [category] = await sql`
        INSERT INTO categories (name, slug, description)
        VALUES (${categorySeed.name}, ${categorySeed.slug}, ${categorySeed.description})
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          updated_at = now()
        RETURNING id, slug
      `;
      categoryBySlug.set(category.slug, category);
      console.log("Category:", category.slug, "ID:", category.id);
    }

    const algorithmCategory = categoryBySlug.get("ai-algorithms");
    if (algorithmCategory) {
      await sql`
        UPDATE posts
        SET category_id = ${algorithmCategory.id}
        WHERE category_id IN (SELECT id FROM categories WHERE slug = ${"deep-learning"})
      `;
      await sql`DELETE FROM categories WHERE slug = ${"deep-learning"}`;
    }

    await sql`
      DELETE FROM post_tags
      WHERE post_id IN (
        SELECT id FROM posts WHERE slug = ${"dynamic-frequency-rope"}
      )
    `;
    await sql`DELETE FROM posts WHERE slug = ${"dynamic-frequency-rope"}`;

    for (const postSeed of posts) {
      const content = fs.readFileSync(postSeed.contentPath, "utf-8");
      const tagIds = await upsertTags(postSeed.tags);
      const category = categoryBySlug.get(postSeed.categorySlug);
      const seriesMetadata = getPostSeriesMetadata(postSeed);
      const canonicalPublishedAt = getCanonicalPublishedAt(postSeed);

      if (!category) {
        throw new Error(`Missing category seed for ${postSeed.categorySlug}`);
      }

      let [post] = await sql`
        INSERT INTO posts (
          title,
          slug,
          content,
          excerpt,
          status,
          visibility,
          category_id,
          author_id,
          series_slug,
          series_title,
          series_order,
          featured_rank,
          pinned_track,
          published_at,
          view_count
        )
        VALUES (
          ${postSeed.title},
          ${postSeed.slug},
          ${content},
          ${postSeed.excerpt},
          ${postSeed.status},
          ${postSeed.visibility},
          ${category.id},
          ${owner.id},
          ${seriesMetadata.seriesSlug},
          ${seriesMetadata.seriesTitle},
          ${seriesMetadata.seriesOrder},
          ${postSeed.featuredRank ?? null},
          ${postSeed.pinnedTrack ?? null},
          ${canonicalPublishedAt},
          0
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          excerpt = EXCLUDED.excerpt,
          status = EXCLUDED.status,
          visibility = EXCLUDED.visibility,
          category_id = EXCLUDED.category_id,
          author_id = EXCLUDED.author_id,
          series_slug = EXCLUDED.series_slug,
          series_title = EXCLUDED.series_title,
          series_order = EXCLUDED.series_order,
          featured_rank = EXCLUDED.featured_rank,
          pinned_track = EXCLUDED.pinned_track,
          published_at = CASE
            WHEN EXCLUDED.status = 'published'
            THEN COALESCE(posts.published_at, EXCLUDED.published_at)
            ELSE NULL
          END
        WHERE posts.title IS DISTINCT FROM EXCLUDED.title
          OR posts.content IS DISTINCT FROM EXCLUDED.content
          OR posts.excerpt IS DISTINCT FROM EXCLUDED.excerpt
          OR posts.status IS DISTINCT FROM EXCLUDED.status
          OR posts.visibility IS DISTINCT FROM EXCLUDED.visibility
          OR posts.category_id IS DISTINCT FROM EXCLUDED.category_id
          OR posts.author_id IS DISTINCT FROM EXCLUDED.author_id
          OR posts.series_slug IS DISTINCT FROM EXCLUDED.series_slug
          OR posts.series_title IS DISTINCT FROM EXCLUDED.series_title
          OR posts.series_order IS DISTINCT FROM EXCLUDED.series_order
          OR posts.featured_rank IS DISTINCT FROM EXCLUDED.featured_rank
          OR posts.pinned_track IS DISTINCT FROM EXCLUDED.pinned_track
          OR (posts.published_at IS NULL AND EXCLUDED.published_at IS NOT NULL)
          OR (EXCLUDED.status <> 'published' AND posts.published_at IS NOT NULL)
        RETURNING id
      `;

      if (!post) {
        [post] = await sql`
          SELECT id
          FROM posts
          WHERE slug = ${postSeed.slug}
          LIMIT 1
        `;
      }

      await sql`DELETE FROM post_tags WHERE post_id = ${post.id}`;
      for (const tagId of tagIds) {
        await sql`
          INSERT INTO post_tags (post_id, tag_id)
          VALUES (${post.id}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }

      console.log("Seeded post:", postSeed.slug, "Post ID:", post.id);
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await sql?.end();
  }
}

seed();
