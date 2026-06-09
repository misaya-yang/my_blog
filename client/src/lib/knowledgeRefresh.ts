export type KnowledgeRefreshState = {
  status: "fresh" | "stale";
  message?: string | null;
};

export type KnowledgeRefreshResult = {
  knowledgeRefresh?: KnowledgeRefreshState | null;
};

export function getKnowledgeRefreshState(
  result: unknown
): KnowledgeRefreshState | null {
  if (!result || typeof result !== "object") return null;

  const refresh = (result as KnowledgeRefreshResult).knowledgeRefresh;
  if (!refresh || typeof refresh !== "object") return null;
  if (refresh.status !== "fresh" && refresh.status !== "stale") return null;

  return refresh;
}

export function isKnowledgeRefreshStale(result: unknown): boolean {
  return getKnowledgeRefreshState(result)?.status === "stale";
}
