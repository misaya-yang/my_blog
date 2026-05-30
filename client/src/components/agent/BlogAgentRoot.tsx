import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  Bot,
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
  Sparkles,
  X,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { buildRouteContext, inferClientScope, type AgentScope } from "./routeContext";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceCards?: SourceCard[];
};

type SourceCard = {
  sourceId: string;
  sourceType?: "blog" | "user_context";
  postTitle: string;
  postSlug: string;
  categorySlug?: string;
  tagSlugs: string[];
  heading?: string;
  excerpt: string;
  relevanceReason: string;
};

type ConversationItem = {
  id: string;
  title: string | null;
  scopeType: string;
  scopeValue: string | null;
  updatedAt?: Date | string;
  lastMessageAt?: Date | string | null;
};

export function BlogAgentRoot() {
  const [location] = useLocation();
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const routeContext = useMemo(() => buildRouteContext(location, language), [location, language]);
  const hiddenOnRoute = /^\/(write|manage|login)(\/|$)/.test(location);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [contextDraft, setContextDraft] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [attachedContextCount, setAttachedContextCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quota, setQuota] = useState<{ limit: number; used: number; remaining: number; tier: string } | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    { conversationId: selectedConversationId ?? "00000000-0000-4000-8000-000000000000" },
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
    setAttachedContextCount(conversationDetail.data.contextSources?.length ?? 0);
    setNotice(null);
  }, [conversationDetail.data]);

  useEffect(() => {
    if (conversationDetail.isError) setNotice(t("agent.error.history"));
  }, [conversationDetail.isError, t]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sendMessage.isPending, notice]);

  if (hiddenOnRoute) return null;

  const suggestedPrompts = bootstrap.data?.suggestedPrompts ?? fallbackPrompts(routeContext.routeType, t);
  const currentScope = bootstrap.data?.currentScope ?? inferClientScope(routeContext);
  const lowQuota = quota ? quota.remaining <= 1 : false;

  async function handleSubmit(message: string) {
    const trimmed = message.trim();
    if (!trimmed || sendMessage.isPending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setNotice(null);
    setDraft("");
    setMessages((current) => [...current, userMessage]);

    try {
      const response = await sendMessage.mutateAsync({
        conversationId,
        message: trimmed,
        routeContext,
      });
      setQuota(response.quota);

      if (response.status === "blocked") {
        setMessages((current) => current.filter((item) => item.id !== userMessage.id));
        setDraft(trimmed);
        setNotice(getQuotaBlockedNotice(response.quota.tier, t));
        return;
      }

      setConversationId(response.conversationId);
      void utils.agent.listConversations.invalidate();
      if (response.status === "failed") {
        setDraft(trimmed);
        setNotice(t("agent.error.send"));
        setMessages((current) => [
          ...current,
          {
            id: response.messageId,
            role: "assistant",
            content: t("agent.error.send"),
          },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: response.messageId,
          role: "assistant",
          content: response.answer.answerMarkdown,
          sourceCards: response.sourceCards,
        },
      ]);
    } catch {
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
      setDraft(trimmed);
      setNotice(t("agent.error.send"));
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
      setAttachedContextCount((count) => count + 1);
      setContextDraft("");
      setContextOpen(false);
      setNotice(t("agent.context.attached"));
      void utils.agent.listConversations.invalidate();
      void utils.agent.getConversation.invalidate({ conversationId: response.conversationId });
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
        onClick={() => setOpen((value) => !value)}
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
            historyLoading={conversations.isLoading || conversationDetail.isFetching}
            activeConversationId={conversationId}
            suggestedPrompts={suggestedPrompts}
            sending={sendMessage.isPending}
            onClose={() => setOpen(false)}
            onDraftChange={setDraft}
            onContextDraftChange={setContextDraft}
            onToggleContext={() => setContextOpen((value) => !value)}
            onAttachPastedContext={() =>
              handleAttachContext({
                kind: "pasted_text",
                content: contextDraft,
              })
            }
            onPickContextFile={() => fileInputRef.current?.click()}
            onToggleHistory={() => setHistoryOpen((value) => !value)}
            onLoadConversation={handleLoadConversation}
            onPrompt={handleSubmit}
            onSubmit={handleSubmit}
            messageEndRef={messageEndRef}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="hidden"
            onChange={(event) => {
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
      className="fixed bottom-5 right-5 z-[60] inline-flex h-12 items-center gap-3 rounded-full border border-sky-300/35 bg-slate-950/85 px-4 text-sm font-semibold text-white shadow-[0_18px_52px_rgba(15,23,42,0.45)] backdrop-blur-xl transition hover:border-sky-200/70 hover:bg-slate-900 sm:bottom-6 sm:right-6"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-400/15 text-sky-200">
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
      </span>
      <span className="hidden sm:inline">{label}</span>
      {lowQuota && <span className="h-2 w-2 rounded-full bg-cyan-300" aria-hidden="true" />}
    </button>
  );
}

export function AgentMobileSheet({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed z-[59]",
        isMobile
          ? "inset-x-3 bottom-20 max-h-[calc(100dvh-6rem)]"
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
  messageEndRef,
}: {
  bootstrapping: boolean;
  bootstrapError: boolean;
  currentScope: AgentScope;
  draft: string;
  messages: ChatMessage[];
  notice: string | null;
  quota: { limit: number; used: number; remaining: number; tier: string } | null;
  contextDraft: string;
  contextOpen: boolean;
  attachedContextCount: number;
  attachingContext: boolean;
  historyOpen: boolean;
  conversations: ConversationItem[];
  historyLoading: boolean;
  activeConversationId?: string;
  suggestedPrompts: string[];
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
  messageEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useLanguage();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(draft);
  }

  return (
    <section className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-lg border border-sky-300/25 bg-slate-950/92 text-slate-100 shadow-[0_28px_90px_rgba(2,6,23,0.55)] backdrop-blur-xl">
      <header className="flex items-start justify-between gap-4 border-b border-sky-300/15 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-sky-300/25 bg-sky-400/10 text-sky-200">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">{t("agent.header.title")}</h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{t("agent.header.subtitle")}</p>
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

      <div className="border-b border-sky-300/10 px-4 py-2 text-xs text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-300/20 bg-sky-400/10 px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              {scopeLabel(currentScope, t)}
            </span>
            {quota && <AgentQuotaBadge quota={quota} />}
          </div>
          <button
            type="button"
            onClick={onToggleHistory}
            aria-expanded={historyOpen}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
              historyOpen
                ? "border-sky-300/45 bg-sky-400/15 text-sky-100"
                : "border-sky-300/15 bg-white/[0.03] text-slate-300 hover:border-sky-300/35 hover:bg-sky-400/10 hover:text-sky-100"
            )}
          >
            <History className="h-3.5 w-3.5" />
            {t("agent.history.button")}
          </button>
        </div>
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
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-sky-300" />
            {t("agent.header.subtitle")}
          </div>
        )}

        {bootstrapError && (
          <AgentNotice tone="error" message={t("agent.error.bootstrap")} />
        )}

        {!bootstrapping && messages.length === 0 && (
          <div className="flex min-h-full flex-col justify-center gap-5 py-4">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg border border-sky-300/25 bg-sky-400/10 text-sky-200">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t("agent.welcome.title")}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{t("agent.welcome.body")}</p>
            </div>
            <div className="grid gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sending}
                  onClick={() => onPrompt(prompt)}
                  className="rounded-lg border border-sky-300/15 bg-white/[0.03] px-3 py-2 text-left text-sm leading-6 text-slate-200 transition hover:border-sky-300/35 hover:bg-sky-400/10 disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-400/10 text-sky-200">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[86%] rounded-lg px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "bg-sky-500 text-white"
                      : "border border-sky-300/10 bg-white/[0.04] text-slate-200"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-li:my-1">
                      <Streamdown>{message.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  {message.sourceCards && message.sourceCards.length > 0 && (
                    <AgentSourceCards sources={message.sourceCards} />
                  )}
                </div>
              </article>
            ))}
            {sending && (
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-400/10 text-sky-200">
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

      <form onSubmit={submit} className="border-t border-sky-300/15 p-3">
        <div className="flex items-end gap-2 rounded-lg border border-sky-300/20 bg-slate-900/70 p-2">
          <Button
            type="button"
            size="icon"
            onClick={onToggleContext}
            aria-label={t("agent.context.toggle")}
            className={cn(
              "h-10 w-10 shrink-0 rounded-md border border-sky-300/15 bg-white/[0.03] text-slate-300 hover:bg-sky-400/10 hover:text-sky-100",
              contextOpen && "border-sky-300/40 bg-sky-400/15 text-sky-100"
            )}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit(draft);
              }
            }}
            placeholder={t("agent.input.placeholder")}
            rows={1}
            className="max-h-28 min-h-10 resize-none border-0 bg-transparent text-sm text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || sending || bootstrapping}
            aria-label={t("agent.input.send")}
            className="h-10 w-10 shrink-0 rounded-md bg-sky-500 text-white hover:bg-sky-400"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
    <div className="border-t border-sky-300/10 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-xs font-medium text-slate-400 transition hover:text-sky-100"
        >
          <Paperclip className="h-3.5 w-3.5 text-sky-300" />
          <span className="truncate">{t("agent.context.title")}</span>
          {count > 0 && (
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-1.5 text-[0.68rem] text-sky-100">
              {count}
            </span>
          )}
        </button>
        {count > 0 && (
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-cyan-200">
            <Check className="h-3.5 w-3.5" />
            {t("agent.context.active")}
          </span>
        )}
      </div>

      {open && (
        <div className="mt-2 rounded-lg border border-sky-300/15 bg-slate-900/65 p-2">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t("agent.context.placeholder")}
            rows={3}
            className="max-h-28 min-h-20 resize-none border-0 bg-transparent text-xs leading-5 text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPickFile}
              disabled={attaching}
              className="inline-flex items-center gap-1.5 rounded-md border border-sky-300/15 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-sky-300/35 hover:bg-sky-400/10 hover:text-sky-100 disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("agent.context.file")}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={!value.trim() || attaching}
              onClick={onAttach}
              className="h-8 rounded-md bg-sky-500 px-3 text-xs text-white hover:bg-sky-400"
            >
              {attaching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("agent.context.attach")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentSourceCards({ sources }: { sources: SourceCard[] }) {
  const { t } = useLanguage();

  return (
    <div className="mt-3 border-t border-sky-300/10 pt-3">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sky-200">
        {t("agent.sources.title")}
      </div>
      <div className="grid gap-2">
        {sources.slice(0, 3).map((source) => {
          const title = source.postTitle || t("agent.sources.site");
          const body = source.heading ? `${source.heading} · ${source.excerpt}` : source.excerpt;
          const card = (
            <span className="block rounded-md border border-sky-300/15 bg-slate-950/45 p-2.5 transition hover:border-sky-300/35 hover:bg-sky-400/10">
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-sky-100">
                <span className="min-w-0 truncate">{title}</span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <span className="rounded border border-sky-300/15 bg-white/[0.03] px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-400">
                    {source.sourceType === "user_context" ? t("agent.sources.context") : t("agent.sources.blog")}
                  </span>
                  {source.postSlug && <ExternalLink className="h-3.5 w-3.5 shrink-0" />}
                </span>
              </span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{body}</span>
            </span>
          );

          return source.postSlug ? (
            <a key={source.sourceId} href={`/post/${source.postSlug}`} aria-label={t("agent.sources.open")}>
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
    <div className="border-b border-sky-300/10 bg-slate-950/55 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>{t("agent.history.title")}</span>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-300" />}
      </div>
      {visible.length > 0 ? (
        <div className="grid max-h-48 gap-2 overflow-y-auto pr-1">
          {visible.map((conversation) => {
            const active = conversation.id === activeConversationId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onLoadConversation(conversation.id)}
                className={cn(
                  "grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-left text-xs leading-5 transition",
                  active
                    ? "border-sky-300/50 bg-sky-400/15 text-sky-100"
                    : "border-sky-300/15 bg-white/[0.03] text-slate-300 hover:border-sky-300/35 hover:bg-sky-400/10"
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
                  {formatConversationTime(conversation.lastMessageAt ?? conversation.updatedAt, t)}
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

function formatConversationTime(value: Date | string | null | undefined, t: (key: string) => string) {
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

function AgentQuotaBadge({ quota }: { quota: { limit: number; remaining: number } }) {
  const { t } = useLanguage();
  const key = quota.remaining <= 1 ? "agent.quota.low" : "agent.quota.remaining";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-500/25 bg-white/[0.03] px-2.5 py-1 text-slate-300">
      <LogIn className="h-3.5 w-3.5 text-slate-400" />
      {t(key, { remaining: quota.remaining, limit: quota.limit })}
    </span>
  );
}

function AgentNotice({ tone, message }: { tone: "warning" | "error"; message: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-6",
        tone === "error"
          ? "border-red-300/25 bg-red-950/30 text-red-100"
          : "border-cyan-300/25 bg-cyan-950/30 text-cyan-100"
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
  return tier === "anonymous" ? t("agent.quota.blockedAnonymous") : t("agent.quota.blockedVisitor");
}

function getContextFileKind(fileName: string): "markdown_file" | "text_file" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".md")) return "markdown_file";
  if (lower.endsWith(".txt")) return "text_file";
  return null;
}

function getFallbackMimeType(kind: "markdown_file" | "text_file") {
  return kind === "markdown_file" ? "text/markdown" : "text/plain";
}

function fallbackPrompts(routeType: string, t: (key: string) => string) {
  if (routeType === "post") {
    return [
      t("agent.prompts.postSummary"),
      t("agent.prompts.postAssumptions"),
      t("agent.prompts.nextReading"),
    ];
  }

  return [
    t("agent.prompts.siteThemes"),
    t("agent.prompts.compareTracks"),
    t("agent.prompts.readingPath"),
  ];
}

function toChatMessage(message: {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sourceJson?: Record<string, unknown> | null;
}): ChatMessage {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    sourceCards: extractSourceCards(message.sourceJson),
  };
}

function extractSourceCards(sourceJson: Record<string, unknown> | null | undefined): SourceCard[] | undefined {
  const cards = sourceJson?.sourceCards;
  if (!Array.isArray(cards)) return undefined;
  const normalized = cards
    .map((card) => normalizeSourceCard(card))
    .filter((card): card is SourceCard => Boolean(card));
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeSourceCard(value: unknown): SourceCard | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.sourceId !== "string" || typeof record.postTitle !== "string") return null;
  return {
    sourceId: record.sourceId,
    sourceType: record.sourceType === "user_context" ? "user_context" : "blog",
    postTitle: record.postTitle,
    postSlug: typeof record.postSlug === "string" ? record.postSlug : "",
    categorySlug: typeof record.categorySlug === "string" ? record.categorySlug : undefined,
    tagSlugs: Array.isArray(record.tagSlugs)
      ? record.tagSlugs.filter((tag): tag is string => typeof tag === "string")
      : [],
    heading: typeof record.heading === "string" ? record.heading : undefined,
    excerpt: typeof record.excerpt === "string" ? record.excerpt : "",
    relevanceReason: typeof record.relevanceReason === "string" ? record.relevanceReason : "",
  };
}
