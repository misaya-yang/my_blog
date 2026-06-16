import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MailPlus, Rss } from "lucide-react";
import { FormEvent, useId, useState } from "react";
import { toast } from "sonner";

type SubscriptionFormProps = {
  className?: string;
  embedded?: boolean;
  surface?: "home" | "article";
};

type SubscriptionStatus = "idle" | "created" | "existing";

type SubscriptionMessage = {
  text: string;
  className?: string;
};

type Translate = (
  key: string,
  vars?: Record<string, string | number>
) => string;

export function SubscriptionForm({
  className,
  embedded = false,
  surface = "home",
}: SubscriptionFormProps) {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"zh" | "en">(
    language
  );
  const [interests, setInterests] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>("idle");
  const emailId = useId();
  const interestsId = useId();
  const statusId = useId();
  const titleKey =
    surface === "article"
      ? "engagement.subscribe.articleTitle"
      : "engagement.subscribe.title";

  const subscribe = trpc.engagement.subscribe.useMutation({
    onSuccess: result => {
      setStatus(result.status);
      setEmail("");
      setInterests("");
      toast.success(
        result.status === "created"
          ? t("engagement.subscribe.toastCreated")
          : t("engagement.subscribe.toastExisting")
      );
    },
    onError: error => {
      toast.error(error.message || t("engagement.subscribe.error"));
    },
  });
  const statusMessage = getSubscriptionMessage(
    subscribeErrorMessage(subscribe.error),
    status,
    t
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    subscribe.mutate({
      email,
      preferredLanguage,
      interests: interests.trim() || undefined,
    });
  };

  return (
    <section
      className={cn(embedded ? "space-y-4" : "glass-panel p-5", className)}
      aria-label={t("engagement.subscribe.title")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-white">
            <MailPlus className="h-4 w-4 text-sky-200" />
            <h2 className="text-base font-semibold">{t(titleKey)}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            {t("engagement.subscribe.description")}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="glass-button shrink-0"
        >
          <a href="/rss.xml" aria-label={t("engagement.subscribe.rss")}>
            <Rss className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("engagement.subscribe.rss")}
            </span>
          </a>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor={emailId}>
            {t("engagement.subscribe.emailPlaceholder")}
          </label>
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder={t("engagement.subscribe.emailPlaceholder")}
            aria-describedby={statusId}
            className="border-white/10 bg-slate-950/40 text-white placeholder:text-slate-500"
          />
          <Button
            type="submit"
            disabled={subscribe.isPending}
            className="w-full md:w-auto"
          >
            {subscribe.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("engagement.subscribe.loading")}
              </>
            ) : (
              t("engagement.subscribe.button")
            )}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor={interestsId}>
            {t("engagement.subscribe.interestsPlaceholder")}
          </label>
          <Input
            id={interestsId}
            value={interests}
            onChange={event => setInterests(event.target.value)}
            placeholder={t("engagement.subscribe.interestsPlaceholder")}
            className="border-white/10 bg-slate-950/40 text-white placeholder:text-slate-500"
            maxLength={240}
            aria-describedby={statusId}
          />
          <div
            className="subscription-language-control"
            role="group"
            aria-label={t("engagement.subscribe.languageLabel")}
          >
            <span className="subscription-language-label">
              {t("engagement.subscribe.languageLabel")}
            </span>
            <div className="inline-grid grid-cols-2 rounded-md border border-white/10 bg-slate-950/50 p-1">
              {(["zh", "en"] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={preferredLanguage === option}
                  onClick={() => setPreferredLanguage(option)}
                  className={cn(
                    "h-8 rounded px-3 text-xs font-medium transition",
                    preferredLanguage === option
                      ? "bg-sky-300/15 text-sky-100"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                  )}
                >
                  {option === "zh" ? t("nav.switchToZh") : t("nav.switchToEn")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      <div
        id={statusId}
        className="min-h-5 text-xs leading-5 text-slate-500"
        aria-live="polite"
      >
        <span className={statusMessage.className}>{statusMessage.text}</span>
      </div>
    </section>
  );
}

function subscribeErrorMessage(error: { message?: string } | null): string {
  return error?.message ?? "";
}

function getSubscriptionMessage(
  errorMessage: string,
  status: SubscriptionStatus,
  t: Translate
): SubscriptionMessage {
  if (errorMessage) {
    return {
      text: errorMessage.includes("Too many")
        ? t("engagement.subscribe.rateLimited")
        : t("engagement.subscribe.error"),
      className: "text-red-200",
    };
  }

  if (status === "created") {
    return {
      text: t("engagement.subscribe.successCreated"),
      className: "text-sky-100",
    };
  }

  if (status === "existing") {
    return {
      text: t("engagement.subscribe.successExisting"),
      className: "text-sky-100",
    };
  }

  return { text: t("engagement.subscribe.privacy") };
}
