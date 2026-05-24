import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      setHeader: (name: string, value: string | string[]) => {
        if (name.toLowerCase() !== "set-cookie") return;
        const values = Array.isArray(value) ? value : [value];
        values.forEach((cookie) => {
          const [pair] = cookie.split(";");
          const [cookieName, cookieValue] = pair.split("=");
          clearedCookies.push({ name: cookieName, value: cookieValue });
        });
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.adminLogout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.adminLogout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toContainEqual({ name: "admin_session", value: "" });
  });

  it("clears both admin and visitor cookies from unified logout", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toEqual(
      expect.arrayContaining([
        { name: "admin_session", value: "" },
        { name: "visitor_session", value: "" },
      ])
    );
  });
});
