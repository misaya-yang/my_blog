import { TRPCError } from "@trpc/server";
import { publicProcedure } from "./_core/trpc.js";
import { verifyAdminSession } from "./auth.js";

export const blogAdminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!(await verifyAdminSession(ctx.req))) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin authentication required",
    });
  }
  return next({ ctx: { ...ctx, isAdmin: true } });
});
