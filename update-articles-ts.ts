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
  const dfropeContent = readFileSync(path.resolve("dfrope_blog_en.md"), "utf-8");
  const isohcContent = readFileSync(path.resolve("isohc_blog_en.md"), "utf-8");

  await sql`
    UPDATE posts
    SET
      title = ${"Dynamic Frequency RoPE: My Journey to Solving Long-Sequence Transformers"},
      content = ${dfropeContent},
      excerpt = ${"When I first started working with Transformers on long sequences, I quickly ran into a fundamental problem: how do we help these models understand position in sequences that are much longer than what they were trained on? In this post, I share how I developed Dynamic Frequency RoPE (DF-RoPE)."},
      updated_at = now()
    WHERE slug = ${"dynamic-frequency-rope"}
  `;

  console.log("DFRoPE article updated!");

  await sql`
    UPDATE posts
    SET
      title = ${"IsoHC: How I Solved the Stability Crisis in Hyper-Connections"},
      content = ${isohcContent},
      excerpt = ${"When I first encountered Hyper-Connections, I was excited by its potential. But as I scaled up my experiments, training became unstable at depth. In this post, I share how I developed IsoHC-a new manifold constraint that preserves both global stream mean and l2 energy along residuals."},
      updated_at = now()
    WHERE slug = ${"isohc-stability-crisis"}
  `;

  console.log("IsoHC article updated!");
}

updateArticles()
  .finally(() => sql.end())
  .then(() => {
    console.log("Articles updated successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
