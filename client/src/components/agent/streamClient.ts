import type { AgentRouteContext } from "./routeContext";
import type { AgentTraceEntry, QuotaInfo, SourceCard } from "./types";

export const AGENT_STREAM_TIMEOUT_MS = 45_000;

export type AgentAnswerMode = "summary" | "deep" | "compare" | "reading_path";

type AgentStreamCallbacks = {
  conversationId?: string;
  retryUserMessageId?: string;
  message: string;
  routeContext: AgentRouteContext;
  answerMode?: AgentAnswerMode;
  signal?: AbortSignal;
  onStatus: (event: AgentStreamStatusEvent) => void;
  onAnswerDelta: (delta: string) => void;
  onFinal: (event: AgentStreamFinalEvent) => void;
};

type AgentStreamStatusEvent = AgentTraceEntry & {
  type: "status";
  conversationId?: string;
  userMessageId?: string;
};

type AgentStreamFinalEvent = {
  type: "final";
  output: AgentSendMessageResponse;
  elapsedMs: number;
  outcome?: "blocked" | "completed" | "failed" | "no_source";
  reason?: string;
};

type AgentSendMessageResponse =
  | {
      status: "blocked";
      reason: "quota";
      quota: QuotaInfo;
    }
  | {
      status: "completed";
      conversationId: string;
      userMessageId: string;
      messageId: string;
      answer: {
        answerMarkdown: string;
        answerType?: string;
        refusalReason?: string;
      };
      sourceCards: SourceCard[];
      relatedQuestions: string[];
      quota: QuotaInfo;
      runStatus: "completed";
    }
  | {
      status: "failed";
      conversationId: string;
      userMessageId: string;
      messageId: string;
      quota: QuotaInfo;
      runStatus: "failed";
      errorCode: string;
    };

export async function streamAgentMessage({
  conversationId,
  retryUserMessageId,
  message,
  routeContext,
  answerMode,
  signal,
  onStatus,
  onAnswerDelta,
  onFinal,
}: AgentStreamCallbacks) {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    timeoutController.abort(
      new DOMException("Agent stream timed out", "TimeoutError")
    );
  }, AGENT_STREAM_TIMEOUT_MS);
  const combinedSignal = combineAbortSignals(signal, timeoutController.signal);

  try {
    const response = await fetch("/api/agent/stream", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        conversationId,
        retryUserMessageId,
        message,
        routeContext,
        answerMode,
      }),
      signal: combinedSignal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Agent stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamError: string | null = null;
    let finalSeen = false;
    const handleEvent = (
      event:
        | AgentStreamStatusEvent
        | AgentStreamFinalEvent
        | { type: "answer_delta"; delta: string }
        | { type: "error"; message: string }
    ) => {
      if (event.type === "status") onStatus(event);
      if (event.type === "answer_delta") onAnswerDelta(event.delta);
      if (event.type === "final") {
        finalSeen = true;
        onFinal(event);
      }
      if (event.type === "error") {
        streamError = event.message;
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\n\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const event = parseSseFrame(frame);
        if (!event) continue;
        handleEvent(event);
      }
    }

    const trailingEvent = parseSseFrame(buffer);
    if (trailingEvent) handleEvent(trailingEvent);

    if (!finalSeen) throw new Error(streamError ?? "agent_stream_incomplete");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function isAbortError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }
  if (error instanceof Error) {
    return error.name === "AbortError";
  }
  return false;
}

export function isTimeoutError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "TimeoutError";
  }
  if (error instanceof Error) {
    return error.name === "TimeoutError";
  }
  return false;
}

function combineAbortSignals(...signals: Array<AbortSignal | undefined>) {
  const activeSignals = signals.filter(Boolean) as AbortSignal[];
  if (activeSignals.length === 0) return undefined;
  if (activeSignals.length === 1) return activeSignals[0];

  const controller = new AbortController();
  const abort = (signal: AbortSignal) => {
    if (!controller.signal.aborted) controller.abort(signal.reason);
  };
  for (const signal of activeSignals) {
    if (signal.aborted) {
      abort(signal);
      break;
    }
    signal.addEventListener("abort", () => abort(signal), { once: true });
  }
  return controller.signal;
}

function parseSseFrame(
  frame: string
):
  | AgentStreamStatusEvent
  | AgentStreamFinalEvent
  | { type: "answer_delta"; delta: string }
  | { type: "error"; message: string }
  | null {
  const data = frame
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith("data:"))
    .map(line => line.replace(/^data:\s*/, ""))
    .join("\n");
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
