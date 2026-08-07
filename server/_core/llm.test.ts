import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_AGENT_MODEL } from "../ai/model";
import { ENV } from "./env";
import {
  DEFAULT_LLM_MODEL,
  invokeLLM,
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

function completedResponse(
  outputText = "答案",
  overrides: Record<string, unknown> = {}
) {
  return {
    id: "resp-1",
    object: "response",
    created_at: 1,
    status: "completed",
    error: null,
    incomplete_details: null,
    instructions: null,
    metadata: null,
    model: "deepseek-v4-flash",
    output: [
      {
        id: "search-1",
        type: "web_search_call",
        status: "completed",
        action: { type: "search", queries: ["test"] },
      },
      {
        id: "message-1",
        type: "message",
        status: "completed",
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: outputText,
            annotations: [],
            logprobs: [],
          },
        ],
      },
    ],
    output_text: outputText,
    parallel_tool_calls: true,
    temperature: 1,
    tool_choice: "auto",
    tools: [{ type: "web_search" }],
    top_p: 1,
    usage: {
      input_tokens: 2,
      output_tokens: 3,
      total_tokens: 5,
      input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
      output_tokens_details: { reasoning_tokens: 1 },
    },
    ...overrides,
  };
}

function sseResponse(events: unknown[]) {
  const body = events.map(event => `data: ${JSON.stringify(event)}\n\n`).join("");
  return new Response(`${body}data: [DONE]\n\n`, {
    headers: { "content-type": "text/event-stream" },
  });
}

describe("LLM Responses adapter", () => {
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

  it("uses the Responses endpoint and enables web search by default", async () => {
    ENV.forgeApiKey = "test-key";
    ENV.forgeApiUrl = "https://api.deepseek.com";
    let requestUrl = "";
    let requestBody: Record<string, unknown> = {};
    globalThis.fetch = vi.fn(async (input, init) => {
      requestUrl = String(input);
      requestBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify(completedResponse()), {
        headers: { "content-type": "application/json" },
      });
    });

    const result = await invokeLLM({
      model: "deepseek-v4-flash",
      instructions: "System instruction",
      input: "hello",
      responseFormat: { type: "json_object" },
      maxTokens: 100,
    });

    expect(requestUrl).toBe("https://api.deepseek.com/responses");
    expect(requestBody).toMatchObject({
      model: "deepseek-v4-flash",
      instructions: "System instruction",
      input: "hello",
      max_output_tokens: 100,
      store: false,
      stream: false,
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      text: { format: { type: "json_object" } },
    });
    expect(requestBody).not.toHaveProperty("messages");
    expect(requestBody).not.toHaveProperty("response_format");
    expect(result.outputText).toBe("答案");
    expect(result.webSearchUsed).toBe(true);
    expect(result.usage?.total_tokens).toBe(5);
  });

  it("streams Responses reasoning and answer deltas separately", async () => {
    ENV.forgeApiKey = "test-key";
    ENV.forgeApiUrl = "https://api.deepseek.com";
    const final = completedResponse("答案");
    globalThis.fetch = vi.fn(async () =>
      sseResponse([
        {
          type: "response.reasoning_text.delta",
          sequence_number: 1,
          item_id: "reasoning-1",
          output_index: 0,
          content_index: 0,
          delta: "先检索",
        },
        {
          type: "response.output_text.delta",
          sequence_number: 2,
          item_id: "message-1",
          output_index: 1,
          content_index: 0,
          delta: "答案",
          logprobs: [],
        },
        {
          type: "response.completed",
          sequence_number: 3,
          response: final,
        },
      ])
    );

    const deltas: Array<{ content?: string; reasoningContent?: string }> = [];
    const result = await invokeLLMStream(
      {
        model: "deepseek-v4-flash",
        instructions: "System instruction",
        input: "hello",
      },
      delta => deltas.push(delta)
    );

    expect(deltas).toEqual([
      { reasoningContent: "先检索" },
      { content: "答案" },
    ]);
    expect(result.reasoningContent).toBe("先检索");
    expect(result.content).toBe("答案");
    expect(result.webSearchUsed).toBe(true);
    expect(result.usage?.total_tokens).toBe(5);
  });

  it("rejects a failed terminal response after preserving streamed deltas", async () => {
    ENV.forgeApiKey = "test-key";
    ENV.forgeApiUrl = "https://api.deepseek.com";
    globalThis.fetch = vi.fn(async () =>
      sseResponse([
        {
          type: "response.output_text.delta",
          sequence_number: 1,
          item_id: "message-1",
          output_index: 0,
          content_index: 0,
          delta: "partial",
          logprobs: [],
        },
        {
          type: "response.failed",
          sequence_number: 2,
          response: completedResponse("partial", {
            status: "failed",
            error: { code: "provider_error", message: "provider interrupted" },
          }),
        },
      ])
    );
    const deltas: string[] = [];

    await expect(
      invokeLLMStream(
        { input: "hello" },
        delta => delta.content && deltas.push(delta.content)
      )
    ).rejects.toThrow("provider interrupted");
    expect(deltas).toEqual(["partial"]);
  });

  it("preserves abort identity for the agent stream error contract", async () => {
    ENV.forgeApiKey = "test-key";
    ENV.forgeApiUrl = "https://api.deepseek.com";
    const controller = new AbortController();
    const abortError = Object.assign(new Error("user cancelled"), {
      name: "AbortError",
    });
    controller.abort(abortError);

    await expect(
      invokeLLMStream(
        { input: "hello", signal: controller.signal },
        () => undefined
      )
    ).rejects.toMatchObject({ name: "AbortError", message: "user cancelled" });
  });
});
