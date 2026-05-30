import { and, eq, sql } from "drizzle-orm";
import { aiUsageBuckets } from "../../drizzle/schema.js";
import { getDb } from "../db.js";
import type { AgentIdentity, AgentQuota, AgentIdentityType, AgentUsageActionType } from "./types.js";

export type QuotaStore = {
  reserveDailyMessage(identity: AgentIdentity, limit: number, now?: Date): Promise<AgentQuota>;
  reserveDailyAction(
    identity: AgentIdentity,
    actionType: AgentUsageActionType,
    limit: number,
    now?: Date
  ): Promise<AgentQuota>;
  getDailyMessageQuota(identity: AgentIdentity, limit: number, now?: Date): Promise<AgentQuota>;
  getDailyActionQuota(
    identity: AgentIdentity,
    actionType: AgentUsageActionType,
    limit: number,
    now?: Date
  ): Promise<AgentQuota>;
};

export function utcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function nextUtcDay(date = new Date()) {
  const start = utcDayStart(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export class PostgresQuotaStore implements QuotaStore {
  async reserveDailyMessage(identity: AgentIdentity, limit: number, now = new Date()): Promise<AgentQuota> {
    return this.reserveDailyAction(identity, "assistant_message", limit, now);
  }

  async reserveDailyAction(
    identity: AgentIdentity,
    actionType: AgentUsageActionType,
    limit: number,
    now = new Date()
  ): Promise<AgentQuota> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const windowStart = utcDayStart(now);
    const returning = await db
      .insert(aiUsageBuckets)
      .values({
        identityType: identity.type,
        identityKey: identity.key,
        actionType,
        windowType: "day",
        windowStart,
        requestCount: 1,
        inputTokens: 0,
        outputTokens: 0,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          aiUsageBuckets.identityType,
          aiUsageBuckets.identityKey,
          aiUsageBuckets.actionType,
          aiUsageBuckets.windowType,
          aiUsageBuckets.windowStart,
        ],
        set: {
          requestCount: sql`${aiUsageBuckets.requestCount} + 1`,
          updatedAt: now,
        },
        setWhere: sql`${aiUsageBuckets.requestCount} < ${limit}`,
      })
      .returning({ requestCount: aiUsageBuckets.requestCount });

    if (returning[0]) {
      return quotaResult(identity.type, limit, returning[0].requestCount, nextUtcDay(now), true);
    }

    const current = await this.getDailyActionQuota(identity, actionType, limit, now);
    return { ...current, allowed: false };
  }

  async getDailyMessageQuota(identity: AgentIdentity, limit: number, now = new Date()): Promise<AgentQuota> {
    return this.getDailyActionQuota(identity, "assistant_message", limit, now);
  }

  async getDailyActionQuota(
    identity: AgentIdentity,
    actionType: AgentUsageActionType,
    limit: number,
    now = new Date()
  ): Promise<AgentQuota> {
    const db = await getDb();
    if (!db) {
      return quotaResult(identity.type, limit, 0, nextUtcDay(now), true);
    }

    try {
      const rows = await db
        .select({ requestCount: aiUsageBuckets.requestCount })
        .from(aiUsageBuckets)
        .where(
          and(
            eq(aiUsageBuckets.identityType, identity.type),
            eq(aiUsageBuckets.identityKey, identity.key),
            eq(aiUsageBuckets.actionType, actionType),
            eq(aiUsageBuckets.windowType, "day"),
            eq(aiUsageBuckets.windowStart, utcDayStart(now))
          )
        )
        .limit(1);

      return quotaResult(identity.type, limit, rows[0]?.requestCount ?? 0, nextUtcDay(now), true);
    } catch (error) {
      if (isMissingAgentTable(error)) {
        return quotaResult(identity.type, limit, 0, nextUtcDay(now), true);
      }
      throw error;
    }
  }
}

export function createMemoryQuotaStore(): QuotaStore {
  const buckets = new Map<string, number>();

  return {
    async reserveDailyMessage(identity, limit, now = new Date()) {
      return this.reserveDailyAction(identity, "assistant_message", limit, now);
    },
    async reserveDailyAction(identity, actionType, limit, now = new Date()) {
      const key = bucketKey(identity, actionType, now);
      const used = buckets.get(key) ?? 0;
      if (used >= limit) {
        return quotaResult(identity.type, limit, used, nextUtcDay(now), false);
      }
      const next = used + 1;
      buckets.set(key, next);
      return quotaResult(identity.type, limit, next, nextUtcDay(now), true);
    },
    async getDailyMessageQuota(identity, limit, now = new Date()) {
      return this.getDailyActionQuota(identity, "assistant_message", limit, now);
    },
    async getDailyActionQuota(identity, actionType, limit, now = new Date()) {
      const used = buckets.get(bucketKey(identity, actionType, now)) ?? 0;
      return quotaResult(identity.type, limit, used, nextUtcDay(now), true);
    },
  };
}

function bucketKey(identity: AgentIdentity, actionType: AgentUsageActionType, now: Date) {
  return `${identity.type}:${identity.key}:${actionType}:day:${utcDayStart(now).toISOString()}`;
}

function quotaResult(
  tier: AgentIdentityType,
  limit: number,
  used: number,
  resetAt: Date,
  allowed: boolean
): AgentQuota {
  return {
    allowed,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    resetAt,
    tier,
  };
}

function isMissingAgentTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("ai_usage_buckets") && /does not exist|relation .* not exist|Failed query/i.test(message);
}
