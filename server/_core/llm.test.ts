import { describe, expect, it } from "vitest";
import { BLOG_AGENT_MODEL } from "../ai/model";
import { DEFAULT_LLM_MODEL, resolveLLMModel } from "./llm";

describe("LLM model defaults", () => {
  it("defaults the public blog agent to DeepSeek Flash", () => {
    expect(DEFAULT_LLM_MODEL).toBe("deepseek-v4-flash");
    expect(BLOG_AGENT_MODEL).toBe("deepseek-v4-flash");
    expect(DEFAULT_LLM_MODEL).not.toContain("pro");
    expect(DEFAULT_LLM_MODEL).not.toContain("gemini");
  });

  it("keeps explicit model overrides when a caller provides one", () => {
    expect(resolveLLMModel("deepseek-v4-flash")).toBe("deepseek-v4-flash");
  });

  it("ignores blank model overrides", () => {
    expect(resolveLLMModel("   ")).toBe("deepseek-v4-flash");
  });
});
