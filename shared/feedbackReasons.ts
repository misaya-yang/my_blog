export const FEEDBACK_REASONS = [
  "unclear_mechanism",
  "needs_example",
  "unsupported_claim",
  "awkward_wording",
  "missing_next_step",
  "other",
] as const;

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

const FEEDBACK_REASON_PREFIX = "Feedback reason:";

export function isFeedbackReason(value: string): value is FeedbackReason {
  return (FEEDBACK_REASONS as readonly string[]).includes(value);
}

export function getFeedbackReasonLabelKey(reason: FeedbackReason) {
  return `engagement.feedback.reason.${reason}`;
}

export function formatFeedbackMessageWithReason(
  message: string | null | undefined,
  reason: FeedbackReason | undefined
) {
  if (!reason) return message ?? null;
  const reasonLine = `${FEEDBACK_REASON_PREFIX} ${reason}`;
  return message ? `${reasonLine}\n\n${message}` : reasonLine;
}

export function parseFeedbackMessageWithReason(
  message: string | null | undefined
) {
  if (!message) {
    return { reason: null, message: null } as const;
  }

  const [firstLine, ...remainingLines] = message.split(/\r?\n/);
  const match = new RegExp(`^${FEEDBACK_REASON_PREFIX}\\s+(.+)$`).exec(
    firstLine.trim()
  );
  const reason = match?.[1];
  if (!reason || !isFeedbackReason(reason)) {
    return { reason: null, message } as const;
  }

  const strippedMessage = remainingLines.join("\n").trim();
  return {
    reason,
    message: strippedMessage || null,
  } as const;
}
