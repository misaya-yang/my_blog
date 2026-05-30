import { describe, expect, it, vi } from "vitest";
import { reportErrorToAnalytics, shouldShowErrorStack } from "./ErrorBoundary";
import * as analytics from "@/lib/analytics";

describe("ErrorBoundary safety helpers", () => {
  it("shows stack traces only in development", () => {
    expect(shouldShowErrorStack(true)).toBe(true);
    expect(shouldShowErrorStack(false)).toBe(false);
  });

  it("reports client errors through analytics without throwing", () => {
    const spy = vi.spyOn(analytics, "trackClientError").mockImplementation(() => undefined);

    expect(() =>
      reportErrorToAnalytics(new Error("Boom"), { componentStack: "\n    at Test" })
    ).not.toThrow();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Boom",
        componentStack: "\n    at Test",
      })
    );
  });
});
