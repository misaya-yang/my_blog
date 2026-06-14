import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
} {
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
        values.forEach(cookie => {
          const [pair] = cookie.split(";");
          const [cookieName, cookieValue] = pair.split("=");
          clearedCookies.push({ name: cookieName, value: cookieValue });
        });
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth cookie switching", () => {
  it("clears visitor identity when admin login succeeds", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.adminLogin({
      password: process.env.ADMIN_PASSWORD || "admin123",
    });

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "admin_session" }),
        { name: "visitor_session", value: "" },
        { name: "agent_guest_id", value: "" },
      ])
    );
  });

  it("clears admin identity when visitor login succeeds", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.visitorLogin({ nickname: "Reader Two" });

    expect(result).toMatchObject({
      success: true,
      session: {
        role: "visitor",
        displayName: "Reader Two",
      },
    });
    expect(clearedCookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "visitor_session" }),
        { name: "admin_session", value: "" },
        { name: "agent_guest_id", value: "" },
      ])
    );
  });
});

describe("auth.adminLogout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.adminLogout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toContainEqual({ name: "admin_session", value: "" });
    expect(clearedCookies).toContainEqual({
      name: "visitor_session",
      value: "",
    });
    expect(clearedCookies).toContainEqual({
      name: "agent_guest_id",
      value: "",
    });
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
        { name: "agent_guest_id", value: "" },
      ])
    );
  });
});
