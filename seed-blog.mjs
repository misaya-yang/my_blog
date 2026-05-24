import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// Read the blog post
const blogContent = fs.readFileSync("./dfrope_blog_post.md", "utf-8");

// Extract excerpt (first 200 characters)
const excerpt = blogContent.substring(0, 200).replace(/[#*\n]/g, " ").trim() + "...";

async function seed() {
  console.log("Starting seed...");

  try {
    // Get owner user ID
    const ownerOpenId = process.env.OWNER_OPEN_ID;
    if (!ownerOpenId) {
      console.error("OWNER_OPEN_ID not found");
      process.exit(1);
    }

    const connection = await mysql.createConnection(DATABASE_URL);
    
    // Get user
    const [users] = await connection.query(
      "SELECT id FROM users WHERE openId = ? LIMIT 1",
      [ownerOpenId]
    );

    let userId;
    if (users.length === 0) {
      console.log("Creating owner user...");
      const [result] = await connection.query(
        "INSERT INTO users (openId, name, role, lastSignedIn) VALUES (?, ?, ?, NOW())",
        [ownerOpenId, process.env.OWNER_NAME || "Admin", "admin"]
      );
      userId = result.insertId;
    } else {
      userId = users[0].id;
    }

    console.log("User ID:", userId);

    // Create category
    console.log("Creating category...");
    const [categoryResult] = await connection.query(
      "INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
      ["深度学习", "deep-learning", "深度学习、神经网络和Transformer架构相关研究"]
    );
    const categoryId = categoryResult.insertId;

    // Create tags
    console.log("Creating tags...");
    const tags = [
      { name: "Transformer", slug: "transformer" },
      { name: "位置编码", slug: "position-encoding" },
      { name: "RoPE", slug: "rope" },
      { name: "长序列", slug: "long-sequence" },
    ];

    const tagIds = [];
    for (const tag of tags) {
      const [tagResult] = await connection.query(
        "INSERT INTO tags (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
        [tag.name, tag.slug]
      );
      tagIds.push(tagResult.insertId);
    }

    // Create post
    console.log("Creating blog post...");
    const [postResult] = await connection.query(
      "INSERT INTO posts (title, slug, content, excerpt, status, category_id, author_id, published_at, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
      [
        "Dynamic Frequency RoPE: 长序列Transformer的积分频率调制",
        "dynamic-frequency-rope",
        blogContent,
        excerpt,
        "published",
        categoryId,
        userId,
        0,
      ]
    );
    const postId = postResult.insertId;

    // Link tags to post
    console.log("Linking tags to post...");
    for (const tagId of tagIds) {
      await connection.query(
        "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
        [postId, tagId]
      );
    }

    await connection.end();

    console.log("✅ Seed completed successfully!");
    console.log("Post ID:", postId);
    console.log("Category ID:", categoryId);
    console.log("Tag IDs:", tagIds);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
