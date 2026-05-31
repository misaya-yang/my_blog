import { describe, expect, it } from "vitest";
import {
  buildRouteContext,
  getCompanionPromptKeys,
  getCompanionWelcomeKeys,
  inferClientScope,
} from "./routeContext";

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

  it("returns distinct companion prompt sets by route type", () => {
    const postContext = buildRouteContext("/post/agent-loop-observable-tool-using-agents", "en");
    const applicationsContext = buildRouteContext("/applications", "en");
    const algorithmsContext = buildRouteContext("/algorithms", "en");

    expect(getCompanionPromptKeys(postContext)).toContain("agent.prompts.postAbstraction");
    expect(getCompanionPromptKeys(applicationsContext)).toContain("agent.prompts.applicationsPath");
    expect(getCompanionPromptKeys(algorithmsContext)).toContain("agent.prompts.algorithmsMap");
    expect(getCompanionPromptKeys(postContext)).not.toEqual(
      getCompanionPromptKeys(applicationsContext)
    );
  });

  it("uses article and track welcome copy keys", () => {
    expect(getCompanionWelcomeKeys(buildRouteContext("/post/agent-loop", "en"))).toEqual({
      titleKey: "agent.welcome.postTitle",
      bodyKey: "agent.welcome.postBody",
    });
    expect(getCompanionWelcomeKeys(buildRouteContext("/applications", "en"))).toEqual({
      titleKey: "agent.welcome.trackTitle",
      bodyKey: "agent.welcome.trackBody",
    });
  });
});
