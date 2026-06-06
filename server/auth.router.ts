import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
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
import { getRequestSource, setHeader } from "./httpRequest.js";
import {
  assertWindowRateLimit,
  recordWindowRateLimitHit,
} from "./rateLimit.js";

const ADMIN_LOGIN_MAX_FAILURES = 5;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const adminLoginFailures = new Map<
  string,
  { count: number; firstSeenAt: number }
>();

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password && ENV.isProduction) {
    throw new Error("ADMIN_PASSWORD is required in production");
  }
  return password || "admin123";
}

function assertAdminLoginAllowed(source: string) {
  assertWindowRateLimit({
    store: adminLoginFailures,
    key: source,
    maxAttempts: ADMIN_LOGIN_MAX_FAILURES,
    windowMs: ADMIN_LOGIN_WINDOW_MS,
    message: "Too many login attempts. Try again later.",
  });
}

function recordAdminLoginFailure(source: string) {
  recordWindowRateLimitHit({
    store: adminLoginFailures,
    key: source,
    windowMs: ADMIN_LOGIN_WINDOW_MS,
  });
}

function clearAdminLoginFailures(source: string) {
  adminLoginFailures.delete(source);
}

export const authRouter = router({
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
        buildSessionCookie(
          ctx.req,
          VISITOR_SESSION_COOKIE,
          session.token,
          365 * 24 * 60 * 60
        )
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

  adminLogin: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const source = getRequestSource(ctx.req);
      assertAdminLoginAllowed(source);

      if (input.password !== getAdminPassword()) {
        recordAdminLoginFailure(source);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      clearAdminLoginFailures(source);

      const sessionToken = await signAdminSession(
        process.env.OWNER_NAME || "Misaya Yang"
      );

      setHeader(
        ctx.res,
        "Set-Cookie",
        buildSessionCookie(
          ctx.req,
          ADMIN_SESSION_COOKIE,
          sessionToken,
          30 * 24 * 60 * 60
        )
      );

      return { success: true };
    }),

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
});
