import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not found");
}

const sql = postgres(DATABASE_URL, { prepare: false });

async function updateArticles() {
  const dfropeContent = readFileSync(
    path.resolve("dfrope_blog_post.md"),
    "utf-8"
  );
  const isohcContent = readFileSync(path.resolve("isohc_blog.md"), "utf-8");

  await sql`
    DELETE FROM post_tags
    WHERE post_id IN (
      SELECT id FROM posts WHERE slug = ${"dynamic-frequency-rope"}
    )
  `;
  await sql`DELETE FROM posts WHERE slug = ${"dynamic-frequency-rope"}`;

  const evqRows = await sql`
    UPDATE posts
    SET
      title = ${"EVQ-Cosh: RoPE as a Finite Spectral Budget"},
      content = ${dfropeContent},
      excerpt = ${"把 RoPE inverse frequency table 当成有限光谱预算：频率不是默认表，而是一个可以推导、实现和消融的初始化选择。"},
      status = 'draft',
      visibility = 'hidden',
      updated_at = now()
    WHERE slug = ${"evq-cosh-frequency-allocation"}
    RETURNING id
  `;
  assertUpdated(evqRows, "evq-cosh-frequency-allocation");

  console.log("EVQ-Cosh article updated!");

  const isohcRows = await sql`
    UPDATE posts
    SET
      title = ${"IsoHC: Fixed-Vector Isometric Residual Mixing"},
      content = ${isohcContent},
      excerpt = ${"从多 stream 残差混合里的一个稳定性疑问出发：如果平均方向不能漂，残差能量也不能漏，混合矩阵应该长什么样？"},
      status = 'published',
      visibility = 'public',
      updated_at = now()
    WHERE slug = ${"isohc-fixed-vector-isometric-residual-mixing"}
    RETURNING id
  `;
  assertUpdated(isohcRows, "isohc-fixed-vector-isometric-residual-mixing");

  console.log("IsoHC article updated!");
}

function assertUpdated(rows: { length: number }, slug: string) {
  if (rows.length > 0) return;
  throw new Error(
    `No post row found for ${slug}. Run pnpm db:seed or pnpm content:publish first.`
  );
}

updateArticles()
  .finally(() => sql.end())
  .then(() => {
    console.log("Articles updated successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
