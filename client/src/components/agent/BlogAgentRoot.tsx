import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  buildRouteContext,
  BLOG_AGENT_OPEN_EVENT,
  getCompanionPromptKeys,
  getCompanionWelcomeKeys,
  inferClientScope,
  type BlogAgentOpenDetail,
  type AgentRouteContext,
} from "./routeContext";
import {
  markAssistantMessageRecoverable,
  toChatMessage,
  upsertTraceEntry,
} from "./messageState";
import {
  streamAgentMessage,
  type AgentAnswerMode,
} from "./streamClient";
import {
  getAgentFailureNotice,
  getAgentFailureState,
  getClientStreamFailure,
  getCompletedMessageState,
  getQuotaBlockedNotice,
} from "./agentFailure";
import { AgentFloatingFrame } from "./AgentFloatingFrame";
import { AgentLauncher } from "./AgentLauncher";
import { AgentPanel } from "./AgentPanel";
import {
  getNextAgentStreamFollowState,
  shouldScrollAgentMessagesToEnd,
} from "./agentScrollPolicy";
import type {
  ChatMessage,
  ConversationItem,
  QuotaInfo,
} from "./types";

export {
  formatSourceExcerpt,
  getSourceAnchorId,
  getSourceFallbackAnchorId,
  getSourceHref,
} from "./sourceCardLinks";
export {
  AGENT_FRAME_PRESETS,
  AGENT_FRAME_STORAGE_KEY,
  clampAgentFrameState,
  getAgentFramePresetShortcut,
  getDefaultAgentFrameState,
  isAgentFramePreset,
  readStoredAgentFrameState,
} from "./agentFrameState";
export type { AgentFramePreset, AgentFrameState } from "./agentFrameState";
export { AgentFloatingFrame } from "./AgentFloatingFrame";
export type { AgentFrameControls } from "./AgentFloatingFrame";
export { AgentLauncher } from "./AgentLauncher";
export { AgentPanel } from "./AgentPanel";
export {
  getAgentDisplayElapsedMs,
  getTraceStageDurations,
} from "./agentElapsed";
export type { AgentTraceStageDuration } from "./agentElapsed";
export {
  AGENT_COLLAPSED_SOURCE_LIMIT,
  getHiddenSourceCount,
  getSourcePreviewTitle,
  getVisibleSourceCards,
} from "./agentSourceSummary";
export {
  getNextAgentStreamFollowState,
  isAgentNearBottom,
  shouldScrollAgentMessagesToEnd,
} from "./agentScrollPolicy";

