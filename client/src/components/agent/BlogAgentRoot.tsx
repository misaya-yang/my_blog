import {
  Suspense,
  lazy,
  useEffect,
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
  Check,
  ExternalLink,
  FileText,
  Grip,
  History,
  Loader2,
  LogIn,
  Move,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
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
  getCompanionWelcomeKeys,
  inferClientScope,
  type BlogAgentOpenDetail,
  type AgentScope,
  type AgentRouteContext,
} from "./routeContext";
import {
  formatSourceExcerpt,
  getSourceAnchorId,
  getSourceHref,
  normalizeSourceText,
} from "./sourceCardLinks";
import {
  markAssistantMessageRecoverable,
  toChatMessage,
  upsertTraceEntry,
} from "./messageState";
import {
  isAbortError,
  isTimeoutError,
  streamAgentMessage,
  type AgentAnswerMode,
} from "./streamClient";
import {
  AGENT_FRAME_PRESETS,
  AGENT_FRAME_STORAGE_KEY,
  clampAgentFrameState,
  getAgentFramePresetShortcut,
  getDefaultAgentFrameState,
  readStoredAgentFrameState,
  type AgentFramePreset,
  type AgentFrameState,
} from "./agentFrameState";
import {
  getAgentDisplayElapsedMs,
  getTraceStageDurations,
} from "./agentElapsed";
import {
  getHiddenSourceCount,
  getSourcePreviewTitle,
  getVisibleSourceCards,
} from "./agentSourceSummary";
import {
  getNextAgentStreamFollowState,
  shouldScrollAgentMessagesToEnd,
} from "./agentScrollPolicy";
import type {
  AgentTraceEntry,
  ChatMessage,
  ChatMessageState,
  ConversationItem,
  QuotaInfo,
  SourceCard,
} from "./types";

const AgentMarkdown = lazy(() =>
  import("./AgentMarkdown").then(module => ({ default: module.AgentMarkdown }))
);

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

type AgentFrameControls = {
  isFloating: boolean;
  dragHandleProps?: {
    title: string;
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  };
  activePreset?: AgentFramePreset;
  resizeHandle?: ReactNode;
  onApplyPreset: (preset: AgentFramePreset) => void;
  onReset: () => void;
};

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

