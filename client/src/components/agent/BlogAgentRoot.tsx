import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
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
  History,
  Loader2,
  LogIn,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { toChatMessage, upsertTraceEntry } from "./messageState";
import { isAbortError, streamAgentMessage } from "./streamClient";
import type {
  AgentTraceEntry,
  ChatMessage,
  ConversationItem,
  QuotaInfo,
  SourceCard,
} from "./types";

const AgentMarkdown = lazy(() =>
  import("./AgentMarkdown").then(module => ({ default: module.AgentMarkdown }))
);

export function BlogAgentRoot() {
  const [location] = useLocation();
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const routeContext = useMemo(
    () => buildRouteContext(location, language),
    [location, language]
  );
  const hiddenOnRoute = /^\/(write|manage|login)(\/|$)/.test(location);
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
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const utils = trpc.useUtils();

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

  useEffect(() => {
    if (bootstrap.data?.quota) setQuota(bootstrap.data.quota);
  }, [bootstrap.data?.quota]);

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
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sendMessage.isPending, streaming, notice]);

  useEffect(() => {
    function handleExternalOpen(event: Event) {
      const detail = (event as CustomEvent<BlogAgentOpenDetail>).detail;
      setOpen(true);
      setNotice(null);
      if (detail?.prompt) setDraft(detail.prompt);
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

  async function handleSubmit(message: string) {
    const trimmed = message.trim();
    if (!trimmed || sendMessage.isPending || streaming) return;

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
      reasoningMarkdown: "",
      traceEntries: [],
      streaming: true,
    };
    setNotice(null);
    setDraft("");
    setStreaming(true);
    setMessages(current => [...current, userMessage, assistantDraft]);
    const controller = new AbortController();
    streamAbortRef.current = controller;

    try {
      await streamAgentMessage({
        conversationId,
        message: trimmed,
        routeContext,
        signal: controller.signal,
        onStatus: event => {
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
        onReasoningDelta: delta => {
          setMessages(current =>
            current.map(item =>
              item.id === assistantMessageId
                ? {
                    ...item,
                    reasoningMarkdown: `${item.reasoningMarkdown ?? ""}${delta}`,
                  }
                : item
            )
          );
        },
        onAnswerDelta: delta => {
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

          if (response.status === "blocked") {
            setMessages(current =>
              current.filter(
                item =>
                  item.id !== userMessage.id && item.id !== assistantMessageId
              )
            );
            setDraft(trimmed);
            setNotice(getQuotaBlockedNotice(response.quota.tier, t));
            return;
          }

          if (response.status === "failed") {
            const failureNotice = getAgentFailureNotice(response.errorCode, t);
            setDraft(trimmed);
            setNotice(failureNotice);
            setMessages(current =>
              current.map(item =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      id: response.messageId,
                      content: failureNotice,
                      streaming: false,
                    }
                  : item
              )
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
                    reasoningMarkdown:
                      event.reasoningMarkdown ?? item.reasoningMarkdown,
                    streaming: false,
                  }
                : item
            )
          );
        },
      });
    } catch (error) {
      setMessages(current =>
        current.filter(
          item => item.id !== userMessage.id && item.id !== assistantMessageId
        )
      );
      setDraft(trimmed);
      setNotice(
        isAbortError(error) ? t("agent.error.cancelled") : t("agent.error.send")
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
        open={open}
        lowQuota={lowQuota}
        label={t("agent.launcher.label")}
        tooltip={t("agent.launcher.tooltip")}
        onClick={() => setOpen(value => !value)}
      />

      {open && (
        <AgentMobileSheet isMobile={isMobile}>
          <AgentPanel
            bootstrapping={bootstrap.isLoading}
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
            activeConversationId={conversationId}
            suggestedPrompts={suggestedPrompts}
            welcomeTitle={welcomeCopy.title}
            welcomeBody={welcomeCopy.body}
            sending={sendMessage.isPending || streaming}
            onClose={() => setOpen(false)}
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
            messageEndRef={messageEndRef}
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
        </AgentMobileSheet>
      )}
    </>
  );
}

export function AgentLauncher({
  open,
  lowQuota,
  label,
  tooltip,
  onClick,
}: {
  open: boolean;
  lowQuota: boolean;
  label: string;
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={label}
      title={tooltip}
      onClick={onClick}
      className="agent-liquid-launcher fixed bottom-5 right-5 z-[60] inline-flex h-11 items-center gap-2.5 rounded-full border px-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400/35 sm:bottom-6 sm:right-6 sm:px-4"
    >
      <span className="agent-launcher-orb grid h-8 w-8 place-items-center rounded-full text-slate-200">
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

export function AgentMobileSheet({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed z-[59]",
        isMobile
          ? "inset-x-3 bottom-20 h-[min(720px,calc(100dvh-6rem))]"
          : "bottom-24 right-6 h-[min(640px,calc(100vh-8rem))] w-[min(480px,calc(100vw-2rem))]"
      )}
    >
      {children}
    </div>
  );
}

export function AgentPanel({
  bootstrapping,
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
  activeConversationId,
  suggestedPrompts,
  welcomeTitle,
  welcomeBody,
  sending,
  onClose,
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
  messageEndRef,
}: {
  bootstrapping: boolean;
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
  activeConversationId?: string;
  suggestedPrompts: string[];
  welcomeTitle: string;
  welcomeBody: string;
  sending: boolean;
  onClose: () => void;
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
  messageEndRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useLanguage();
  const hasStreamingAssistant = messages.some(
    message => message.role === "assistant" && message.streaming
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(draft);
  }

  return (
    <section className="agent-liquid-panel flex h-full min-h-[420px] flex-col overflow-hidden rounded-md border text-slate-100">
      <header className="flex items-start justify-between gap-4 border-b border-slate-700/50 px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-slate-600/45 bg-slate-900/70 text-slate-200">
            <BookOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">
              {t("agent.header.title")}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {t("agent.header.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("agent.header.close")}
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-600/45 bg-slate-900/55 px-2.5 py-1 text-slate-300">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              {scopeLabel(currentScope, t)}
            </span>
            {quota && <AgentQuotaBadge quota={quota} />}
            {currentScope.type === "post" && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-600/45 bg-slate-900/55 px-2.5 py-1 text-slate-300">
                <Check className="h-3.5 w-3.5" />
                {t("agent.scope.postContextReady")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleHistory}
            aria-expanded={historyOpen}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
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

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {bootstrapping && (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-slate-400" />
            {t("agent.header.subtitle")}
          </div>
        )}

        {bootstrapError && (
          <AgentNotice tone="error" message={t("agent.error.bootstrap")} />
        )}

        {!bootstrapping && messages.length === 0 && (
          <div className="flex min-h-full flex-col justify-center gap-5 py-4">
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
                  disabled={sending}
                  onClick={() => onPrompt(prompt)}
                  className="rounded-md border border-slate-700 bg-slate-950/45 px-3 py-2 text-left text-sm font-medium leading-6 text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 disabled:opacity-60"
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
                className={cn(
                  "flex gap-3",
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
                    "max-w-[86%] rounded-md px-3.5 py-2.5 text-sm leading-6",
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
            <div ref={messageEndRef} />
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
            aria-label={t("agent.context.toggle")}
            className={cn(
              "h-10 w-10 shrink-0 rounded-md border border-slate-700 bg-white/[0.025] text-slate-400 hover:bg-slate-900 hover:text-slate-100",
              contextOpen && "border-slate-500 bg-slate-900 text-slate-100"
            )}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={draft}
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
            className="max-h-28 min-h-10 resize-none border-0 bg-transparent text-sm text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0"
          />
          <Button
            type={sending ? "button" : "submit"}
            size="icon"
            onClick={sending ? onCancel : undefined}
            disabled={(!draft.trim() && !sending) || bootstrapping}
            aria-label={
              sending ? t("agent.input.cancel") : t("agent.input.send")
            }
            className={cn(
              "h-10 w-10 shrink-0 rounded-md text-white",
              sending
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-slate-100 text-slate-950 hover:bg-white"
            )}
          >
            {sending ? <X className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </section>
  );
}

function AgentContextDock({
  open,
  value,
  count,
  attaching,
  onChange,
  onToggle,
  onAttach,
  onPickFile,
}: {
  open: boolean;
  value: string;
  count: number;
  attaching: boolean;
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
          className="inline-flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-xs font-medium text-slate-400 transition hover:text-slate-100"
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
            placeholder={t("agent.context.placeholder")}
            rows={3}
            className="max-h-28 min-h-20 resize-none border-0 bg-transparent text-xs leading-5 text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPickFile}
              disabled={attaching}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100 disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("agent.context.file")}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={!value.trim() || attaching}
              onClick={onAttach}
              className="h-8 rounded-md bg-slate-100 px-3 text-xs text-slate-950 hover:bg-white"
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

export function AgentSourceCards({ sources }: { sources: SourceCard[] }) {
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const currentPath = normalizePathWithoutHash(location);

  return (
    <div className="mt-3 border-t border-slate-800/80 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <span>{t("agent.sources.title")}</span>
        <span className="normal-case tracking-normal text-slate-600">
          {t("agent.sources.count", {
            count: Math.min(sources.length, 3),
          })}
        </span>
      </div>
      <div className="grid gap-2">
        {sources.slice(0, 3).map(source => {
          const title = source.postTitle || t("agent.sources.site");
          const hasBlogLink =
            source.sourceType !== "user_context" && Boolean(source.postSlug);
          const currentPageSource =
            isCurrentPathSource(source, currentPath) ||
            isCurrentPageSource(source);
          const section = getSourceSectionLabel(source, t);
          const excerpt = formatSourceExcerpt(source);
          const href = hasBlogLink ? getSourceHref(source) : undefined;
          const card = (
            <span className="block rounded-md border border-slate-700/80 bg-slate-950/30 px-2.5 py-2 transition hover:border-slate-500 hover:bg-slate-900/55">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-100">
                    {section}
                  </span>
                  {source.postTitle && section !== title && (
                    <span className="mt-0.5 block truncate text-[0.72rem] text-slate-500">
                      {title}
                    </span>
                  )}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1">
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
                  {hasBlogLink && (
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  )}
                </span>
              </span>
              {excerpt && (
                <span className="mt-1 block line-clamp-1 text-xs leading-5 text-slate-500">
                  {excerpt}
                </span>
              )}
            </span>
          );

          return hasBlogLink ? (
            <a
              key={source.sourceId}
              href={href}
              aria-label={`${t("agent.sources.open")}: ${title}`}
              title={`${title}${source.heading ? ` · ${source.heading}` : ""}`}
              onClick={event => {
                if (href) handleSourceLinkClick(event, source, href, navigate);
              }}
            >
              {card}
            </a>
          ) : (
            <div key={source.sourceId}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

export function getSourceHref(source: SourceCard) {
  if (!source.postSlug) return "#";
  const anchorId = getSourceFallbackAnchorId(source);
  return anchorId
    ? `/post/${source.postSlug}#${anchorId}`
    : `/post/${source.postSlug}`;
}

export function getSourceFallbackAnchorId(source: SourceCard) {
  const chunkIndex = parseSourceChunkIndex(source.sourceId);
  if (chunkIndex === null) return null;
  return `heading-${Math.max(0, chunkIndex - 2)}`;
}

export function formatSourceExcerpt(source: SourceCard) {
  const heading = source.heading ? normalizeSourceText(source.heading) : "";
  let excerpt = source.excerpt
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/#{1,6}\s+/g, " ")
    .replace(/[*_>]+/g, " ")
    .replace(/\$\$/g, "$")
    .replace(/\s+/g, " ")
    .trim();

  if (heading) {
    const normalizedExcerpt = normalizeSourceText(excerpt);
    if (normalizedExcerpt.startsWith(heading)) {
      excerpt = excerpt.slice(source.heading?.length ?? 0).trim();
    }
  }

  return excerpt.length > 150 ? `${excerpt.slice(0, 147).trim()}...` : excerpt;
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
      ".article-prose h1[id], .article-prose h2[id], .article-prose h3[id]"
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

  const fallbackId = getSourceFallbackAnchorId(source);
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

function parseSourceChunkIndex(sourceId: string) {
  const match = /(?::|^)(\d+)$/.exec(sourceId);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function normalizeSourceText(value: string) {
  return value
    .replace(/[#*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function AgentReasoningTrace({ message }: { message: ChatMessage }) {
  const { t } = useLanguage();
  if (message.role !== "assistant") return null;

  const traceEntries = message.traceEntries ?? [];
  const reasoningMarkdown = message.reasoningMarkdown?.trim();
  const hasTrace =
    message.streaming || traceEntries.length > 0 || Boolean(reasoningMarkdown);
  if (!hasTrace) return null;

  const elapsedMs = Math.max(0, ...traceEntries.map(entry => entry.elapsedMs));
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
            {traceEntries.map(entry => (
              <li
                key={entry.stage}
                className="flex items-center justify-between gap-3"
              >
                <span>{traceStageLabel(entry, t)}</span>
                <span className="shrink-0 text-slate-600">
                  {formatElapsedSeconds(entry.elapsedMs)}s
                </span>
              </li>
            ))}
          </ol>
        )}

        {reasoningMarkdown && (
          <div className="mt-2 rounded-md border border-slate-700/60 bg-black/20 px-3 py-2">
            <div className="mb-1 text-[0.68rem] font-semibold uppercase text-slate-500">
              {t("agent.trace.reasoning")}
            </div>
            <div className="prose prose-xs prose-invert max-h-44 max-w-none overflow-y-auto text-xs leading-5 prose-p:my-1.5 prose-li:my-1">
              <Suspense
                fallback={
                  <p className="whitespace-pre-wrap">{reasoningMarkdown}</p>
                }
              >
                <AgentMarkdown>{reasoningMarkdown}</AgentMarkdown>
              </Suspense>
            </div>
          </div>
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
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-500/25 bg-white/[0.03] px-2.5 py-1 text-slate-300"
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

function scopeLabel(scope: AgentScope, t: (key: string) => string) {
  return t(`agent.scope.${scope.type}`);
}

function getQuotaBlockedNotice(tier: string, t: (key: string) => string) {
  return tier === "anonymous"
    ? t("agent.quota.blockedAnonymous")
    : t("agent.quota.blockedVisitor");
}

function getAgentFailureNotice(errorCode: string, t: (key: string) => string) {
  return errorCode === "model_not_configured"
    ? t("agent.error.modelNotConfigured")
    : t("agent.error.send");
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

function buildCompanionPrompts(
  routeContext: AgentRouteContext,
  t: (key: string, values?: Record<string, string | number>) => string,
  serverPrompts?: string[]
) {
  const prompts = getCompanionPromptKeys(routeContext)
    .map(key => t(key))
    .filter(prompt => prompt && !prompt.startsWith("agent.prompts."));
  if (prompts.length > 0) return prompts;
  if (serverPrompts && serverPrompts.length > 0) return serverPrompts;
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
