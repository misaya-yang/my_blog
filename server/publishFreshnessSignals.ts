import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildPublishFreshnessSignal,
  type ReaderSignal,
} from "./readerSignals.js";

export const DEFAULT_PUBLISH_FRESHNESS_REPORT =
  "docs/product_optimization/reports/po-08-publish-freshness-latest.json";

type FeedCheck = {
  missingPublicSlugs?: string[];
  leakedNonPublicSlugs?: string[];
};

type PublishFreshnessReport = {
  generatedAt?: string;
  metadataIssues?: string[];
  generatedAssets?: {
    sitemap?: FeedCheck;
    rss?: FeedCheck;
    archive?: {
      missingPublicSlugs?: string[];
    };
  };
  trackCoverage?: {
    missingPublicSlugs?: string[];
    mismatchedPrimarySeriesSlugs?: string[];
    configuredUnknownSlugs?: string[];
    configuredNonPublicSlugs?: string[];
  };
  agentKnowledge?: {
    stalePublicPostSlugs?: string[];
    extraIndexedPostSlugs?: string[];
    nonPublicIndexedSlugs?: string[];
    lastReindexAt?: string | null;
  };
  routeChecks?: Array<{
    path?: string;
    state?: string;
    ok?: boolean;
    status?: number;
    error?: string;
  }>;
  blockers?: string[];
};

export async function loadLatestPublishFreshnessSignals(
  projectRoot = process.cwd(),
  reportPath = DEFAULT_PUBLISH_FRESHNESS_REPORT
): Promise<ReaderSignal[]> {
  const absolutePath = resolve(projectRoot, reportPath);
  try {
    const source = await readFile(absolutePath, "utf8");
    return buildPublishFreshnessSignalsFromReport(
      JSON.parse(source) as PublishFreshnessReport,
      reportPath
    );
  } catch {
    return [
      buildPublishFreshnessSignal({
        checkCode: "report_unavailable",
        message: "Latest publish freshness report could not be read.",
        sourceRef: reportPath,
      }),
    ];
  }
}

export function buildPublishFreshnessSignalsFromReport(
  report: PublishFreshnessReport,
  sourceRef = DEFAULT_PUBLISH_FRESHNESS_REPORT
): ReaderSignal[] {
  const timestamp = report.generatedAt ?? new Date(0).toISOString();
  const signals: ReaderSignal[] = [];

  addIssueSignals(signals, {
    code: "release_blocker",
    values: report.blockers,
    message: value => `Release blocker: ${value}`,
    sourceRef,
    timestamp,
  });
  addIssueSignals(signals, {
    code: "metadata_issue",
    values: report.metadataIssues,
    message: value => `Metadata freshness issue: ${value}`,
    sourceRef,
    timestamp,
  });

  addSlugSignals(signals, {
    code: "missing_sitemap",
    slugs: report.generatedAssets?.sitemap?.missingPublicSlugs,
    message: slug => `Published article is missing from sitemap: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "missing_rss",
    slugs: report.generatedAssets?.rss?.missingPublicSlugs,
    message: slug => `Published article is missing from RSS: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "missing_archive",
    slugs: report.generatedAssets?.archive?.missingPublicSlugs,
    message: slug => `Published article is missing from archive: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "hidden_content_exposed",
    slugs: [
      ...(report.generatedAssets?.sitemap?.leakedNonPublicSlugs ?? []),
      ...(report.generatedAssets?.rss?.leakedNonPublicSlugs ?? []),
      ...(report.trackCoverage?.configuredNonPublicSlugs ?? []),
      ...(report.agentKnowledge?.nonPublicIndexedSlugs ?? []),
    ],
    message: slug => `Non-public article appears in public freshness surface: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "missing_track",
    slugs: report.trackCoverage?.missingPublicSlugs,
    message: slug => `Published article is missing from configured track: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "track_mismatch",
    slugs: report.trackCoverage?.mismatchedPrimarySeriesSlugs,
    message: slug => `Track configuration does not match primary series: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "track_unknown_slug",
    slugs: report.trackCoverage?.configuredUnknownSlugs,
    message: slug => `Track configuration references unknown slug: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "stale_public_agent_index",
    slugs: report.agentKnowledge?.stalePublicPostSlugs,
    message: slug => `Agent knowledge index is stale for public article: ${slug}`,
    sourceRef,
    timestamp,
  });
  addSlugSignals(signals, {
    code: "extra_agent_index",
    slugs: report.agentKnowledge?.extraIndexedPostSlugs,
    message: slug => `Agent knowledge index contains an unexpected slug: ${slug}`,
    sourceRef,
    timestamp,
  });

  if (report.agentKnowledge && !report.agentKnowledge.lastReindexAt) {
    signals.push(
      buildPublishFreshnessSignal({
        checkCode: "missing_freshness_timestamp",
        message: "Agent knowledge freshness report has no last reindex timestamp.",
        sourceRef,
        firstSeenAt: timestamp,
        lastSeenAt: timestamp,
      })
    );
  }

  for (const routeCheck of report.routeChecks ?? []) {
    if (routeCheck.state === "checked" && routeCheck.ok === false) {
      signals.push(
        buildPublishFreshnessSignal({
          checkCode: "route_check_failed",
          message: `Freshness route check failed: ${routeCheck.path ?? "unknown"}`,
          sourceRef,
          firstSeenAt: timestamp,
          lastSeenAt: timestamp,
        })
      );
    }
    if (routeCheck.state === "error") {
      signals.push(
        buildPublishFreshnessSignal({
          checkCode: "route_check_unavailable",
          message: `Freshness route check errored: ${routeCheck.error ?? routeCheck.path ?? "unknown"}`,
          sourceRef,
          firstSeenAt: timestamp,
          lastSeenAt: timestamp,
        })
      );
    }
  }

  return dedupeSignals(signals);
}

function addSlugSignals(
  signals: ReaderSignal[],
  input: {
    code: string;
    slugs?: string[];
    message: (slug: string) => string;
    sourceRef: string;
    timestamp: string;
  }
) {
  for (const slug of input.slugs ?? []) {
    signals.push(
      buildPublishFreshnessSignal({
        checkCode: input.code,
        articleSlug: slug,
        message: input.message(slug),
        sourceRef: input.sourceRef,
        firstSeenAt: input.timestamp,
        lastSeenAt: input.timestamp,
      })
    );
  }
}

function addIssueSignals(
  signals: ReaderSignal[],
  input: {
    code: string;
    values?: string[];
    message: (value: string) => string;
    sourceRef: string;
    timestamp: string;
  }
) {
  const values = input.values ?? [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    signals.push(
      buildPublishFreshnessSignal({
        checkCode: `${input.code}:${index + 1}`,
        message: input.message(value),
        sourceRef: input.sourceRef,
        firstSeenAt: input.timestamp,
        lastSeenAt: input.timestamp,
      })
    );
  }
}

function dedupeSignals(signals: ReaderSignal[]) {
  return Array.from(
    new Map(signals.map(signal => [signal.id, signal])).values()
  );
}
