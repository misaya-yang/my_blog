import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Archive, { formatMonth } from "./Archive";

const archiveQuery = vi.hoisted(() => ({
  data: [] as unknown[] | undefined,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: { discovery: { archive: { useQuery: () => archiveQuery } } },
}));

vi.mock("@/lib/seo", () => ({
  getClientSiteUrl: () => "https://example.test",
  useSeo: () => undefined,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", t: (key: string) => key }),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, isAdmin: false }),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark", switchable: false }),
}));

vi.mock("wouter", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
}));

describe("archive month labels", () => {
  it("keeps the server's UTC grouping month in both interface languages", () => {
    expect(formatMonth(2026, 8, "zh-CN")).toBe("2026年8月");
    expect(formatMonth(2026, 1, "en-US")).toBe("January 2026");
  });
});

describe("archive request recovery", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
    Object.assign(archiveQuery, {
      data: [],
      isLoading: false,
      isError: false,
      isFetching: false,
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("shows a retryable request failure instead of an empty archive", () => {
    archiveQuery.data = undefined;
    archiveQuery.isError = true;

    const html = renderToStaticMarkup(React.createElement(Archive));

    expect(html).toContain("discovery.archiveFailed");
    expect(html).toContain("common.retry");
    expect(html).not.toContain("discovery.archiveEmpty");
    expect(html).not.toContain("discovery.archiveSubtitle");
  });

  it("keeps an empty successful response distinct from a failed request", () => {
    const html = renderToStaticMarkup(React.createElement(Archive));

    expect(html).toContain("discovery.archiveEmpty");
    expect(html).not.toContain("discovery.archiveFailed");
    expect(html).not.toContain("common.retry");
  });
});
