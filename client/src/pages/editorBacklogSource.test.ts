import { describe, expect, it } from "vitest";

import { normalizeBacklogSource } from "./editorBacklogSource";

describe("normalizeBacklogSource", () => {
  it("keeps canonical source values and defaults blank values", () => {
    expect(normalizeBacklogSource("feedback")).toBe("feedback");
    expect(normalizeBacklogSource(" search_miss ")).toBe("search_miss");
    expect(normalizeBacklogSource("")).toBe("backlog");
    expect(normalizeBacklogSource(null)).toBe("backlog");
  });

  it("normalizes the legacy Agent radar alias", () => {
    expect(normalizeBacklogSource("agent_radar")).toBe("agent_question");
  });
});
