import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildPublishFreshnessSignalsFromReport,
  loadLatestPublishFreshnessSignals,
} from "./publishFreshnessSignals";

describe("publish freshness reader signals", () => {
  it("returns no signals for a healthy report", () => {
    const signals = buildPublishFreshnessSignalsFromReport({
      generatedAt: "2026-07-09T00:00:00.000Z",
      metadataIssues: [],
      generatedAssets: {
        sitemap: { missingPublicSlugs: [], leakedNonPublicSlugs: [] },
        rss: { missingPublicSlugs: [], leakedNonPublicSlugs: [] },
        archive: { missingPublicSlugs: [] },
      },
      trackCoverage: {
        missingPublicSlugs: [],
        mismatchedPrimarySeriesSlugs: [],
        configuredUnknownSlugs: [],
        configuredNonPublicSlugs: [],
      },
      agentKnowledge: {
        stalePublicPostSlugs: [],
        extraIndexedPostSlugs: [],
        nonPublicIndexedSlugs: [],
        lastReindexAt: "2026-07-09T00:00:00.000Z",
      },
      routeChecks: [],
      blockers: [],
    });

    expect(signals).toEqual([]);
  });

  it("maps freshness report findings to owner-only reader signals", () => {
    const signals = buildPublishFreshnessSignalsFromReport(
      {
        generatedAt: "2026-07-09T01:00:00.000Z",
        metadataIssues: ["missing excerpt"],
        generatedAssets: {
          sitemap: {
            missingPublicSlugs: ["missing-sitemap"],
            leakedNonPublicSlugs: ["private-draft"],
          },
          rss: {
            missingPublicSlugs: ["missing-rss"],
            leakedNonPublicSlugs: [],
          },
          archive: { missingPublicSlugs: ["missing-archive"] },
        },
        trackCoverage: {
          missingPublicSlugs: ["missing-track"],
          mismatchedPrimarySeriesSlugs: ["track-mismatch"],
          configuredUnknownSlugs: ["unknown-track-slug"],
          configuredNonPublicSlugs: ["hidden-track"],
        },
        agentKnowledge: {
          stalePublicPostSlugs: ["stale-agent"],
          extraIndexedPostSlugs: ["extra-agent"],
          nonPublicIndexedSlugs: ["hidden-agent"],
          lastReindexAt: null,
        },
        routeChecks: [
          {
            path: "/post/missing-sitemap",
            state: "checked",
            ok: false,
            status: 404,
          },
        ],
        blockers: ["hidden draft exposed"],
      },
      "reports/latest.json"
    );

    expect(signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "publish_freshness:missing_sitemap:missing-sitemap",
          severity: "high",
          articleSlug: "missing-sitemap",
          sourceRef: "reports/latest.json",
        }),
        expect.objectContaining({
          id: "publish_freshness:hidden_content_exposed:private-draft",
          severity: "high",
        }),
        expect.objectContaining({
          id: "publish_freshness:stale_public_agent_index:stale-agent",
          severity: "high",
        }),
        expect.objectContaining({
          id: "publish_freshness:missing_freshness_timestamp:global",
          severity: "medium",
        }),
        expect.objectContaining({
          id: "publish_freshness:route_check_failed:global",
          severity: "high",
        }),
        expect.objectContaining({
          id: "publish_freshness:release_blocker:1:global",
          severity: "high",
        }),
      ])
    );
    expect(JSON.stringify(signals)).not.toContain("reader@example.com");
  });

  it("returns report_unavailable when the latest report cannot be read", async () => {
    const root = await mkdtemp(join(tmpdir(), "publish-freshness-signals-"));
    const signals = await loadLatestPublishFreshnessSignals(
      root,
      "missing-report.json"
    );

    expect(signals).toEqual([
      expect.objectContaining({
        id: "publish_freshness:report_unavailable:global",
        kind: "publish_freshness",
        severity: "medium",
        sourceRef: "missing-report.json",
      }),
    ]);
  });

  it("loads the latest report from disk", async () => {
    const root = await mkdtemp(join(tmpdir(), "publish-freshness-signals-"));
    await writeFile(
      join(root, "latest.json"),
      JSON.stringify({
        generatedAt: "2026-07-09T01:00:00.000Z",
        generatedAssets: {
          sitemap: { missingPublicSlugs: ["missing-sitemap"] },
        },
      })
    );

    const signals = await loadLatestPublishFreshnessSignals(root, "latest.json");

    expect(signals).toEqual([
      expect.objectContaining({
        id: "publish_freshness:missing_sitemap:missing-sitemap",
        articleSlug: "missing-sitemap",
      }),
    ]);
  });
});
