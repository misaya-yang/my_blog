import { parse as parseCookieHeader } from "cookie";
import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { ENV } from "./_core/env.js";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const VISITOR_SESSION_COOKIE = "visitor_session";
export const AGENT_GUEST_COOKIE = "agent_guest_id";

type AuthRequest = {
  protocol?: string;
  headers?: Record<string, string | string[] | undefined>;
};

export type BlogSession =
  | {
      isAuthenticated: false;
      isAdmin: false;
      role: "anonymous";
      displayName: null;
    }
  | {
      isAuthenticated: true;
      isAdmin: true;
      role: "admin";
      displayName: string;
    }
  | {
      isAuthenticated: true;
      isAdmin: false;
      role: "visitor";
      displayName: string;
      visitorId: string;
    };

type AdminPayload = {
  role: "admin";
  displayName: string;
};

type VisitorPayload = {
  role: "visitor";
  displayName: string;
  visitorId: string;
};

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

function getSecretKey() {
  const configuredSecret = ENV.cookieSecret || process.env.JWT_SECRET;
  if (!configuredSecret && ENV.isProduction) {
    throw new Error("JWT_SECRET is required in production");
  }
  const secret = configuredSecret || "local-blog-session-secret";
  return new TextEncoder().encode(secret);
}

function normalizeCookieHeader(req: AuthRequest) {
  const cookieHeader = req.headers?.cookie;
  return Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;
}

function getCookie(req: AuthRequest, name: string) {
  const cookieHeader = normalizeCookieHeader(req);
  if (!cookieHeader) return undefined;
  return parseCookieHeader(cookieHeader)[name];
}

export function readCookie(req: AuthRequest, name: string) {
  return getCookie(req, name);
}

export function createAgentGuestId() {
  return randomUUID();
}

async function signPayload(
  payload: AdminPayload | VisitorPayload,
  maxAgeSeconds: number
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecretKey());
}

async function verifyPayload(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function signAdminSession(displayName = "Misaya Yang") {
  return signPayload({ role: "admin", displayName }, THIRTY_DAYS_SECONDS);
}

export async function signVisitorSession(displayName: string) {
  const visitorId = randomUUID();
  return signPayload(
    { role: "visitor", displayName, visitorId },
    ONE_YEAR_SECONDS
  );
}

export async function createVisitorSession(displayName: string) {
  const visitorId = randomUUID();
  const token = await signPayload(
    { role: "visitor", displayName, visitorId },
    ONE_YEAR_SECONDS
  );
  return { token, visitorId };
}

export async function verifyAdminSession(req: AuthRequest) {
  const payload = await verifyPayload(getCookie(req, ADMIN_SESSION_COOKIE));
  return payload?.role === "admin";
}

export async function verifyVisitorSession(req: AuthRequest) {
  const payload = await verifyPayload(getCookie(req, VISITOR_SESSION_COOKIE));
  if (
    payload?.role !== "visitor" ||
    typeof payload.displayName !== "string" ||
    typeof payload.visitorId !== "string"
  ) {
    return null;
  }

  return {
    displayName: payload.displayName,
    visitorId: payload.visitorId,
  };
}

export async function resolveBlogSession(
  req: AuthRequest
): Promise<BlogSession> {
  const adminPayload = await verifyPayload(
    getCookie(req, ADMIN_SESSION_COOKIE)
  );
  if (adminPayload?.role === "admin") {
    return {
      isAuthenticated: true,
      isAdmin: true,
      role: "admin",
      displayName:
        typeof adminPayload.displayName === "string"
          ? adminPayload.displayName
          : "Misaya Yang",
    };
  }

  const visitor = await verifyVisitorSession(req);
  if (visitor) {
    return {
      isAuthenticated: true,
      isAdmin: false,
      role: "visitor",
      displayName: visitor.displayName,
      visitorId: visitor.visitorId,
    };
  }

  return {
    isAuthenticated: false,
    isAdmin: false,
    role: "anonymous",
    displayName: null,
  };
}

export function buildSessionCookie(
  req: AuthRequest,
  name: string,
  value: string,
  maxAge: number
) {
  return serializeSessionCookie(name, value, {
    ...getSessionCookieOptions(req),
    maxAge,
  });
}

export function buildClearedCookie(req: AuthRequest, name: string) {
  return serializeSessionCookie(name, "", {
    ...getSessionCookieOptions(req),
    maxAge: 0,
  });
}

export function buildAgentGuestCookie(req: AuthRequest, guestId: string) {
  return buildSessionCookie(req, AGENT_GUEST_COOKIE, guestId, ONE_YEAR_SECONDS);
}

function serializeSessionCookie(
  name: string,
  value: string,
  options: ReturnType<typeof getSessionCookieOptions> & { maxAge: number }
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    parts.push(`SameSite=${formatSameSite(options.sameSite)}`);
  }
  return parts.join("; ");
}

function formatSameSite(
  value: NonNullable<ReturnType<typeof getSessionCookieOptions>["sameSite"]>
) {
  if (value === "none") return "None";
  if (value === "lax") return "Lax";
  return "Strict";
}
