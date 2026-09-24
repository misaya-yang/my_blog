import { extractMarkdownHeadings } from "../shared/heading-anchors.js";
import { estimateReadingMinutes } from "../shared/reading-time.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import {
  recordKnowledgeReindexFailure,
  reindexPublicKnowledgeChunks,
} from "./ai/knowledgeDb.js";
import { agentRouter } from "./ai/router.js";
import { authRouter } from "./auth.router.js";
import { blogAdminProcedure } from "./blogAdminProcedure.js";
import { ENV } from "./_core/env.js";
import * as db from "./db.js";
import { engagementRouter } from "./engagement.router.js";
import { getPublicSeedArticleBySlug } from "./publicSeedPosts.js";
import {
  invalidatePublicArticles,
  loadPublicArticle,
} from "./publicArticle.js";
import { recordSearchMiss } from "./searchMisses.js";
import { verifyAdminSession } from "./auth.js";

const postVisibilityInput = z.enum(["hidden", "admin", "public"]);
const pinnedTrackInput = z
  .enum(["algorithms", "applications"])
  .nullable()
  .optional();
const curationFieldsInput = {
  seriesSlug: z.string().trim().max(120).nullable().optional(),
  seriesTitle: z.string().trim().max(255).nullable().optional(),
  seriesOrder: z.number().int().nullable().optional(),
  featuredRank: z.number().int().positive().nullable().optional(),
  pinnedTrack: pinnedTrackInput,
};

const discoveryPaginationInput = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
});

function normalizeDiscoveryPagination(input: {
  limit?: number;
  offset?: number;
}) {
  return {
    limit: Math.min(Math.max(input.limit ?? 10, 1), 50),
    offset: Math.max(input.offset ?? 0, 0),
  };
}

function normalizeDiscoveryQuery(query: string | undefined) {
  return (query ?? "").trim().replace(/\s+/g, " ");
}

async function refreshAgentKnowledgeAfterPostMutation(action: string) {
  // Every post mutation passes through here: kept public copies are stale.
  invalidatePublicArticles();
  try {
    await reindexPublicKnowledgeChunks();
    return { status: "fresh" as const };
  } catch (error) {
    console.error(
      `[Knowledge] Failed to refresh chunks after ${action}:`,
      error
    );
    recordKnowledgeReindexFailure(error);
    return {
      status: "stale" as const,
      message:
        "Post saved, but Agent knowledge refresh failed. Run pnpm ai:reindex before relying on assistant answers.",
    };
  }
}

