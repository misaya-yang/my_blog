import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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
            "Send a short private note about what worked, what was unclear, or what should be added next.",
          "engagement.feedback.anonymousIdentity":
            "You can submit anonymously.",
          "engagement.feedback.privateNote":
            "Stored privately for the owner backlog.",
          "engagement.feedback.optionalReply": "Reply email is optional.",
          "engagement.feedback.afterSubmit":
            "Useful for revisions, examples, and follow-up notes.",
          "engagement.feedback.useful": "Useful",
          "engagement.feedback.notUseful": "Not useful",
          "engagement.feedback.messagePlaceholder":
            "Optional note: what was clear or missing?",
          "engagement.feedback.namePlaceholder": "Optional nickname",
          "engagement.feedback.emailPlaceholder": "Optional reply email",
          "engagement.feedback.privacy":
            "Reply email is optional and only used when follow-up is needed.",
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
  it("keeps the form as the primary path instead of a direct email CTA", () => {
    const html = renderToStaticMarkup(
      <ArticleFeedback postId={1} postTitle="Agent Harness Engine" />
    );

    expect(html).toContain("Private feedback for Agent Harness Engine");
    expect(html).toContain("Stored privately for the owner backlog.");
    expect(html).toContain("Reply email is optional.");
    expect(html).toContain("Useful for revisions, examples, and follow-up notes.");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("zedpl28174");
  });
});
