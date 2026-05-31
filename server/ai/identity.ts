import { createHash } from "node:crypto";
import type { BlogSession } from "../auth.js";
import type { AgentIdentity, RequestLike } from "./types.js";

const DEFAULT_SALT = "local-ai-agent-identity-salt";
const DEFAULT_MESSAGE_QUOTA = {
  anonymous: 2,
  visitor: 6,
  admin: 200,
} as const;
const MESSAGE_QUOTA_ENV = {
  anonymous: "AI_ANONYMOUS_DAILY_LIMIT",
  visitor: "AI_VISITOR_DAILY_LIMIT",
  admin: "AI_ADMIN_DAILY_LIMIT",
} as const;
const DEFAULT_FILE_UPLOAD_QUOTA = {
  anonymous: 1,
  visitor: 3,
  admin: 100,
} as const;
const FILE_UPLOAD_QUOTA_ENV = {
  anonymous: "AI_ANONYMOUS_DAILY_FILE_LIMIT",
  visitor: "AI_VISITOR_DAILY_FILE_LIMIT",
  admin: "AI_ADMIN_DAILY_FILE_LIMIT",
} as const;

export function resolveAgentIdentity(
  session: BlogSession,
  req: RequestLike,
  salt = process.env.AI_IDENTITY_SALT || process.env.JWT_SECRET || DEFAULT_SALT
): AgentIdentity {
  if (session.role === "admin") {
    return {
      type: "admin",
      tier: "admin",
      key: stableHash(`admin|${session.displayName}`),
      displayName: session.displayName,
    };
  }

  if (session.role === "visitor") {
    return {
      type: "visitor",
      tier: "visitor",
      key: session.visitorId,
      displayName: session.displayName,
    };
  }

  return {
    type: "anonymous",
    tier: "anonymous",
    key: stableHash(`${getRequestIp(req)}|${getUserAgentBucket(req)}|${salt}`),
    displayName: null,
  };
}

export function getQuotaLimit(type: AgentIdentity["type"]): number {
  return readPositiveInt(
    process.env[MESSAGE_QUOTA_ENV[type]],
    DEFAULT_MESSAGE_QUOTA[type]
  );
}

export function getFileUploadQuotaLimit(type: AgentIdentity["type"]): number {
  return readPositiveInt(
    process.env[FILE_UPLOAD_QUOTA_ENV[type]],
    DEFAULT_FILE_UPLOAD_QUOTA[type]
  );
}

function getRequestIp(req: RequestLike): string {
  const forwardedFor = getHeader(req, "x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function getUserAgentBucket(req: RequestLike): string {
  const userAgent = getHeader(req, "user-agent") || "unknown";
  return userAgent.toLowerCase().slice(0, 120);
}

function getHeader(req: RequestLike, name: string): string | undefined {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function stableHash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
