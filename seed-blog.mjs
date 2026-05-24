import "dotenv/config";
import fs from "node:fs";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

const categorySeed = {
  name: "Deep Learning",
  slug: "deep-learning",
  description:
    "Deep learning, Transformers, position encoding, and residual stability research",
};

const posts = [
  {
    title: "EVQ-Cosh: RoPE as a Finite Spectral Budget",
    slug: "evq-cosh-frequency-allocation",
    contentPath: "./dfrope_blog_post.md",
    status: "draft",
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
    status: "published",
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
];

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

    const [category] = await sql`
      INSERT INTO categories (name, slug, description)
      VALUES (${categorySeed.name}, ${categorySeed.slug}, ${categorySeed.description})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = now()
      RETURNING id
    `;

    console.log("Category ID:", category.id);

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

      const [post] = await sql`
        INSERT INTO posts (
          title,
          slug,
          content,
          excerpt,
          status,
          category_id,
          author_id,
          published_at,
          view_count
        )
        VALUES (
          ${postSeed.title},
          ${postSeed.slug},
          ${content},
          ${postSeed.excerpt},
          ${postSeed.status},
          ${category.id},
          ${owner.id},
          ${postSeed.status === "published" ? new Date() : null},
          0
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          excerpt = EXCLUDED.excerpt,
          status = EXCLUDED.status,
          category_id = EXCLUDED.category_id,
          author_id = EXCLUDED.author_id,
          published_at = EXCLUDED.published_at,
          updated_at = now()
        RETURNING id
      `;

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
