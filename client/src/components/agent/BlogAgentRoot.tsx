import {
  Suspense,
  lazy,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  BookOpen,
  ExternalLink,
  FileText,
  History,
  Loader2,
  LogIn,
  RotateCcw,
  Send,
  Square,
  SquarePen,
  X,
} from "lucide-react";
import { siteConfig } from "@shared/site";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  buildRouteContext,
  BLOG_AGENT_OPEN_EVENT,
  getCompanionPromptKeys,
  type BlogAgentOpenDetail,
  type AgentRouteContext,
} from "./routeContext";
import {
  formatSourceExcerpt,
  getSourceAnchorId,
  getSourceHref,
  normalizeSourceText,
} from "./sourceCardLinks";
import { markAssistantMessageRecoverable, toChatMessage } from "./messageState";
import {
  AGENT_PANEL_STORAGE_KEY,
  DEFAULT_AGENT_PANEL_SIZE,
  MIN_AGENT_PANEL_SIZE,
  agentPanelSizesEqual,
  clampAgentPanelSize,
  getAgentPanelKeyboardDelta,
  getAgentPanelSizeBounds,
  parseStoredAgentPanelSize,
  resizeAgentPanelFromTopLeft,
  type AgentPanelSize,
} from "./panelSize";
import {
  isAbortError,
  isTimeoutError,
  streamAgentMessage,
  type AgentAnswerMode,
} from "./streamClient";
import type {
  ChatMessage,
  ChatMessageState,
  ConversationItem,
  QuotaInfo,
  SourceCard,
} from "./types";

interface AgentPanelResizeGesture {
  pointerId: number;
  startX: number;
  startY: number;
  startSize: AgentPanelSize;
}

const PERSISTED_AGENT_PANEL_BOUNDS = {
  minWidth: MIN_AGENT_PANEL_SIZE.width,
  maxWidth: 2048,
  minHeight: MIN_AGENT_PANEL_SIZE.height,
  maxHeight: 1600,
};

const AgentMarkdown = lazy(() =>
  import("./AgentMarkdown").then(module => ({ default: module.AgentMarkdown }))
);

export {
  formatSourceExcerpt,
  getSourceAnchorId,
  getSourceFallbackAnchorId,
  getSourceHref,
} from "./sourceCardLinks";

function readInitialAgentPanelSize() {
  if (typeof window === "undefined") return DEFAULT_AGENT_PANEL_SIZE;

  try {
    return parseStoredAgentPanelSize(
      window.localStorage.getItem(AGENT_PANEL_STORAGE_KEY),
      window.innerWidth >= 768
        ? getCurrentAgentPanelSizeBounds()
        : PERSISTED_AGENT_PANEL_BOUNDS
    );
  } catch {
    return DEFAULT_AGENT_PANEL_SIZE;
  }
}

function getCurrentAgentPanelSizeBounds() {
  if (typeof window === "undefined") {
    return getAgentPanelSizeBounds(416, 736);
  }

  const headerBottom = document
    .querySelector<HTMLElement>(".site-header")
    ?.getBoundingClientRect().bottom;
  const reservedTop =
    typeof headerBottom === "number" && Number.isFinite(headerBottom)
      ? Math.max(0, headerBottom)
      : 72;
  return getAgentPanelSizeBounds(
    window.innerWidth,
    window.innerHeight,
    reservedTop
  );
}