export function BlogAgentRoot() {
  const [location] = useLocation();
  const { session } = useAuth();
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const routeContext = useMemo(
    () => buildRouteContext(location, language),
    [location, language]
  );
  const hiddenOnRoute = isBlogAgentHiddenRoute(location);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >();
  const [notice, setNotice] = useState<string | null>(null);
  const [contextDraft, setContextDraft] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [attachedContextCount, setAttachedContextCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [composerFocusToken, setComposerFocusToken] = useState(0);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const messageScrollerRef = useRef<HTMLDivElement | null>(null);
  const pendingAssistantFocusRef = useRef<string | null>(null);
  const shouldFollowStreamRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const previousIdentityKeyRef = useRef<string | null>(null);
  const utils = trpc.useUtils();
  const panelId = "blog-agent-panel";
  const panelTitleId = "blog-agent-title";

  const bootstrap = trpc.agent.bootstrap.useQuery(
    { routeContext },
    {
      enabled: open && !hiddenOnRoute,
      retry: 1,
    }
  );
  const conversations = trpc.agent.listConversations.useQuery(undefined, {
    enabled: open && !hiddenOnRoute,
    retry: 1,
  });
  const conversationDetail = trpc.agent.getConversation.useQuery(
    {
      conversationId:
        selectedConversationId ?? "00000000-0000-4000-8000-000000000000",
    },
    {
      enabled: open && Boolean(selectedConversationId),
      retry: 1,
    }
  );
  const sendMessage = trpc.agent.sendMessage.useMutation();
  const addContext = trpc.agent.addContext.useMutation();
  const visitorLogin = trpc.auth.visitorLogin.useMutation();
  const identityKey = getAgentSessionKey(session);
  const pendingVisitorRetryPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (bootstrap.data?.quota) setQuota(bootstrap.data.quota);
  }, [bootstrap.data?.quota]);

  useEffect(() => {
    if (previousIdentityKeyRef.current === null) {
      previousIdentityKeyRef.current = identityKey;
      return;
    }
    if (previousIdentityKeyRef.current === identityKey) return;

    previousIdentityKeyRef.current = identityKey;
    streamAbortRef.current?.abort();
    const pendingVisitorRetryPrompt = pendingVisitorRetryPromptRef.current;
    pendingVisitorRetryPromptRef.current = null;

    setDraft(pendingVisitorRetryPrompt ?? "");
    setMessages([]);
    setConversationId(undefined);
    setSelectedConversationId(undefined);
    setNotice(pendingVisitorRetryPrompt ? t("agent.quota.visitorReady") : null);
    setContextDraft("");
    setContextOpen(false);
    setAttachedContextCount(0);
    setHistoryOpen(false);
    setStreaming(false);
    setQuota(null);
    if (pendingVisitorRetryPrompt) {
      setComposerFocusToken(token => token + 1);
    }
    void utils.agent.listConversations.invalidate();
  }, [identityKey, t, utils.agent.listConversations]);

  useEffect(() => {
    if (!conversationDetail.data) return;
    setConversationId(conversationDetail.data.conversation.id);
    setMessages(conversationDetail.data.messages.map(toChatMessage));
    setAttachedContextCount(
      conversationDetail.data.contextSources?.length ?? 0
    );
    setNotice(null);
  }, [conversationDetail.data]);

  useEffect(() => {
    if (conversationDetail.isError) setNotice(t("agent.error.history"));
  }, [conversationDetail.isError, t]);

  useEffect(() => {
    const scroller = messageScrollerRef.current;
    if (
      !scroller ||
      !shouldScrollAgentMessagesToEnd({
        streaming,
        shouldFollowStream: shouldFollowStreamRef.current,
      })
    )
      return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      if (composerFocusToken > 0) {
        draftInputRef.current?.focus({ preventScroll: true });
        setComposerFocusToken(0);
        return;
      }

      panelRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [composerFocusToken, open, isMobile]);

  useEffect(() => {
    function handleExternalOpen(event: Event) {
      const detail = (event as CustomEvent<BlogAgentOpenDetail>).detail;
      setOpen(true);
      setNotice(null);
      if (detail?.prompt) {
        setDraft(detail.prompt);
        setComposerFocusToken(token => token + 1);
      }
    }

    window.addEventListener(BLOG_AGENT_OPEN_EVENT, handleExternalOpen);
    return () =>
      window.removeEventListener(BLOG_AGENT_OPEN_EVENT, handleExternalOpen);
  }, []);

  if (hiddenOnRoute) return null;

  const suggestedPrompts = buildCompanionPrompts(
    routeContext,
    t,
    bootstrap.data?.suggestedPrompts
  );
  const welcomeCopy = getCompanionWelcome(routeContext, t);
  const currentScope =
    bootstrap.data?.currentScope ?? inferClientScope(routeContext);
  const lowQuota = quota ? quota.remaining <= 1 : false;
  const conversationSwitching =
    Boolean(selectedConversationId) &&
    (conversationDetail.isFetching ||
      conversationId !== selectedConversationId);
  async function handleSubmit(message: string) {
    const trimmed = message.trim();
    if (
      !trimmed ||
      sendMessage.isPending ||
      streaming ||
      conversationSwitching ||
      bootstrap.isError
    )
      return;

    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      role: "user",
      content: trimmed,
    };
    const assistantMessageId = `assistant-${timestamp}`;
    const assistantDraft: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      traceEntries: [],
      streaming: true,
    };
    setNotice(null);
    setDraft("");
    setStreaming(true);
    pendingAssistantFocusRef.current = assistantMessageId;
    shouldFollowStreamRef.current = getNextAgentStreamFollowState({
      event: "submit",
      scroller: messageScrollerRef.current,
    });
    setMessages(current => [...current, userMessage, assistantDraft]);
    const controller = new AbortController();
    streamAbortRef.current = controller;

    try {
      await streamAgentMessage({
        conversationId,
        message: trimmed,
        routeContext,
        answerMode: inferAnswerMode(trimmed, routeContext),
        signal: controller.signal,
        onStatus: event => {
          shouldFollowStreamRef.current = getNextAgentStreamFollowState({
            event: "stream_status",
            scroller: messageScrollerRef.current,
          });
          setMessages(current =>
            current.map(item =>
              item.id === assistantMessageId
                ? {
                    ...item,
                    traceEntries: upsertTraceEntry(item.traceEntries, {
                      stage: event.stage,
                      elapsedMs: event.elapsedMs,
                      sourceCount: event.sourceCount,
                      currentPageContextInjected:
                        event.currentPageContextInjected,
                    }),
                  }
                : item
            )
          );
        },
        onAnswerDelta: delta => {
          shouldFollowStreamRef.current = getNextAgentStreamFollowState({
            event: "answer_delta",
            scroller: messageScrollerRef.current,
          });
          setMessages(current =>
            current.map(item =>
              item.id === assistantMessageId
                ? { ...item, content: `${item.content}${delta}` }
                : item
            )
          );
        },
        onFinal: event => {
          const response = event.output;
          setQuota(response.quota);
          shouldFollowStreamRef.current = getNextAgentStreamFollowState({
            event: "final",
            scroller: messageScrollerRef.current,
          });

          if (response.status === "blocked") {
            setDraft(trimmed);
            setMessages(current =>
              markAssistantMessageRecoverable(current, assistantMessageId, {
                content: getQuotaBlockedNotice(response.quota.tier, t),
                state: "quota_blocked",
                recoveryPrompt: trimmed,
                quotaTier: response.quota.tier,
                finalElapsedMs: event.elapsedMs,
              })
            );
            return;
          }

          if (response.status === "failed") {
            const failureNotice = getAgentFailureNotice(response.errorCode, t);
            setDraft(trimmed);
            setMessages(current =>
              markAssistantMessageRecoverable(current, assistantMessageId, {
                messageId: response.messageId,
                content: failureNotice,
                state: getAgentFailureState(response.errorCode),
                recoveryPrompt: trimmed,
                finalElapsedMs: event.elapsedMs,
              })
            );
            return;
          }

          setConversationId(response.conversationId);
          void utils.agent.listConversations.invalidate();
          setMessages(current =>
            current.map(item =>
              item.id === assistantMessageId
                ? {
                    ...item,
                    id: response.messageId,
                    content: response.answer.answerMarkdown,
                    sourceCards: response.sourceCards,
                    relatedQuestions: response.relatedQuestions,
                    finalElapsedMs: event.elapsedMs,
                    streaming: false,
                    state: getCompletedMessageState(response),
                  }
                : item
            )
          );
        },
      });
    } catch (error) {
      shouldFollowStreamRef.current = getNextAgentStreamFollowState({
        event: "failed",
        scroller: messageScrollerRef.current,
      });
      setDraft(trimmed);
      const failure = getClientStreamFailure(error, t);
      setMessages(current =>
        markAssistantMessageRecoverable(current, assistantMessageId, {
          content: failure.content,
          state: failure.state,
          recoveryPrompt: trimmed,
        })
      );
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
      }
      setStreaming(false);
    }
  }

  function handleCancelStreaming() {
    streamAbortRef.current?.abort();
  }

  async function handleContinueAsVisitor(recoveryPrompt?: string) {
    const prompt = recoveryPrompt?.trim() || draft.trim();
    pendingVisitorRetryPromptRef.current = prompt || null;

    try {
      await visitorLogin.mutateAsync({ nickname: "Reader" });
      await utils.auth.session.invalidate();
      await utils.agent.bootstrap.invalidate();
      setNotice(t("agent.quota.visitorReady"));
      if (prompt) {
        setDraft(prompt);
        setComposerFocusToken(token => token + 1);
      }
    } catch {
      pendingVisitorRetryPromptRef.current = null;
      setNotice(t("agent.quota.visitorError"));
    }
  }

  function closeAgent() {
    setOpen(false);
    window.requestAnimationFrame(() => {
      launcherRef.current?.focus({ preventScroll: true });
    });
  }

  function toggleAgent() {
    setOpen(value => {
      const next = !value;
      if (!next) {
        window.requestAnimationFrame(() => {
          launcherRef.current?.focus({ preventScroll: true });
        });
      }
      return next;
    });
  }

  function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    const nativeEvent = event.nativeEvent as KeyboardEvent & {
      isComposing?: boolean;
    };
    if (event.key === "Escape" && !nativeEvent.isComposing) {
      event.preventDefault();
      closeAgent();
      return;
    }

    if (!isMobile || event.key !== "Tab" || !panelRef.current) return;

    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleAttachContext(input: {
    kind: "pasted_text" | "text_file" | "markdown_file";
    content: string;
    filename?: string;
    mimeType?: string;
  }) {
    const trimmed = input.content.trim();
    if (!trimmed || addContext.isPending) return;

    try {
      const response = await addContext.mutateAsync({
        conversationId,
        routeContext,
        kind: input.kind,
        filename: input.filename,
        mimeType: input.mimeType,
        content: trimmed,
      });

      if (response.status === "blocked") {
        setNotice(t("agent.context.blocked"));
        return;
      }

      setConversationId(response.conversationId);
      setAttachedContextCount(count => count + 1);
      setContextDraft("");
      setContextOpen(false);
      setNotice(t("agent.context.attached"));
      void utils.agent.listConversations.invalidate();
      void utils.agent.getConversation.invalidate({
        conversationId: response.conversationId,
      });
    } catch {
      setNotice(t("agent.context.error"));
    }
  }

  function handleLoadConversation(nextConversationId: string) {
    setNotice(null);
    setSelectedConversationId(nextConversationId);
    setHistoryOpen(false);
  }

  async function handleFileInput(file: File) {
    const kind = getContextFileKind(file.name);
    if (!kind) {
      setNotice(t("agent.context.unsupported"));
      return;
    }

    try {
      const content = await file.text();
      await handleAttachContext({
        kind,
        filename: file.name,
        mimeType: file.type || getFallbackMimeType(kind),
        content,
      });
    } catch {
      setNotice(t("agent.context.error"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <AgentLauncher
        buttonRef={launcherRef}
        open={open}
        lowQuota={lowQuota}
        label={t("agent.launcher.label")}
        tooltip={t("agent.launcher.tooltip")}
        controls={panelId}
        onClick={toggleAgent}
      />

      {open && (
        <AgentFloatingFrame isMobile={isMobile}>
          {frameControls => (
            <>
              <AgentPanel
                isMobile={isMobile}
                panelId={panelId}
                titleId={panelTitleId}
                panelRef={panelRef}
                draftInputRef={draftInputRef}
                bootstrapping={bootstrap.isLoading}
                bootstrapRetrying={bootstrap.isFetching}
                bootstrapError={bootstrap.isError}
                currentScope={currentScope}
                draft={draft}
                messages={messages}
                notice={notice}
                quota={quota}
                contextDraft={contextDraft}
                contextOpen={contextOpen}
                attachedContextCount={attachedContextCount}
                attachingContext={addContext.isPending}
                historyOpen={historyOpen}
                conversations={conversations.data ?? []}
                historyLoading={
                  conversations.isLoading || conversationDetail.isFetching
                }
                conversationSwitching={conversationSwitching}
                activeConversationId={conversationId}
                suggestedPrompts={suggestedPrompts}
                welcomeTitle={welcomeCopy.title}
                welcomeBody={welcomeCopy.body}
                sending={sendMessage.isPending || streaming}
                visitorLoading={visitorLogin.isPending}
                frameControls={frameControls}
                onClose={closeAgent}
                onRetryBootstrap={() => void bootstrap.refetch()}
                onPanelKeyDown={handlePanelKeyDown}
                onDraftChange={setDraft}
                onContextDraftChange={setContextDraft}
                onToggleContext={() => setContextOpen(value => !value)}
                onAttachPastedContext={() =>
                  handleAttachContext({
                    kind: "pasted_text",
                    content: contextDraft,
                  })
                }
                onPickContextFile={() => fileInputRef.current?.click()}
                onToggleHistory={() => setHistoryOpen(value => !value)}
                onLoadConversation={handleLoadConversation}
                onPrompt={handleSubmit}
                onSubmit={handleSubmit}
                onCancel={handleCancelStreaming}
                onContinueAsVisitor={handleContinueAsVisitor}
                messageScrollerRef={messageScrollerRef}
                pendingAssistantFocusRef={pendingAssistantFocusRef}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                className="hidden"
                onChange={event => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void handleFileInput(file);
                }}
              />
            </>
          )}
        </AgentFloatingFrame>
      )}
    </>
  );
}

export function inferAnswerMode(
  message: string,
  routeContext?: AgentRouteContext
): AgentAnswerMode {
  const normalized = message.toLowerCase();
  if (/compare|对比|比较/.test(normalized)) return "compare";
  if (
    /path|checklist|next|first|read next|reading path|阅读路径|阅读清单|清单|下一篇|先读/.test(
      normalized
    )
  ) {
    return "reading_path";
  }
  if (
    /deep|implementation|implication|failure|assumption|source|detail|实现|启发|假设|失败|来源|细节/.test(
      normalized
    )
  ) {
    return "deep";
  }
  if (routeContext?.routeType === "post") return "deep";
  return "summary";
}

export function isBlogAgentHiddenRoute(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return /^\/(write|manage|login)(\/|$)/.test(pathname);
}

function getAgentSessionKey(session: ReturnType<typeof useAuth>["session"]) {
  if (!session) return "loading";
  if (session.role === "admin") {
    return `admin:${session.displayName ?? "owner"}`;
  }
  if (session.role === "visitor") {
    return `visitor:${session.visitorId}`;
  }
  return "anonymous";
}

function getContextFileKind(
  fileName: string
): "markdown_file" | "text_file" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".md")) return "markdown_file";
  if (lower.endsWith(".txt")) return "text_file";
  return null;
}

function getFallbackMimeType(kind: "markdown_file" | "text_file") {
  return kind === "markdown_file" ? "text/markdown" : "text/plain";
}

function getFocusableElements(container: HTMLElement) {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    element =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.offsetParent !== null
  );
}

function buildCompanionPrompts(
  routeContext: AgentRouteContext,
  t: (key: string, values?: Record<string, string | number>) => string,
  serverPrompts?: string[]
) {
  const prompts = getCompanionPromptKeys(routeContext)
    .map(key => t(key))
    .filter(prompt => prompt && !prompt.startsWith("agent.prompts."));
  if (prompts.length > 0) return prompts.slice(0, 3);
  if (serverPrompts && serverPrompts.length > 0)
    return serverPrompts.slice(0, 3);
  return fallbackPrompts(t);
}

function getCompanionWelcome(
  routeContext: AgentRouteContext,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const keys = getCompanionWelcomeKeys(routeContext);
  return {
    title: t(keys.titleKey),
    body: t(keys.bodyKey),
  };
}

function fallbackPrompts(
  t: (key: string, values?: Record<string, string | number>) => string
) {
  return [
    t("agent.prompts.siteThemes"),
    t("agent.prompts.compareTracks"),
    t("agent.prompts.readingPath"),
  ];
}
