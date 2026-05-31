import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, ThumbsDown, ThumbsUp } from "lucide-react";
import { FormEvent, useId, useState } from "react";
import { toast } from "sonner";

type FeedbackType = "useful" | "not_useful";

type ArticleFeedbackProps = {
  postId: number;
  postTitle: string;
  className?: string;
  embedded?: boolean;
};

const OWNER_EMAIL = "zedpl28174@gmail.com";

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
  const [replyEmail, setReplyEmail] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [sent, setSent] = useState(false);
  const messageId = useId();
  const visitorNameId = useId();
  const replyEmailId = useId();
  const statusId = useId();

  const feedback = trpc.engagement.feedback.create.useMutation({
    onSuccess: () => {
      trackAnalyticsEvent("article_feedback_submitted", { postId, type });
      setSent(true);
      setType(null);
      setMessage("");
      setReplyEmail("");
      setVisitorName("");
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
      message: message.trim() || undefined,
      replyEmail: replyEmail.trim() || undefined,
      visitorName: isVisitor ? undefined : visitorName.trim() || undefined,
    });
  };

  return (
    <section
      className={cn(
        embedded ? "space-y-5" : "glass-panel p-5",
        className
      )}
      aria-label={t("engagement.feedback.title")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{t("engagement.feedback.title")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {t("engagement.feedback.description")}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {isVisitor && displayName
              ? t("engagement.feedback.visitorIdentity", { name: displayName })
              : t("engagement.feedback.anonymousIdentity")}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="glass-button shrink-0">
          <a href={`mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(`Feedback: ${postTitle}`)}`}>
            <Mail className="h-4 w-4" />
            {t("engagement.feedback.contact")}
          </a>
        </Button>
      </div>

      <form onSubmit={submitFeedback} className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={type === "useful"}
            onClick={() => setType("useful")}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition",
              type === "useful"
                ? "border-sky-300/60 bg-sky-400/15 text-sky-100"
                : "border-sky-200/15 bg-slate-950/35 text-slate-300 hover:border-sky-300/45 hover:text-white"
            )}
          >
            <ThumbsUp className="h-4 w-4" />
            {t("engagement.feedback.useful")}
          </button>
          <button
            type="button"
            aria-pressed={type === "not_useful"}
            onClick={() => setType("not_useful")}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition",
              type === "not_useful"
                ? "border-amber-300/60 bg-amber-400/15 text-amber-100"
                : "border-sky-200/15 bg-slate-950/35 text-slate-300 hover:border-sky-300/45 hover:text-white"
            )}
          >
            <ThumbsDown className="h-4 w-4" />
            {t("engagement.feedback.notUseful")}
          </button>
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
            className="min-h-24 border-sky-200/15 bg-slate-950/35 text-white placeholder:text-slate-500"
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
                className="border-sky-200/15 bg-slate-950/35 text-white placeholder:text-slate-500"
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
              className="border-sky-200/15 bg-slate-950/35 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            id={statusId}
            className="min-h-5 text-xs leading-5 text-slate-500"
            aria-live="polite"
          >
            {feedback.error ? (
              <span className="text-red-200">
                {feedback.error.message.includes("Too many")
                  ? t("engagement.feedback.rateLimited")
                  : t("engagement.feedback.error")}
              </span>
            ) : sent ? (
              <span className="text-sky-200">{t("engagement.feedback.success")}</span>
            ) : (
              t("engagement.feedback.privacy")
            )}
          </p>
          <Button
            type="submit"
            disabled={!type || feedback.isPending}
            className="bg-sky-400 text-slate-950 hover:bg-sky-300"
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
