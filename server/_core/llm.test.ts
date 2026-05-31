import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_AGENT_MODEL } from "../ai/model";
import { ENV } from "./env";
import {
  DEFAULT_LLM_MODEL,
  invokeLLMStream,
  resolveLLMModel,
} from "./llm";

const originalFetch = globalThis.fetch;
const originalForgeApiKey = ENV.forgeApiKey;
const originalForgeApiUrl = ENV.forgeApiUrl;

afterEach(() => {
  globalThis.fetch = originalFetch;
  ENV.forgeApiKey = originalForgeApiKey;
  ENV.forgeApiUrl = originalForgeApiUrl;
  vi.restoreAllMocks();
});

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

  it("streams DeepSeek reasoning_content separately from answer content", async () => {
    ENV.forgeApiKey = "test-key";
    ENV.forgeApiUrl = "https://api.deepseek.com";
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'data: {"id":"chatcmpl-1","created":1,"model":"deepseek-reasoner","choices":[{"delta":{"reasoning_content":"先检索"}}]}',
              "",
              'data: {"id":"chatcmpl-1","created":1,"model":"deepseek-reasoner","choices":[{"delta":{"content":"答案"}}],"usage":{"prompt_tokens":2,"completion_tokens":3,"total_tokens":5}}',
              "",
              "data: [DONE]",
              "",
            ].join("\n")
          )
        );
        controller.close();
      },
    });
    globalThis.fetch = vi.fn(async () => new Response(body));

    const deltas: Array<{ content?: string; reasoningContent?: string }> = [];
    const result = await invokeLLMStream(
      {
        model: "deepseek-reasoner",
        messages: [{ role: "user", content: "hello" }],
      },
      delta => deltas.push(delta)
    );

    expect(deltas).toEqual([
      { reasoningContent: "先检索" },
      { content: "答案" },
    ]);
    expect(result.reasoningContent).toBe("先检索");
    expect(result.content).toBe("答案");
    expect(result.usage?.total_tokens).toBe(5);
  });
});
