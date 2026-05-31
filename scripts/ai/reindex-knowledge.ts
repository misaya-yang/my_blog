import { getKnowledgeIndexStatus, reindexPublicKnowledgeChunks } from "../../server/ai/knowledgeDb.js";
import { closeDb } from "../../server/db.js";

async function main() {
  const result = await reindexPublicKnowledgeChunks();
  const status = await getKnowledgeIndexStatus();
  console.log(
    `AI knowledge reindex complete: ${result.created} created, ${result.deleted} deleted, ${result.skipped} skipped`
  );
  console.log(
    `AI knowledge status: ${status.indexedPublicPostCount}/${status.publicPostCount} public posts indexed, ${status.hiddenOrDraftExcludedCount} hidden/draft excluded`
  );
  if (status.stalePublicPostSlugs.length > 0 || status.extraIndexedPostSlugs.length > 0) {
    console.log(
      `AI knowledge attention: stale=[${status.stalePublicPostSlugs.join(", ")}], extra=[${status.extraIndexedPostSlugs.join(", ")}]`
    );
  }
}

main()
  .catch((error) => {
    console.error("AI knowledge reindex failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
