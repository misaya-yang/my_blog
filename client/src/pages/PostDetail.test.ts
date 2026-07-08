import { describe, expect, it } from "vitest";

import {
  ARTICLE_READER_LAYOUT,
  getArticleRailMode,
  isArticleProseMeasureHealthy,
} from "../lib/articleLayout";
import { buildArticleCompletionLinks } from "./PostDetail";

const t = (key: string) =>
  ({
    "post.handoff.nextInSeries": "Next in series",
    "post.handoff.nextArticle": "Next article",
    "post.handoff.continueTrack": "Continue path",
    "post.handoff.related": "Related note",
  })[key] ?? key;

describe("article completion links", () => {
  it("prioritizes the next series article before the track path", () => {
    expect(
      buildArticleCompletionLinks({
        seriesNext: { slug: "agent-runtime", title: "Agent Runtime" },
        postNext: { slug: "archive-ledger", title: "Archive Ledger" },
        related: [{ slug: "retrieval-map", title: "Retrieval Map" }],
        continueTrackHref: "/algorithms",
        continueTrackLabel: "Algorithms",
        t,
      })
    ).toEqual([
      {
        kind: "series-next",
        href: "/post/agent-runtime",
        label: "Next in series",
        title: "Agent Runtime",
        primary: true,
      },
      {
        kind: "track",
        href: "/algorithms",
        label: "Continue path",
        title: "Algorithms",
        primary: false,
      },
      {
        kind: "related",
        href: "/post/retrieval-map",
        label: "Related note",
        title: "Retrieval Map",
        primary: false,
      },
    ]);
  });

  it("falls back to the next article when no series continuation exists", () => {
    expect(
      buildArticleCompletionLinks({
        postNext: { slug: "archive-ledger", title: "Archive Ledger" },
        related: [],
        continueTrackHref: "/applications",
        continueTrackLabel: "Applications",
        t,
      }).slice(0, 2)
    ).toEqual([
      {
        kind: "post-next",
        href: "/post/archive-ledger",
        label: "Next article",
        title: "Archive Ledger",
        primary: true,
      },
      {
        kind: "track",
        href: "/applications",
        label: "Continue path",
        title: "Applications",
        primary: false,
      },
    ]);
  });

  it("deduplicates related articles and caps the list at three links", () => {
    expect(
      buildArticleCompletionLinks({
        postNext: { slug: "archive-ledger", title: "Archive Ledger" },
        related: [
          { slug: "archive-ledger", title: "Archive Ledger Duplicate" },
          { slug: "retrieval-map", title: "Retrieval Map" },
          { slug: "agent-runtime", title: "Agent Runtime" },
        ],
        continueTrackHref: "/algorithms",
        continueTrackLabel: "Algorithms",
        t,
      }).map(link => link.href)
    ).toEqual(["/post/archive-ledger", "/algorithms", "/post/retrieval-map"]);
  });
});

describe("article reader layout contract", () => {
  it("keeps the TOC inline until the prose can hold a healthy measure", () => {
    expect(getArticleRailMode(1024)).toBe("inline-toc");
    expect(getArticleRailMode(1279)).toBe("inline-toc");
    expect(getArticleRailMode(1359)).toBe("inline-toc");
    expect(getArticleRailMode(1360)).toBe("toc-rail");
    expect(getArticleRailMode(1440)).toBe("toc-rail");
  });

  it("documents the target article prose measure", () => {
    expect(ARTICLE_READER_LAYOUT.proseMeasure).toEqual({
      min: 66,
      target: 74,
      max: 78,
    });
    expect(isArticleProseMeasureHealthy(65)).toBe(false);
    expect(isArticleProseMeasureHealthy(66)).toBe(true);
    expect(isArticleProseMeasureHealthy(74)).toBe(true);
    expect(isArticleProseMeasureHealthy(78)).toBe(true);
    expect(isArticleProseMeasureHealthy(79)).toBe(false);
  });
});
