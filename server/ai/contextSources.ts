import { createHash } from "node:crypto";
import { and, eq, gt, isNotNull, isNull, lte, or } from "drizzle-orm";
import { aiContextSources } from "../../drizzle/schema.js";
import { getDb } from "../db.js";
import type {
  AgentContextSourceKind,
  AgentContextSourceRecord,
  AgentIdentity,
} from "./types.js";

const MAX_CONTEXT_CHARS = 20_000;
const DEFAULT_PASTED_FILENAME = "Pasted context";

export type ContextSourceStore = {
  addSource(input: {
    conversationId: string;
    identity: AgentIdentity;
    kind: AgentContextSourceKind;
    filename?: string | null;
    mimeType?: string | null;
    content: string;
    expiresAt?: Date | null;
    now?: Date;
  }): Promise<AgentContextSourceRecord>;
  listSources(input: {
    conversationId: string;
    identity: AgentIdentity;
    now?: Date;
  }): Promise<AgentContextSourceRecord[]>;
  cleanupExpired(now?: Date): Promise<number>;
};

export type NormalizedContextSourceInput = {
  kind: AgentContextSourceKind;
  filename: string;
  mimeType: string;
  content: string;
  contentHash: string;
  tokenEstimate: number;
};

export class PostgresContextSourceStore implements ContextSourceStore {
  async addSource(input: {
    conversationId: string;
    identity: AgentIdentity;
    kind: AgentContextSourceKind;
    filename?: string | null;
    mimeType?: string | null;
    content: string;
    expiresAt?: Date | null;
    now?: Date;
  }): Promise<AgentContextSourceRecord> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const normalized = normalizeContextSourceInput(input);
    const created = await db
      .insert(aiContextSources)
      .values({
        conversationId: input.conversationId,
        ownerType: input.identity.type,
        ownerKey: input.identity.key,
        kind: normalized.kind,
        filename: normalized.filename,
        mimeType: normalized.mimeType,
        content: normalized.content,
        contentHash: normalized.contentHash,
        tokenEstimate: normalized.tokenEstimate,
        expiresAt: input.expiresAt ?? null,
        updatedAt: input.now ?? new Date(),
      })
      .returning();

    return toContextSourceRecord(created[0]);
  }

  async listSources(input: {
    conversationId: string;
    identity: AgentIdentity;
    now?: Date;
  }): Promise<AgentContextSourceRecord[]> {
    const db = await getDb();
    if (!db) return [];
    const now = input.now ?? new Date();

    const rows = await db
      .select()
      .from(aiContextSources)
      .where(
        and(
          eq(aiContextSources.conversationId, input.conversationId),
          eq(aiContextSources.ownerType, input.identity.type),
          eq(aiContextSources.ownerKey, input.identity.key),
          eq(aiContextSources.status, "ready"),
          or(isNull(aiContextSources.expiresAt), gt(aiContextSources.expiresAt, now))
        )
      )
      .orderBy(aiContextSources.createdAt)
      .limit(8);

    return rows.map(toContextSourceRecord);
  }

  async cleanupExpired(now = new Date()): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const deleted = await db
      .delete(aiContextSources)
      .where(
        and(
          eq(aiContextSources.status, "ready"),
          isNotNull(aiContextSources.expiresAt),
          lte(aiContextSources.expiresAt, now)
        )
      )
      .returning({ id: aiContextSources.id });

    return deleted.length;
  }
}

