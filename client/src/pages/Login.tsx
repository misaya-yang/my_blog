import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SectionHeader,
  SiteHeader,
  SpaceBackdrop,
  Surface,
} from "@/components/ResearchShell";
import { trpc } from "@/lib/trpc";
import { BookOpen, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";

export default function Login() {
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("login.seoTitle"),
      description: t("login.subtitle"),
      path: "/login",
      noindex: true,
    })
  );

  const adminLogin = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.session.invalidate();
      toast.success(t("login.toast.welcomeBack"));
      navigate("/");
    },
    onError: error => {
      toast.error(error.message || t("login.toast.adminFailed"));
    },
  });

  const handleAdminSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    adminLogin.mutate({ password });
  };

  return (
    <div className="space-page text-foreground">
      <SpaceBackdrop subtle />
      <SiteHeader
        active="login"
        backHref="/"
        backLabel={t("login.backToHome")}
        compact
      />

      <main className="container relative z-10 grid min-h-[calc(100dvh-68px)] grid-cols-1 items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-12">
        <section className="page-hero login-copy max-w-2xl">
          <div className="signal-chip mb-7">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("login.chip")}
          </div>
          <h1 className="page-title max-w-xl">{t("login.title")}</h1>
          <p className="page-copy mt-5 max-w-xl">{t("login.subtitle")}</p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <Surface as="div" density="compact">
              <BookOpen className="mb-3 h-5 w-5 text-sky-300" />
              <p className="text-sm font-medium text-white">
                {t("login.readerOpenTitle")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {t("login.readerOpenDesc")}
              </p>
            </Surface>
            <Surface as="div" density="compact">
              <LockKeyhole className="mb-3 h-5 w-5 text-blue-300" />
              <p className="text-sm font-medium text-white">
                {t("login.ownerCardTitle")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {t("login.ownerCardDesc")}
              </p>
            </Surface>
          </div>
        </section>

        <Surface className="login-panel">
          <SectionHeader
            icon={<KeyRound className="h-4 w-4" />}
            title={t("login.panelTitle")}
          />
          <form onSubmit={handleAdminSubmit} className="mt-6 space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {t("login.adminTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {t("login.adminDesc")}
              </p>
            </div>
            <label className="sr-only" htmlFor="admin-password">
              {t("login.adminPasswordPlaceholder")}
            </label>
            <Input
              id="admin-password"
              type="password"
              placeholder={t("login.adminPasswordPlaceholder")}
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              aria-label={t("login.adminPasswordPlaceholder")}
              autoComplete="current-password"
              className="border-sky-200/15 bg-slate-950/40 text-white placeholder:text-slate-500"
            />
            <Button
              type="submit"
              className="owner-primary-action w-full"
              disabled={adminLogin.isPending}
            >
              {adminLogin.isPending
                ? t("login.adminBtnLoading")
                : t("login.adminBtn")}
            </Button>
          </form>
        </Surface>
      </main>
    </div>
  );
}
