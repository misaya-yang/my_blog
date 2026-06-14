import {
  SectionHeader,
  SiteHeader,
  SpaceBackdrop,
  Surface,
} from "@/components/ResearchShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import { BookOpen, GraduationCap, Mail, Network } from "lucide-react";

export default function About() {
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("about.title"),
      description: t("about.subtitle"),
      path: "/about",
    })
  );

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="about" />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        <section className="page-hero">
          <div className="signal-chip mb-6">
            <BookOpen className="h-4 w-4" />
            {t("about.kicker")}
          </div>
          <h1 className="page-title">{t("about.title")}</h1>
          <p className="page-copy mt-5">{t("about.subtitle")}</p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          <Surface as="article" className="lg:col-span-2">
            <SectionHeader
              icon={<Network className="h-4 w-4" />}
              title={t("about.focusTitle")}
            />
            <p className="mt-5 text-sm leading-8 text-slate-300">
              {t("about.focusBody")}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "about.focus1",
                "about.focus2",
                "about.focus3",
                "about.focus4",
              ].map(key => (
                <div
                  key={key}
                  className="article-tag min-h-14 items-center rounded-xl px-4 py-3 text-sm text-slate-200"
                >
                  {t(key)}
                </div>
              ))}
            </div>
          </Surface>

          <Surface as="aside">
            <SectionHeader
              icon={<BookOpen className="h-4 w-4" />}
              title={t("about.linksTitle")}
            />
            <div className="mt-5 grid gap-3">
              <a
                href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-ink justify-start gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                {t("nav.scholar")}
              </a>
              <a
                href="mailto:zedpl28174@gmail.com"
                className="nav-ink justify-start gap-2"
              >
                <Mail className="h-4 w-4" />
                zedpl28174@gmail.com
              </a>
              <div className="nav-ink justify-start gap-2 text-slate-400">
                <Network className="h-4 w-4" />
                {t("about.location")}
              </div>
            </div>
          </Surface>
        </section>
      </main>
    </div>
  );
}
