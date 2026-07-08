import { describe, expect, it } from "vitest";

import {
  buildCompanionPrompts,
  getAgentSessionKey,
  getCompanionWelcome,
  getContextFileKind,
  getFallbackMimeType,
  getFocusableElements,
} from "./agentCompanionRuntime";
import { buildRouteContext } from "./routeContext";

describe("agent companion runtime helpers", () => {
  it("falls back to server prompts before generic prompts", () => {
    expect(
      buildCompanionPrompts(buildRouteContext("/search", "en"), missingPrompt, [
        "Server prompt one",
        "Server prompt two",
        "Server prompt three",
        "Server prompt four",
      ])
    ).toEqual(["Server prompt one", "Server prompt two", "Server prompt three"]);
  });

  it("falls back to generic companion prompts when route prompts are untranslated", () => {
    expect(
      buildCompanionPrompts(
        buildRouteContext("/post/agent-loop", "en"),
        fallbackPrompt
      )
    ).toEqual(["Site themes", "Compare tracks", "Reading path"]);
  });

  it("uses route-specific welcome copy", () => {
    expect(
      getCompanionWelcome(buildRouteContext("/post/agent-loop", "en"), welcome)
    ).toEqual({
      title: "Article helper",
      body: "Ask about this article.",
    });
  });

  it("derives stable session identity keys without exposing full session data", () => {
    expect(getAgentSessionKey(null)).toBe("loading");
    expect(getAgentSessionKey({ role: "anonymous" })).toBe("anonymous");
    expect(getAgentSessionKey({ role: "admin", displayName: null })).toBe(
      "admin:owner"
    );
    expect(
      getAgentSessionKey({ role: "visitor", visitorId: "visitor-1" })
    ).toBe("visitor:visitor-1");
  });

  it("classifies attachable context files and fallback MIME types", () => {
    expect(getContextFileKind("notes.MD")).toBe("markdown_file");
    expect(getContextFileKind("trace.txt")).toBe("text_file");
    expect(getContextFileKind("archive.pdf")).toBeNull();
    expect(getFallbackMimeType("markdown_file")).toBe("text/markdown");
    expect(getFallbackMimeType("text_file")).toBe("text/plain");
  });

  it("filters focusable elements to visible, enabled controls", () => {
    const visibleButton = fakeFocusable("visible-button");
    const disabledButton = fakeFocusable("disabled-button", {
      disabled: true,
    });
    const hiddenInput = fakeFocusable("hidden-input", { visible: false });
    const ariaHiddenLink = fakeFocusable("aria-hidden-link", {
      ariaHidden: true,
    });

    expect(
      getFocusableElements(
        fakeContainer([
          visibleButton,
          disabledButton,
          hiddenInput,
          ariaHiddenLink,
        ])
      ).map(element => element.dataset.testid)
    ).toEqual(["visible-button"]);
  });
});

function missingPrompt(key: string) {
  return key;
}

function fallbackPrompt(key: string) {
  return (
    {
      "agent.prompts.siteThemes": "Site themes",
      "agent.prompts.compareTracks": "Compare tracks",
      "agent.prompts.readingPath": "Reading path",
    } satisfies Record<string, string>
  )[key] ?? key;
}

function welcome(key: string) {
  return (
    {
      "agent.welcome.postTitle": "Article helper",
      "agent.welcome.postBody": "Ask about this article.",
    } satisfies Record<string, string>
  )[key] ?? key;
}

function fakeContainer(elements: HTMLElement[]) {
  return {
    querySelectorAll: () => elements,
  } as unknown as HTMLElement;
}

function fakeFocusable(
  testid: string,
  options: {
    disabled?: boolean;
    ariaHidden?: boolean;
    visible?: boolean;
  } = {}
) {
  return {
    dataset: { testid },
    hasAttribute: (name: string) => name === "disabled" && options.disabled,
    getAttribute: (name: string) =>
      name === "aria-hidden" && options.ariaHidden ? "true" : null,
    offsetParent: options.visible === false ? null : {},
  } as unknown as HTMLElement;
}
