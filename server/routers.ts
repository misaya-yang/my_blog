import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { agentRouter } from "./ai/router.js";
import { z } from "zod";
import * as db from "./db.js";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env.js";
import {
  ADMIN_SESSION_COOKIE,
  VISITOR_SESSION_COOKIE,
  buildClearedCookie,
  buildSessionCookie,
  createVisitorSession,
  resolveBlogSession,
  signAdminSession,
  verifyAdminSession,
  verifyVisitorSession,
} from "./auth.js";

const ADMIN_LOGIN_MAX_FAILURES = 5;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const adminLoginFailures = new Map<string, { count: number; firstFailedAt: number }>();
const ENGAGEMENT_MAX_SUBMISSIONS = 4;
const ENGAGEMENT_WINDOW_MS = 60 * 1000;
const engagementSubmissions = new Map<string, { count: number; firstSubmittedAt: number }>();

function setHeader(res: unknown, name: string, value: string | string[]) {
  (res as { setHeader(headerName: string, headerValue: string | string[]): void }).setHeader(
    name,
    value
  );
}

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password && ENV.isProduction) {
    throw new Error("ADMIN_PASSWORD is required in production");
  }
  return password || "admin123";
}

function getRequestSource(req: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }) {
  const forwardedFor = req.headers?.["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return raw?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getRequestHeader(req: unknown, name: string) {
  const headers = (req as { headers?: Record<string, string | string[] | undefined> }).headers;
  return getHeaderValue(headers?.[name]);
}

function assertAdminLoginAllowed(source: string) {
  const now = Date.now();
  const entry = adminLoginFailures.get(source);
  if (!entry) return;

  if (now - entry.firstFailedAt > ADMIN_LOGIN_WINDOW_MS) {
    adminLoginFailures.delete(source);
    return;
  }

  if (entry.count >= ADMIN_LOGIN_MAX_FAILURES) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many login attempts. Try again later.",
    });
  }
}

function recordAdminLoginFailure(source: string) {
  const now = Date.now();
  const entry = adminLoginFailures.get(source);
  if (!entry || now - entry.firstFailedAt > ADMIN_LOGIN_WINDOW_MS) {
    adminLoginFailures.set(source, { count: 1, firstFailedAt: now });
    return;
  }

  adminLoginFailures.set(source, {
    count: entry.count + 1,
    firstFailedAt: entry.firstFailedAt,
  });
}

function clearAdminLoginFailures(source: string) {
  adminLoginFailures.delete(source);
}

function assertEngagementAllowed(source: string, bucket: string) {
  const now = Date.now();
  const key = `${bucket}:${source}`;
  const entry = engagementSubmissions.get(key);
  if (!entry) return;

  if (now - entry.firstSubmittedAt > ENGAGEMENT_WINDOW_MS) {
    engagementSubmissions.delete(key);
    return;
  }

  if (entry.count >= ENGAGEMENT_MAX_SUBMISSIONS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many engagement submissions. Try again later.",
    });
  }
}

function recordEngagementSubmission(source: string, bucket: string) {
  const now = Date.now();
  const key = `${bucket}:${source}`;
  const entry = engagementSubmissions.get(key);
  if (!entry || now - entry.firstSubmittedAt > ENGAGEMENT_WINDOW_MS) {
    engagementSubmissions.set(key, { count: 1, firstSubmittedAt: now });
    return;
  }

  engagementSubmissions.set(key, {
    count: entry.count + 1,
    firstSubmittedAt: entry.firstSubmittedAt,
  });
}

export function __resetEngagementRateLimitsForTests() {
  engagementSubmissions.clear();
}

// Admin-only procedure
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!(await verifyAdminSession(ctx.req))) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }
  return next({ ctx: { ...ctx, isAdmin: true } });
});

const postVisibilityInput = z.enum(["hidden", "admin", "public"]);
const feedbackStatusInput = z.enum(["new", "reviewed", "hidden"]);
const pinnedTrackInput = z.enum(["algorithms", "applications"]).nullable().optional();
const curationFieldsInput = {
  seriesSlug: z.string().trim().max(120).nullable().optional(),
  seriesTitle: z.string().trim().max(255).nullable().optional(),
  seriesOrder: z.number().int().nullable().optional(),
  featuredRank: z.number().int().positive().nullable().optional(),
  pinnedTrack: pinnedTrackInput,
};
const optionalTrimmedText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => (value ? value : null));

const optionalEmailInput = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .trim()
    .email()
    .max(320)
    .optional()
    .transform((value) => (value ? value.toLowerCase() : null))
);

