import type { AgentTraceEntry, ChatMessage } from "./types";

export type AgentTraceStageDuration = AgentTraceEntry & {
  durationMs: number;
};

export function getAgentDisplayElapsedMs(message: ChatMessage) {
  if (
    typeof message.finalElapsedMs === "number" &&
    Number.isFinite(message.finalElapsedMs)
  ) {
    return Math.max(0, message.finalElapsedMs);
  }
  return Math.max(
    0,
    ...(message.traceEntries ?? []).map(entry => entry.elapsedMs)
  );
}

export function getTraceStageDurations(
  entries: AgentTraceEntry[]
): AgentTraceStageDuration[] {
  let previousElapsedMs = 0;
  return entries
    .slice()
    .sort((left, right) => left.elapsedMs - right.elapsedMs)
    .map(entry => {
      const elapsedMs = Math.max(0, entry.elapsedMs);
      const durationMs = Math.max(0, elapsedMs - previousElapsedMs);
      previousElapsedMs = elapsedMs;
      return { ...entry, elapsedMs, durationMs };
    });
}
