import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sql = postgres(DATABASE_URL, { prepare: false });

const dfropeContent = readFileSync(path.join(projectRoot, "dfrope_blog_en.md"), "utf-8");
const isohcContent = readFileSync(path.join(projectRoot, "isohc_blog_en.md"), "utf-8");

try {
  await sql`
    UPDATE posts
    SET
      title = ${"Dynamic Frequency RoPE: My Journey to Solving Long-Sequence Transformers"},
      content = ${dfropeContent},
      excerpt = ${"When I first started working with Transformers on long sequences, I quickly ran into a fundamental problem: how do we help these models understand position in sequences that are much longer than what they were trained on? In this post, I share how I developed Dynamic Frequency RoPE (DF-RoPE)."},
      visibility = 'public',
      updated_at = now()
    WHERE slug = ${"dynamic-frequency-rope"}
  `;

  await sql`
    INSERT INTO posts (
      title,
      slug,
      content,
      excerpt,
      status,
      visibility,
      category_id,
      author_id,
      published_at
    )
    VALUES (
      ${"IsoHC: How I Solved the Stability Crisis in Hyper-Connections"},
      ${"isohc-stability-crisis"},
      ${isohcContent},
      ${"When I first encountered Hyper-Connections, I was excited by its potential. But as I scaled up my experiments, training became unstable at depth. In this post, I share how I developed IsoHC-a new manifold constraint that preserves both global stream mean and l2 energy along residuals."},
      'published',
      'public',
      1,
      1,
      now()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      excerpt = EXCLUDED.excerpt,
      status = EXCLUDED.status,
      visibility = EXCLUDED.visibility,
      category_id = EXCLUDED.category_id,
      author_id = EXCLUDED.author_id,
      updated_at = now()
  `;

  console.log("Articles updated successfully!");
} finally {
  await sql.end();
}
