import { describe, expect, it } from "vitest";
import { getStalePublicPostSlugs } from "./knowledgeDb";
import type { KnowledgeChunkDraft } from "./knowledge";

function chunk(
  postSlug: string,
  chunkIndex: number,
  contentHash: string
): KnowledgeChunkDraft {
  return {
    chunkType: "post_chunk",
    postId: 1,
    postSlug,
    postTitle: "Public post",
    categorySlug: "ai-applications",
    tagSlugs: ["agent-systems"],
    statusSnapshot: "published",
    visibilitySnapshot: "public",
    locale: "en",
    chunkIndex,
    heading: "Section",
    sectionPath: "Section",
    content: "Content",
    summary: null,
    keywords: [],
    contentHash,
    tokenEstimate: 1,
  };
}

describe("knowledge index status drift", () => {
  it("marks a public post stale when old indexed chunks remain", () => {
    const staleSlugs = getStalePublicPostSlugs({
      expectedChunks: [chunk("agent-loop", 1, "fresh-hash")],
      publicRows: [
        {
          postSlug: "agent-loop",
          chunkIndex: 1,
          chunkType: "post_chunk",
          contentHash: "fresh-hash",
        },
        {
          postSlug: "agent-loop",
          chunkIndex: 2,
          chunkType: "post_chunk",
          contentHash: "old-hash",
        },
      ],
      publicPostSlugs: new Set(["agent-loop"]),
    });

    expect(staleSlugs).toEqual(["agent-loop"]);
  });
});