export function AgentLauncher({
  buttonRef,
  open,
  lowQuota,
  label,
  tooltip,
  controls,
  onClick,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  lowQuota: boolean;
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
      className="agent-liquid-launcher fixed bottom-5 right-5 z-[60] inline-flex h-11 items-center gap-2.5 rounded-[0.82rem] border border-transparent px-3 text-sm font-semibold transition sm:bottom-6 sm:right-6 sm:px-4"
    >
      <span className="agent-launcher-orb grid h-8 w-8 place-items-center rounded-[0.62rem]">
        {open ? <X className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
      </span>
      <span className="hidden sm:inline">{label}</span>
      {lowQuota && (
        <span
          className="h-2 w-2 rounded-full bg-slate-400"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export function AgentFloatingFrame({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: (controls: AgentFrameControls) => ReactNode;
}) {
  const { t } = useLanguage();
  const [frame, setFrame] = useState<AgentFrameState>(() =>
    getDefaultAgentFrameState()
  );
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setFrameReady(false);
      return;
    }

    setFrame(readStoredAgentFrameState());
    setFrameReady(true);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !frameReady) return;
    window.localStorage.setItem(AGENT_FRAME_STORAGE_KEY, JSON.stringify(frame));
  }, [frame, frameReady, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    function handleResize() {
      setFrame(current => clampAgentFrameState(current));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="fixed inset-x-3 bottom-20 z-[59] h-[min(720px,calc(100dvh-6rem))]">
        {children({
          isFloating: false,
          onApplyPreset: () => {},
          onReset: () => {},
        })}
      </div>
    );
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    event.preventDefault();
    const startFrame = frame;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture?.(pointerId);

    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      setFrame(current =>
        clampAgentFrameState({
          ...current,
          x: startFrame.x + moveEvent.clientX - startX,
          y: startFrame.y + moveEvent.clientY - startY,
        })
      );
    }

    function cleanup() {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", cleanup, { once: true });
    window.addEventListener("pointercancel", cleanup, { once: true });
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const startFrame = frame;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture?.(pointerId);

    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      setFrame(current =>
        clampAgentFrameState({
          ...current,
          width: startFrame.width + moveEvent.clientX - startX,
          height: startFrame.height + moveEvent.clientY - startY,
          preset: undefined,
        })
      );
    }

    function cleanup() {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", cleanup, { once: true });
    window.addEventListener("pointercancel", cleanup, { once: true });
  }

  function applyPreset(preset: AgentFramePreset) {
    const size = AGENT_FRAME_PRESETS[preset];
    setFrame(current =>
      clampAgentFrameState({
        ...current,
        ...size,
        preset,
      })
    );
  }

  function resetFrame() {
    setFrame(getDefaultAgentFrameState());
  }

  return (
    <div
      className="agent-floating-frame fixed z-[59]"
      style={{
        width: frame.width,
        height: frame.height,
        transform: `translate3d(${frame.x}px, ${frame.y}px, 0)`,
      }}
    >
      {children({
        isFloating: true,
        dragHandleProps: {
          title: t("agent.frame.drag"),
          onPointerDown: startDrag,
        },
        activePreset: frame.preset,
        onApplyPreset: applyPreset,
        onReset: resetFrame,
        resizeHandle: (
          <button
            type="button"
            aria-label={t("agent.frame.resize")}
            title={t("agent.frame.resize")}
            onPointerDown={startResize}
            className="agent-frame-resize-handle"
          >
            <Grip className="h-3.5 w-3.5" />
          </button>
        ),
      })}
    </div>
  );
}

export function AgentPanel({
  isMobile,
  panelId,
  titleId,
  panelRef,
  draftInputRef,
  bootstrapping,
  bootstrapRetrying,
  bootstrapError,
  currentScope,
  draft,
  messages,
  notice,
  quota,
  contextDraft,
  contextOpen,
  attachedContextCount,
  attachingContext,
  historyOpen,
  conversations,
  historyLoading,
  conversationSwitching,
  activeConversationId,
  suggestedPrompts,
  welcomeTitle,
  welcomeBody,
  sending,
  visitorLoading,
  frameControls,
  onClose,
  onRetryBootstrap,
  onPanelKeyDown,
  onDraftChange,
  onContextDraftChange,
  onToggleContext,
  onAttachPastedContext,
  onPickContextFile,
  onToggleHistory,
  onLoadConversation,
  onPrompt,
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
  bootstrapping: boolean;
  bootstrapRetrying: boolean;
  bootstrapError: boolean;
  currentScope: AgentScope;
  draft: string;
  messages: ChatMessage[];
  notice: string | null;
  quota: {
    limit: number;
    used: number;
    remaining: number;
    tier: string;
  } | null;
  contextDraft: string;
  contextOpen: boolean;
  attachedContextCount: number;
  attachingContext: boolean;
  historyOpen: boolean;
  conversations: ConversationItem[];
  historyLoading: boolean;
  conversationSwitching: boolean;
  activeConversationId?: string;
  suggestedPrompts: string[];
  welcomeTitle: string;
  welcomeBody: string;
  sending: boolean;
  visitorLoading: boolean;
  frameControls: AgentFrameControls;
  onClose: () => void;
  onRetryBootstrap: () => void;
  onPanelKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  onDraftChange: (value: string) => void;
  onContextDraftChange: (value: string) => void;
  onToggleContext: () => void;
  onAttachPastedContext: () => void;
  onPickContextFile: () => void;
  onToggleHistory: () => void;
  onLoadConversation: (conversationId: string) => void;
  onPrompt: (message: string) => void;
  onSubmit: (message: string) => void;
  onCancel: () => void;
  onContinueAsVisitor: (recoveryPrompt?: string) => void;
  messageScrollerRef: RefObject<HTMLDivElement | null>;
  pendingAssistantFocusRef: MutableRefObject<string | null>;
}) {
  const { t } = useLanguage();
  const hasStreamingAssistant = messages.some(
    message => message.role === "assistant" && message.streaming
  );
  const inputDisabled =
    bootstrapping || bootstrapError || conversationSwitching;

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
      className="agent-liquid-panel flex h-full min-h-[420px] flex-col overflow-hidden rounded-md border text-slate-100"
    >
      <header className="agent-panel-header flex items-start justify-between gap-3 border-b border-slate-700/50 px-4 py-3.5">
        <div
          className={cn(
            "agent-drag-handle flex min-w-0 flex-1 items-start gap-3",
            frameControls.isFloating && "cursor-move select-none"
          )}
          {...frameControls.dragHandleProps}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-slate-600/45 bg-slate-900/70 text-slate-200">
            <BookOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold text-white">
              {t("agent.header.title")}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {t("agent.header.subtitle")}
            </p>
          </div>
          {frameControls.isFloating && (
            <span className="agent-drag-indicator ml-auto hidden shrink-0 items-center gap-1 text-[0.68rem] text-slate-500 sm:inline-flex">
              <Move className="h-3.5 w-3.5" />
              {t("agent.frame.drag")}
            </span>
          )}
        </div>
        <div className="agent-panel-actions flex shrink-0 items-center gap-1">
          {frameControls.isFloating && (
            <div className="agent-frame-controls hidden items-center gap-1 sm:flex">
              {(["compact", "comfortable", "wide"] as AgentFramePreset[]).map(
                preset => (
                  <button
                    key={preset}
                    type="button"
                    aria-label={t(`agent.frame.${preset}`)}
                    title={t(`agent.frame.${preset}`)}
                    onClick={() => frameControls.onApplyPreset(preset)}
                    className={cn(
                      "agent-frame-control",
                      frameControls.activePreset === preset &&
                        "agent-frame-control-active"
                    )}
                  >
                    {getAgentFramePresetShortcut(preset)}
                  </button>
                )
              )}
              <button
                type="button"
                aria-label={t("agent.frame.reset")}
                title={t("agent.frame.reset")}
                onClick={frameControls.onReset}
                className="agent-frame-control"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label={t("agent.header.close")}
            onClick={onClose}
            className="agent-close-button grid h-11 w-11 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white/5 hover:text-white sm:h-8 sm:w-8"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="agent-topbar border-b border-slate-800 px-4 py-2 text-xs text-slate-300">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-600/45 bg-slate-900/55 px-2.5 py-1 text-slate-300">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              {scopeLabel(currentScope, t)}
            </span>
            {quota && <AgentQuotaBadge quota={quota} />}
            <AgentTrustBoundary
              currentScope={currentScope}
              attachedContextCount={attachedContextCount}
            />
          </div>
          <button
            type="button"
            onClick={onToggleHistory}
            aria-expanded={historyOpen}
            className={cn(
              "agent-history-button inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition sm:min-h-0 sm:px-2.5 sm:py-1.5",
              historyOpen
                ? "border-slate-500 bg-slate-900 text-slate-100"
                : "border-slate-700 bg-white/[0.025] text-slate-300 hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100"
            )}
          >
            <History className="h-3.5 w-3.5" />
            {t("agent.history.button")}
          </button>
        </div>
        {quota && shouldShowQuotaCallout(quota) && (
          <AgentQuotaCallout quota={quota} />
        )}
      </div>

      {historyOpen && (
        <AgentHistoryPanel
          conversations={conversations}
          loading={historyLoading}
          activeConversationId={activeConversationId}
          onLoadConversation={onLoadConversation}
        />
      )}

      <div
        ref={messageScrollerRef}
        className="agent-message-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4"
      >
        {bootstrapping && (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-slate-400" />
            {t("agent.header.subtitle")}
          </div>
        )}

        {!bootstrapping && bootstrapError && (
          <AgentBootstrapUnavailable
            retrying={bootstrapRetrying}
            onRetry={onRetryBootstrap}
          />
        )}

        {!bootstrapping && !bootstrapError && messages.length === 0 && (
          <div className="flex min-h-full flex-col justify-start gap-4 py-2">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-md border border-slate-700 bg-slate-950/55 text-slate-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {welcomeTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {welcomeBody}
              </p>
            </div>
            <div className="grid gap-2">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sending || inputDisabled}
                  onClick={() => onPrompt(prompt)}
                  className="min-h-11 rounded-md border border-slate-700 bg-slate-950/45 px-3 py-2 text-left text-sm font-medium leading-6 text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map(message => (
              <article
                key={message.id}
                ref={node => {
                  if (node && message.id === pendingAssistantFocusRef.current) {
                    pendingAssistantFocusRef.current = null;
                    window.requestAnimationFrame(() => {
                      node.scrollIntoView({ block: "start" });
                    });
                  }
                }}
                className={cn(
                  "agent-message-row flex min-w-0 gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-700 bg-slate-950/55 text-slate-300">
                    <BookOpen className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={cn(
                    "agent-message-bubble max-w-[86%] rounded-md px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "border border-slate-600/50 bg-slate-100/10 text-slate-100"
                      : "border border-slate-700/70 bg-slate-950/35 text-slate-200"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-li:my-1">
                      <AgentReasoningTrace message={message} />
                      <Suspense
                        fallback={
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                        }
                      >
                        {message.content ? (
                          <AgentMarkdown>{message.content}</AgentMarkdown>
                        ) : (
                          <p className="text-slate-500">
                            {t("agent.trace.waiting")}
                          </p>
                        )}
                      </Suspense>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  {message.sourceCards && message.sourceCards.length > 0 && (
                    <AgentSourceCards sources={message.sourceCards} />
                  )}
                  {message.role === "assistant" &&
                    message.relatedQuestions &&
                    message.relatedQuestions.length > 0 && (
                      <AgentRelatedQuestions
                        questions={message.relatedQuestions}
                        disabled={sending}
                        onPrompt={onPrompt}
                      />
                    )}
                  {message.role === "assistant" && message.state && (
                    <AgentMessageRecovery
                      message={message}
                      disabled={sending || inputDisabled}
                      visitorLoading={visitorLoading}
                      onRetry={onPrompt}
                      onContinueAsVisitor={onContinueAsVisitor}
                    />
                  )}
                </div>
              </article>
            ))}
            {sending && !hasStreamingAssistant && (
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="grid h-8 w-8 place-items-center rounded-md border border-slate-700 bg-slate-950/55 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                {t("agent.header.subtitle")}
              </div>
            )}
          </div>
        )}
      </div>

      {notice && (
        <div className="px-4 pb-3">
          <AgentNotice tone="warning" message={notice} />
        </div>
      )}

      <AgentContextDock
        open={contextOpen}
        value={contextDraft}
        count={attachedContextCount}
        attaching={attachingContext}
        disabled={inputDisabled}
        onChange={onContextDraftChange}
        onToggle={onToggleContext}
        onAttach={onAttachPastedContext}
        onPickFile={onPickContextFile}
      />

      <form onSubmit={submit} className="border-t border-slate-800 p-3">
        <div className="flex items-end gap-2 rounded-md border border-slate-700 bg-slate-950/45 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <Button
            type="button"
            size="icon"
            onClick={onToggleContext}
            disabled={inputDisabled}
            aria-label={t("agent.context.toggle")}
            className={cn(
              "h-11 w-11 shrink-0 rounded-md border border-slate-700 bg-white/[0.025] text-slate-400 hover:bg-slate-900 hover:text-slate-100 sm:h-10 sm:w-10",
              contextOpen && "border-slate-500 bg-slate-900 text-slate-100"
            )}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            ref={draftInputRef}
            value={draft}
            disabled={inputDisabled}
            onChange={event => onDraftChange(event.target.value)}
            onKeyDown={event => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                onSubmit(draft);
              }
            }}
            placeholder={t("agent.input.placeholder")}
            rows={1}
            className="max-h-28 min-h-11 resize-none border-0 bg-transparent text-sm text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0 sm:min-h-10"
          />
          <Button
            type={sending ? "button" : "submit"}
            size="icon"
            onClick={sending ? onCancel : undefined}
            disabled={(!draft.trim() && !sending) || inputDisabled}
            aria-label={
              sending ? t("agent.input.cancel") : t("agent.input.send")
            }
            className={cn(
              "h-11 w-11 shrink-0 rounded-md text-white sm:h-10 sm:w-10",
              sending
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-slate-100 text-slate-950 hover:bg-white"
            )}
          >
            {sending ? <X className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
      {frameControls.resizeHandle}
    </section>
  );
}

function AgentContextDock({
  open,
  value,
  count,
  attaching,
  disabled,
  onChange,
  onToggle,
  onAttach,
  onPickFile,
}: {
  open: boolean;
  value: string;
  count: number;
  attaching: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  onAttach: () => void;
  onPickFile: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="border-t border-slate-800 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-slate-400 transition hover:text-slate-100 sm:min-h-0 sm:px-1.5 sm:py-1"
        >
          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{t("agent.context.title")}</span>
          {count > 0 && (
            <span className="rounded-full border border-slate-600/50 bg-slate-900 px-1.5 text-[0.68rem] text-slate-300">
              {t("agent.context.count", { count })}
            </span>
          )}
        </button>
        {count > 0 && (
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-slate-400">
            <Check className="h-3.5 w-3.5" />
            {t("agent.context.active")}
          </span>
        )}
      </div>

      {open && (
        <div className="mt-2 rounded-md border border-slate-700 bg-slate-950/45 p-2">
          <p className="mb-2 text-xs leading-5 text-slate-400">
            {t("agent.context.supported")}
          </p>
          <Textarea
            value={value}
            onChange={event => onChange(event.target.value)}
            disabled={disabled}
            placeholder={t("agent.context.placeholder")}
            rows={3}
            className="max-h-28 min-h-20 resize-none border-0 bg-transparent text-xs leading-5 text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPickFile}
              disabled={attaching || disabled}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-700 bg-white/[0.025] px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100 disabled:opacity-50 sm:min-h-0 sm:px-2.5 sm:py-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("agent.context.file")}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={!value.trim() || attaching || disabled}
              onClick={onAttach}
              className="h-11 rounded-md bg-slate-100 px-3 text-xs text-slate-950 hover:bg-white sm:h-8"
            >
              {attaching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                t("agent.context.attach")
              )}
            </Button>
          </div>
          <p className="mt-2 text-[0.7rem] leading-5 text-slate-500">
            {count > 0
              ? t("agent.context.lifecycle")
              : t("agent.context.limit")}
          </p>
        </div>
      )}
    </div>
  );
}

function AgentTrustBoundary({
  currentScope,
  attachedContextCount,
}: {
  currentScope: AgentScope;
  attachedContextCount: number;
}) {
  const { t } = useLanguage();
  const contextKey =
    attachedContextCount > 0
      ? "agent.trust.contextAttached"
      : "agent.trust.contextPrivate";
  const hasAttachedContext = attachedContextCount > 0;

  return (
    <details
      open={hasAttachedContext}
      className={cn(
        "agent-trust-boundary min-w-0 rounded-md border px-2.5 py-1",
        hasAttachedContext && "agent-trust-boundary-attached"
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-slate-300">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {t("agent.trust.publicScope", {
            scope: scopeLabel(currentScope, t),
          })}
        </span>
      </summary>
      <p className="mt-1 pl-5 text-xs leading-5 text-slate-500">
        {t(contextKey)}
      </p>
    </details>
  );
}

