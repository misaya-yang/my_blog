import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  AgentQuotaBadge,
  AgentQuotaCallout,
  shouldShowQuotaCallout,
} from "./AgentQuotaStatus";
import type { QuotaInfo } from "./types";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: translate,
  }),
}));

describe("AgentQuotaStatus", () => {
  it("renders remaining quota copy when quota is not low", () => {
    const html = renderToStaticMarkup(
      <AgentQuotaBadge quota={quota({ remaining: 7 })} />
    );

    expect(html).toContain("7 of 10 left today");
    expect(html).toContain('title="visitor quota"');
  });

  it("renders low quota copy and low quota callout", () => {
    const badgeHtml = renderToStaticMarkup(
      <AgentQuotaBadge quota={quota({ remaining: 1 })} />
    );
    const calloutHtml = renderToStaticMarkup(
      <AgentQuotaCallout quota={quota({ remaining: 1 })} />
    );

    expect(badgeHtml).toContain("1 left today");
    expect(calloutHtml).toContain("Almost out of daily questions");
    expect(shouldShowQuotaCallout(quota({ remaining: 1 }))).toBe(true);
  });

  it("shows admin callout even when quota is not low", () => {
    const adminQuota = quota({ remaining: 10, tier: "admin" });
    const html = renderToStaticMarkup(
      <AgentQuotaCallout quota={adminQuota} />
    );

    expect(shouldShowQuotaCallout(adminQuota)).toBe(true);
    expect(html).toContain("Admin quota tier");
  });

  it("does not show regular non-low visitor callouts", () => {
    expect(shouldShowQuotaCallout(quota({ remaining: 2 }))).toBe(false);
  });
});

function quota(overrides: Partial<QuotaInfo> = {}): QuotaInfo {
  return {
    limit: 10,
    used: 3,
    remaining: 7,
    tier: "visitor",
    ...overrides,
  };
}

function translate(key: string, values?: Record<string, number>) {
  if (key === "agent.quota.remaining") {
    return `${values?.remaining} of ${values?.limit} left today`;
  }
  return (
    (
      {
        "agent.quota.low": `${values?.remaining} left today`,
        "agent.quota.lowDetail": "Almost out of daily questions",
        "agent.quota.adminDetail": "Admin quota tier",
      } satisfies Record<string, string>
    )[key] ?? key
  );
}
