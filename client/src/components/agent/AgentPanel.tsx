import React, {
  Suspense,
  lazy,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type RefObject,
} from "react";
import {
  BookOpen,
  History,
  Loader2,
  Move,
  Paperclip,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

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
import {
  getAgentFramePresetShortcut,
  type AgentFramePreset,
} from "./agentFrameState";
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
        <div className="agent-topbar-primary flex items-center justify-between gap-2">
          <div className="agent-topbar-meta flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <span className="agent-scope-pill inline-flex items-center gap-1.5 rounded-md border border-slate-600/45 bg-slate-900/55 px-2.5 py-1 text-slate-300">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              {scopeLabel(currentScope, t)}
            </span>
            {quota && <AgentQuotaBadge quota={quota} />}
            <AgentTrustBoundary
              scopeLabel={scopeLabel(currentScope, t)}
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
                    "agent-message-bubble rounded-md px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "agent-message-bubble-user max-w-[82%] border border-slate-600/50 bg-slate-100/10 text-slate-100"
                      : "agent-message-bubble-assistant w-full max-w-[calc(100%-2.75rem)] border border-slate-700/70 bg-slate-950/35 text-slate-200"
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

function scopeLabel(scope: AgentScope, t: (key: string) => string) {
  return t(`agent.scope.${scope.type}`);
}
