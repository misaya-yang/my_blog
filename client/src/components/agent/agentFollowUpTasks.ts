export const AGENT_FOLLOW_UP_TASK_LIMIT = 3;

export function getVisibleAgentFollowUpTasks(questions: string[]) {
  const seen = new Set<string>();
  const tasks: string[] = [];

  for (const question of questions) {
    const normalized = question.replace(/\s+/g, " ").trim();
    const key = normalized.toLocaleLowerCase();
    if (!normalized || seen.has(key)) continue;

    seen.add(key);
    tasks.push(normalized);
    if (tasks.length >= AGENT_FOLLOW_UP_TASK_LIMIT) break;
  }

  return tasks;
}
