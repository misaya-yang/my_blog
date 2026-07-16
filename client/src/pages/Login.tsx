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
import { getSafeAdminReturnPath } from "@/lib/adminReturnTo";
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
      navigate(getSafeAdminReturnPath(window.location.search));
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

      <main className="login-access-shell container relative z-10 px-4 sm:px-6">
        <section
          className="login-access-card open-group"
          aria-labelledby="owner-access-title"
        >
          <div className="login-access-copy">
            <div className="signal-chip login-access-chip">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("login.chip")}
            </div>
            <h1 id="owner-access-title" className="login-access-title">
              {t("login.title")}
            </h1>
            <p className="login-access-lede">{t("login.subtitle")}</p>

            <div className="login-access-notes">
              <div className="login-access-note">
                <BookOpen className="h-4 w-4" />
                <div>
                  <strong>{t("login.readerOpenTitle")}</strong>
                  <span>{t("login.readerOpenDesc")}</span>
                </div>
              </div>
              <div className="login-access-note">
                <LockKeyhole className="h-4 w-4" />
                <div>
                  <strong>{t("login.ownerCardTitle")}</strong>
                  <span>{t("login.ownerCardDesc")}</span>
                </div>
              </div>
            </div>
          </div>

          <Surface className="login-panel login-access-form" variant="popover">
            <SectionHeader
              icon={<KeyRound className="h-4 w-4" />}
              title={t("login.panelTitle")}
              description={t("login.adminDesc")}
            />
            <form
              onSubmit={handleAdminSubmit}
              className="login-access-form-stack"
              aria-busy={adminLogin.isPending}
            >
              <label className="sr-only" htmlFor="admin-password">
                {t("login.adminPasswordPlaceholder")}
              </label>
              <Input
                id="admin-password"
                type="password"
                placeholder={t("login.adminPasswordPlaceholder")}
                value={password}
                onChange={event => {
                  setPassword(event.target.value);
                  if (adminLogin.isError) adminLogin.reset();
                }}
                required
                aria-label={t("login.adminPasswordPlaceholder")}
                aria-invalid={adminLogin.isError}
                aria-describedby={
                  adminLogin.isError ? "admin-password-error" : undefined
                }
                autoComplete="current-password"
                className="login-access-input"
              />
              {adminLogin.isError ? (
                <p
                  id="admin-password-error"
                  className="login-access-error"
                  role="alert"
                >
                  {adminLogin.error?.message || t("login.toast.adminFailed")}
                </p>
              ) : null}
              <Button
                type="submit"
                className="owner-primary-action w-full"
                disabled={adminLogin.isPending}
              >
                {adminLogin.isPending
                  ? t("login.adminBtnLoading")
                  : t("login.adminBtn")}
              </Button>
              <p className="login-access-footnote">{t("login.formHint")}</p>
            </form>
          </Surface>
        </section>
      </main>
    </div>
  );
}
