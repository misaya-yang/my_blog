import React, {
  Suspense,
  lazy,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type RefObject,
} from "react";
import { BookOpen, History, Loader2, Paperclip, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import { AgentContextDock, AgentTrustBoundary } from "./AgentContextSurfaces";
import {
  AgentBootstrapUnavailable,
  AgentMessageRecovery,
  AgentNotice,
} from "./AgentRecoverySurfaces";
import type { AgentFrameControls } from "./AgentFloatingFrame";
import { AgentHistoryPanel } from "./AgentHistoryPanel";
import {
  AgentQuotaBadge,
  AgentQuotaCallout,
  shouldShowQuotaCallout,
} from "./AgentQuotaStatus";
import { AgentReasoningTrace } from "./AgentReasoningTrace";
import { AgentRelatedQuestions } from "./AgentRelatedQuestions";
import { AgentSourceCards } from "./AgentSourceCards";
import type { AgentScope } from "./routeContext";
import type { ChatMessage, ConversationItem, QuotaInfo } from "./types";

const AgentMarkdown = lazy(() =>
  import("./AgentMarkdown").then(module => ({ default: module.AgentMarkdown }))
);

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
  quota: QuotaInfo | null;
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
  const interactionLocked = sending || conversationSwitching;
  const historyPanelId = `${panelId}-history`;
  const contextPanelId = `${panelId}-context`;
  const historyButtonRef = useRef<HTMLButtonElement | null>(null);
  const contextButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousHistoryOpenRef = useRef(historyOpen);
  const previousContextOpenRef = useRef(contextOpen);

  useEffect(() => {
    const historyClosed = previousHistoryOpenRef.current && !historyOpen;
    const contextClosed = previousContextOpenRef.current && !contextOpen;

    if (!historyOpen && !contextOpen && (historyClosed || contextClosed)) {
      const target = historyClosed
        ? historyButtonRef.current
        : contextButtonRef.current;
      window.requestAnimationFrame(() =>
        target?.focus({ preventScroll: true })
      );
    }

    previousHistoryOpenRef.current = historyOpen;
    previousContextOpenRef.current = contextOpen;
  }, [contextOpen, historyOpen]);

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
      className="agent-liquid-panel flex h-full min-h-0 flex-col overflow-hidden border"
    >
      <header className="agent-panel-header flex items-center justify-between gap-3 px-3.5 py-3">
        <div
          className={cn(
            "agent-drag-handle flex min-w-0 flex-1 items-center gap-2.5",
            frameControls.isFloating && "cursor-move select-none"
          )}
          {...frameControls.dragHandleProps}
        >
          <span className="agent-header-mark grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-200">
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
        </div>
        <div className="agent-panel-actions flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={t("agent.header.close")}
            onClick={onClose}
            className="agent-close-button grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="agent-topbar relative px-3.5 pb-2.5 text-xs text-slate-300">
        <div className="agent-topbar-primary flex items-center justify-between gap-2">
          <div className="agent-topbar-meta flex min-w-0 flex-1 items-center gap-1.5">
            <AgentTrustBoundary
              scopeLabel={scopeLabel(currentScope, t)}
              attachedContextCount={attachedContextCount}
            />
            {quota && <AgentQuotaBadge quota={quota} />}
          </div>
          <button
            ref={historyButtonRef}
            type="button"
            onClick={onToggleHistory}
            disabled={interactionLocked && !historyOpen}
            aria-expanded={historyOpen}
            aria-controls={historyPanelId}
            className={cn(
              "agent-history-button inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium sm:min-h-0 sm:py-1.5",
              historyOpen
                ? "agent-history-button-active text-slate-100"
                : "text-slate-300"
            )}
          >
            <History className="h-3.5 w-3.5" />
            {t("agent.history.button")}
          </button>
        </div>
        {quota && shouldShowQuotaCallout(quota) && (
          <AgentQuotaCallout quota={quota} />
        )}
        {historyOpen && (
          <AgentHistoryPanel
            id={historyPanelId}
            conversations={conversations}
            loading={historyLoading}
            activeConversationId={activeConversationId}
            onLoadConversation={onLoadConversation}
          />
        )}
      </div>

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
          <div className="agent-welcome flex min-h-full flex-col justify-start gap-4 py-1">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {welcomeTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {welcomeBody}
              </p>
            </div>
            <div className="agent-suggested-prompts grid gap-1">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sending || inputDisabled}
                  onClick={() => onPrompt(prompt)}
                  className="agent-suggested-prompt min-h-11 rounded-md px-3 py-2 text-left text-sm font-medium leading-6 text-slate-300 disabled:opacity-60"
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
                  <span className="agent-assistant-mark mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-300">
                    <BookOpen className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={cn(
                    "agent-message-bubble rounded-md px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "agent-message-bubble-user max-w-[82%] text-slate-100"
                      : "agent-message-bubble-assistant w-full max-w-[calc(100%-2.5rem)] text-slate-200"
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
                <span className="agent-assistant-mark grid h-7 w-7 place-items-center rounded-md text-slate-300">
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

      <div className="agent-input-zone relative">
        <AgentContextDock
          panelId={contextPanelId}
          open={contextOpen}
          value={contextDraft}
          count={attachedContextCount}
          attaching={attachingContext}
          disabled={inputDisabled || interactionLocked}
          onChange={onContextDraftChange}
          onToggle={onToggleContext}
          onAttach={onAttachPastedContext}
          onPickFile={onPickContextFile}
        />

        <form onSubmit={submit} className="agent-composer px-3 pb-3 pt-2">
          <div className="agent-composer-shell flex items-end gap-1.5 rounded-md border p-1.5">
            <Button
              ref={contextButtonRef}
              type="button"
              size="icon"
              onClick={onToggleContext}
              disabled={(inputDisabled || interactionLocked) && !contextOpen}
              aria-label={t("agent.context.toggle")}
              aria-expanded={contextOpen}
              aria-controls={contextPanelId}
              className={cn(
                "agent-attachment-button h-11 w-11 shrink-0 rounded-md border-0 bg-transparent text-slate-400 shadow-none sm:h-10 sm:w-10",
                contextOpen && "agent-attachment-button-active text-slate-100"
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
              aria-label={t("agent.input.label")}
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
                "agent-send-button h-11 w-11 shrink-0 rounded-md border-0 text-white shadow-none sm:h-10 sm:w-10",
                sending && "agent-send-button-cancel"
              )}
            >
              {sending ? (
                <X className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
      {frameControls.resizeHandle}
    </section>
  );
}

function scopeLabel(scope: AgentScope, t: (key: string) => string) {
  return t(`agent.scope.${scope.type}`);
}