const subscriptionInput = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  preferredLanguage: z.enum(["zh", "en"]).optional(),
  interests: optionalTrimmedText(240),
});

const feedbackCreateInput = z.object({
  postId: z.number().int().positive(),
  type: z.enum(["useful", "not_useful"]),
  message: optionalTrimmedText(600),
  visitorName: optionalTrimmedText(80),
  replyEmail: optionalEmailInput,
});

const discoveryPaginationInput = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
});

function normalizeDiscoveryPagination(input: { limit?: number; offset?: number }) {
  return {
    limit: Math.min(Math.max(input.limit ?? 10, 1), 50),
    offset: Math.max(input.offset ?? 0, 0),
  };
}

function normalizeDiscoveryQuery(query: string | undefined) {
  return (query ?? "").trim().replace(/\s+/g, " ");
}

export const appRouter = router({
  system: systemRouter,
  agent: agentRouter,
  
  auth: router({
    // Check if current session is authenticated as admin
    isAdmin: publicProcedure.query(async ({ ctx }) => {
      return await verifyAdminSession(ctx.req);
    }),

    session: publicProcedure.query(async ({ ctx }) => {
      return await resolveBlogSession(ctx.req);
    }),

    visitorLogin: publicProcedure
      .input(
        z.object({
          nickname: z
            .string()
            .trim()
            .min(2, "Nickname must be at least 2 characters")
            .max(40, "Nickname must be 40 characters or less"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = await createVisitorSession(input.nickname);
        setHeader(
          ctx.res,
          "Set-Cookie",
          buildSessionCookie(ctx.req, VISITOR_SESSION_COOKIE, session.token, 365 * 24 * 60 * 60)
        );

        return {
          success: true,
          session: {
            isAuthenticated: true,
            isAdmin: false,
            role: "visitor",
            displayName: input.nickname,
            visitorId: session.visitorId,
          } as const,
        };
    }),
    
    // Admin login with password
    adminLogin: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const source = getRequestSource(ctx.req);
        assertAdminLoginAllowed(source);

        if (input.password !== getAdminPassword()) {
          recordAdminLoginFailure(source);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        clearAdminLoginFailures(source);
        
        const sessionToken = await signAdminSession(process.env.OWNER_NAME || "Misaya Yang");
        
        setHeader(
          ctx.res,
          "Set-Cookie",
          buildSessionCookie(ctx.req, ADMIN_SESSION_COOKIE, sessionToken, 30 * 24 * 60 * 60)
        );
        
        return { success: true };
      }),
    
    // Admin logout
    adminLogout: publicProcedure.mutation(({ ctx }) => {
      setHeader(
        ctx.res,
        "Set-Cookie",
        buildClearedCookie(ctx.req, ADMIN_SESSION_COOKIE)
      );
      return { success: true };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      setHeader(ctx.res, "Set-Cookie", [
        buildClearedCookie(ctx.req, ADMIN_SESSION_COOKIE),
        buildClearedCookie(ctx.req, VISITOR_SESSION_COOKIE),
      ]);
      return { success: true };
    }),
  }),

  discovery: router({
    search: publicProcedure
      .input(
        discoveryPaginationInput.extend({
          query: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.searchPublicPosts({
          query: normalizeDiscoveryQuery(input.query),
          ...normalizeDiscoveryPagination(input),
        });
      }),

    tag: publicProcedure
      .input(
        discoveryPaginationInput.extend({
          slug: z.string().min(1),
        })
      )
      .query(async ({ input }) => {
        const result = await db.getPublicTagPage(input.slug, normalizeDiscoveryPagination(input));
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
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
        return result;
      }),
  }),

  engagement: router({
    subscribe: publicProcedure.input(subscriptionInput).mutation(async ({ input, ctx }) => {
      const source = getRequestSource(ctx.req);
      assertEngagementAllowed(source, "subscription");

      const result = await db.upsertSubscriber({
        email: input.email,
        preferredLanguage: input.preferredLanguage ?? null,
        interests: input.interests,
        source,
      });
      recordEngagementSubmission(source, "subscription");

      return {
        success: true,
        status: result.created ? "created" : "existing",
      } as const;
    }),

    feedback: router({
      create: publicProcedure.input(feedbackCreateInput).mutation(async ({ input, ctx }) => {
        const source = getRequestSource(ctx.req);
        assertEngagementAllowed(source, "feedback");

        const post = await db.getPostById(input.postId);
        if (!post || post.status !== "published" || post.visibility !== "public") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }

        const visitor = await verifyVisitorSession(ctx.req);
        await db.createPostFeedback({
          postId: input.postId,
          visitorId: visitor?.visitorId ?? null,
          visitorName: visitor?.displayName ?? input.visitorName,
          type: input.type,
          message: input.message,
          replyEmail: input.replyEmail,
          source,
          userAgent: getRequestHeader(ctx.req, "user-agent") ?? null,
        });
        recordEngagementSubmission(source, "feedback");

        return { success: true, status: "new" } as const;
      }),

      list: adminProcedure
        .input(
          z.object({
            postId: z.number().int().positive().optional(),
            status: feedbackStatusInput.optional(),
            limit: z.number().optional(),
          })
        )
        .query(async ({ input }) => {
          return await db.listPostFeedback({
            postId: input.postId,
            status: input.status,
            limit: input.limit,
          });
        }),

      markReviewed: adminProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          const feedback = await db.markPostFeedbackReviewed(input.id);
          if (!feedback) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found" });
          }
          return { success: true, feedback };
        }),
    }),

    subscribers: router({
      list: adminProcedure.query(async () => {
        return await db.listSubscribers();
      }),
    }),
  }),

  // Blog routers
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
          orderBy: z.enum(["createdAt", "publishedAt", "viewCount", "featured"]).default("createdAt"),
          includeUnpublished: z.boolean().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const isAdmin = await verifyAdminSession(ctx.req);
        const posts = await db.getPosts({
          ...input,
          status: isAdmin && input.includeUnpublished ? undefined : input.status || "published",
          visibility: isAdmin && input.includeUnpublished ? input.visibility : "public",
        });
        const total = await db.getPostsCount({
          ...input,
          status: isAdmin && input.includeUnpublished ? undefined : input.status || "published",
          visibility: isAdmin && input.includeUnpublished ? input.visibility : "public",
        });
        return { posts, total };
      }),

    getBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input, ctx }) => {
        const post = await db.getPostBySlug(input);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        const isAdmin = await verifyAdminSession(ctx.req);
        if ((post.status !== "published" || post.visibility !== "public") && !isAdmin) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        // Increment view count
        if (post.status === "published" && post.visibility === "public") {
          await db.incrementViewCount(post.id);
        }
        const [category, tags] = await Promise.all([
          post.categoryId ? db.getCategoryById(post.categoryId) : Promise.resolve(null),
          db.getPostTags(post.id),
        ]);
        return {
          ...post,
          category,
          tags,
        };
      }),

    create: adminProcedure
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
        // Use authorId = 1 as default admin user
        const postId = await db.createPostWithTags({
          ...postData,
          authorId: 1,
          visibility: input.visibility ?? (input.status === "published" ? "public" : "admin"),
          publishedAt: input.status === "published" ? new Date() : null,
        }, tagIds);
        return await db.getPostById(postId);
      }),

    update: adminProcedure
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
        await db.updatePostWithTags(id, {
          ...updateData,
          ...(input.status === "published"
            ? { publishedAt: new Date(), visibility: input.visibility ?? "public" }
            : {}),
          ...(input.status === "draft"
            ? { publishedAt: null, visibility: input.visibility ?? "admin" }
            : {}),
        }, tagIds);
        return await db.getPostById(id);
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deletePostCascade(input);
        return { success: true };
      }),

    saveVersion: adminProcedure
      .input(
        z.object({
          postId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Get current post title
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

    getVersions: adminProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getPostVersions(input);
      }),

    restoreVersion: adminProcedure
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
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
        return { success: true };
      }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getCategories();
    }),

    create: adminProcedure
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

    update: adminProcedure
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
            throw new TRPCError({ code: "CONFLICT", message: "Category slug already exists" });
          }
        }
        return await db.updateCategory(id, updateData);
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const postCount = await db.getPostsCount({ categoryId: input });
        if (postCount > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Category still has posts" });
        }
        await db.deleteCategory(input);
        return { success: true };
      }),
  }),

  tags: router({
    list: publicProcedure.query(async () => {
      return await db.getTags();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createTag(input);
      }),

    update: adminProcedure
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
            throw new TRPCError({ code: "CONFLICT", message: "Tag slug already exists" });
          }
        }
        const tag = await db.updateTag(id, updateData);
        if (!tag) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
        }
        return tag;
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const usageCount = await db.getTagUsageCount(input);
        if (usageCount > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Tag still has posts" });
        }
        await db.deleteTag(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
