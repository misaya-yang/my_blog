import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
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
} from "./auth.js";

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

// Admin-only procedure
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!(await verifyAdminSession(ctx.req))) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }
  return next({ ctx: { ...ctx, isAdmin: true } });
});

const postVisibilityInput = z.enum(["hidden", "admin", "public"]);

export const appRouter = router({
  system: systemRouter,
  
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
        if (input.password !== getAdminPassword()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
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
          orderBy: z.enum(["createdAt", "publishedAt", "viewCount"]).default("createdAt"),
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
        return post;
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
        })
      )
      .mutation(async ({ input }) => {
        const { tagIds, ...postData } = input;
        // Use authorId = 1 as default admin user
        const postId = await db.createPost({
          ...postData,
          authorId: 1,
          visibility: input.visibility ?? (input.status === "published" ? "public" : "admin"),
          publishedAt: input.status === "published" ? new Date() : null,
        });
        // Add tags if provided
        if (tagIds && tagIds.length > 0) {
          await db.setPostTags(postId, tagIds);
        }
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
        })
      )
      .mutation(async ({ input }) => {
        const { id, tagIds, ...updateData } = input;
        await db.updatePost(id, {
          ...updateData,
          ...(input.status === "published" ? { publishedAt: new Date() } : {}),
          ...(input.status === "draft" ? { publishedAt: null } : {}),
        });
        if (tagIds) {
          await db.setPostTags(id, tagIds);
        }
        return await db.getPostById(id);
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deletePost(input);
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
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        return await db.updateCategory(id, updateData);
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
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
        // Tag update not implemented in db.ts, skip for now
        throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Tag update not yet implemented" });
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteTag(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