export const appRouter = router({
  system: systemRouter,
  agent: agentRouter,
  auth: authRouter,

  discovery: router({
    search: publicProcedure
      .input(
        discoveryPaginationInput.extend({
          query: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const query = normalizeDiscoveryQuery(input.query);
        const result = await db.searchPublicPosts({
          query,
          ...normalizeDiscoveryPagination(input),
        });

        if (query && result.total === 0) {
          recordSearchMiss(query);
        }

        return result;
      }),

    tag: publicProcedure
      .input(
        discoveryPaginationInput.extend({
          slug: z.string().min(1),
        })
      )
      .query(async ({ input }) => {
        const result = await db.getPublicTagPage(
          input.slug,
          normalizeDiscoveryPagination(input)
        );
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
        }
        return result;
      }),

    category: publicProcedure
      .input(
        discoveryPaginationInput.extend({
          slug: z.string().min(1),
        })
      )
      .query(async ({ input }) => {
        const result = await db.getPublicCategoryPage(
          input.slug,
          normalizeDiscoveryPagination(input)
        );
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
        return result;
      }),

    archive: publicProcedure.query(async () => {
      return await db.getPublicArchive();
    }),

    postContext: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(async ({ input }) => {
        const result = await db.getPublicPostContext(input.slug);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        // Navigation links do not need to download neighboring articles' bodies.
        const link = ({
          id,
          slug,
          title,
        }: {
          id: number;
          slug: string;
          title: string;
        }) => ({ id, slug, title });
        return {
          previous: result.previous ? link(result.previous) : null,
          next: result.next ? link(result.next) : null,
          related: result.related.map(link),
        };
      }),
  }),

  engagement: engagementRouter,

  posts: router({
    list: publicProcedure
      .input(
        z.object({
          status: z.enum(["draft", "published"]).optional(),
          visibility: postVisibilityInput.optional(),
          categorySlug: z.string().optional(),
          categoryId: z.number().optional(),
          search: z.string().optional(),
          limit: z.number().default(10),
          offset: z.number().default(0),
          orderBy: z
            .enum(["createdAt", "publishedAt", "viewCount", "featured"])
            .default("createdAt"),
          includeUnpublished: z.boolean().optional(),
          summaryOnly: z.boolean().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // The session only matters when unpublished posts were requested;
        // public list requests skip that lookup entirely.
        const isAdmin = input.includeUnpublished
          ? await verifyAdminSession(ctx.req)
          : false;
        const filters = {
          ...input,
          status:
            isAdmin && input.includeUnpublished
              ? undefined
              : input.status || "published",
          visibility:
            isAdmin && input.includeUnpublished ? input.visibility : "public",
        };
        const [posts, total] = await Promise.all([
          db.getPosts(filters),
          db.getPostsCount(filters),
        ]);
        return {
          posts: input.summaryOnly
            ? posts.map(post => ({
                ...post,
                content: "",
                excerpt:
                  post.excerpt ||
                  `${post.content
                    .replace(/[#*$\\`\n]/g, " ")
                    .trim()
                    .slice(0, 220)}...`,
                readingMinutes:
                  post.readingMinutes || estimateReadingMinutes(post.content),
                outline: extractMarkdownHeadings(post.content)
                  .filter(heading => heading.level === 2)
                  .slice(0, 3)
                  .map(heading => heading.text),
              }))
            : posts,
          total,
        };
      }),

    getBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input, ctx }) => {
        // Public articles come from the shared one-round-trip cache.
        const article = await loadPublicArticle(input).catch(() =>
          getPublicSeedArticleBySlug(input)
        );
        if (article) return article;
        // Drafts and owner-only posts: read fresh, and only for the owner.
        const post = await db.getPostBySlug(input).catch(() => null);
        if (!post || !(await verifyAdminSession(ctx.req))) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        const [category, tags] = await Promise.all([
          post.categoryId
            ? db.getCategoryById(post.categoryId)
            : Promise.resolve(null),
          db.getPostTags(post.id),
        ]);
        return {
          ...post,
          category,
          tags,
        };
      }),

    /**
     * Counts a public read. Separate from getBySlug, so the article itself can
     * arrive inlined in the page or from the cache without a write in its path.
     */
    recordView: publicProcedure
      .input(z.string().trim().min(1).max(200))
      .mutation(async ({ input }) => {
        const article = await loadPublicArticle(input).catch(() => null);
        if (article && article.id > 0)
          await db.incrementViewCount(article.id).catch(() => undefined);
        return { counted: Boolean(article && article.id > 0) };
      }),

    create: blogAdminProcedure
      .input(
        z.object({
          title: z.string(),
          slug: z.string(),
          content: z.string(),
          excerpt: z.string().optional(),
          coverImage: z.string().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["draft", "published"]),
          visibility: postVisibilityInput.optional(),
          tagIds: z.array(z.number()),
          ...curationFieldsInput,
        })
      )
      .mutation(async ({ input }) => {
        const { tagIds, ...postData } = input;
        const postId = await db.createPostWithTags(
          {
            ...postData,
            authorId: 1,
            visibility:
              input.visibility ??
              (input.status === "published" ? "public" : "admin"),
            publishedAt: input.status === "published" ? new Date() : null,
          },
          tagIds
        );
        const knowledgeRefresh =
          await refreshAgentKnowledgeAfterPostMutation("post create");
        const post = await db.getPostById(postId);
        return post ? { ...post, knowledgeRefresh } : post;
      }),

    update: blogAdminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          content: z.string().optional(),
          excerpt: z.string().optional(),
          coverImage: z.string().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["draft", "published"]).optional(),
          visibility: postVisibilityInput.optional(),
          tagIds: z.array(z.number()).optional(),
          ...curationFieldsInput,
        })
      )
      .mutation(async ({ input }) => {
        const { id, tagIds, ...updateData } = input;
        await db.updatePostWithTags(
          id,
          {
            ...updateData,
            ...(input.status === "published"
              ? {
                  publishedAt: new Date(),
                  visibility: input.visibility ?? "public",
                }
              : {}),
            ...(input.status === "draft"
              ? { publishedAt: null, visibility: input.visibility ?? "admin" }
              : {}),
          },
          tagIds
        );
        const knowledgeRefresh =
          await refreshAgentKnowledgeAfterPostMutation("post update");
        const post = await db.getPostById(id);
        return post ? { ...post, knowledgeRefresh } : post;
      }),

    delete: blogAdminProcedure.input(z.number()).mutation(async ({ input }) => {
      await db.deletePostCascade(input);
      const knowledgeRefresh =
        await refreshAgentKnowledgeAfterPostMutation("post delete");
      return { success: true, knowledgeRefresh };
    }),

    saveVersion: blogAdminProcedure
      .input(
        z.object({
          postId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        return await db.createPostVersion({
          postId: input.postId,
          title: post.title,
          content: input.content,
        });
      }),

    getVersions: blogAdminProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getPostVersions(input);
      }),

    restoreVersion: blogAdminProcedure
      .input(
        z.object({
          postId: z.number().int().positive(),
          versionId: z.number().int().positive(),
          saveCurrent: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const [post, version] = await Promise.all([
          db.getPostById(input.postId),
          db.getPostVersionById(input.versionId),
        ]);
        if (!post || !version || version.postId !== input.postId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Version not found",
          });
        }

        if (input.saveCurrent) {
          await db.createPostVersion({
            postId: post.id,
            title: post.title,
            content: post.content,
          });
        }

        await db.updatePost(post.id, {
          title: version.title,
          content: version.content,
        });
        const knowledgeRefresh = await refreshAgentKnowledgeAfterPostMutation(
          "post version restore"
        );
        return { success: true, knowledgeRefresh };
      }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getCategories();
    }),

    create: blogAdminProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createCategory(input);
      }),

    update: blogAdminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        if (updateData.slug) {
          const existing = await db.getCategoryBySlug(updateData.slug);
          if (existing && existing.id !== id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Category slug already exists",
            });
          }
        }
        return await db.updateCategory(id, updateData);
      }),

    delete: blogAdminProcedure.input(z.number()).mutation(async ({ input }) => {
      const postCount = await db.getPostsCount({ categoryId: input });
      if (postCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category still has posts",
        });
      }
      await db.deleteCategory(input);
      return { success: true };
    }),
  }),

  tags: router({
    list: publicProcedure.query(async () => {
      return await db.getTags();
    }),

    create: blogAdminProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createTag(input);
      }),

    update: blogAdminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        if (updateData.slug) {
          const existing = await db.getTagBySlug(updateData.slug);
          if (existing && existing.id !== id) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Tag slug already exists",
            });
          }
        }
        const tag = await db.updateTag(id, updateData);
        if (!tag) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
        }
        return tag;
      }),

    delete: blogAdminProcedure.input(z.number()).mutation(async ({ input }) => {
      const usageCount = await db.getTagUsageCount(input);
      if (usageCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Tag still has posts",
        });
      }
      await db.deleteTag(input);
      return { success: true };
    }),
  }),
});

export { __resetEngagementRateLimitsForTests } from "./engagement.router.js";

export type AppRouter = typeof appRouter;
