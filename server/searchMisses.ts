import { redactDirectContact } from "../shared/redaction.js";

const SEARCH_MISS_MAX_ENTRIES = 100;

const searchMisses = new Map<
  string,
  {
    query: string;
    normalizedQuery: string;
    count: number;
    firstSeenAt: Date;
    lastSeenAt: Date;
  }
>();

export function normalizeSearchMissQuery(query: string) {
  return sanitizeSearchMissQuery(query)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120)
    .toLowerCase();
}

export function recordSearchMiss(query: string) {
  const sanitizedQuery = sanitizeSearchMissQuery(query);
  const normalizedQuery = normalizeSearchMissQuery(sanitizedQuery);
  if (normalizedQuery.length < 2) return;

  const now = new Date();
  const existing = searchMisses.get(normalizedQuery);
  if (existing) {
    searchMisses.set(normalizedQuery, {
      ...existing,
      count: existing.count + 1,
      lastSeenAt: now,
    });
    return;
  }

  if (searchMisses.size >= SEARCH_MISS_MAX_ENTRIES) {
    const oldest = Array.from(searchMisses.values()).sort(
      (a, b) => a.lastSeenAt.getTime() - b.lastSeenAt.getTime()
    )[0];
    if (oldest) searchMisses.delete(oldest.normalizedQuery);
  }

  searchMisses.set(normalizedQuery, {
    query: sanitizedQuery.trim().slice(0, 120),
    normalizedQuery,
    count: 1,
    firstSeenAt: now,
    lastSeenAt: now,
  });
}

export function listSearchMissOpportunities() {
  return Array.from(searchMisses.values())
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.lastSeenAt.getTime() - a.lastSeenAt.getTime() ||
        a.normalizedQuery.localeCompare(b.normalizedQuery)
    )
    .map(item => ({
      query: item.query,
      normalizedQuery: item.normalizedQuery,
      count: item.count,
      firstSeenAt: item.firstSeenAt,
      lastSeenAt: item.lastSeenAt,
      suggestedPrompt: `Write or connect a public note that answers: ${item.query}`,
    }));
}

function sanitizeSearchMissQuery(query: string) {
  return redactDirectContact(query);
}

export function resetSearchMissesForTests() {
  searchMisses.clear();
}
