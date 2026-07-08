import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SubscriptionForm } from "./SubscriptionForm";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string) =>
      (
        {
          "engagement.subscribe.title": "Save reading preferences",
          "engagement.subscribe.articleTitle":
            "Save interest in future notes",
          "engagement.subscribe.description":
            "Leave an email for future notes. Topics and language are optional.",
          "engagement.subscribe.rss": "RSS",
          "engagement.subscribe.emailPlaceholder": "you@example.com",
          "engagement.subscribe.interestsPlaceholder":
            "Optional topics: RoPE, agents, RAG...",
          "engagement.subscribe.languageLabel": "Email language",
          "engagement.subscribe.detailsToggle": "Add topics and language",
          "engagement.subscribe.detailsHide": "Hide topics and language",
          "engagement.subscribe.loading": "Saving...",
          "engagement.subscribe.button": "Save preference",
          "engagement.subscribe.error": "Preference could not be saved",
          "engagement.subscribe.rateLimited":
            "Too many attempts. Please try again later.",
          "engagement.subscribe.successCreated":
            "Saved as a reading signal. Use RSS for updates until email delivery is connected.",
          "engagement.subscribe.successExisting":
            "Already saved. Preferences were refreshed.",
          "engagement.subscribe.privacy":
            "Only email and optional topics are stored. No delivery provider is connected yet.",
          "nav.switchToZh": "中文",
          "nav.switchToEn": "EN",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    engagement: {
      subscribe: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        }),
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

describe("SubscriptionForm article surface", () => {
  it("keeps the article subscription path compact by default", () => {
    const html = renderToStaticMarkup(
      <SubscriptionForm surface="article" embedded />
    );

    expect(html).toContain("Save interest in future notes");
    expect(html).toContain("Leave an email for future notes.");
    expect(html).toContain("you@example.com");
    expect(html).toContain("Save preference");
    expect(html).toContain('href="/rss.xml"');
    expect(html).toContain("Add topics and language");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(
      "Only email and optional topics are stored. No delivery provider is connected yet."
    );
    expect(html).not.toContain("Optional topics: RoPE, agents, RAG...");
    expect(html).not.toContain("Email language");
  });
});
