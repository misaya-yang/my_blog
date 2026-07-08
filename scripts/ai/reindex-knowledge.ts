import {
  getKnowledgeIndexStatus,
  reindexPublicKnowledgeChunks,
} from "../../server/ai/knowledgeDb.js";
import type { AgentKnowledgeIndexStatusOutput } from "../../server/ai/types.js";
import { closeDb } from "../../server/db.js";

export type ReindexKnowledgeOptions = {
  dryRun: boolean;
};

export function parseReindexKnowledgeArgs(
  argv: string[]
): ReindexKnowledgeOptions {
  const options: ReindexKnowledgeOptions = { dryRun: false };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else {
      throw new Error(`Unknown ai:reindex argument: ${arg}`);
    }
  }

  return options;
}

export function formatKnowledgeStatusLines(
  status: AgentKnowledgeIndexStatusOutput
) {
  const lines = [
    `AI knowledge status: ${status.indexedPublicPostCount}/${status.publicPostCount} public posts indexed, ${status.hiddenOrDraftExcludedCount} hidden/draft excluded`,
  ];

  if (
    status.stalePublicPostSlugs.length > 0 ||
    status.extraIndexedPostSlugs.length > 0
  ) {
    lines.push(
      `AI knowledge attention: stale=[${status.stalePublicPostSlugs.join(", ")}], extra=[${status.extraIndexedPostSlugs.join(", ")}]`
    );
  }

  if (status.latestReindexError) {
    lines.push(`AI knowledge latest error: ${status.latestReindexError}`);
  }

  return lines;
}

async function main() {
  const options = parseReindexKnowledgeArgs(process.argv.slice(2));

  if (options.dryRun) {
    const status = await getKnowledgeIndexStatus();
    console.log("AI knowledge reindex dry run: no database writes performed");
    for (const line of formatKnowledgeStatusLines(status)) {
      console.log(line);
    }
    return;
  }

  const result = await reindexPublicKnowledgeChunks();
  const status = await getKnowledgeIndexStatus();
  console.log(
    `AI knowledge reindex complete: ${result.created} created, ${result.deleted} deleted, ${result.skipped} skipped`
  );
  for (const line of formatKnowledgeStatusLines(status)) {
    console.log(line);
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
