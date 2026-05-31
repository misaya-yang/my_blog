import dotenv from "dotenv";
import fs from "node:fs";
import postgres from "postgres";

dotenv.config({ quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

const categorySeeds = [
  {
    name: "AI Algorithms",
    slug: "ai-algorithms",
    description:
      "Model architecture, Transformers, position encoding, long-context behavior, and algorithmic reliability research",
  },
  {
    name: "AI Applications",
    slug: "ai-applications",
    description:
      "Agent systems, RAG, context engineering, evaluation harnesses, fine-tuning, and AI application infrastructure",
  },
];

const seriesSeeds = [
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
    ],
    expectedNext: [
      "Tool ABI: typed capabilities for agent runtimes",
      "Context Budget: deciding what enters a model window",
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
  },
];

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
      "EVQ-Cosh treats RoPE inverse frequencies as a finite spectral allocation problem and derives a closed-form initialization rule for rotary channels.",
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
    contentPath: "./isohc_blog_en.md",
    categorySlug: "ai-algorithms",
    status: "published",
    visibility: "public",
    publishedAt: "2026-05-31T00:00:00.000Z",
    featuredRank: 4,
    pinnedTrack: "algorithms",
    excerpt:
      "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold, preserving both stream mean and residual energy in deep architectures.",
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
      "A harness engine makes tool-using agents observable and repeatable by controlling task protocols, context policy, tool traces, and evaluation signals.",
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
      "把知识库从 top-k chunk 搜索升级为面向 Agent 的上下文编译器，用 Evidence Packet 统一检索信号、来源引用、权限范围、token budget、trace 和评测。",
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
      "Agent Loop 将 ReAct 式多步行为收束为可观测运行时：用状态机、上下文构建器、决策合约、工具运行时、预算、检查点和 trace 管理模型行动。",
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
  return primarySeriesByPostSlug.get(postSeed.slug) ?? {
    seriesSlug: null,
    seriesTitle: null,
    seriesOrder: null,
  };
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

    if (postSeed.status === "published" && postSeed.visibility === "public") {
      const publishedAt = getCanonicalPublishedAt(postSeed);
      assertValidDate(publishedAt, `publishedAt for ${postSeed.slug}`);
      if (!primarySeriesByPostSlug.has(postSeed.slug)) {
        throw new Error(`Missing primary series for public post ${postSeed.slug}`);
      }
    }
  }

  for (const seriesSeed of seriesSeeds) {
    if (!seriesSeed.slug || !seriesSeed.title || !seriesSeed.promise || !seriesSeed.track) {
      throw new Error(`Incomplete series seed: ${seriesSeed.slug || "(missing slug)"}`);
    }

    for (const postSlug of seriesSeed.orderedPostSlugs ?? []) {
      const postSeed = postsBySlug.get(postSlug);
      if (!postSeed) throw new Error(`Unknown post slug in series ${seriesSeed.slug}: ${postSlug}`);
      if (postSeed.status !== "published" || postSeed.visibility !== "public") {
        throw new Error(`Public series ${seriesSeed.slug} includes non-public post ${postSlug}`);
      }
    }

    for (const postSlug of seriesSeed.privatePostSlugs ?? []) {
      const postSeed = postsBySlug.get(postSlug);
      if (!postSeed) throw new Error(`Unknown private post slug in series ${seriesSeed.slug}: ${postSlug}`);
      if (postSeed.status === "published" && postSeed.visibility === "public") {
        throw new Error(`Private series association includes public post ${postSlug}`);
      }
    }
  }
}

async function upsertTags(tags) {
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
    await sql.end();
  }
}

seed();
