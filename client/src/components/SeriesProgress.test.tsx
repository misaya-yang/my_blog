import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SeriesProgress } from "./SeriesProgress";

function renderSeriesProgress(
  props: React.ComponentProps<typeof SeriesProgress>
) {
  return renderToStaticMarkup(<SeriesProgress {...props} />);
}

describe("SeriesProgress", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
    vi.stubGlobal("location", { pathname: "/", search: "", hash: "" });
    vi.stubGlobal("history", { pushState: vi.fn(), replaceState: vi.fn() });
    vi.stubGlobal("addEventListener", vi.fn());
    vi.stubGlobal("removeEventListener", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a first-article start link", () => {
    const html = renderSeriesProgress({
      label: "Series",
      title: "Agent Runtime Systems",
      meta: "1 / 4",
      links: [
        {
          href: "/post/agent-runtime-intro",
          label: "Start series",
          direction: "start",
          primary: true,
        },
      ],
    });

    expect(html).toContain('aria-label="Series"');
    expect(html).toContain("series-progress-compact");
    expect(html).toContain('href="/post/agent-runtime-intro"');
    expect(html).toContain("series-progress-action-primary");
    expect(html).toContain("lucide-arrow-right");
  });

  it("renders previous and next links for a middle article", () => {
    const html = renderSeriesProgress({
      variant: "footer",
      label: "Series",
      title: "Agent Runtime Systems",
      links: [
        {
          href: "/post/previous",
          label: "Previous",
          direction: "previous",
        },
        {
          href: "/post/next",
          label: "Next",
          direction: "next",
          primary: true,
        },
      ],
    });

    expect(html).toContain("series-progress-footer");
    expect(html).toContain('href="/post/previous"');
    expect(html).toContain('href="/post/next"');
    expect(html).toContain("lucide-arrow-left");
    expect(html).toContain("lucide-arrow-right");
  });

  it("renders a last-article track overview link", () => {
    const html = renderSeriesProgress({
      variant: "card",
      label: "Series",
      title: "Agent Runtime Systems",
      meta: "4 / 4",
      promise: "From runtime control to evaluation loops",
      links: [
        {
          href: "/tracks/agent-runtime-systems",
          label: "Track overview",
          direction: "track",
          primary: true,
        },
      ],
    });

    expect(html).toContain("series-progress-card");
    expect(html).toContain("4 / 4 / From runtime control to evaluation loops");
    expect(html).toContain('href="/tracks/agent-runtime-systems"');
    expect(html).toContain("Track overview");
    expect(html).toContain("lucide-arrow-right");
  });
});
