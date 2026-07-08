import { describe, expect, it } from "vitest";

import { getArchiveSummary, hasMeaningfulUpdate } from "./Archive";

describe("archive helpers", () => {
  it("detects meaningful date changes only when the calendar day differs", () => {
    expect(
      hasMeaningfulUpdate({
        publishedAt: "2026-07-09T00:10:00.000Z",
        updatedAt: "2026-07-09T08:00:00.000Z",
      })
    ).toBe(false);

    expect(
      hasMeaningfulUpdate({
        publishedAt: "2026-07-08T08:00:00.000Z",
        updatedAt: "2026-07-09T08:00:00.000Z",
      })
    ).toBe(true);

    expect(hasMeaningfulUpdate({ publishedAt: null, updatedAt: null })).toBe(
      false
    );
  });

  it("summarizes month groups defensively", () => {
    expect(
      getArchiveSummary([
        { posts: [{ id: 1 }, { id: 2 }] },
        { posts: [{ id: 3 }] },
        {},
      ])
    ).toEqual({
      monthCount: 3,
      total: 3,
    });

    expect(getArchiveSummary(null)).toEqual({
      monthCount: 0,
      total: 0,
    });
  });
});
