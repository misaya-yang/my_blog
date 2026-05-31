import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MailPlus, Rss } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type SubscriptionFormProps = {
  className?: string;
  embedded?: boolean;
  surface?: "home" | "article";
};

export function SubscriptionForm({
  className,
  embedded = false,
  surface = "home",
}: SubscriptionFormProps) {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"zh" | "en">(language);
  const [interests, setInterests] = useState("");
  const [status, setStatus] = useState<"idle" | "created" | "existing">("idle");

  const subscribe = trpc.engagement.subscribe.useMutation({
    onSuccess: (result) => {
      setStatus(result.status);
      setEmail("");
      setInterests("");
      toast.success(
        result.status === "created"
          ? t("engagement.subscribe.toastCreated")
          : t("engagement.subscribe.toastExisting")
      );
    },
    onError: (error) => {
      toast.error(error.message || t("engagement.subscribe.error"));
    },
  });

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
        embedded ? "space-y-4" : "glass-panel p-5",
        className
      )}
      aria-label={t("engagement.subscribe.title")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-white">
            <MailPlus className="h-4 w-4 text-sky-300" />
            <h2 className="text-base font-semibold">
              {surface === "article"
                ? t("engagement.subscribe.articleTitle")
                : t("engagement.subscribe.title")}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            {t("engagement.subscribe.description")}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="glass-button shrink-0">
          <a href="/rss.xml" aria-label={t("engagement.subscribe.rss")}>
            <Rss className="h-4 w-4" />
            <span className="hidden sm:inline">{t("engagement.subscribe.rss")}</span>
          </a>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("engagement.subscribe.emailPlaceholder")}
            className="border-sky-200/15 bg-slate-950/40 text-white placeholder:text-slate-500"
          />
          <div className="inline-grid grid-cols-2 rounded-md border border-sky-200/15 bg-slate-950/50 p-1">
            {(["zh", "en"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={preferredLanguage === option}
                onClick={() => setPreferredLanguage(option)}
                className={cn(
                  "h-8 rounded px-3 text-xs font-medium transition",
                  preferredLanguage === option
                    ? "bg-sky-400/20 text-sky-100"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                )}
              >
                {option === "zh" ? t("nav.switchToZh") : t("nav.switchToEn")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
            placeholder={t("engagement.subscribe.interestsPlaceholder")}
            className="border-sky-200/15 bg-slate-950/40 text-white placeholder:text-slate-500"
            maxLength={240}
          />
          <Button
            type="submit"
            disabled={subscribe.isPending}
            className="bg-sky-400 text-slate-950 hover:bg-sky-300"
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
      </form>

      <div className="min-h-5 text-xs leading-5 text-slate-500">
        {subscribe.error ? (
          <span className="text-red-200">
            {subscribe.error.message.includes("Too many")
              ? t("engagement.subscribe.rateLimited")
              : t("engagement.subscribe.error")}
          </span>
        ) : status === "created" ? (
          <span className="text-sky-200">{t("engagement.subscribe.successCreated")}</span>
        ) : status === "existing" ? (
          <span className="text-sky-200">{t("engagement.subscribe.successExisting")}</span>
        ) : (
          t("engagement.subscribe.privacy")
        )}
      </div>
    </section>
  );
}
