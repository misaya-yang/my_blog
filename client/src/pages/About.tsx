import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
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
    <div className="space-page author-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="about" />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        <section className="about-spread">
          <article className="about-letter open-group">
            <div className="signal-chip mb-6">
              <BookOpen className="h-4 w-4" />
              {t("about.kicker")}
            </div>
            <h1 className="page-title about-title" lang="en">
              misaya<span>Misaya Yang</span>
            </h1>
            <p className="page-copy about-copy mt-5">{t("about.subtitle")}</p>
            <p className="about-note">{t("about.focusBody")}</p>
          </article>

          <aside className="about-links-rail glass-dock">
            <div>
              <p>{t("about.linksTitle")}</p>
              <div className="about-link-list">
                <a
                  href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GraduationCap className="h-4 w-4" />
                  {t("nav.scholar")}
                </a>
                <a href="mailto:zedpl28174@gmail.com">
                  <Mail className="h-4 w-4" />
                  zedpl28174@gmail.com
                </a>
                <span>
                  <Network className="h-4 w-4" />
                  {t("about.location")}
                </span>
              </div>
            </div>
          </aside>
        </section>

        <section
          className="about-focus-ledger open-group hairline-list"
          aria-labelledby="about-focus"
        >
          <h2 id="about-focus">{t("about.focusTitle")}</h2>
          <div>
            {[
              "about.focus1",
              "about.focus2",
              "about.focus3",
              "about.focus4",
            ].map(key => (
              <p key={key}>{t(key)}</p>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
