import { describe, expect, it } from "vitest";
import { buildRouteContext, inferClientScope } from "./routeContext";

describe("BlogAgent route context", () => {
  it("infers post scope from article routes", () => {
    const context = buildRouteContext("/post/agent-harness-engine", "en");

    expect(context).toMatchObject({
      path: "/post/agent-harness-engine",
      routeType: "post",
      postSlug: "agent-harness-engine",
      locale: "en",
    });
    expect(inferClientScope(context)).toEqual({
      type: "post",
      value: "agent-harness-engine",
    });
  });

  it("infers AI application track scope", () => {
    const context = buildRouteContext("/applications", "zh");

    expect(context).toMatchObject({
      routeType: "track",
      trackSlug: "ai-applications",
      locale: "zh",
    });
    expect(inferClientScope(context)).toEqual({
      type: "track",
      value: "ai-applications",
    });
  });

  it("falls back to site scope for public pages without a tighter scope", () => {
    const context = buildRouteContext("/archive", "en");

    expect(context.routeType).toBe("archive");
    expect(inferClientScope(context)).toEqual({ type: "site" });
  });
});
