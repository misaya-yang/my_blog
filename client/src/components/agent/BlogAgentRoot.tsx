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
  getAgentRouteScopeKey,
  inferClientScope,
  type BlogAgentOpenDetail,
} from "./routeContext";
import {
  markAssistantMessageRecoverable,
  toChatMessage,
  upsertTraceEntry,
} from "./messageState";
import {
  streamAgentMessage,
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
import {
  setBlogAgentOpenState,
  useBlogAgentOpenState,
} from "./agentController";
import {
  buildCompanionPrompts,
  getAgentSessionKey,
  getCompanionWelcome,
  getContextFileKind,
  getFallbackMimeType,
  getFocusableElements,
  inferAnswerMode,
  isBlogAgentHiddenRoute,
} from "./agentCompanionRuntime";
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
export {
  inferAnswerMode,
  isBlogAgentHiddenRoute,
} from "./agentCompanionRuntime";

function useIsAgentModalViewport() {
  const [isModalViewport, setIsModalViewport] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1359px)");
    const update = () => setIsModalViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isModalViewport;
}

export function BlogAgentRoot() {
  const [location] = useLocation();
  const { session } = useAuth();
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const isModalViewport = useIsAgentModalViewport();
  const routeContext = useMemo(
    () => buildRouteContext(location, language),
    [location, language]
  );
  const routeScopeKey = getAgentRouteScopeKey(routeContext);
  const hiddenOnRoute = isBlogAgentHiddenRoute(location);
  const open = useBlogAgentOpenState();
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
  const previousRouteScopeKeyRef = useRef<string | null>(null);
  const activeRouteScopeKeyRef = useRef(routeScopeKey);
  activeRouteScopeKeyRef.current = routeScopeKey;
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
    if (previousRouteScopeKeyRef.current === null) {
      previousRouteScopeKeyRef.current = routeScopeKey;
      return;
    }
    if (previousRouteScopeKeyRef.current === routeScopeKey) return;

    previousRouteScopeKeyRef.current = routeScopeKey;
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    pendingVisitorRetryPromptRef.current = null;
    pendingAssistantFocusRef.current = null;
    shouldFollowStreamRef.current = true;
    void utils.agent.bootstrap.cancel();
    void utils.agent.listConversations.cancel();
    void utils.agent.getConversation.cancel();

    setMessages([]);
    setConversationId(undefined);
    setSelectedConversationId(undefined);
    setNotice(null);
    setContextDraft("");
    setContextOpen(false);
    setAttachedContextCount(0);
    setHistoryOpen(false);
    setStreaming(false);
    setQuota(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [
    routeScopeKey,
    utils.agent.bootstrap,
    utils.agent.getConversation,
    utils.agent.listConversations,
  ]);

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
    if (
      !conversationDetail.data ||
      !selectedConversationId ||
      conversationDetail.data.conversation.id !== selectedConversationId
    )
      return;
    setConversationId(conversationDetail.data.conversation.id);
    setMessages(conversationDetail.data.messages.map(toChatMessage));
    setAttachedContextCount(
      conversationDetail.data.contextSources?.length ?? 0
    );
    setNotice(null);
  }, [conversationDetail.data, selectedConversationId]);

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
  }, [composerFocusToken, open, isModalViewport]);

  useEffect(() => {
    if (!open || !isModalViewport) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const previousBodyStyle = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const routeSurface = document.querySelector<HTMLElement>(
      "[data-route-surface]"
    );
    const previousRouteSurface = routeSurface
      ? {
          inert: routeSurface.inert,
          ariaHidden: routeSurface.getAttribute("aria-hidden"),
        }
      : null;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    document.documentElement.dataset.blogAgentModal = "open";

    if (routeSurface) {
      routeSurface.inert = true;
      routeSurface.setAttribute("aria-hidden", "true");
    }

    return () => {
      body.style.overflow = previousBodyStyle.overflow;
      body.style.position = previousBodyStyle.position;
      body.style.top = previousBodyStyle.top;
      body.style.width = previousBodyStyle.width;
      delete document.documentElement.dataset.blogAgentModal;

      if (routeSurface && previousRouteSurface) {
        routeSurface.inert = previousRouteSurface.inert;
        if (previousRouteSurface.ariaHidden === null) {
          routeSurface.removeAttribute("aria-hidden");
        } else {
          routeSurface.setAttribute(
            "aria-hidden",
            previousRouteSurface.ariaHidden
          );
        }
      }

      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [isModalViewport, open]);

  useEffect(() => {
    if (!hiddenOnRoute) return;
    streamAbortRef.current?.abort();
    void utils.agent.bootstrap.cancel();
    void utils.agent.listConversations.cancel();
    setBlogAgentOpenState(false);
    setStreaming(false);
  }, [hiddenOnRoute, utils.agent.bootstrap, utils.agent.listConversations]);

  useEffect(
    () => () => {
      streamAbortRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    function handleExternalOpen(event: Event) {
      const detail = (event as CustomEvent<BlogAgentOpenDetail>).detail;
      setBlogAgentOpenState(true);
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

  useEffect(() => {
    if (!open) return;

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.key !== "Escape" ||
        event.isComposing
      )
        return;

      event.preventDefault();
      void utils.agent.bootstrap.cancel();
      void utils.agent.listConversations.cancel();
      setBlogAgentOpenState(false);
      window.requestAnimationFrame(() => {
        const target = isMobile
          ? document.querySelector<HTMLButtonElement>(
              "[data-mobile-agent-trigger]"
            )
          : launcherRef.current;
        target?.focus({ preventScroll: true });
      });
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    isMobile,
    open,
    utils.agent.bootstrap,
    utils.agent.listConversations,
  ]);

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

    const submitRouteScopeKey = routeScopeKey;
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
          if (activeRouteScopeKeyRef.current !== submitRouteScopeKey) return;
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
          if (activeRouteScopeKeyRef.current !== submitRouteScopeKey) return;
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
          if (activeRouteScopeKeyRef.current !== submitRouteScopeKey) return;
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
      if (activeRouteScopeKeyRef.current !== submitRouteScopeKey) return;
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
      if (activeRouteScopeKeyRef.current === submitRouteScopeKey) {
        setStreaming(false);
      }
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

  function focusAgentTrigger() {
    const target = isMobile
      ? document.querySelector<HTMLButtonElement>("[data-mobile-agent-trigger]")
      : launcherRef.current;
    target?.focus({ preventScroll: true });
  }

  function cancelAgentBootstrapQueries() {
    void utils.agent.bootstrap.cancel();
    void utils.agent.listConversations.cancel();
  }

  function closeAgent() {
    cancelAgentBootstrapQueries();
    setBlogAgentOpenState(false);
    window.requestAnimationFrame(() => {
      focusAgentTrigger();
    });
  }

  function toggleAgent() {
    setBlogAgentOpenState(value => {
      const next = !value;
      if (!next) {
        cancelAgentBootstrapQueries();
        window.requestAnimationFrame(() => {
          focusAgentTrigger();
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

    if (!isModalViewport || event.key !== "Tab" || !panelRef.current) return;

    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (active === panelRef.current || !panelRef.current.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && active === first) {
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
    const contextRouteScopeKey = routeScopeKey;

    try {
      const response = await addContext.mutateAsync({
        conversationId,
        routeContext,
        kind: input.kind,
        filename: input.filename,
        mimeType: input.mimeType,
        content: trimmed,
      });
      if (activeRouteScopeKeyRef.current !== contextRouteScopeKey) return;

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
        <AgentFloatingFrame isMobile={isModalViewport}>
          {frameControls => (
            <>
              <AgentPanel
                isMobile={isModalViewport}
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
