import { describe, expect, it } from "vitest";

import {
  canShowPublicBlogAgent,
  classifyProductRoute,
  isKnownClientRoute,
  normalizeRoutePathname,
} from "./route-contract";

describe("shared route contract", () => {
  it("classifies public, reader, owner, editor, and system routes", () => {
    expect(classifyProductRoute("/")).toMatchObject({
      pathname: "/",
      kind: "home",
      known: true,
    });
    expect(classifyProductRoute("/post/agent-loop?ref=archive")).toMatchObject({
      pathname: "/post/agent-loop",
      kind: "reader",
      known: true,
      slug: "agent-loop",
    });
    expect(classifyProductRoute("/tags/rlhf#top")).toMatchObject({
      pathname: "/tags/rlhf",
      kind: "public",
      known: true,
      slug: "rlhf",
    });
    expect(classifyProductRoute("/categories/ai-applications")).toMatchObject({
      kind: "public",
      known: true,
      slug: "ai-applications",
    });
    expect(classifyProductRoute("/manage/agent")).toMatchObject({
      kind: "owner",
      known: true,
    });
    expect(classifyProductRoute("/write/draft-slug")).toMatchObject({
      kind: "editor",
      known: true,
    });
    expect(classifyProductRoute("/login")).toMatchObject({
      kind: "system",
      known: true,
    });
    expect(classifyProductRoute("/not-a-real-route")).toMatchObject({
      kind: "system",
      known: false,
    });
  });

  it("normalizes route pathname without treating similarly named paths as owner routes", () => {
    expect(normalizeRoutePathname("/archive///?month=2026-07")).toBe(
      "/archive"
    );
    expect(classifyProductRoute("/managed-reading-notes")).toMatchObject({
      kind: "system",
      known: false,
    });
    expect(isKnownClientRoute("/write/post-draft")).toBe(true);
    expect(isKnownClientRoute("/managed-reading-notes")).toBe(false);
  });

  it("allows the public Blog Agent only on home, public, and reader routes", () => {
    expect(canShowPublicBlogAgent("/")).toBe(true);
    expect(canShowPublicBlogAgent("/applications")).toBe(true);
    expect(canShowPublicBlogAgent("/post/agent-loop")).toBe(true);
    expect(canShowPublicBlogAgent("/manage")).toBe(false);
    expect(canShowPublicBlogAgent("/write")).toBe(false);
    expect(canShowPublicBlogAgent("/login")).toBe(false);
    expect(canShowPublicBlogAgent("/404")).toBe(false);
    expect(canShowPublicBlogAgent("/unknown")).toBe(false);
  });
});
