import { useSyncExternalStore } from "react";

type AgentOpenStateUpdater = boolean | ((current: boolean) => boolean);

let agentOpen = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return agentOpen;
}

export function useBlogAgentOpenState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setBlogAgentOpenState(next: AgentOpenStateUpdater) {
  const resolved = typeof next === "function" ? next(agentOpen) : next;
  if (resolved === agentOpen) return;

  agentOpen = resolved;
  listeners.forEach(listener => listener());
}
