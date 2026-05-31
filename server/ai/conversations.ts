import { and, desc, eq, sql } from "drizzle-orm";
import {
  aiAgentRuns,
  aiConversations,
  aiMessages,
} from "../../drizzle/schema.js";
import { getDb } from "../db.js";
import type {
  AgentConversationRecord,
  AgentIdentity,
  AgentMessageRecord,
  AgentMessageRole,
  AgentMessageStatus,
  AgentRunRecord,
  AgentRunStatus,
  AgentScope,
} from "./types.js";

export type ConversationStore = {
  createOrLoadConversation(input: {
    conversationId?: string;
    identity: AgentIdentity;
    scope: AgentScope;
    title: string;
  }): Promise<AgentConversationRecord>;
  listConversations(identity: AgentIdentity): Promise<AgentConversationRecord[]>;
  getConversation(input: {
    conversationId: string;
    identity: AgentIdentity;
  }): Promise<AgentConversationRecord>;
  getMessages(input: {
    conversationId: string;
    identity: AgentIdentity;
  }): Promise<AgentMessageRecord[]>;
  addMessage(input: {
    conversationId: string;
    role: AgentMessageRole;
    status: AgentMessageStatus;
    content: string;
    sourceJson?: Record<string, unknown> | null;
    usageJson?: Record<string, unknown> | null;
    errorCode?: string | null;
  }): Promise<AgentMessageRecord>;
  startRun(input: {
    conversationId?: string;
    userMessageId?: string;
    identity: AgentIdentity;
    scope: AgentScope;
    model?: string;
    retrievedChunkIds?: string[];
    status?: AgentRunStatus;
    errorCode?: string | null;
  }): Promise<AgentRunRecord>;
  listRuns(input: { limit: number }): Promise<AgentRunRecord[]>;
  finishRun(input: {
    runId: string;
    assistantMessageId?: string;
    status: AgentRunStatus;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    retrievedChunkIds?: string[];
    errorCode?: string | null;
  }): Promise<void>;
};

export class PostgresConversationStore implements ConversationStore {
  async createOrLoadConversation(input: {
    conversationId?: string;
    identity: AgentIdentity;
    scope: AgentScope;
    title: string;
  }): Promise<AgentConversationRecord> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (input.conversationId) {
      const existing = await db
        .select()
        .from(aiConversations)
        .where(
          input.identity.type === "admin"
            ? eq(aiConversations.id, input.conversationId)
            : and(
                eq(aiConversations.id, input.conversationId),
                eq(aiConversations.ownerType, input.identity.type),
                eq(aiConversations.ownerKey, input.identity.key)
              )
        )
        .limit(1);
      if (existing[0]) return toConversationRecord(existing[0]);
      throw new Error("Conversation not found");
    }

    const created = await db
      .insert(aiConversations)
      .values({
        ownerType: input.identity.type,
        ownerKey: input.identity.key,
        title: input.title,
        scopeType: input.scope.type,
        scopeValue: input.scope.value ?? null,
        lastMessageAt: new Date(),
      })
      .returning();

