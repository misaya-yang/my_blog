import { createHash } from "node:crypto";
import type { BlogSession } from "../auth.js";
import type { AgentIdentity, RequestLike } from "./types.js";

const DEFAULT_SALT = "local-ai-agent-identity-salt";

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

export function getQuotaLimit(type: AgentIdentity["type"]) {
  if (type === "anonymous") return 2;
  if (type === "visitor") return 6;
  const configuredLimit = Number.parseInt(process.env.AI_ADMIN_DAILY_LIMIT || "200", 10);
  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 200;
}

export function getFileUploadQuotaLimit(type: AgentIdentity["type"]) {
  if (type === "anonymous") return 1;
  if (type === "visitor") return 3;
  const configuredLimit = Number.parseInt(process.env.AI_ADMIN_DAILY_FILE_LIMIT || "100", 10);
  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 100;
}

function getRequestIp(req: RequestLike) {
  const forwardedFor = getHeader(req, "x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function getUserAgentBucket(req: RequestLike) {
  const userAgent = getHeader(req, "user-agent") || "unknown";
  return userAgent.toLowerCase().slice(0, 120);
}

function getHeader(req: RequestLike, name: string) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function stableHash(input: string) {
  return createHash("sha256").update(input).digest("hex");
}
