import { describe, expect, it } from "vitest";

import { isTheme, resolveInitialTheme } from "./ThemeContext";

describe("theme runtime helpers", () => {
  it("accepts only supported theme values", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("prefers a valid stored theme only when switching is enabled", () => {
    expect(
      resolveInitialTheme({
        switchable: true,
        storedTheme: "dark",
        defaultTheme: "light",
      })
    ).toBe("dark");

    expect(
      resolveInitialTheme({
        switchable: false,
        storedTheme: "dark",
        defaultTheme: "light",
      })
    ).toBe("light");
  });

  it("falls back to the configured default for invalid stored values", () => {
    expect(
      resolveInitialTheme({
        switchable: true,
        storedTheme: "system",
        defaultTheme: "dark",
      })
    ).toBe("dark");
  });
});
