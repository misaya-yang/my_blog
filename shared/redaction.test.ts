import { describe, expect, it } from "vitest";

import { redactDirectContact } from "./redaction";

describe("direct contact redaction", () => {
  it("redacts emails and IP-like strings without changing ordinary text", () => {
    expect(
      redactDirectContact(
        "Contact User.Name+qa@Example.com from 203.0.113.120 about AgentLoop."
      )
    ).toBe(
      "Contact [redacted-email] from [redacted-ip] about AgentLoop."
    );
  });

  it("keeps empty and already-safe text stable", () => {
    expect(redactDirectContact("")).toBe("");
    expect(redactDirectContact("No private contact here.")).toBe(
      "No private contact here."
    );
  });
});
