export function normalizeBacklogSource(source: string | null | undefined) {
  const trimmed = source?.trim();
  if (!trimmed) return "backlog";
  return trimmed === "agent_radar" ? "agent_question" : trimmed;
}
