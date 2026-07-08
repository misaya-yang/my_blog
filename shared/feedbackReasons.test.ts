import { describe, expect, it } from "vitest";
import {
  FEEDBACK_REASONS,
  formatFeedbackMessageWithReason,
  getFeedbackReasonLabelKey,
  parseFeedbackMessageWithReason,
} from "./feedbackReasons";

describe("feedback reasons", () => {
  it("keeps the public reason taxonomy stable", () => {
    expect(FEEDBACK_REASONS).toEqual([
      "unclear_mechanism",
      "needs_example",
      "unsupported_claim",
      "awkward_wording",
      "missing_next_step",
      "other",
    ]);
    expect(getFeedbackReasonLabelKey("needs_example")).toBe(
      "engagement.feedback.reason.needs_example"
    );
  });

  it("formats and parses private feedback message prefixes", () => {
    const message = formatFeedbackMessageWithReason(
      "Show a shorter implementation path.",
      "needs_example"
    );

    expect(message).toBe(
      "Feedback reason: needs_example\n\nShow a shorter implementation path."
    );
    expect(parseFeedbackMessageWithReason(message)).toEqual({
      reason: "needs_example",
      message: "Show a shorter implementation path.",
    });
  });

  it("preserves legacy messages and invalid prefixes", () => {
    expect(parseFeedbackMessageWithReason("Plain feedback")).toEqual({
      reason: null,
      message: "Plain feedback",
    });
    expect(
      parseFeedbackMessageWithReason(
        "Feedback reason: marketing_followup\n\nPlain feedback"
      )
    ).toEqual({
      reason: null,
      message: "Feedback reason: marketing_followup\n\nPlain feedback",
    });
  });
});
