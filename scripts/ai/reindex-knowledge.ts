import { reindexPublicKnowledgeChunks } from "../../server/ai/knowledgeDb.js";
import { closeDb } from "../../server/db.js";

async function main() {
  const result = await reindexPublicKnowledgeChunks();
  console.log(
    `AI knowledge reindex complete: ${result.created} created, ${result.deleted} deleted, ${result.skipped} skipped`
  );
}

main()
  .catch((error) => {
    console.error("AI knowledge reindex failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