export function createMemoryContextSourceStore(): ContextSourceStore & {
  sources: AgentContextSourceRecord[];
} {
  const sources: AgentContextSourceRecord[] = [];

  return {
    sources,
    async addSource(input) {
      const normalized = normalizeContextSourceInput(input);
      const id = `context-${sources.length + 1}`;
      const now = input.now ?? new Date();
      const source: AgentContextSourceRecord = {
        id,
        conversationId: input.conversationId,
        ownerType: input.identity.type,
        ownerKey: input.identity.key,
        kind: normalized.kind,
        status: "ready",
        filename: normalized.filename,
        mimeType: normalized.mimeType,
        content: normalized.content,
        contentHash: normalized.contentHash,
        tokenEstimate: normalized.tokenEstimate,
        expiresAt: input.expiresAt ?? null,
        createdAt: now,
        updatedAt: now,
        sourceId: `context:${id}`,
        sourceType: "user_context",
        excerpt: buildExcerpt(normalized.content),
      };
      sources.push(source);
      return source;
    },
    async listSources(input) {
      const now = input.now ?? new Date();
      return sources.filter(
        (source) =>
          source.conversationId === input.conversationId &&
          source.ownerType === input.identity.type &&
          source.ownerKey === input.identity.key &&
          source.status === "ready" &&
          (!source.expiresAt || source.expiresAt > now)
      );
    },
    async cleanupExpired(now = new Date()) {
      const before = sources.length;
      for (let index = sources.length - 1; index >= 0; index -= 1) {
        const source = sources[index];
        if (source.status === "ready" && source.expiresAt && source.expiresAt <= now) {
          sources.splice(index, 1);
        }
      }
      return before - sources.length;
    },
  };
}

export function normalizeContextSourceInput(input: {
  kind: AgentContextSourceKind;
  filename?: string | null;
  mimeType?: string | null;
  content: string;
}): NormalizedContextSourceInput {
  const content = input.content.replace(/\r\n/g, "\n").trim();
  if (!content) throw new Error("Context source content is required");
  if (content.length > MAX_CONTEXT_CHARS) {
    throw new Error(`Context source content must be ${MAX_CONTEXT_CHARS} characters or fewer`);
  }

  const filename = normalizeFilename(input.kind, input.filename);
  const mimeType = normalizeMimeType(input.kind, input.mimeType);

  if (!isSupportedContextSource(input.kind, filename, mimeType)) {
    throw new Error("Only pasted text, .txt, and .md context sources are supported");
  }

  return {
    kind: input.kind,
    filename,
    mimeType,
    content,
    contentHash: createHash("sha256").update(`${input.kind}\n${filename}\n${content}`).digest("hex"),
    tokenEstimate: estimateTokens(content),
  };
}

function normalizeFilename(kind: AgentContextSourceKind, filename?: string | null) {
  const fallback = kind === "pasted_text" ? DEFAULT_PASTED_FILENAME : "context.txt";
  const normalized = (filename ?? fallback).replace(/[\\/:*?"<>|]/g, "-").trim();
  return normalized.slice(0, 255) || fallback;
}

function normalizeMimeType(kind: AgentContextSourceKind, mimeType?: string | null) {
  if (mimeType?.trim()) return mimeType.toLowerCase().trim().slice(0, 120);
  if (kind === "markdown_file") return "text/markdown";
  return "text/plain";
}

function isSupportedContextSource(
  kind: AgentContextSourceKind,
  filename: string,
  mimeType: string
) {
  if (kind === "pasted_text") return mimeType.startsWith("text/");
  if (kind === "text_file") return filename.toLowerCase().endsWith(".txt") && mimeType.startsWith("text/");
  return filename.toLowerCase().endsWith(".md") && mimeType.startsWith("text/");
}

function toContextSourceRecord(row: typeof aiContextSources.$inferSelect): AgentContextSourceRecord {
  return {
    id: row.id,
    conversationId: row.conversationId,
    ownerType: row.ownerType,
    ownerKey: row.ownerKey,
    kind: row.kind,
    status: row.status,
    filename: row.filename,
    mimeType: row.mimeType,
    content: row.content,
    contentHash: row.contentHash,
    tokenEstimate: row.tokenEstimate,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sourceId: `context:${row.id}`,
    sourceType: "user_context",
    excerpt: buildExcerpt(row.content),
  };
}

function estimateTokens(content: string) {
  return Math.ceil(content.length / 4);
}

function buildExcerpt(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 260 ? `${normalized.slice(0, 257)}...` : normalized;
}