    return toConversationRecord(created[0]);
  }

  async listConversations(identity: AgentIdentity): Promise<AgentConversationRecord[]> {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(aiConversations)
      .where(
        identity.type === "admin"
          ? eq(aiConversations.status, "active")
          : and(
              eq(aiConversations.ownerType, identity.type),
              eq(aiConversations.ownerKey, identity.key)
            )
      )
      .orderBy(desc(aiConversations.updatedAt))
      .limit(20);

    return rows.map(toConversationRecord);
  }

  async getConversation(input: {
    conversationId: string;
    identity: AgentIdentity;
  }): Promise<AgentConversationRecord> {
    const conversation = await this.createOrLoadConversation({
      conversationId: input.conversationId,
      identity: input.identity,
      scope: { type: "site" },
      title: "",
    });
    return conversation;
  }

  async getMessages(input: {
    conversationId: string;
    identity: AgentIdentity;
  }): Promise<AgentMessageRecord[]> {
    const db = await getDb();
    if (!db) return [];

    await this.getConversation(input);

    const rows = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, input.conversationId))
      .orderBy(aiMessages.createdAt);

    return rows.map(toMessageRecord);
  }

  async addMessage(input: {
    conversationId: string;
    role: AgentMessageRole;
    status: AgentMessageStatus;
    content: string;
    sourceJson?: Record<string, unknown> | null;
    usageJson?: Record<string, unknown> | null;
    errorCode?: string | null;
  }): Promise<AgentMessageRecord> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const created = await db
      .insert(aiMessages)
      .values({
        conversationId: input.conversationId,
        role: input.role,
        status: input.status,
        content: input.content,
        sourceJson: input.sourceJson ?? null,
        usageJson: input.usageJson ?? null,
        errorCode: input.errorCode ?? null,
      })
      .returning();

    await db
      .update(aiConversations)
      .set({
        messageCount: sql`${aiConversations.messageCount} + 1`,
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      })
      .where(eq(aiConversations.id, input.conversationId));

    return toMessageRecord(created[0]);
  }

  async startRun(input: {
    conversationId?: string;
    userMessageId?: string;
    identity: AgentIdentity;
    scope: AgentScope;
    model?: string;
    retrievedChunkIds?: string[];
    status?: AgentRunStatus;
    errorCode?: string | null;
  }): Promise<AgentRunRecord> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const created = await db
      .insert(aiAgentRuns)
      .values({
        conversationId: input.conversationId ?? null,
        userMessageId: input.userMessageId ?? null,
        identityType: input.identity.type,
        identityKey: input.identity.key,
        model: input.model ?? null,
        scopeType: input.scope.type,
        scopeValue: input.scope.value ?? null,
        retrievalStrategy: "supabase_keyword",
        retrievedChunkIds: input.retrievedChunkIds ?? [],
        toolCallIds: [],
        status: input.status ?? "started",
        errorCode: input.errorCode ?? null,
      })
      .returning({ id: aiAgentRuns.id });

    return created[0];
  }

  async listRuns(input: { limit: number }): Promise<AgentRunRecord[]> {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        run: aiAgentRuns,
        question: aiMessages.content,
      })
      .from(aiAgentRuns)
      .leftJoin(aiMessages, eq(aiAgentRuns.userMessageId, aiMessages.id))
      .orderBy(desc(aiAgentRuns.createdAt))
      .limit(input.limit);

    return rows.map((row) => toRunRecord(row.run, row.question));
  }

  async finishRun(input: {
    runId: string;
    assistantMessageId?: string;
    status: AgentRunStatus;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    retrievedChunkIds?: string[];
    errorCode?: string | null;
  }): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(aiAgentRuns)
      .set({
        assistantMessageId: input.assistantMessageId ?? null,
        status: input.status,
        inputTokens: input.inputTokens ?? 0,
        outputTokens: input.outputTokens ?? 0,
        latencyMs: input.latencyMs ?? null,
        retrievedChunkIds: input.retrievedChunkIds ?? [],
        errorCode: input.errorCode ?? null,
        completedAt: new Date(),
      })
      .where(eq(aiAgentRuns.id, input.runId));
  }
}

