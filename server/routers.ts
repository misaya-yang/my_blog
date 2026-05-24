import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
// Simple cookie serialization helper
function serializeCookie(name: string, value: string, options: any): string {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (options.maxAge != null) str += `; Max-Age=${options.maxAge}`;
  if (options.path) str += `; Path=${options.path}`;
  if (options.httpOnly) str += `; HttpOnly`;
  // Always set Secure for HTTPS proxied environments
  str += `; Secure`;
  str += `; SameSite=none`;
  return str;
}

// Simple admin authentication using environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_SESSION_COOKIE = "admin_session";

// Helper to check if request has valid admin session
function isAdminAuthenticated(req: any): boolean {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`));
  if (!match) return false;
  
  try {
    // Decode URL-encoded cookie value first
    const decodedValue = decodeURIComponent(match[1]);
    const sessionData = JSON.parse(Buffer.from(decodedValue, "base64").toString());
    return sessionData.isAdmin === true && Date.now() < sessionData.expires;
  } catch {
    return false;
  }
}

// Admin-only procedure
const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!isAdminAuthenticated(ctx.req)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }
  return next({ ctx: { ...ctx, isAdmin: true } });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    // Check if current session is authenticated as admin
    isAdmin: publicProcedure.query(({ ctx }) => {
      return isAdminAuthenticated(ctx.req);
    }),
    
    // Admin login with password
    adminLogin: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input, ctx }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        // Create admin session (valid for 30 days)
        const sessionData = {
          isAdmin: true,
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
        
        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64");
        const cookieOptions = getSessionCookieOptions(ctx.req);
        
        ctx.res.setHeader(
          "Set-Cookie",
          serializeCookie(ADMIN_SESSION_COOKIE, sessionToken, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60,
          })
        );
        
        return { success: true };
      }),
    
    // Admin logout
    adminLogout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.setHeader(
        "Set-Cookie",
          serializeCookie(ADMIN_SESSION_COOKIE, "", {
          ...cookieOptions,
          maxAge: -1,
        })
      );
      return { success: true };
    }),
  }),

  // Blog routers
  posts: router({
    list: publicProcedure
      .input(
        z.object({
          status: z.enum(["draft", "published"]).optional(),
          categoryId: z.number().optional(),
          search: z.string().optional(),
          limit: z.number().default(10),
          offset: z.number().default(0),
          orderBy: z.enum(["createdAt", "publishedAt", "viewCount"]).default("createdAt"),
          includeUnpublished: z.boolean().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const isAdmin = isAdminAuthenticated(ctx.req);
        const posts = await db.getPosts({
          ...input,
          status: isAdmin && input.includeUnpublished ? undefined : input.status || "published",
        });
        const total = await db.getPostsCount({
          ...input,
          status: isAdmin && input.includeUnpublished ? undefined : input.status || "published",
        });
        return { posts, total };
      }),

    getBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const post = await db.getPostBySlug(input);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        // Increment view count
        await db.incrementViewCount(post.id);
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
          tagIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        const { tagIds, ...postData } = input;
        // Use authorId = 1 as default admin user
        const postId = await db.createPost({ ...postData, authorId: 1 });
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
          tagIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        return await db.updatePost(id, updateData);
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
