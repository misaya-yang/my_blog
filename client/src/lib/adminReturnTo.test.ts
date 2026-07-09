import { describe, expect, it } from "vitest";

import {
  buildAdminLoginHref,
  getSafeAdminReturnPath,
  isSafeAdminReturnPath,
} from "./adminReturnTo";

describe("admin return-to helpers", () => {
  it("allows owner routes with query and hash", () => {
    expect(isSafeAdminReturnPath("/manage")).toBe(true);
    expect(isSafeAdminReturnPath("/manage/agent?tab=eval#runs")).toBe(true);
    expect(isSafeAdminReturnPath("/write/new?source=feedback")).toBe(true);
  });

  it("rejects external or public return values", () => {
    expect(isSafeAdminReturnPath("https://example.com/manage")).toBe(false);
    expect(isSafeAdminReturnPath("//example.com/manage")).toBe(false);
    expect(isSafeAdminReturnPath("/post/goal-harness-agent-phase-protocol")).toBe(
      false
    );
    expect(isSafeAdminReturnPath("/login")).toBe(false);
    expect(isSafeAdminReturnPath("/manage\\evil")).toBe(false);
  });

  it("parses login query return target with safe fallback", () => {
    expect(
      getSafeAdminReturnPath("?returnTo=%2Fmanage%2Fagent%3Ftab%3Druns")
    ).toBe("/manage/agent?tab=runs");
    expect(getSafeAdminReturnPath("?returnTo=https%3A%2F%2Fevil.test")).toBe(
      "/"
    );
  });

  it("builds login href only for safe owner paths", () => {
    expect(buildAdminLoginHref("/write/draft#meta")).toBe(
      "/login?returnTo=%2Fwrite%2Fdraft%23meta"
    );
    expect(buildAdminLoginHref("/archive")).toBe("/login");
  });
});
