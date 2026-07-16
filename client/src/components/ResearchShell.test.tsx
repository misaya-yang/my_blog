import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./ResearchShell";
import { setBlogAgentOpenState } from "./agent/agentController";

const authState = vi.hoisted(() => ({
  current: {
    isAdmin: false,
    isAuthenticated: false,
    displayName: null as string | null,
    logout: () => undefined,
  },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => authState.current,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    toggleLanguage: () => undefined,
    t: (key: string) =>
      (
        {
          "nav.home": "Home",
          "nav.algorithms": "AI Algorithms",
          "nav.applications": "AI Applications",
          "nav.archive": "Archive",
          "nav.search": "Search",
          "nav.about": "About",
          "nav.write": "Write",
          "nav.login": "Login",
          "nav.menu": "Open navigation",
          "nav.switchToZh": "中文",
          "nav.switchToEn": "EN",
          "nav.switchLanguageToZh": "Switch language to Chinese",
          "nav.switchLanguageToEn": "Switch language to English",
          "nav.switchToLight": "Switch to light mode",
          "nav.switchToDark": "Switch to dark mode",
          "nav.brand": "Misaya Notes",
          "nav.back": "Back",
          "agent.launcher.label": "Ask the blog",
          "agent.launcher.tooltip": "Open the blog agent",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "dark",
    toggleTheme: () => undefined,
    switchable: true,
  }),
}));

vi.mock("wouter", async () => {
  const ReactModule = await import("react");
  return {
    Link: ({
      href,
      className,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
      ReactModule.createElement("a", { href, className, ...props }, children),
  };
});

describe("SiteHeader public access model", () => {
  afterEach(() => {
    setBlogAgentOpenState(false);
  });

  it("does not advertise login to anonymous public readers", () => {
    authState.current = {
      isAdmin: false,
      isAuthenticated: false,
      displayName: null,
      logout: () => undefined,
    };

    const html = renderToStaticMarkup(<SiteHeader active="home" />);

    expect(html).toContain("Misaya Notes");
    expect(html).toContain('aria-label="Switch to light mode"');
    expect(html).toContain('aria-label="Switch language to Chinese"');
    expect(html).toContain('title="Switch language to Chinese"');
    expect(html).toContain("data-mobile-agent-trigger");
    expect(html).toContain('aria-label="Ask the blog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain(">Login<");
  });

  it("reflects the shared Agent open state on the mobile trigger", () => {
    setBlogAgentOpenState(true);

    const html = renderToStaticMarkup(<SiteHeader active="home" />);

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('data-state="open"');
  });

  it("keeps owner controls available after admin authentication", () => {
    authState.current = {
      isAdmin: true,
      isAuthenticated: true,
      displayName: "Misaya Yang",
      logout: () => undefined,
    };

    const html = renderToStaticMarkup(<SiteHeader active="home" />);

    expect(html).toContain('href="/write"');
    expect(html).toContain("Misaya");
  });

  it("does not show the theme toggle inside locked owner routes", () => {
    authState.current = {
      isAdmin: true,
      isAuthenticated: true,
      displayName: "Misaya Yang",
      logout: () => undefined,
    };

    const html = renderToStaticMarkup(<SiteHeader active="manage" />);

    expect(html).not.toContain("Switch to light mode");
    expect(html).not.toContain("Switch to dark mode");
    expect(html).not.toContain("data-mobile-agent-trigger");
  });

  it("lets system pages disable the mobile Agent entry explicitly", () => {
    const html = renderToStaticMarkup(
      <SiteHeader active="home" showAgent={false} />
    );

    expect(html).not.toContain("data-mobile-agent-trigger");
  });
});
