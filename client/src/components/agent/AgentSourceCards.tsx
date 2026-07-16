import React, { useId, useState, type MouseEvent } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { useLocation } from "wouter";

import { useLanguage } from "@/contexts/LanguageContext";

import {
  formatSourceExcerpt,
  getSourceAnchorId,
  getSourceHref,
  normalizeSourceText,
} from "./sourceCardLinks";
import {
  getHiddenSourceCount,
  getSourcePreviewTitle,
  getVisibleSourceCards,
} from "./agentSourceSummary";
import type { SourceCard } from "./types";

export function AgentSourceCards({ sources }: { sources: SourceCard[] }) {
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const sourceListId = useId();
  const currentPath = normalizePathWithoutHash(location);
  const visibleSources = getVisibleSourceCards(sources, expanded);
  const previewSources = getVisibleSourceCards(sources, false);
  const hiddenSourceCount = getHiddenSourceCount(sources);

  return (
    <div className="agent-sources mt-3 border-t border-slate-800/80 pt-3">
      <div className="agent-source-summary flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 font-semibold text-slate-500">
            {t("agent.sources.summary", { count: sources.length })}
          </span>
          <div className="agent-source-chips flex min-w-0 flex-1 items-center gap-1.5">
            {previewSources.map(source => (
              <AgentSourcePreviewChip key={source.sourceId} source={source} />
            ))}
            {hiddenSourceCount > 0 && (
              <span className="agent-source-chip shrink-0 rounded-md border border-slate-700 bg-slate-950/35 px-2 py-0.5 text-[0.68rem] font-medium text-slate-500">
                {t("agent.sources.previewMore", {
                  count: hiddenSourceCount,
                })}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={sourceListId}
          onClick={() => setExpanded(value => !value)}
          className="agent-source-toggle inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-slate-100"
        >
          {expanded ? t("agent.sources.hide") : t("agent.sources.view")}
        </button>
      </div>
      {expanded && (
        <div
          id={sourceListId}
          className="agent-source-list mt-2 grid gap-2 overflow-y-auto overflow-x-hidden pr-1"
        >
          {visibleSources.map(source => {
            const title = source.postTitle || t("agent.sources.site");
            const hasBlogLink =
              source.sourceType !== "user_context" && Boolean(source.postSlug);
            const currentPageSource =
              isCurrentPathSource(source, currentPath) ||
              isCurrentPageSource(source);
            const section =
              source.sectionTitle ?? getSourceSectionLabel(source, t);
            const excerpt = formatSourceExcerpt(source);
            const relevanceReason = getDisplayRelevanceReason(source, t);
            const href = hasBlogLink ? getSourceHref(source) : undefined;

            return (
              <div
                key={source.sourceId}
                className="agent-source-card rounded-md border border-slate-700/80 bg-slate-950/30 px-2.5 py-2"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="agent-source-icon mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border"
                    aria-hidden="true"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">
                          {section}
                        </div>
                        {source.postTitle && section !== title && (
                          <div className="mt-0.5 truncate text-[0.72rem] text-slate-500">
                            {title}
                          </div>
                        )}
                      </div>
                      <div className="inline-flex shrink-0 items-center gap-1">
                        <span className="rounded border border-slate-700 bg-white/[0.025] px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-400">
                          {source.sourceType === "user_context"
                            ? t("agent.sources.context")
                            : t("agent.sources.blog")}
                        </span>
                        {currentPageSource && (
                          <span className="rounded border border-slate-600/50 bg-slate-900 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-300">
                            {t("agent.sources.currentPage")}
                          </span>
                        )}
                        {hasBlogLink && href && (
                          <a
                            href={href}
                            aria-label={`${t("agent.sources.open")}: ${title}`}
                            title={`${title}${
                              source.heading ? ` / ${source.heading}` : ""
                            }`}
                            onClick={event => {
                              handleSourceLinkClick(
                                event,
                                source,
                                href,
                                navigate
                              );
                            }}
                            className="agent-source-open grid h-7 w-7 place-items-center rounded-md border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-slate-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                    {(excerpt || relevanceReason) && (
                      <details className="agent-source-detail mt-1">
                        <summary className="cursor-pointer list-none text-[0.7rem] font-medium text-slate-500">
                          {t("agent.sources.details")}
                        </summary>
                        {excerpt && (
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {excerpt}
                          </p>
                        )}
                        {relevanceReason && (
                          <p className="mt-1 text-[0.7rem] leading-5 text-slate-500">
                            {t("agent.sources.reason")}: {relevanceReason}
                          </p>
                        )}
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgentSourcePreviewChip({ source }: { source: SourceCard }) {
  const { t } = useLanguage();
  const title = getSourcePreviewTitle(source, t("agent.sources.site"));

  return (
    <span
      className="agent-source-chip truncate rounded-md border border-slate-700 bg-slate-950/35 px-2 py-0.5 text-[0.68rem] font-medium text-slate-400"
      title={title}
    >
      {title}
    </span>
  );
}

export function handleSourceLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  source: SourceCard,
  href: string,
  navigate: (to: string) => void
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return;
  }

  event.preventDefault();
  if (getSourceLinkAction(href, window.location.pathname) === "scroll") {
    scrollToSource(source, href);
    return;
  }

  navigate(href);
}

export function getSourceLinkAction(href: string, currentPath: string) {
  return normalizePathWithoutHash(href) ===
    normalizePathWithoutHash(currentPath)
    ? "scroll"
    : "navigate";
}

export function getAgentSourceScrollBehavior(
  prefersReducedMotion = typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

function scrollToSource(source: SourceCard, href: string) {
  const target =
    findSourceHeadingElement(source) ??
    findHashElement(href) ??
    document.querySelector<HTMLElement>(".article-prose");
  if (!target) {
    window.history.pushState(null, "", href);
    return;
  }

  const targetHash = target.id ? `#${target.id}` : "";
  window.history.pushState(
    null,
    "",
    `${window.location.pathname}${targetHash}`
  );
  target.scrollIntoView({
    behavior: getAgentSourceScrollBehavior(),
    block: "start",
  });
  target.focus?.({ preventScroll: true });
}

function findSourceHeadingElement(source: SourceCard) {
  const heading = source.heading ? normalizeSourceText(source.heading) : "";
  const articleHeadings = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".article-prose h1[id], .article-prose h2[id], .article-prose h3[id], .article-prose h4[id], .article-prose h5[id], .article-prose h6[id]"
    )
  );

  if (heading) {
    const exactMatch = articleHeadings.find(
      element => normalizeSourceText(element.textContent ?? "") === heading
    );
    if (exactMatch) return exactMatch;

    const sectionMatch = articleHeadings.find(element => {
      const text = normalizeSourceText(element.textContent ?? "");
      return text.includes(heading) || heading.includes(text);
    });
    if (sectionMatch) return sectionMatch;
  }

  const fallbackId = getSourceAnchorId(source);
  return fallbackId ? document.getElementById(fallbackId) : null;
}

function findHashElement(href: string) {
  const hash = href.split("#")[1];
  if (!hash) return null;
  return document.getElementById(decodeURIComponent(hash));
}

export function getSourceSectionLabel(
  source: SourceCard,
  t: (key: string) => string
) {
  if (source.heading) return source.heading;
  if (source.sourceType === "user_context")
    return source.postTitle || t("agent.sources.context");
  return source.postTitle || t("agent.sources.site");
}

export function isCurrentPathSource(source: SourceCard, currentPath: string) {
  return Boolean(source.postSlug) && currentPath === `/post/${source.postSlug}`;
}

export function normalizePathWithoutHash(value: string) {
  return value.split("#")[0].split("?")[0] || "/";
}

function isCurrentPageSource(source: SourceCard) {
  if (source.isCurrentPage) return true;
  return source.relevanceReason
    .toLowerCase()
    .startsWith("current public article context");
}

function getDisplayRelevanceReason(
  source: SourceCard,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  if (!isCurrentPageSource(source)) return source.relevanceReason;
  const stripped = source.relevanceReason
    .replace(/^Current public article context\.?\s*/i, "")
    .trim();
  return stripped || t("agent.sources.currentPage");
}
