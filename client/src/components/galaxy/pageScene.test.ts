import { describe, expect, it } from "vitest";
import { getPageScene } from "./pageScene";

describe("page-specific starfield composition", () => {
  it("is stable for one article, independent of query and heading anchors", () => {
    expect(getPageScene("/post/flow#references")).toEqual(
      getPageScene("/post/flow?source=home")
    );
    expect(getPageScene("/post/flow")).toEqual(getPageScene("/post/flow"));
  });
  it("gives different articles different compositions and distinguishes the author page", () => {
    expect(getPageScene("/post/flow").phase).not.toBe(
      getPageScene("/post/agent").phase
    );
    expect(getPageScene("/about").mode).toBe("author");
    expect(getPageScene("/").mode).toBe("home");
    expect(getPageScene("/post/agent").mode).toBe("reading");
  });
});