export function BlogAgentRoot() {
  const [location] = useLocation();
  const { session } = useAuth();
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const [documentTitle, setDocumentTitle] = useState(() =>
    typeof document === "undefined"
      ? ""
      : stripDocumentTitleSuffix(document.title)
  );
  const routeContext = useMemo(
    () => buildRouteContext(location, language, documentTitle),
    [location, language, documentTitle]
  );
  const hiddenOnRoute = isBlogAgentHiddenRoute(location);
  const [open, setOpen] = useState(false);
  const closeForSource = useCallback(() => {
    if (isMobile) setOpen(false);
  }, [isMobile]);
  const [draft, setDraft] = useState("");
  const conversationDraftsRef = useRef(new Map<string, string>());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >();
  const [notice, setNotice] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [composerFocusToken, setComposerFocusToken] = useState(0);
  const [panelSize, setPanelSize] = useState(readInitialAgentPanelSize);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const panelSizeRef = useRef(panelSize);
  const panelResizeGestureRef = useRef<AgentPanelResizeGesture | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const messageScrollerRef = useRef<HTMLDivElement | null>(null);
  const pendingAssistantFocusRef = useRef<string | null>(null);
  const shouldFollowStreamRef = useRef(true);
  const streamAbortRef = useRef<AbortController | null>(null);
  const discardedAbortControllersRef = useRef(new WeakSet<AbortController>());
  const previousIdentityKeyRef = useRef<string | null>(null);
  const utils = trpc.useUtils();
  const panelId = "blog-agent-panel";
  const panelTitleId = "blog-agent-title";

  const bootstrap = trpc.agent.bootstrap.useQuery(
    { routeContext },
    {
      enabled: open && !hiddenOnRoute,
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    }
  );
  const conversations = trpc.agent.listConversations.useQuery(undefined, {
    enabled: open && !hiddenOnRoute && historyOpen,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const conversationDetail = trpc.agent.getConversation.useQuery(
    {
      conversationId:
        selectedConversationId ?? "00000000-0000-4000-8000-000000000000",
    },
    {
      enabled: open && Boolean(selectedConversationId),
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );
  const visitorLogin = trpc.auth.visitorLogin.useMutation();
  const identityKey = getAgentSessionKey(session);
  const pendingVisitorRetryPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (bootstrap.data?.quota) setQuota(bootstrap.data.quota);
  }, [bootstrap.data?.quota]);

  useEffect(() => {
    function readTitle() {
      setDocumentTitle(stripDocumentTitleSuffix(document.title));
    }

    readTitle();
    const titleElement = document.head.querySelector("title");
    if (!titleElement) return;

    const observer = new MutationObserver(readTitle);
    observer.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [location, language]);

  useEffect(() => {
    if (previousIdentityKeyRef.current === null) {
      previousIdentityKeyRef.current = identityKey;
      return;
    }
    if (previousIdentityKeyRef.current === identityKey) return;

    previousIdentityKeyRef.current = identityKey;
    discardAndAbortActiveStream();
    conversationDraftsRef.current.clear();
    const pendingVisitorRetryPrompt = pendingVisitorRetryPromptRef.current;
    pendingVisitorRetryPromptRef.current = null;

    setDraft(pendingVisitorRetryPrompt ?? "");
    setMessages([]);
    setConversationId(undefined);
    setSelectedConversationId(undefined);
    setNotice(pendingVisitorRetryPrompt ? t("agent.quota.visitorReady") : null);
    setHistoryOpen(false);
    setStreaming(false);
    setQuota(null);
    if (pendingVisitorRetryPrompt) {
      setComposerFocusToken(token => token + 1);
    }
    void utils.agent.listConversations.invalidate();
  }, [identityKey, t, utils.agent.listConversations]);

  useEffect(() => {
    const detail = conversationDetail.data;
    // Guard against a detail that settles after its selection was dropped
    // (New thread clears selectedConversationId, but TanStack Query lets the
    // in-flight fetch finish): applying the stale payload would resurrect
    // the old conversation over the fresh empty thread.
    if (!detail || !selectedConversationId) return;
    if (detail.conversation.id !== selectedConversationId) return;
    setConversationId(detail.conversation.id);
    setMessages(detail.messages.map(toChatMessage));
    setNotice(null);
    setComposerFocusToken(token => token + 1);
  }, [conversationDetail.data, selectedConversationId]);

  useEffect(() => {
    if (!conversationDetail.isError) return;
    setDraft(conversationDraftsRef.current.get(conversationId ?? "") ?? "");
    setSelectedConversationId(undefined);
    setNotice(t("agent.error.history"));
    setComposerFocusToken(token => token + 1);
  }, [conversationDetail.isError, t]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, open]);

  useEffect(() => {
    panelSizeRef.current = panelSize;
    try {
      window.localStorage.setItem(
        AGENT_PANEL_STORAGE_KEY,
        JSON.stringify(panelSize)
      );
    } catch {
      // Storage can be unavailable in privacy-restricted browsing modes. The
      // in-memory size remains fully usable for the current page session.
    }
  }, [panelSize]);

  useEffect(() => {
    if (isMobile) return;

    function fitPanelToViewport() {
      const bounds = getCurrentAgentPanelSizeBounds();
      setPanelSize(current => {
        const next = clampAgentPanelSize(current, bounds);
        panelSizeRef.current = next;
        return agentPanelSizesEqual(current, next) ? current : next;
      });
    }

    fitPanelToViewport();
    window.addEventListener("resize", fitPanelToViewport);
    return () => window.removeEventListener("resize", fitPanelToViewport);
  }, [isMobile]);

  useEffect(() => {
    const scroller = messageScrollerRef.current;
    if (!scroller || !streaming || !shouldFollowStreamRef.current) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages, streaming]);

  const prevOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      if (composerFocusToken > 0) {
        draftInputRef.current?.focus({ preventScroll: true });
        setComposerFocusToken(0);
        return;
      }

      // Panel focus belongs to the closed->open transition only. Resetting
      // the focus token above re-runs this effect, and a second panel focus
      // there would steal the caret from the textarea.
      if (!wasOpen) {
        panelRef.current?.focus({ preventScroll: true });
      }
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== "i") return;
      if (hiddenOnRoute) return;
      event.preventDefault();
      toggleAgent();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hiddenOnRoute]);

  if (hiddenOnRoute) return null;

  const postTitle =
    routeContext.routeType === "post" ? routeContext.postTitle : undefined;
  const suggestedPrompts = buildCompanionPrompts(
    routeContext,
    t,
    bootstrap.data?.suggestedPrompts,
    postTitle
  );
  const conversationSwitching =
    Boolean(selectedConversationId) &&
    (conversationDetail.isFetching ||
      conversationId !== selectedConversationId);

  async function handleSubmit(
    message: string,
    retry?: { assistantMessageId: string; userMessageId: string }
  ) {
    const trimmed = message.trim();
    if (!trimmed || streaming || conversationSwitching || bootstrap.isError)
      return;

    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      role: "user",
      content: trimmed,
    };
    const assistantMessageId = `assistant-${timestamp}`;
    const assistantDraft: ChatMessage = {
      id: retry?.assistantMessageId ?? assistantMessageId,
      role: "assistant",
      content: "",
      streaming: true,
      retryUserMessageId: retry?.userMessageId,
    };
    const activeAssistantMessageId = assistantDraft.id;
    setNotice(null);
    if (shouldClearAgentDraft(draft, trimmed, Boolean(retry))) setDraft("");
    setStreaming(true);
    pendingAssistantFocusRef.current = activeAssistantMessageId;
    shouldFollowStreamRef.current = true;
    setMessages(current => {
      if (!retry) {
        return [...current, userMessage, assistantDraft];
      }
      return current.map(item =>
        item.id === retry.assistantMessageId ? assistantDraft : item
      );
    });
    const controller = new AbortController();
    streamAbortRef.current = controller;
    let confirmedUserMessageId = retry?.userMessageId;
    let historyInvalidated = false;
    let pendingDelta = "";
    let deltaTimer: ReturnType<typeof setTimeout> | undefined;
    const flushDelta = () => {
      clearTimeout(deltaTimer);
      deltaTimer = undefined;
      const delta = pendingDelta;
      pendingDelta = "";
      if (!delta || discardedAbortControllersRef.current.has(controller))
        return;
      shouldFollowStreamRef.current = isAgentNearBottom(
        messageScrollerRef.current
      );
      setMessages(current =>
        current.map(item =>
          item.id === activeAssistantMessageId
            ? { ...item, content: item.content + delta }
            : item
        )
      );
    };

    try {
      await streamAgentMessage({
        conversationId,
        retryUserMessageId: retry?.userMessageId,
        message: trimmed,
        routeContext,
        answerMode: inferAnswerMode(trimmed, routeContext),
        signal: controller.signal,
        onStatus: event => {
          if (event.conversationId) setConversationId(event.conversationId);
          if (
            event.conversationId &&
            event.userMessageId &&
            !historyInvalidated
          ) {
            historyInvalidated = true;
            void utils.agent.listConversations.invalidate();
          }
          if (event.userMessageId) {
            confirmedUserMessageId = event.userMessageId;
            setMessages(current =>
              current.map(item =>
                item.id === activeAssistantMessageId
                  ? { ...item, retryUserMessageId: event.userMessageId }
                  : item
              )
            );
          }
          shouldFollowStreamRef.current = isAgentNearBottom(
            messageScrollerRef.current
          );
        },
        onAnswerDelta: delta => {
          pendingDelta += delta;
          if (!deltaTimer) deltaTimer = setTimeout(flushDelta, 60);
        },
        onFinal: event => {
          flushDelta();
          const response = event.output;
          setQuota(response.quota);
          shouldFollowStreamRef.current = false;

          if (response.status === "blocked") {
            restoreDraftIfEmpty(trimmed);
            setMessages(current =>
              markAssistantMessageRecoverable(
                current,
                activeAssistantMessageId,
                {
                  content: getQuotaBlockedNotice(response.quota.tier, t),
                  state: "quota_blocked",
                  recoveryPrompt: trimmed,
                  quotaTier: response.quota.tier,
                  finalElapsedMs: event.elapsedMs,
                }
              )
            );
            return;
          }

          if (response.status === "failed") {
            const failureNotice = getAgentFailureNotice(response.errorCode, t);
            setConversationId(response.conversationId);
            void utils.agent.listConversations.invalidate();
            restoreDraftIfEmpty(trimmed);
            setMessages(current =>
              markAssistantMessageRecoverable(
                current,
                activeAssistantMessageId,
                {
                  messageId: response.messageId,
                  content: failureNotice,
                  state: getAgentFailureState(response.errorCode),
                  recoveryPrompt: trimmed,
                  retryUserMessageId: response.userMessageId,
                  finalElapsedMs: event.elapsedMs,
                }
              )
            );
            return;
          }

          setConversationId(response.conversationId);
          void utils.agent.listConversations.invalidate();
          setMessages(current =>
            current.map(item =>
              item.id === activeAssistantMessageId
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
      flushDelta();
      shouldFollowStreamRef.current = false;
      const interruptedForReset =
        discardedAbortControllersRef.current.has(controller);
      discardedAbortControllersRef.current.delete(controller);
      if (!interruptedForReset) restoreDraftIfEmpty(trimmed);
      const failure = getClientStreamFailure(error, t);
      setMessages(current =>
        markAssistantMessageRecoverable(current, activeAssistantMessageId, {
          content: failure.content,
          state: failure.state,
          recoveryPrompt: trimmed,
          retryUserMessageId: confirmedUserMessageId,
        })
      );
    } finally {
      clearTimeout(deltaTimer);
      if (shouldFinalizeAgentStream(streamAbortRef.current, controller)) {
        streamAbortRef.current = null;
        setStreaming(false);
      }
    }
  }

  function handleRetry(
    assistantMessageId: string,
    prompt: string,
    userMessageId: string
  ) {
    void handleSubmit(prompt, { assistantMessageId, userMessageId });
  }

  function discardAndAbortActiveStream() {
    const controller = streamAbortRef.current;
    if (!controller) return;
    discardedAbortControllersRef.current.add(controller);
    streamAbortRef.current = null;
    controller.abort();
  }

  function restoreDraftIfEmpty(prompt: string) {
    setDraft(current => (current.trim() ? current : prompt));
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

  function handleNewThread() {
    if (conversationId) conversationDraftsRef.current.set(conversationId, draft);
    discardAndAbortActiveStream();
    setStreaming(false);
    setMessages([]);
    setConversationId(undefined);
    setSelectedConversationId(undefined);
    setNotice(null);
    setDraft("");
    setComposerFocusToken(token => token + 1);
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

    // When the panel section itself holds focus (the closed->open initial
    // state), Shift+Tab would otherwise leave the modal dialog and land on
    // the covered page behind it; wrap to the last control instead.
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleLoadConversation(nextConversationId: string) {
    if (streaming || conversationSwitching) return;
    conversationDraftsRef.current.set(conversationId ?? "", draft);
    setDraft(conversationDraftsRef.current.get(nextConversationId) ?? "");
    panelRef.current?.focus({ preventScroll: true });
    setNotice(null);
    setSelectedConversationId(nextConversationId);
    setHistoryOpen(false);
  }

  function setClampedPanelSize(nextSize: AgentPanelSize) {
    const next = clampAgentPanelSize(
      nextSize,
      getCurrentAgentPanelSizeBounds()
    );
    panelSizeRef.current = next;
    setPanelSize(current =>
      agentPanelSizesEqual(current, next) ? current : next
    );
  }

  function resetPanelSize() {
    setClampedPanelSize(DEFAULT_AGENT_PANEL_SIZE);
  }

  function handlePanelResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    panelResizeGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startSize: panelSizeRef.current,
    };
  }

  function handlePanelResizePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    const gesture = panelResizeGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    setClampedPanelSize(
      resizeAgentPanelFromTopLeft(
        gesture.startSize,
        event.clientX - gesture.startX,
        event.clientY - gesture.startY,
        getCurrentAgentPanelSizeBounds()
      )
    );
  }

  function finishPanelResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (panelResizeGestureRef.current?.pointerId !== event.pointerId) return;
    panelResizeGestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePanelResizeKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key === "Home") {
      event.preventDefault();
      event.stopPropagation();
      resetPanelSize();
      return;
    }

    const delta = getAgentPanelKeyboardDelta(
      event.key,
      event.shiftKey ? 32 : 16
    );
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    setClampedPanelSize({
      width: panelSizeRef.current.width + delta.width,
      height: panelSizeRef.current.height + delta.height,
    });
  }

  return (
    <>
      <AgentLauncher
        buttonRef={launcherRef}
        open={open}
        label={t("agent.launcher.label")}
        tooltip={t("agent.launcher.tooltip")}
        controls={panelId}
        onClick={toggleAgent}
      />

      {open && (
        <div
          data-agent-panel-shell
          data-agent-panel-width={isMobile ? undefined : panelSize.width}
          data-agent-panel-height={isMobile ? undefined : panelSize.height}
          className={cn(
            "agent-panel-shell fixed z-[65]",
            isMobile ? "inset-0" : "bottom-3 right-3"
          )}
          style={
            isMobile
              ? undefined
              : {
                  width: panelSize.width,
                  height: panelSize.height,
                }
          }
        >
          {!isMobile && (
            <button
              data-agent-resize-handle
              type="button"
              className="agent-panel-resize-handle"
              aria-label={t("agent.panel.resize")}
              title={t("agent.panel.resizeHint")}
              aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home"
              onClick={event => {
                // Keyboard activation sends a click with detail 0; pointer
                // users keep single-click free for starting a drag.
                if (event.detail === 0) resetPanelSize();
              }}
              onDoubleClick={event => {
                event.preventDefault();
                resetPanelSize();
              }}
              onKeyDown={handlePanelResizeKeyDown}
              onPointerDown={handlePanelResizePointerDown}
              onPointerMove={handlePanelResizePointerMove}
              onPointerUp={finishPanelResize}
              onPointerCancel={finishPanelResize}
              onLostPointerCapture={() => {
                panelResizeGestureRef.current = null;
              }}
            />
          )}
          <AgentPanel
            isMobile={isMobile}
            panelId={panelId}
            titleId={panelTitleId}
            panelRef={panelRef}
            draftInputRef={draftInputRef}
            bootstrapRetrying={bootstrap.isFetching}
            bootstrapError={bootstrap.isError}
            draft={draft}
            messages={messages}
            notice={notice}
            quota={quota}
            historyOpen={historyOpen}
            historyError={conversations.isError}
            onRetryHistory={() => void conversations.refetch()}
            conversations={conversations.data ?? []}
            historyLoading={
              conversations.isLoading || conversationDetail.isFetching
            }
            conversationSwitching={conversationSwitching}
            activeConversationId={conversationId}
            isPostRoute={routeContext.routeType === "post"}
            postTitle={postTitle}
            suggestedPrompts={suggestedPrompts}
            sending={streaming}
            visitorLoading={visitorLogin.isPending}
            onClose={closeAgent}
            onReadSource={closeForSource}
            onNewThread={handleNewThread}
            onRetryBootstrap={() => void bootstrap.refetch()}
            onPanelKeyDown={handlePanelKeyDown}
            onDraftChange={setDraft}
            onToggleHistory={() => setHistoryOpen(value => !value)}
            onLoadConversation={handleLoadConversation}
            onPrompt={handleSubmit}
            onRetry={handleRetry}
            onSubmit={handleSubmit}
            onCancel={handleCancelStreaming}
            onContinueAsVisitor={handleContinueAsVisitor}
            messageScrollerRef={messageScrollerRef}
            pendingAssistantFocusRef={pendingAssistantFocusRef}
          />
        </div>
      )}
    </>
  );
}

