import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import { ArrowRight, Boxes, FlaskConical } from "lucide-react";
import { Link } from "wouter";

const projectKeys = [
  {
    title: "projects.harness.title",
    body: "projects.harness.body",
    href: "/tags/harness-engine",
  },
  {
    title: "projects.context.title",
    body: "projects.context.body",
    href: "/tags/context-engineering",
  },
  {
    title: "projects.isohc.title",
    body: "projects.isohc.body",
    href: "/post/isohc-fixed-vector-isometric-residual-mixing",
  },
];

export default function Projects() {
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("projects.title"),
      description: t("projects.subtitle"),
      path: "/projects",
    })
  );

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="projects" />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        <section className="max-w-4xl">
          <div className="signal-chip mb-6">
            <FlaskConical className="h-4 w-4 text-sky-300" />
            {t("projects.kicker")}
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
            {t("projects.title")}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            {t("projects.subtitle")}
          </p>
        </section>

        <section className="mt-10 grid gap-4">
          {projectKeys.map((project) => (
            <Link key={project.title} href={project.href}>
              <article className="glass-panel group grid gap-4 p-5 transition hover:border-sky-300/50 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                <span className="grid h-12 w-12 place-items-center rounded-lg border border-sky-200/15 bg-slate-950/45 text-sky-200">
                  <Boxes className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">{t(project.title)}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{t(project.body)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-sky-300 transition-transform group-hover:translate-x-1" />
              </article>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
