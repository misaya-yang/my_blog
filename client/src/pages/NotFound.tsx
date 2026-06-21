import { Button } from "@/components/ui/button";
import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import { Archive, Home, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("notFound.heading"),
      description: t("notFound.description").replace("\n", " "),
      path: location || "/404",
      noindex: true,
    })
  );

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader compact backHref="/" backLabel={t("nav.backToHome")} />
      <main className="container relative z-10 flex min-h-[calc(100vh-68px)] items-center px-4 py-12 sm:px-6">
        <section className="page-hero open-group max-w-2xl">
          <div className="signal-chip mb-6">{t("notFound.title")}</div>
          <h1 className="page-title">{t("notFound.heading")}</h1>
          <p className="page-copy mt-5 max-w-xl">
            {t("notFound.description").replace("\n", " ")}
          </p>
          <div
            id="not-found-button-group"
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button onClick={handleGoHome}>
              <Home className="h-4 w-4" />
              {t("notFound.goHome")}
            </Button>
            <Button asChild variant="outline" className="glass-button">
              <Link href="/archive">
                <Archive className="h-4 w-4" />
                {t("nav.archive")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="glass-button">
              <Link href="/search">
                <Search className="h-4 w-4" />
                {t("nav.search")}
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