export function AgentLauncher({
  buttonRef,
  open,
  label,
  tooltip,
  controls,
  onClick,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  label: string;
  tooltip: string;
  controls: string;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      title={tooltip}
      onClick={onClick}
      className={cn(
        "agent-liquid-launcher fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[66] inline-flex h-11 items-center gap-2.5 px-3 text-sm font-medium",
        // The header owns Close while the panel is open; a visible launcher
        // would sit on top of the composer's bottom-right corner.
        open && "hidden"
      )}
    >
      <span className="agent-launcher-orb grid h-8 w-8 place-items-center">
        <BookOpen className="h-4 w-4" />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function AgentHeaderButton({
  label,
  ariaExpanded,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  ariaExpanded?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={ariaExpanded}
      disabled={disabled}
      onClick={onClick}
      className="agent-header-action grid place-items-center text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-inline)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function AgentPanel({
  isMobile,
  panelId,
  titleId,
  panelRef,
  draftInputRef,
  bootstrapRetrying,
  bootstrapError,
  draft,
  messages,
  notice,
  quota,
  historyOpen,
  historyError = false,
  onRetryHistory,
  conversations,
  historyLoading,
  conversationSwitching,
  activeConversationId,
  isPostRoute,
  postTitle,
  suggestedPrompts,
  sending,
  visitorLoading,
  onClose,
  onReadSource,
  onNewThread,
  onRetryBootstrap,
  onPanelKeyDown,
  onDraftChange,
  onToggleHistory,
  onLoadConversation,
  onPrompt,
  onRetry,
  onSubmit,
  onCancel,
  onContinueAsVisitor,
  messageScrollerRef,
  pendingAssistantFocusRef,
}: {
  isMobile: boolean;
  panelId: string;
  titleId: string;
  panelRef: RefObject<HTMLElement | null>;
  draftInputRef: RefObject<HTMLTextAreaElement | null>;
  bootstrapRetrying: boolean;
  bootstrapError: boolean;
  draft: string;
  messages: ChatMessage[];
  notice: string | null;
  quota: QuotaInfo | null;
  historyOpen: boolean;
  historyError?: boolean;
  onRetryHistory?: () => void;
  conversations: ConversationItem[];
  historyLoading: boolean;
  conversationSwitching: boolean;
  activeConversationId?: string;
  isPostRoute: boolean;
  postTitle?: string;
  suggestedPrompts: string[];
  sending: boolean;
  visitorLoading: boolean;
  onClose: () => void;
  onReadSource?: () => void;
  onNewThread: () => void;
  onRetryBootstrap: () => void;
  onPanelKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  onDraftChange: (value: string) => void;
  onToggleHistory: () => void;
  onLoadConversation: (conversationId: string) => void;
  onPrompt: (message: string) => void;
  onRetry: (
    assistantMessageId: string,
    message: string,
    userMessageId: string
  ) => void;
  onSubmit: (message: string) => void;
  onCancel: () => void;
  onContinueAsVisitor: (recoveryPrompt?: string) => void;
  messageScrollerRef: RefObject<HTMLDivElement | null>;
  pendingAssistantFocusRef: MutableRefObject<string | null>;
}) {
  const { t } = useLanguage();
  const inputDisabled = bootstrapError || conversationSwitching;

  useEffect(() => {
    resizeAgentTextarea(draftInputRef.current);
  }, [draft, draftInputRef, t]);

  useEffect(() => {
    const input = draftInputRef.current;
    if (!input) return;
    let width = -1;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => resizeAgentTextarea(input));
    });
    observer.observe(input);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [draftInputRef]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inputDisabled) return;
    onSubmit(draft);
  }

  return (
    <section
      ref={panelRef}
      id={panelId}
      role={isMobile ? "dialog" : "complementary"}
      aria-modal={isMobile ? "true" : undefined}
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={onPanelKeyDown}
      className="agent-liquid-panel flex h-dvh min-h-0 flex-col overflow-hidden md:h-full"
    >
      <header className="agent-panel-header flex shrink-0 items-center gap-2.5 pt-[env(safe-area-inset-top)]">
        <span
          className="agent-header-mark grid h-8 w-8 shrink-0 place-items-center"
          aria-hidden="true"
        >
          <BookOpen className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate font-semibold text-[var(--fg)]">
            {t("agent.header.title")}
          </h2>
          <p className="truncate text-xs text-[var(--fg-muted)]">
            {t("agent.header.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <AgentHeaderButton
            label={t("agent.history.button")}
            ariaExpanded={historyOpen}
            disabled={sending}
            onClick={onToggleHistory}
          >
            <History className="h-4 w-4" />
          </AgentHeaderButton>
          <AgentHeaderButton
            label={t("agent.thread.new")}
            onClick={onNewThread}
          >
            <SquarePen className="h-4 w-4" />
          </AgentHeaderButton>
          <AgentHeaderButton label={t("agent.header.close")} onClick={onClose}>
            <X className="h-4 w-4" />
          </AgentHeaderButton>
        </div>
      </header>

      <div className="agent-context-row shrink-0 px-4 py-1.5">
        <p title={postTitle} className="text-xs text-[var(--fg-muted)]">
          {isPostRoute && postTitle ? (
            <>
              <span className="text-[var(--fg-faint)]">
                {t("agent.context.currentReading")}
              </span>
              <span
                className="mx-1.5 text-[var(--fg-faint)]"
                aria-hidden="true"
              >
                ·
              </span>
              {postTitle}
            </>
          ) : (
            t("agent.context.siteWide")
          )}
        </p>
      </div>

      {historyOpen && (
        <AgentHistoryPanel
          conversations={conversations}
          error={historyError}
          onRetry={onRetryHistory}
          loading={historyLoading}
          disabled={sending}
          activeConversationId={activeConversationId}
          onLoadConversation={onLoadConversation}
        />
      )}

      {/* The QA harness locates this scroller as the panel's only
          overflow-y-auto div; keep that utility class stable. */}
      <div
        ref={messageScrollerRef}
        className="agent-message-scroller min-h-0 flex-1 overscroll-contain overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5 sm:px-5"
      >
        {bootstrapError && (
          <AgentBootstrapUnavailable
            retrying={bootstrapRetrying}
            onRetry={onRetryBootstrap}
          />
        )}

        {conversationSwitching && (
          <div
            role="status"
            className="flex items-center gap-2 py-4 text-sm text-[var(--fg-muted)]"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading")}
          </div>
        )}
        {!bootstrapError && !conversationSwitching && messages.length === 0 && (
          <div className="agent-empty-state flex flex-col gap-4 py-2">
            <div>
              <h3>
                {t(
                  isPostRoute
                    ? "agent.empty.postTitle"
                    : "agent.empty.siteTitle"
                )}
              </h3>
              <p className="max-w-[30rem] text-sm leading-6 text-[var(--fg-muted)]">
                {isPostRoute
                  ? t("agent.empty.postBody")
                  : t("agent.empty.siteBody")}
              </p>
            </div>
            <div className="grid gap-0.5">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  aria-label={
                    isPostRoute && index === 0
                      ? t("agent.prompts.postAbstraction")
                      : prompt
                  }
                  type="button"
                  disabled={sending || inputDisabled}
                  onClick={() => onPrompt(prompt)}
                  className="agent-prompt-row group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm leading-6 text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
                >
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-px shrink-0 bg-[var(--border)] transition-colors group-hover:bg-[var(--primary)]"
                  />
                  {isPostRoute && index === 0
                    ? t("agent.prompts.postAbstraction")
                    : prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-6">
            {messages.map(message => (
              <article
                key={message.id}
                data-agent-message-role={message.role}
                ref={node => {
                  if (node && message.id === pendingAssistantFocusRef.current) {
                    pendingAssistantFocusRef.current = null;
                    window.requestAnimationFrame(() => {
                      const scroller = messageScrollerRef.current;
                      if (scroller && node.isConnected) {
                        scroller.scrollTop +=
                          node.getBoundingClientRect().top -
                          scroller.getBoundingClientRect().top -
                          16;
                      }
                    });
                  }
                }}
                className={cn(
                  "agent-message-enter flex min-w-0",
                  message.role === "user"
                    ? "agent-message-user justify-end"
                    : "agent-message-assistant w-full"
                )}
              >
                {message.role === "assistant" ? (
                  <div className="flex w-full min-w-0 flex-col gap-3">
                    {message.streaming && (
                      <div
                        role="status"
                        className="flex items-center gap-1.5 text-xs text-[var(--fg-faint)]"
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{t("agent.trace.waiting")}</span>
                      </div>
                    )}
                    {/* On a failed turn the recovery card already headlines the
                        notice; only render the prose body when it carries an
                        actual (partial) answer. */}
                    {message.content &&
                      message.content !== message.recoveryMessage && (
                        <div className="agent-answer-prose max-w-none break-words [overflow-wrap:anywhere]">
                          <Suspense
                            fallback={
                              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                {message.content}
                              </p>
                            }
                          >
                            <AgentMarkdown onNavigate={onReadSource}>
                              {message.content}
                            </AgentMarkdown>
                          </Suspense>
                        </div>
                      )}
                    {message.sourceCards && message.sourceCards.length > 0 && (
                      <AgentSourceCards
                        sources={message.sourceCards}
                        onNavigate={onReadSource}
                      />
                    )}
                    {message.relatedQuestions &&
                      message.relatedQuestions.length > 0 && (
                        <AgentRelatedQuestions
                          questions={message.relatedQuestions}
                          disabled={sending}
                          onPrompt={onPrompt}
                        />
                      )}
                    {message.state && (
                      <AgentMessageRecovery
                        message={message}
                        disabled={sending || inputDisabled}
                        visitorLoading={visitorLoading}
                        onRetry={onRetry}
                        onContinueAsVisitor={onContinueAsVisitor}
                      />
                    )}
                  </div>
                ) : (
                  <div className="max-w-[84%] break-words rounded-[0.65rem] bg-[var(--secondary)] px-3.5 py-2.5 text-sm leading-6 text-[var(--secondary-foreground)] [overflow-wrap:anywhere]">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {notice && (
        <div className="px-3 pt-3 sm:px-4">
          <AgentNotice tone="warning" message={notice} />
        </div>
      )}

      {quota && quota.remaining <= 1 && (
        <p className="px-3 pt-2 text-xs text-[var(--fg-faint)] sm:px-4">
          {t("agent.quota.low", { remaining: quota.remaining })}
        </p>
      )}

      <form
        onSubmit={submit}
        className="agent-composer shrink-0 bg-[var(--bg-elevated)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3"
      >
        <div className="agent-composer-field flex items-end gap-2">
          <Textarea
            ref={draftInputRef}
            value={draft}
            disabled={inputDisabled}
            onChange={event => {
              onDraftChange(event.target.value);
              resizeAgentTextarea(event.currentTarget);
            }}
            onKeyDown={event => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.nativeEvent.keyCode !== 229
              ) {
                event.preventDefault();
                onSubmit(draft);
              }
            }}
            aria-label={t("agent.input.label")}
            placeholder={t("agent.input.placeholder")}
            rows={1}
            className="max-h-28 min-h-11 flex-1 resize-none bg-[var(--card)] text-sm leading-6 text-[var(--fg)] shadow-none placeholder:text-[var(--fg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <Button
            type="button"
            size="icon"
            onClick={event => {
              if (sending) {
                onCancel();
                return;
              }
              event.currentTarget.form?.requestSubmit();
            }}
            disabled={!sending && (!draft.trim() || inputDisabled)}
            aria-label={
              sending ? t("agent.input.cancel") : t("agent.input.send")
            }
            title={sending ? t("agent.input.cancel") : t("agent.input.send")}
            className="h-11 w-11 shrink-0 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] sm:h-10 sm:w-10"
          >
            {sending ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="agent-composer-hint">{t("agent.input.hint")}</p>
      </form>
    </section>
  );
}

export function AgentSourceCards({
  sources,
  onNavigate,
}: {
  sources: SourceCard[];
  onNavigate?: () => void;
}) {
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const currentPath = normalizePathWithoutHash(location);
  const visibleSources = getVisibleSourceCards(sources, expanded);
  const previewSources = getVisibleSourceCards(sources, false);

  return (
    <div className="agent-sources mt-3 border-t border-[var(--border)] pt-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 font-semibold text-[var(--fg-muted)]">
            {t("agent.sources.summary", { count: sources.length })}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {previewSources.map(source => (
              <AgentSourcePreviewChip key={source.sourceId} source={source} />
            ))}
            {sources.length > previewSources.length && (
              <span className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[0.68rem] font-medium text-[var(--fg-muted)]">
                {t("agent.sources.previewMore", {
                  count: sources.length - previewSources.length,
                })}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {expanded ? t("agent.sources.hide") : t("agent.sources.view")}
        </button>
      </div>
      {expanded && (
        <div className="agent-source-list mt-2 grid gap-2">
          {visibleSources.map(source => {
            const title = source.postTitle || t("agent.sources.site");
            const hasBlogLink =
              source.sourceType !== "user_context" && Boolean(source.postSlug);
            const currentPageSource = isCurrentPathSource(source, currentPath);
            const section =
              source.sectionTitle ?? getSourceSectionLabel(source, t);
            const excerpt = formatSourceExcerpt(source);
            const relevanceReason = getDisplayRelevanceReason(
              source,
              currentPageSource,
              t
            );
            const href = hasBlogLink ? getSourceHref(source) : undefined;

            return (
              <div
                key={source.sourceId}
                data-agent-source-id={source.sourceId}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--fg-muted)]"
                    aria-hidden="true"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="agent-source-heading flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--fg)]">
                          {section}
                        </div>
                        {source.postTitle && section !== title && (
                          <div className="mt-0.5 truncate text-[0.72rem] text-[var(--fg-muted)]">
                            {title}
                          </div>
                        )}
                      </div>
                      <div className="agent-source-actions inline-flex shrink-0 items-center gap-1">
                        <span className="rounded border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 text-[0.65rem] font-medium text-[var(--fg-muted)]">
                          {source.sourceType === "user_context"
                            ? t("agent.sources.context")
                            : t("agent.sources.blog")}
                        </span>
                        {currentPageSource && (
                          <span className="rounded border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 text-[0.65rem] font-medium text-[var(--primary)]">
                            {t("agent.sources.currentPage")}
                          </span>
                        )}
                        {hasBlogLink && href && (
                          <a
                            href={href}
                            aria-label={`${t("agent.sources.open")}: ${title}`}
                            title={`${title}${
                              source.heading ? ` / ${source.heading}` : ""
                            }`}
                            onClick={event => {
                              if (
                                handleSourceLinkClick(
                                  event,
                                  source,
                                  href,
                                  navigate
                                )
                              )
                                onNavigate?.();
                            }}
                            className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border)] text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                    {(excerpt || relevanceReason) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer list-none text-[0.7rem] font-medium text-[var(--fg-muted)]">
                          {t("agent.sources.details")}
                        </summary>
                        {excerpt && (
                          <p className="mt-1 break-words text-xs leading-5 text-[var(--fg-muted)] [overflow-wrap:anywhere]">
                            {excerpt}
                          </p>
                        )}
                        {relevanceReason && (
                          <p className="mt-1 break-words text-[0.7rem] leading-5 text-[var(--fg-muted)] [overflow-wrap:anywhere]">
                            {t("agent.sources.reason")}: {relevanceReason}
                          </p>
                        )}
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgentSourcePreviewChip({ source }: { source: SourceCard }) {
  const { t } = useLanguage();
  const title =
    source.sectionTitle ??
    source.heading ??
    source.postTitle ??
    t("agent.sources.site");

  return (
    <span
      className="max-w-[min(12rem,34vw)] truncate rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[0.68rem] font-medium text-[var(--fg-muted)]"
      title={title}
    >
      {title}
    </span>
  );
}

export function getVisibleSourceCards<T>(sources: T[], expanded: boolean) {
  return expanded ? sources : sources.slice(0, 2);
}

function handleSourceLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  source: SourceCard,
  href: string,
  navigate: (to: string) => void
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return;
  }

  event.preventDefault();
  const targetPath = normalizePathWithoutHash(href);
  const currentPath = normalizePathWithoutHash(window.location.pathname);
  if (targetPath === currentPath) {
    scrollToSource(source, href, event.detail === 0);
    return true;
  }

  navigate(href);
  return true;
}

function scrollToSource(source: SourceCard, href: string, focusTarget = false) {
  const target =
    findSourceHeadingElement(source) ??
    findHashElement(href) ??
    document.querySelector<HTMLElement>(".article-prose");
  if (!target) {
    window.history.pushState(null, "", href);
    return;
  }

  const targetHash = target.id ? `#${target.id}` : "";
  window.history.pushState(
    null,
    "",
    `${window.location.pathname}${targetHash}`
  );
  target.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
  if (focusTarget) {
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
}

function findSourceHeadingElement(source: SourceCard) {
  const heading = source.heading ? normalizeSourceText(source.heading) : "";
  const articleHeadings = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".article-prose h1[id], .article-prose h2[id], .article-prose h3[id], .article-prose h4[id], .article-prose h5[id], .article-prose h6[id]"
    )
  );

  if (heading) {
    const exactMatch = articleHeadings.find(
      element => normalizeSourceText(element.textContent ?? "") === heading
    );
    if (exactMatch) return exactMatch;

    const sectionMatch = articleHeadings.find(element => {
      const text = normalizeSourceText(element.textContent ?? "");
      return text.includes(heading) || heading.includes(text);
    });
    if (sectionMatch) return sectionMatch;
  }

  const fallbackId = getSourceAnchorId(source);
  return fallbackId ? document.getElementById(fallbackId) : null;
}

function findHashElement(href: string) {
  const hash = href.split("#")[1];
  if (!hash) return null;
  try {
    return document.getElementById(decodeURIComponent(hash));
  } catch {
    return null;
  }
}

function getSourceSectionLabel(source: SourceCard, t: (key: string) => string) {
  if (source.heading) return source.heading;
  if (source.sourceType === "user_context")
    return source.postTitle || t("agent.sources.context");
  return source.postTitle || t("agent.sources.site");
}

function isCurrentPathSource(source: SourceCard, currentPath: string) {
  return Boolean(source.postSlug) && currentPath === `/post/${source.postSlug}`;
}

function normalizePathWithoutHash(value: string) {
  return value.split("#")[0].split("?")[0] || "/";
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

function AgentRelatedQuestions({
  questions,
  disabled,
  onPrompt,
}: {
  questions: string[];
  disabled: boolean;
  onPrompt: (message: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="agent-related-questions mt-3 border-t border-[var(--border)] pt-3">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase text-[var(--fg-faint)]">
        {t("agent.related.title")}
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.slice(0, 3).map(question => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onPrompt(question)}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-left text-xs leading-5 text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

export function getDisplayRelevanceReason(
  source: SourceCard,
  currentPageSource: boolean,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  const stripped = source.relevanceReason
    .replace(/^Current public article context\.?\s*/i, "")
    .trim();
  if (stripped) return stripped;
  return currentPageSource
    ? t("agent.sources.currentPage")
    : t("agent.sources.blog");
}

function AgentHistoryPanel({
  conversations,
  loading,
  error = false,
  onRetry,
  disabled,
  activeConversationId,
  onLoadConversation,
}: {
  conversations: ConversationItem[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  disabled: boolean;
  activeConversationId?: string;
  onLoadConversation: (conversationId: string) => void;
}) {
  const { t } = useLanguage();
  const visible = conversations.slice(0, 8);

  return (
    <div className="agent-history-panel shrink-0 px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
        <span>{t("agent.history.title")}</span>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </div>
      {error && (
        <div role="status" className="text-sm text-[var(--fg-muted)]">
          <p>{t("agent.error.history")}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md px-3 py-2 text-[var(--primary)]"
          >
            {t("agent.input.retry")}
          </button>
        </div>
      )}
      {visible.length > 0 ? (
        <div className="grid max-h-48 gap-2 overflow-y-auto pr-1">
          {visible.map(conversation => {
            const active = conversation.id === activeConversationId;
            return (
              <button
                key={conversation.id}
                data-agent-conversation-id={conversation.id}
                type="button"
                disabled={disabled}
                onClick={() => onLoadConversation(conversation.id)}
                className={cn(
                  "grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border bg-[var(--card)] px-3 py-2 text-left text-xs leading-5 transition-colors disabled:pointer-events-none disabled:opacity-55",
                  active
                    ? "border-[var(--primary)] text-[var(--fg)]"
                    : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]"
                )}
              >
                <span className="min-w-0 truncate font-medium">
                  {conversation.title || t("agent.history.continue")}
                </span>
                <span className="shrink-0 text-right text-[0.68rem] leading-4 text-[var(--fg-muted)]">
                  {formatConversationTime(
                    conversation.lastMessageAt ?? conversation.updatedAt,
                    t
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : !error ? (
        <div className="text-xs text-[var(--fg-muted)]">
          {t(loading ? "common.loading" : "agent.history.empty")}
        </div>
      ) : null}
    </div>
  );
}

function formatConversationTime(
  value: Date | string | null | undefined,
  t: (key: string) => string
) {
  if (!value) return t("agent.history.noTime");
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return t("agent.history.noTime");
  return new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isBlogAgentHiddenRoute(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return /^\/(write|manage|login)(\/|$)/.test(pathname);
}

export function shouldFinalizeAgentStream(
  activeController: AbortController | null,
  completedController: AbortController
) {
  return activeController === completedController;
}

export function shouldClearAgentDraft(
  currentDraft: string,
  submittedMessage: string,
  retrying: boolean
) {
  return !retrying || currentDraft.trim() === submittedMessage.trim();
}

function AgentNotice({
  tone,
  message,
}: {
  tone: "warning" | "error";
  message: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm leading-6",
        tone === "error" ? "text-[var(--danger-ink)]" : "text-[var(--fg-muted)]"
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function AgentBootstrapUnavailable({
  retrying,
  onRetry,
}: {
  retrying: boolean;
  onRetry: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid min-h-full place-items-center py-8">
      <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm leading-6">
        <div className="mb-3 flex items-start gap-2.5">
          <AlertCircle className="mt-1 h-4 w-4 shrink-0 text-[var(--danger-ink)]" />
          <div>
            <p className="font-semibold text-[var(--fg)]">
              {t("agent.bootstrap.unavailable")}
            </p>
            <p className="mt-1 text-[var(--fg-muted)]">
              {t("agent.error.bootstrap")}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={retrying}
          onClick={onRetry}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--fg)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
        >
          {retrying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          {t("agent.bootstrap.retry")}
        </button>
      </div>
    </div>
  );
}

function AgentMessageRecovery({
  message,
  disabled,
  visitorLoading,
  onRetry,
  onContinueAsVisitor,
}: {
  message: ChatMessage;
  disabled: boolean;
  visitorLoading: boolean;
  onRetry: (
    assistantMessageId: string,
    message: string,
    userMessageId: string
  ) => void;
  onContinueAsVisitor: (recoveryPrompt?: string) => void;
}) {
  const { t } = useLanguage();
  const state = message.state;
  if (!state) return null;

  const canRetry =
    Boolean(message.recoveryPrompt) &&
    Boolean(message.retryUserMessageId) &&
    (state === "cancelled" || state === "failed" || state === "timeout");
  const canUseVisitor =
    state === "quota_blocked" && message.quotaTier === "anonymous";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs leading-5 text-[var(--fg-muted)]">
      {message.recoveryMessage && (
        <p className="font-medium text-[var(--fg)]">
          {message.recoveryMessage}
        </p>
      )}
      <p className={message.recoveryMessage ? "mt-1" : ""}>
        {t(getRecoveryMessageKey(state))}
      </p>
      {(canRetry || canUseVisitor) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {canRetry && (
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onRetry(
                  message.id,
                  message.recoveryPrompt ?? "",
                  message.retryUserMessageId ?? ""
                )
              }
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-2.5 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("agent.input.retry")}
            </button>
          )}
          {canUseVisitor && (
            <button
              type="button"
              disabled={visitorLoading}
              onClick={() => onContinueAsVisitor(message.recoveryPrompt)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--fg)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
            >
              {visitorLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogIn className="h-3.5 w-3.5" />
              )}
              {t("agent.quota.continueAsVisitor")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getRecoveryMessageKey(state: ChatMessageState) {
  if (state === "cancelled") return "agent.recovery.cancelled";
  if (state === "timeout") return "agent.recovery.timeout";
  if (state === "quota_blocked") return "agent.recovery.quota";
  if (state === "no_source") return "agent.recovery.noSource";
  return "agent.recovery.failed";
}

function getQuotaBlockedNotice(tier: string, t: (key: string) => string) {
  return tier === "anonymous"
    ? t("agent.quota.blockedAnonymous")
    : t("agent.quota.blockedVisitor");
}

function getClientStreamFailure(
  error: unknown,
  t: (key: string) => string
): { content: string; state: ChatMessageState } {
  if (isTimeoutError(error)) {
    return { content: t("agent.error.timeout"), state: "timeout" };
  }
  if (isAbortError(error)) {
    return { content: t("agent.error.cancelled"), state: "cancelled" };
  }
  return { content: t("agent.error.send"), state: "failed" };
}

function getAgentFailureNotice(errorCode: string, t: (key: string) => string) {
  if (errorCode === "agent_stream_aborted") return t("agent.error.cancelled");
  if (errorCode === "agent_stream_timeout") return t("agent.error.timeout");
  return errorCode === "model_not_configured"
    ? t("agent.error.modelNotConfigured")
    : t("agent.error.send");
}

function getAgentFailureState(errorCode: string): ChatMessageState {
  if (errorCode === "agent_stream_aborted") return "cancelled";
  if (errorCode === "agent_stream_timeout") return "timeout";
  return "failed";
}

function getCompletedMessageState(response: {
  answer: { refusalReason?: string };
  sourceCards: SourceCard[];
}): ChatMessageState | undefined {
  if (
    response.sourceCards.length === 0 &&
    response.answer.refusalReason === "no_public_source"
  ) {
    return "no_source";
  }
  return undefined;
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

function resizeAgentTextarea(element: HTMLTextAreaElement | null): void {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 112)}px`;
}

function buildCompanionPrompts(
  routeContext: AgentRouteContext,
  t: (key: string, values?: Record<string, string | number>) => string,
  serverPrompts?: string[],
  postTitle?: string
) {
  const prompts = getCompanionPromptKeys(routeContext)
    .map(key => {
      if (key !== "agent.prompts.postCoreWithTitle") return t(key);
      if (postTitle) return t(key, { title: postTitle });
      return t("agent.prompts.postAbstraction");
    })
    .filter(prompt => prompt && !prompt.startsWith("agent.prompts."));
  if (prompts.length > 0) return prompts.slice(0, 3);
  return (serverPrompts ?? []).slice(0, 3);
}

function getDocumentTitleSuffix() {
  const [, suffix] = siteConfig.titleTemplate.split("%s");
  return suffix ?? ` · ${siteConfig.name}`;
}

function stripDocumentTitleSuffix(rawTitle: string) {
  const title = rawTitle.trim();
  const suffix = getDocumentTitleSuffix();
  if (suffix && title.endsWith(suffix)) {
    return title.slice(0, -suffix.length).trim();
  }
  return title;
}

export function isAgentNearBottom(
  element:
    | Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">
    | null
    | undefined,
  threshold = 96
) {
  if (!element) return true;
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
  );
}
