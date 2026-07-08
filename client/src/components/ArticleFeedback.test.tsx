import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FEEDBACK_REASONS } from "@shared/feedbackReasons";

import { ArticleFeedback } from "./ArticleFeedback";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    displayName: null,
    isVisitor: false,
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string, vars?: Record<string, string | number>) =>
      (
        {
          "engagement.feedback.title": "Was this useful?",
          "engagement.feedback.ariaLabel": `Private feedback for ${vars?.title}`,
          "engagement.feedback.description":
            "A quick signal is enough. Add context only when it helps revise the article.",
          "engagement.feedback.anonymousIdentity":
            "You can submit anonymously.",
          "engagement.feedback.privateNote":
            "Stored privately for the owner backlog.",
          "engagement.feedback.optionalReply": "Reply email is optional.",
          "engagement.feedback.afterSubmit":
            "Useful for revisions, examples, and follow-up notes.",
          "engagement.feedback.trustSummary":
            "Private, optional, and used only for article improvements.",
          "engagement.feedback.useful": "Useful",
          "engagement.feedback.notUseful": "Not useful",
          "engagement.feedback.detailsToggle": "Add a private note",
          "engagement.feedback.detailsHide": "Hide private note",
          "engagement.feedback.reasonLabel": "What should I improve?",
          "engagement.feedback.reasonHint":
            "Choose one reason if it helps route this into the right revision.",
          "engagement.feedback.reason.unclear_mechanism": "Mechanism unclear",
          "engagement.feedback.reason.needs_example": "Needs example",
          "engagement.feedback.reason.unsupported_claim": "Needs evidence",
          "engagement.feedback.reason.awkward_wording": "Wording awkward",
          "engagement.feedback.reason.missing_next_step": "Missing next step",
          "engagement.feedback.reason.other": "Other",
          "engagement.feedback.messagePlaceholder":
            "Optional note: what was clear or missing?",
          "engagement.feedback.namePlaceholder": "Optional nickname",
          "engagement.feedback.emailPlaceholder": "Optional reply email",
          "engagement.feedback.privacy":
            "Reply email is optional and only used when follow-up is needed.",
          "engagement.feedback.quickHint":
            "Choose one signal. Details are optional.",
          "engagement.feedback.submit": "Send feedback",
          "engagement.feedback.loading": "Sending...",
          "engagement.feedback.error": "Feedback failed",
          "engagement.feedback.rateLimited":
            "Too many attempts. Please try again later.",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackAnalyticsEvent: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    engagement: {
      feedback: {
        create: {
          useMutation: () => ({
            mutate: vi.fn(),
            isPending: false,
            error: null,
          }),
        },
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ArticleFeedback reader trust copy", () => {
  it("keeps quick feedback visible without exposing optional fields by default", () => {
    const html = renderToStaticMarkup(
      <ArticleFeedback postId={1} postTitle="Agent Harness Engine" />
    );

    expect(html).toContain("Private feedback for Agent Harness Engine");
    expect(html).toContain("A quick signal is enough.");
    expect(html).toContain("Useful");
    expect(html).toContain("Not useful");
    expect(html).toContain("Add a private note");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Send feedback");
    expect(html).toContain("Choose one signal. Details are optional.");
    expect(html).not.toContain("Optional note: what was clear or missing?");
    expect(html).not.toContain("What should I improve?");
    expect(html).not.toContain("Mechanism unclear");
    expect(html).not.toContain("Needs example");
    expect(html).not.toContain("Optional nickname");
    expect(html).not.toContain("Optional reply email");
  });

  it("keeps trust details available without a direct email CTA", () => {
    const html = renderToStaticMarkup(
      <ArticleFeedback postId={1} postTitle="Agent Harness Engine" />
    );

    expect(html).toContain(
      "Private, optional, and used only for article improvements."
    );
    expect(html).toContain("Stored privately for the owner backlog.");
    expect(html).toContain("Reply email is optional.");
    expect(html).toContain("Useful for revisions, examples, and follow-up notes.");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("zedpl28174");
  });

  it("keeps a stable optional reason taxonomy for owner backlog routing", () => {
    expect(FEEDBACK_REASONS).toEqual([
      "unclear_mechanism",
      "needs_example",
      "unsupported_claim",
      "awkward_wording",
      "missing_next_step",
      "other",
    ]);
  });
});