export function createMemoryConversationStore(): ConversationStore & {
  messages: AgentMessageRecord[];
  runs: Array<AgentRunRecord & { status?: AgentRunStatus; errorCode?: string | null }>;
} {
  const conversations = new Map<string, AgentConversationRecord>();
  const messages: AgentMessageRecord[] = [];
  const runs: Array<AgentRunRecord & { status?: AgentRunStatus; errorCode?: string | null }> = [];

  return {
    messages,
    runs,
    async createOrLoadConversation(input) {
      if (input.conversationId) {
        const existing = conversations.get(input.conversationId);
        if (
          existing &&
          (input.identity.type === "admin" ||
            (existing.ownerType === input.identity.type && existing.ownerKey === input.identity.key))
        ) {
          return existing;
        }
        throw new Error("Conversation not found");
      }

      const id = `conv-${conversations.size + 1}`;
      const conversation: AgentConversationRecord = {
        id,
        ownerType: input.identity.type,
        ownerKey: input.identity.key,
        title: input.title,
        scopeType: input.scope.type,
        scopeValue: input.scope.value ?? null,
      };
      conversations.set(id, conversation);
      return conversation;
    },
    async listConversations(identity) {
      return Array.from(conversations.values()).filter(
        (conversation) =>
          identity.type === "admin" ||
          (conversation.ownerType === identity.type && conversation.ownerKey === identity.key)
      );
    },
    async getConversation(input) {
      const existing = conversations.get(input.conversationId);
      if (
        existing &&
        (input.identity.type === "admin" ||
          (existing.ownerType === input.identity.type && existing.ownerKey === input.identity.key))
      ) {
        return existing;
      }
      throw new Error("Conversation not found");
    },
    async getMessages(input) {
      await this.getConversation(input);
      return messages.filter((message) => message.conversationId === input.conversationId);
    },
    async addMessage(input) {
      const message: AgentMessageRecord = {
        id: `msg-${messages.length + 1}`,
        conversationId: input.conversationId,
        role: input.role,
        status: input.status,
        content: input.content,
        sourceJson: input.sourceJson ?? null,
        usageJson: input.usageJson ?? null,
        errorCode: input.errorCode ?? null,
        createdAt: new Date(),
      };
      messages.push(message);
      return message;
    },
    async startRun(input) {
    const question = input.userMessageId
      ? messages.find((message) => message.id === input.userMessageId)?.content ?? null
      : null;
    const run = {
      id: `run-${runs.length + 1}`,
      conversationId: input.conversationId ?? null,
      question,
      scopeType: input.scope.type,
      scopeValue: input.scope.value ?? null,
      retrievalStrategy: "supabase_keyword",
      retrievedChunkIds: input.retrievedChunkIds ?? [],
      createdAt: new Date(),
      status: input.status ?? "started",
      errorCode: input.errorCode ?? null,
      };
      runs.push(run);
      return run;
    },
    async listRuns(input) {
      return runs.slice(-input.limit).reverse();
    },
    async finishRun(input) {
      const run = runs.find((item) => item.id === input.runId);
      if (run) {
        run.status = input.status;
        run.errorCode = input.errorCode ?? null;
        run.inputTokens = input.inputTokens ?? 0;
        run.outputTokens = input.outputTokens ?? 0;
        run.latencyMs = input.latencyMs ?? null;
        run.retrievedChunkIds = input.retrievedChunkIds ?? [];
        run.completedAt = new Date();
      }
    },
  };
}

function toRunRecord(row: typeof aiAgentRuns.$inferSelect, question?: string | null): AgentRunRecord {
  return {
    id: row.id,
    conversationId: row.conversationId,
    status: row.status,
    model: row.model,
    question: question ?? null,
    scopeType: row.scopeType,
    scopeValue: row.scopeValue,
    retrievalStrategy: row.retrievalStrategy,
    retrievedChunkIds: row.retrievedChunkIds,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    latencyMs: row.latencyMs,
    errorCode: row.errorCode,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

function toConversationRecord(row: typeof aiConversations.$inferSelect): AgentConversationRecord {
  return {
    id: row.id,
    ownerType: row.ownerType,
    ownerKey: row.ownerKey,
    title: row.title,
    scopeType: row.scopeType,
    scopeValue: row.scopeValue,
    updatedAt: row.updatedAt,
    lastMessageAt: row.lastMessageAt,
  };
}

function toMessageRecord(row: typeof aiMessages.$inferSelect): AgentMessageRecord {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    status: row.status,
    content: row.content,
    sourceJson: asRecord(row.sourceJson),
    usageJson: asRecord(row.usageJson),
    errorCode: row.errorCode,
    createdAt: row.createdAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