export function AgentSourceCards({ sources }: { sources: SourceCard[] }) {
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const currentPath = normalizePathWithoutHash(location);
  const visibleSources = getVisibleSourceCards(sources, expanded);
  const previewSources = getVisibleSourceCards(sources, false);
  const hiddenSourceCount = getHiddenSourceCount(sources);

  return (
    <div className="agent-sources mt-3 border-t border-slate-800/80 pt-3">
      <div className="agent-source-summary flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 font-semibold text-slate-500">
            {t("agent.sources.summary", { count: sources.length })}
          </span>
          <div className="agent-source-chips flex min-w-0 flex-1 items-center gap-1.5">
            {previewSources.map(source => (
              <AgentSourcePreviewChip key={source.sourceId} source={source} />
            ))}
            {hiddenSourceCount > 0 && (
              <span className="agent-source-chip shrink-0 rounded-md border border-slate-700 bg-slate-950/35 px-2 py-0.5 text-[0.68rem] font-medium text-slate-500">
                {t("agent.sources.previewMore", {
                  count: hiddenSourceCount,
                })}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
          className="agent-source-toggle inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100"
        >
          {expanded ? t("agent.sources.hide") : t("agent.sources.view")}
        </button>
      </div>
      {expanded && (
        <div className="agent-source-list mt-2 grid gap-2 overflow-y-auto pr-1">
          {visibleSources.map(source => {
            const title = source.postTitle || t("agent.sources.site");
            const hasBlogLink =
              source.sourceType !== "user_context" && Boolean(source.postSlug);
            const currentPageSource =
              isCurrentPathSource(source, currentPath) ||
              isCurrentPageSource(source);
            const section =
              source.sectionTitle ?? getSourceSectionLabel(source, t);
            const excerpt = formatSourceExcerpt(source);
            const relevanceReason = getDisplayRelevanceReason(source, t);
            const href = hasBlogLink ? getSourceHref(source) : undefined;

            return (
              <div
                key={source.sourceId}
                className="agent-source-card rounded-md border border-slate-700/80 bg-slate-950/30 px-2.5 py-2"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="agent-source-icon mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border"
                    aria-hidden="true"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">
                          {section}
                        </div>
                        {source.postTitle && section !== title && (
                          <div className="mt-0.5 truncate text-[0.72rem] text-slate-500">
                            {title}
                          </div>
                        )}
                      </div>
                      <div className="inline-flex shrink-0 items-center gap-1">
                        <span className="rounded border border-slate-700 bg-white/[0.025] px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-400">
                          {source.sourceType === "user_context"
                            ? t("agent.sources.context")
                            : t("agent.sources.blog")}
                        </span>
                        {currentPageSource && (
                          <span className="rounded border border-slate-600/50 bg-slate-900 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-300">
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
                              handleSourceLinkClick(
                                event,
                                source,
                                href,
                                navigate
                              );
                            }}
                            className="agent-source-open grid h-7 w-7 place-items-center rounded-md border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-slate-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                    {(excerpt || relevanceReason) && (
                      <details className="agent-source-detail mt-1">
                        <summary className="cursor-pointer list-none text-[0.7rem] font-medium text-slate-500">
                          {t("agent.sources.details")}
                        </summary>
                        {excerpt && (
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {excerpt}
                          </p>
                        )}
                        {relevanceReason && (
                          <p className="mt-1 text-[0.7rem] leading-5 text-slate-500">
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
  const title = getSourcePreviewTitle(source, t("agent.sources.site"));

  return (
    <span
      className="agent-source-chip truncate rounded-md border border-slate-700 bg-slate-950/35 px-2 py-0.5 text-[0.68rem] font-medium text-slate-400"
      title={title}
    >
      {title}
    </span>
  );
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
    scrollToSource(source, href);
    return;
  }

  navigate(href);
}

function scrollToSource(source: SourceCard, href: string) {
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
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.focus?.({ preventScroll: true });
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
  return document.getElementById(decodeURIComponent(hash));
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

function AgentReasoningTrace({ message }: { message: ChatMessage }) {
  const { t } = useLanguage();
  if (message.role !== "assistant") return null;

  const traceEntries = message.traceEntries ?? [];
  const hasTrace = message.streaming || traceEntries.length > 0;
  if (!hasTrace) return null;

  const elapsedMs = getAgentDisplayElapsedMs(message);
  const stageDurations = getTraceStageDurations(traceEntries);
  const summaryKey = message.streaming
    ? "agent.trace.thinking"
    : "agent.trace.done";

  return (
    <details
      open={message.streaming}
      className="not-prose mb-3 rounded-md border border-slate-700 bg-slate-950/45"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-slate-300">
        <span>
          {t(summaryKey)}
          {elapsedMs > 0 && (
            <span className="ml-1 text-slate-500">
              {t("agent.trace.elapsed", {
                seconds: formatElapsedSeconds(elapsedMs),
              })}
            </span>
          )}
        </span>
        {message.streaming && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
        )}
      </summary>
      <div className="border-t border-slate-800 px-3 py-2">
        {traceEntries.length > 0 && (
          <ol className="grid gap-1.5 text-xs leading-5 text-slate-400">
            {stageDurations.map(entry => (
              <li
                key={entry.stage}
                className="flex items-center justify-between gap-3"
              >
                <span>{traceStageLabel(entry, t)}</span>
                <span className="shrink-0 text-slate-600">
                  {formatElapsedSeconds(entry.durationMs)}s
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

function traceStageLabel(
  entry: AgentTraceEntry,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  if (entry.stage === "sources") {
    return t("agent.trace.stage.sources", {
      count: entry.sourceCount ?? 0,
      current:
        entry.currentPageContextInjected === true
          ? t("agent.trace.currentPage")
          : "",
    });
  }
  return t(`agent.trace.stage.${entry.stage}`);
}

function formatElapsedSeconds(elapsedMs: number) {
  return (elapsedMs / 1000).toFixed(elapsedMs < 10_000 ? 1 : 0);
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
    <div className="mt-3 border-t border-slate-800 pt-3">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase text-slate-500">
        {t("agent.related.title")}
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.slice(0, 3).map(question => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onPrompt(question)}
            className="rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-left text-xs leading-5 text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 disabled:opacity-60"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

function isCurrentPageSource(source: SourceCard) {
  if (source.isCurrentPage) return true;
  return source.relevanceReason
    .toLowerCase()
    .startsWith("current public article context");
}

function getDisplayRelevanceReason(
  source: SourceCard,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  if (!isCurrentPageSource(source)) return source.relevanceReason;
  const stripped = source.relevanceReason
    .replace(/^Current public article context\.?\s*/i, "")
    .trim();
  return stripped || t("agent.sources.currentPage");
}

function AgentHistoryPanel({
  conversations,
  loading,
  activeConversationId,
  onLoadConversation,
}: {
  conversations: ConversationItem[];
  loading: boolean;
  activeConversationId?: string;
  onLoadConversation: (conversationId: string) => void;
}) {
  const { t } = useLanguage();
  const visible = conversations.slice(0, 8);

  return (
    <div className="border-b border-slate-800 bg-slate-950/55 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>{t("agent.history.title")}</span>
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        )}
      </div>
      {visible.length > 0 ? (
        <div className="grid max-h-48 gap-2 overflow-y-auto pr-1">
          {visible.map(conversation => {
            const active = conversation.id === activeConversationId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onLoadConversation(conversation.id)}
                className={cn(
                  "grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-left text-xs leading-5 transition",
                  active
                    ? "border-slate-500 bg-slate-900 text-slate-100"
                    : "border-slate-700 bg-white/[0.025] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {conversation.title || t("agent.history.continue")}
                  </span>
                  <span className="block truncate text-slate-500">
                    {conversation.scopeValue || conversation.scopeType}
                    {conversation.ownerType
                      ? ` · ${getConversationOwnerLabel(conversation.ownerType, t)}`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[0.68rem] leading-4 text-slate-500">
                  {formatConversationTime(
                    conversation.lastMessageAt ?? conversation.updatedAt,
                    t
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-slate-600">{t("agent.history.empty")}</div>
      )}
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

function getConversationOwnerLabel(
  ownerType: ConversationItem["ownerType"],
  t: (key: string) => string
) {
  if (ownerType === "admin") return t("agent.history.owner.admin");
  if (ownerType === "visitor") return t("agent.history.owner.visitor");
  return t("agent.history.owner.anonymous");
}

function AgentQuotaBadge({
  quota,
}: {
  quota: { limit: number; remaining: number; tier?: string };
}) {
  const { t } = useLanguage();
  const key =
    quota.remaining <= 1 ? "agent.quota.low" : "agent.quota.remaining";

  return (
    <span
      className="agent-quota-badge inline-flex items-center gap-1.5 rounded-md border border-slate-500/25 bg-white/[0.03] px-2.5 py-1 text-slate-300"
      title={quota.tier ? `${quota.tier} quota` : undefined}
    >
      <LogIn className="h-3.5 w-3.5 text-slate-400" />
      {t(key, { remaining: quota.remaining, limit: quota.limit })}
    </span>
  );
}

function AgentQuotaCallout({
  quota,
}: {
  quota: { remaining: number; tier: string };
}) {
  const { t } = useLanguage();
  const message =
    quota.tier === "admin"
      ? t("agent.quota.adminDetail")
      : t("agent.quota.lowDetail");

  return (
    <div className="mt-2 rounded-md border border-slate-700 bg-slate-950/45 px-3 py-2 text-xs leading-5 text-slate-300">
      {message}
    </div>
  );
}

function shouldShowQuotaCallout(quota: { remaining: number; tier: string }) {
  return quota.remaining <= 1 || quota.tier === "admin";
}

export function isBlogAgentHiddenRoute(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return /^\/(write|manage|login)(\/|$)/.test(pathname);
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
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-6",
        tone === "error"
          ? "border-red-300/25 bg-red-950/30 text-red-100"
          : "border-slate-700 bg-slate-950/45 text-slate-300"
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
      <div className="w-full rounded-md border border-red-300/25 bg-red-950/20 p-4 text-sm leading-6 text-red-100">
        <div className="mb-3 flex items-start gap-2.5">
          <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{t("agent.bootstrap.unavailable")}</p>
            <p className="mt-1 text-red-100/75">{t("agent.error.bootstrap")}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={retrying}
          onClick={onRetry}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200/25 bg-red-100/10 px-3 py-2 text-xs font-semibold text-red-50 transition hover:bg-red-100/15 disabled:opacity-60"
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
  onRetry: (message: string) => void;
  onContinueAsVisitor: (recoveryPrompt?: string) => void;
}) {
  const { t } = useLanguage();
  const state = message.state;
  if (!state) return null;

  const canRetry =
    Boolean(message.recoveryPrompt) &&
    (state === "cancelled" || state === "failed" || state === "timeout");
  const canUseVisitor =
    state === "quota_blocked" && message.quotaTier === "anonymous";

  return (
    <div className="not-prose mt-3 rounded-md border border-slate-700 bg-slate-950/45 px-3 py-2 text-xs leading-5 text-slate-300">
      {message.recoveryMessage && (
        <p className="font-medium text-slate-200">{message.recoveryMessage}</p>
      )}
      <p className={message.recoveryMessage ? "mt-1 text-slate-400" : ""}>
        {t(getRecoveryMessageKey(state))}
      </p>
      {(canRetry || canUseVisitor) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {canRetry && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRetry(message.recoveryPrompt ?? "")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-600 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-white disabled:opacity-60"
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
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-600 bg-white/[0.025] px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-900 disabled:opacity-60"
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

function scopeLabel(scope: AgentScope, t: (key: string) => string) {
  return t(`agent.scope.${scope.type}`);
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
