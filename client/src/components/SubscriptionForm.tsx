import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Loader2,
  MailPlus,
  Rss,
  SlidersHorizontal,
} from "lucide-react";
import React, { FormEvent, useId, useState } from "react";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const emailId = useId();
  const interestsId = useId();
  const statusId = useId();
  const detailsId = useId();
  const titleKey =
    surface === "article"
      ? "engagement.subscribe.articleTitle"
      : "engagement.subscribe.title";

  const subscribe = trpc.engagement.subscribe.useMutation({
    onSuccess: result => {
      setStatus(result.status);
      setEmail("");
      setInterests("");
      setDetailsOpen(false);
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
      className={cn(
        "subscription-surface",
        embedded ? "space-y-3" : "glass-panel liquid-panel p-5",
        className
      )}
      aria-label={t("engagement.subscribe.title")}
    >
      <div className="subscription-head flex items-start justify-between gap-4">
        <div>
          <div className="subscription-title-row mb-2 flex items-center gap-2">
            <MailPlus className="h-4 w-4" />
            <h2 className="text-base font-semibold">{t(titleKey)}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6">
            {t("engagement.subscribe.description")}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="subscription-rss-link shrink-0"
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
        <div className="subscription-core grid gap-3">
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
            className="subscription-field"
          />
          <Button
            type="submit"
            disabled={subscribe.isPending}
            className="subscription-submit"
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

        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen(value => !value)}
          className="subscription-details-toggle inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {detailsOpen
            ? t("engagement.subscribe.detailsHide")
            : t("engagement.subscribe.detailsToggle")}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              detailsOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {detailsOpen && (
          <div id={detailsId} className="subscription-details grid gap-3">
            <label className="sr-only" htmlFor={interestsId}>
              {t("engagement.subscribe.interestsPlaceholder")}
            </label>
            <Input
              id={interestsId}
              value={interests}
              onChange={event => setInterests(event.target.value)}
              placeholder={t("engagement.subscribe.interestsPlaceholder")}
              className="subscription-field"
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
              <div className="subscription-language-options inline-grid grid-cols-2 rounded-md p-1">
                {(["zh", "en"] as const).map(option => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={preferredLanguage === option}
                    onClick={() => setPreferredLanguage(option)}
                    className="subscription-language-option h-8 rounded px-3 text-xs font-medium transition"
                  >
                    {option === "zh"
                      ? t("nav.switchToZh")
                      : t("nav.switchToEn")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      <div
        id={statusId}
        className="min-h-5 text-xs leading-5"
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
      className: "subscription-error",
    };
  }

  if (status === "created") {
    return {
      text: t("engagement.subscribe.successCreated"),
      className: "subscription-success",
    };
  }

  if (status === "existing") {
    return {
      text: t("engagement.subscribe.successExisting"),
      className: "subscription-success",
    };
  }

  return { text: t("engagement.subscribe.privacy") };
}
