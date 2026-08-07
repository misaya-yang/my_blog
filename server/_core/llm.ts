import OpenAI from "openai";
import type {
  FunctionTool,
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseFormatTextConfig,
  ResponseInput,
  ResponseStreamEvent,
  Tool as ResponsesTool,
  ToolChoiceFunction,
  ToolChoiceOptions,
} from "openai/resources/responses/responses";
import { ENV } from "./env.js";

export const DEFAULT_LLM_MODEL = "deepseek-v4-flash";

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
    strict?: boolean;
  };
};

export type ToolChoicePrimitive = ToolChoiceOptions;
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type InvokeParams = {
  model?: string;
  instructions?: string;
  input: string | ResponseInput;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  webSearch?: boolean;
  maxOutputTokens?: number;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  signal?: AbortSignal;
};

export type InvokeUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  outputText: string;
  usage?: InvokeUsage;
  webSearchUsed: boolean;
};

export type StreamDelta = {
  content?: string;
  reasoningContent?: string;
};

export type InvokeStreamResult = InvokeResult & {
  content: string;
  reasoningContent: string;
};

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const resolveBaseUrl = () => {
  const configuredUrl = nonBlank(ENV.forgeApiUrl);
  if (!configuredUrl) return "https://api.deepseek.com";

  return configuredUrl
    .replace(/\/v1\/chat\/completions\/?$/i, "")
    .replace(/\/chat\/completions\/?$/i, "")
    .replace(/\/$/, "");
};

const getApiKey = () => {
  const apiKey = nonBlank(ENV.forgeApiKey);
  if (!apiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  return apiKey;
};

const createClient = () =>
  new OpenAI({
    apiKey: getApiKey(),
    baseURL: resolveBaseUrl(),
  });

export function resolveLLMModel(model?: string): string {
  return nonBlank(model) || nonBlank(ENV.blogAgentModel) || DEFAULT_LLM_MODEL;
}

function normalizeResponseFormat({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: Pick<
  InvokeParams,
  "responseFormat" | "response_format" | "outputSchema" | "output_schema"
>): ResponseFormatTextConfig | undefined {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type !== "json_schema") return explicitFormat;
    if (!explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return {
      type: "json_schema",
      name: explicitFormat.json_schema.name,
      schema: explicitFormat.json_schema.schema,
      ...(typeof explicitFormat.json_schema.strict === "boolean"
        ? { strict: explicitFormat.json_schema.strict }
        : {}),
    };
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    name: schema.name,
    schema: schema.schema,
    ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
  };
}

function normalizeFunctionTool(tool: Tool): FunctionTool {
  return {
    type: "function",
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters ?? {},
    strict: tool.function.strict ?? false,
  };
}

function buildTools(params: InvokeParams): ResponsesTool[] {
  const tools: ResponsesTool[] = (params.tools ?? []).map(normalizeFunctionTool);
  if (params.webSearch !== false) {
    tools.unshift({ type: "web_search" });
  }
  return tools;
}

function normalizeToolChoice(
  toolChoice: ToolChoice | undefined
): ToolChoiceOptions | ToolChoiceFunction | undefined {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === "string") return toolChoice;
  if ("name" in toolChoice) {
    return { type: "function", name: toolChoice.name };
  }
  return { type: "function", name: toolChoice.function.name };
}

function buildCommonPayload(params: InvokeParams) {
  const format = normalizeResponseFormat(params);
  const tools = buildTools(params);
  const toolChoice = normalizeToolChoice(params.toolChoice || params.tool_choice);

  return {
    model: resolveLLMModel(params.model),
    instructions: params.instructions,
    input: params.input,
    max_output_tokens:
      params.maxOutputTokens ??
      params.maxTokens ??
      params.max_tokens ??
      32768,
    store: false,
    tools,
    ...(tools.some(tool => tool.type === "web_search")
      ? { include: ["web_search_call.action.sources" as const] }
      : {}),
    ...(toolChoice ? { tool_choice: toolChoice } : {}),
    ...(format ? { text: { format } } : {}),
  };
}

function normalizeUsage(response: Response): InvokeUsage | undefined {
  if (!response.usage) return undefined;
  return {
    prompt_tokens: response.usage.input_tokens,
    completion_tokens: response.usage.output_tokens,
    total_tokens: response.usage.total_tokens,
  };
}

function responseErrorMessage(response: Response): string {
  if (response.error?.message) return response.error.message;
  if (response.incomplete_details?.reason) {
    return `response incomplete: ${response.incomplete_details.reason}`;
  }
  return `response ended with status ${response.status ?? "unknown"}`;
}

function assertCompletedResponse(response: Response) {
  if (response.status !== "completed" || response.error) {
    throw new Error(responseErrorMessage(response));
  }
}

function hasWebSearchCall(response: Response) {
  return response.output.some(
    item => item.type === "web_search_call" && item.status === "completed"
  );
}

function normalizeResponse(response: Response): InvokeResult {
  assertCompletedResponse(response);
  return {
    id: response.id,
    created: response.created_at,
    model: response.model,
    outputText: response.output_text,
    usage: normalizeUsage(response),
    webSearchUsed: hasWebSearchCall(response),
  };
}

function formatSdkError(
  prefix: string,
  error: unknown,
  signal?: AbortSignal
): Error {
  if (signal?.aborted) {
    if (signal.reason instanceof Error) return signal.reason;
    return Object.assign(new Error("Responses request was aborted"), {
      name: "AbortError",
    });
  }
  if (error instanceof OpenAI.APIUserAbortError) {
    return Object.assign(new Error(error.message, { cause: error }), {
      name: "AbortError",
    });
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return Object.assign(new Error(error.message, { cause: error }), {
      name: "TimeoutError",
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${prefix}: ${message}`, { cause: error });
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const client = createClient();
  const payload: ResponseCreateParamsNonStreaming = {
    ...buildCommonPayload(params),
    stream: false,
  };

  try {
    const response = await client.responses.create(payload, {
      signal: params.signal,
    });
    return normalizeResponse(response);
  } catch (error) {
    throw formatSdkError("LLM Responses invoke failed", error, params.signal);
  }
}

export async function invokeLLMStream(
  params: InvokeParams,
  onDelta: (delta: StreamDelta) => void
): Promise<InvokeStreamResult> {
  const client = createClient();
  const payload: ResponseCreateParamsStreaming = {
    ...buildCommonPayload(params),
    stream: true,
  };

  let content = "";
  let reasoningContent = "";
  let finalResponse: Response | undefined;

  try {
    const stream = await client.responses.create(payload, {
      signal: params.signal,
    });

    for await (const event of stream) {
      if (event.type === "response.reasoning_text.delta") {
        reasoningContent += event.delta;
        onDelta({ reasoningContent: event.delta });
      } else if (event.type === "response.output_text.delta") {
        content += event.delta;
        onDelta({ content: event.delta });
      } else if (
        event.type === "response.completed" ||
        event.type === "response.failed" ||
        event.type === "response.incomplete"
      ) {
        finalResponse = event.response;
      } else if (event.type === "error") {
        throw new Error(event.message || "Responses stream error");
      }
    }

    if (!finalResponse) {
      throw new Error("Responses stream ended without a terminal event");
    }
    assertCompletedResponse(finalResponse);

    const normalized = normalizeResponse(finalResponse);
    return {
      ...normalized,
      content: normalized.outputText || content,
      reasoningContent,
    };
  } catch (error) {
    throw formatSdkError("LLM Responses stream failed", error, params.signal);
  }
}

export type { ResponseStreamEvent };
