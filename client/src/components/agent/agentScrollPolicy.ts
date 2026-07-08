export function isAgentNearBottom(
  element:
    | Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">
    | null
    | undefined,
  threshold = 96
) {
  if (!element) return true;
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
  );
}

export type AgentScrollPolicyEvent =
  | "submit"
  | "stream_status"
  | "answer_delta"
  | "final"
  | "failed";

export function getNextAgentStreamFollowState({
  event,
  scroller,
  threshold,
}: {
  event: AgentScrollPolicyEvent;
  scroller:
    | Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">
    | null
    | undefined;
  threshold?: number;
}) {
  if (event === "submit") return true;
  if (event === "stream_status" || event === "answer_delta") {
    return isAgentNearBottom(scroller, threshold);
  }
  return false;
}

export function shouldScrollAgentMessagesToEnd({
  streaming,
  shouldFollowStream,
}: {
  streaming: boolean;
  shouldFollowStream: boolean;
}) {
  return streaming && shouldFollowStream;
}
