import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  KeyRound,
  Library,
  LockKeyhole,
  Network,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";

export default function Login() {
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("nav.login"),
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

  const visitorLogin = trpc.auth.visitorLogin.useMutation({
    onSuccess: async data => {
      utils.auth.session.setData(undefined, data.session);
      await utils.auth.session.invalidate();
      toast.success(t("login.toast.visitorCreated"));
      navigate("/");
    },
    onError: error => {
      toast.error(error.message || t("login.toast.visitorFailed"));
    },
  });

  const handleAdminSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    adminLogin.mutate({ password });
  };

  const handleVisitorSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    visitorLogin.mutate({ nickname: nickname.trim() });
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

      <main className="container relative z-10 grid min-h-[calc(100vh-68px)] grid-cols-1 items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:items-center lg:py-12">
        <section className="page-hero max-w-2xl">
          <div className="signal-chip mb-7">
            <Library className="h-3.5 w-3.5" />
            {t("login.chip")}
          </div>
          <h1 className="page-title max-w-xl">{t("login.title")}</h1>
          <p className="page-copy mt-5 max-w-xl">{t("login.subtitle")}</p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="glass-panel p-4">
              <Network className="mb-3 h-5 w-5 text-sky-300" />
              <p className="text-sm font-medium text-white">
                {t("login.visitorCardTitle")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {t("login.visitorCardDesc")}
              </p>
            </div>
            <div className="glass-panel p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-blue-300" />
              <p className="text-sm font-medium text-white">
                {t("login.ownerCardTitle")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {t("login.ownerCardDesc")}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-5">
          <Tabs defaultValue="visitor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 border border-sky-200/10 bg-slate-950/45">
              <TabsTrigger value="visitor" className="gap-2">
                <UserRound className="h-4 w-4" />
                {t("login.tabVisitor")}
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <KeyRound className="h-4 w-4" />
                {t("login.tabAdmin")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visitor" className="mt-6">
              <form onSubmit={handleVisitorSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {t("login.visitorTitle")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {t("login.visitorDesc")}
                  </p>
                </div>
                <label className="sr-only" htmlFor="visitor-nickname">
                  {t("login.visitorPlaceholder")}
                </label>
                <Input
                  id="visitor-nickname"
                  value={nickname}
                  onChange={event => setNickname(event.target.value)}
                  placeholder={t("login.visitorPlaceholder")}
                  aria-label={t("login.visitorPlaceholder")}
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={40}
                  className="border-sky-200/15 bg-slate-950/40 text-white placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-500 text-white hover:bg-blue-400"
                  disabled={visitorLogin.isPending}
                >
                  {visitorLogin.isPending
                    ? t("login.visitorBtnLoading")
                    : t("login.visitorBtn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <form onSubmit={handleAdminSubmit} className="space-y-5">
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
                  className="w-full bg-blue-500 text-white hover:bg-blue-400"
                  disabled={adminLogin.isPending}
                >
                  {adminLogin.isPending
                    ? t("login.adminBtnLoading")
                    : t("login.adminBtn")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
