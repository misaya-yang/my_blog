import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./ResearchShell";

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
        ({
          "nav.home": "Home",
          "nav.algorithms": "AI Algorithms",
          "nav.applications": "AI Applications",
          "nav.archive": "Archive",
          "nav.search": "Search",
          "nav.about": "About",
          "nav.write": "Write",
          "nav.login": "Login",
          "nav.menu": "Open navigation",
          "nav.menuDescription": "Primary navigation and display preferences",
          "nav.switchToZh": "中文",
          "nav.switchToEn": "EN",
          "nav.switchToLight": "Switch to light mode",
          "nav.switchToDark": "Switch to dark mode",
          "nav.brand": "Misaya Notes",
          "nav.back": "Back",
        }) satisfies Record<string, string>
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
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain(">Login<");
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
  });
});
