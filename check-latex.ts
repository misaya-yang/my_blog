import { drizzle } from "drizzle-orm/mysql2";
import { posts } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL as string);

const result = await db.select().from(posts).where(eq(posts.slug, 'dynamic-frequency-rope')).limit(1);

if (result.length > 0) {
  const content = result[0].content;
  console.log("First 800 chars of stored content:");
  console.log(content.substring(0, 800));
  console.log("\n---\nSearching for LaTeX patterns:");
  const latexMatches = content.match(/\$[^\$]+\$/g);
  if (latexMatches) {
    console.log("Found inline LaTeX:", latexMatches.slice(0, 10));
  } else {
    console.log("No inline LaTeX found!");
  }
  const blockLatexMatches = content.match(/\$\$[^\$]+\$\$/g);
  if (blockLatexMatches) {
    console.log("Found block LaTeX:", blockLatexMatches.slice(0, 5));
  } else {
    console.log("No block LaTeX found!");
  }
}
