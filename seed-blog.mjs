import "dotenv/config";
import fs from "node:fs";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

const blogContent = fs.readFileSync("./dfrope_blog_post.md", "utf-8");
const excerpt = `${blogContent.substring(0, 200).replace(/[#*\n]/g, " ").trim()}...`;

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
      VALUES (${"深度学习"}, ${"deep-learning"}, ${"深度学习、神经网络和Transformer架构相关研究"})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = now()
      RETURNING id
    `;

    console.log("Category ID:", category.id);

    const seedTags = [
      { name: "Transformer", slug: "transformer" },
      { name: "位置编码", slug: "position-encoding" },
      { name: "RoPE", slug: "rope" },
      { name: "长序列", slug: "long-sequence" },
    ];

    const tagIds = [];
    for (const tag of seedTags) {
      const [createdTag] = await sql`
        INSERT INTO tags (name, slug)
        VALUES (${tag.name}, ${tag.slug})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      tagIds.push(createdTag.id);
    }

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
        ${"Dynamic Frequency RoPE: 长序列Transformer的积分频率调制"},
        ${"dynamic-frequency-rope"},
        ${blogContent},
        ${excerpt},
        'published',
        ${category.id},
        ${owner.id},
        now(),
        0
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        status = EXCLUDED.status,
        category_id = EXCLUDED.category_id,
        author_id = EXCLUDED.author_id,
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

    console.log("Seed completed successfully!");
    console.log("Post ID:", post.id);
    console.log("Tag IDs:", tagIds);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
