import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  Loader2,
  MessageSquare,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import React, { FormEvent, useId, useState } from "react";
import { toast } from "sonner";

type FeedbackType = "useful" | "not_useful";
export type FeedbackReason =
  | "unclear_mechanism"
  | "needs_example"
  | "unsupported_claim"
  | "awkward_wording"
  | "missing_next_step"
  | "other";

export const ARTICLE_FEEDBACK_REASONS: FeedbackReason[] = [
  "unclear_mechanism",
  "needs_example",
  "unsupported_claim",
  "awkward_wording",
  "missing_next_step",
  "other",
];

type ArticleFeedbackProps = {
  postId: number;
  postTitle: string;
  className?: string;
  embedded?: boolean;
};

export function ArticleFeedback({
  postId,
  postTitle,
  className,
  embedded = false,
}: ArticleFeedbackProps) {
  const { displayName, isVisitor } = useAuth();
  const { t } = useLanguage();
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState<FeedbackReason | null>(null);
  const [replyEmail, setReplyEmail] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [sent, setSent] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const messageId = useId();
  const reasonId = useId();
  const visitorNameId = useId();
  const replyEmailId = useId();
  const statusId = useId();
  const detailsId = useId();

  const feedback = trpc.engagement.feedback.create.useMutation({
    onSuccess: () => {
      trackAnalyticsEvent("article_feedback_submitted", { postId, type });
      setSent(true);
      setType(null);
      setMessage("");
      setReason(null);
      setReplyEmail("");
      setVisitorName("");
      setDetailsOpen(false);
      toast.success(t("engagement.feedback.toastSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("engagement.feedback.error"));
    },
  });

  const submitFeedback = (event: FormEvent) => {
    event.preventDefault();
    if (!type) return;

    feedback.mutate({
      postId,
      type,
      reason: reason ?? undefined,
      message: message.trim() || undefined,
      replyEmail: replyEmail.trim() || undefined,
      visitorName: isVisitor ? undefined : visitorName.trim() || undefined,
    });
  };

  return (
    <section
      className={cn(
        "article-feedback-surface",
        embedded ? "space-y-4" : "glass-panel p-5",
        className
      )}
      aria-label={t("engagement.feedback.ariaLabel", { title: postTitle })}
    >
      <div className="article-feedback-head flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">{t("engagement.feedback.title")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            {t("engagement.feedback.description")}
          </p>
          <p className="mt-2 text-xs">
            {isVisitor && displayName
              ? t("engagement.feedback.visitorIdentity", { name: displayName })
              : t("engagement.feedback.anonymousIdentity")}
          </p>
        </div>
        <details className="article-feedback-trust rounded-md text-xs leading-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {t("engagement.feedback.trustSummary")}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </summary>
          <div className="grid gap-2 px-3 py-2 sm:grid-cols-3">
            <span>{t("engagement.feedback.privateNote")}</span>
            <span>{t("engagement.feedback.optionalReply")}</span>
            <span>{t("engagement.feedback.afterSubmit")}</span>
          </div>
        </details>
      </div>

      <form onSubmit={submitFeedback} className="grid gap-4">
        <div className="article-feedback-actions grid grid-cols-2 gap-2">
          <button
            type="button"
            data-feedback-type="useful"
            aria-pressed={type === "useful"}
            onClick={() => setType("useful")}
            className="article-feedback-choice flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition"
          >
            <ThumbsUp className="h-4 w-4" />
            {t("engagement.feedback.useful")}
          </button>
          <button
            type="button"
            data-feedback-type="not_useful"
            aria-pressed={type === "not_useful"}
            onClick={() => setType("not_useful")}
            className="article-feedback-choice flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition"
          >
            <ThumbsDown className="h-4 w-4" />
            {t("engagement.feedback.notUseful")}
          </button>
        </div>

        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen(value => !value)}
          className="article-feedback-detail-toggle inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition"
        >
          <MessageSquare className="h-4 w-4" />
          {detailsOpen
            ? t("engagement.feedback.detailsHide")
            : t("engagement.feedback.detailsToggle")}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              detailsOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {detailsOpen && (
          <div id={detailsId} className="article-feedback-details grid gap-3">
            <div
              className="article-feedback-reasons grid gap-2"
              role="group"
              aria-labelledby={reasonId}
            >
              <p id={reasonId} className="text-xs font-medium">
                {t("engagement.feedback.reasonLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {ARTICLE_FEEDBACK_REASONS.map(item => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={reason === item}
                    onClick={() =>
                      setReason(current => (current === item ? null : item))
                    }
                    className="article-feedback-reason inline-flex min-h-8 items-center rounded-md px-2.5 text-xs font-medium transition"
                  >
                    {t(`engagement.feedback.reason.${item}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs leading-5">
                {t("engagement.feedback.reasonHint")}
              </p>
            </div>

            <div>
              <label className="sr-only" htmlFor={messageId}>
                {t("engagement.feedback.messagePlaceholder")}
              </label>
              <Textarea
                id={messageId}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={600}
                placeholder={t("engagement.feedback.messagePlaceholder")}
                aria-describedby={statusId}
                className="article-feedback-field min-h-24"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {!isVisitor && (
                <div>
                  <label className="sr-only" htmlFor={visitorNameId}>
                    {t("engagement.feedback.namePlaceholder")}
                  </label>
                  <Input
                    id={visitorNameId}
                    value={visitorName}
                    onChange={(event) => setVisitorName(event.target.value)}
                    maxLength={80}
                    placeholder={t("engagement.feedback.namePlaceholder")}
                    autoComplete="name"
                    aria-describedby={statusId}
                    className="article-feedback-field"
                  />
                </div>
              )}
              <div>
                <label className="sr-only" htmlFor={replyEmailId}>
                  {t("engagement.feedback.emailPlaceholder")}
                </label>
                <Input
                  id={replyEmailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={replyEmail}
                  onChange={(event) => setReplyEmail(event.target.value)}
                  placeholder={t("engagement.feedback.emailPlaceholder")}
                  aria-describedby={statusId}
                  className="article-feedback-field"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            id={statusId}
            className="min-h-5 text-xs leading-5"
            aria-live="polite"
          >
            {feedback.error ? (
              <span className="article-feedback-error">
                {feedback.error.message.includes("Too many")
                  ? t("engagement.feedback.rateLimited")
                  : t("engagement.feedback.error")}
              </span>
            ) : sent ? (
              <span className="article-feedback-success">{t("engagement.feedback.success")}</span>
            ) : (
              t("engagement.feedback.quickHint")
            )}
          </p>
          <Button
            type="submit"
            variant={type ? "default" : "outline"}
            disabled={!type || feedback.isPending}
          >
            {feedback.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("engagement.feedback.loading")}
              </>
            ) : (
              t("engagement.feedback.submit")
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
