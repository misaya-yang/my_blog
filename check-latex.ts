import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not found");
}

const sql = postgres(DATABASE_URL, { prepare: false });

const result = await sql`
  SELECT content
  FROM posts
  WHERE slug = ${"evq-cosh-frequency-allocation"}
  LIMIT 1
`;

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

await sql.end();
